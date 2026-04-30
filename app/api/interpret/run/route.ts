/**
 * POST /api/interpret/run
 *
 * Starts an interpretation job and returns immediately.
 * The long Anthropic + DB save workflow runs in Supabase Edge Function
 * `interpret-worker`, so Vercel no longer waits for the full generation.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import type { Mood } from '@/types'

const COST = { basic: 5, premium: 15 } as const
const MAX_DREAM_LENGTH = 3000

type RunBody = {
  type?: 'basic' | 'premium'
  dream?: string
  moods?: Mood[]
  sourceLocale?: 'ko' | 'en'
  clientRunId?: string
}

export async function POST(req: Request) {
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `run-${Date.now()}`

  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 })

  let body: RunBody = {}
  try { body = await req.json() } catch {}

  const type = body.type === 'premium' ? 'premium' : 'basic'
  const dream = (body.dream ?? '').toString()
  const moods = Array.isArray(body.moods) ? body.moods : []
  const sourceLocale = body.sourceLocale === 'en' ? 'en' : 'ko'
  const clientRunId = (body.clientRunId ?? requestId).toString().slice(0, 80)

  if (!dream.trim()) {
    return NextResponse.json({ error: '꿈 내용을 입력해주세요.', requestId, clientRunId }, { status: 400 })
  }
  if (dream.length > MAX_DREAM_LENGTH) {
    return NextResponse.json(
      { error: `꿈 내용은 ${MAX_DREAM_LENGTH}자 이하로 입력해주세요.`, requestId, clientRunId },
      { status: 400 },
    )
  }

  const supa = supabaseServer()
  const { data: user } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (!user) return NextResponse.json({ error: 'no user', requestId, clientRunId }, { status: 404 })

  const { data: existing } = await supa
    .from('interpret_jobs')
    .select('id, status')
    .eq('client_run_id', clientRunId)
    .maybeSingle()

  let jobId = existing?.id as string | undefined
  if (!jobId) {
    const { data: job, error: insertErr } = await supa
      .from('interpret_jobs')
      .insert({
        user_id: user.id,
        email,
        client_run_id: clientRunId,
        type,
        dream,
        moods,
        source_locale: sourceLocale,
        status: 'pending',
        cost: COST[type],
      })
      .select('id')
      .single()
    if (insertErr || !job) {
      return NextResponse.json(
        { error: insertErr?.message ?? 'job create failed', requestId, clientRunId },
        { status: 500 },
      )
    }
    jobId = job.id as string
  }

  const { error: invokeErr } = await supa.functions.invoke('interpret-worker', {
    body: { jobId },
  })
  if (invokeErr) {
    console.error('[interpret/run] worker invoke failed:', { requestId, clientRunId, jobId, error: invokeErr })
    await supa
      .from('interpret_jobs')
      .update({ status: 'failed', error: invokeErr.message, completed_at: new Date().toISOString() })
      .eq('id', jobId)
    return NextResponse.json(
      { error: `해석 작업 실행을 시작하지 못했어요. ${invokeErr.message}`, requestId, clientRunId, jobId },
      { status: 502 },
    )
  }

  console.info('[interpret/run] queued:', { requestId, clientRunId, jobId, type })
  return NextResponse.json({ jobId, status: 'pending', requestId, clientRunId }, { status: 202 })
}
