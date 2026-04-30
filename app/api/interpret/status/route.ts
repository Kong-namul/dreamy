/**
 * GET /api/interpret/status?jobId=...
 *
 * Polls a Supabase-backed interpretation job. Completed jobs include the
 * saved dream so the client can add it to the local diary.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import type { DreamEntry, Mood } from '@/types'

type DbDream = {
  id: string
  dream: string
  interpretation: string | null
  moods: string[] | null
  auspice: 'auspicious' | 'ominous' | 'neutral' | null
  type: 'basic' | 'premium'
  weather: string | null
  pages: unknown
  interpretation_blocks: unknown
  lucky: unknown
  shared: boolean
  created_at: string
  deleted_at: string | null
  translations: Record<string, unknown> | null
  source_locale: string | null
}

function toClient(d: DbDream): DreamEntry & { deletedAt?: string | null } {
  return {
    id: d.id,
    dream: d.dream,
    interpretation: d.interpretation ?? '',
    moods: (d.moods ?? []) as Mood[],
    auspice: d.auspice ?? undefined,
    type: d.type,
    weather: d.weather ?? undefined,
    pages: (d.pages as DreamEntry['pages']) ?? undefined,
    interpretationBlocks: (d.interpretation_blocks as DreamEntry['interpretationBlocks']) ?? undefined,
    lucky: (d.lucky as DreamEntry['lucky']) ?? undefined,
    shared: d.shared,
    date: d.created_at,
    deletedAt: d.deleted_at,
    translations: d.translations,
    sourceLocale: (d.source_locale === 'en' ? 'en' : 'ko'),
  }
}

export async function GET(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'missing jobId' }, { status: 400 })

  const supa = supabaseServer()
  const { data: job, error: jobErr } = await supa
    .from('interpret_jobs')
    .select('id, email, client_run_id, status, credits_after, dream_id, error')
    .eq('id', jobId)
    .maybeSingle()

  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })
  if (!job || job.email !== email) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let dream: DreamEntry | null = null
  if (job.status === 'completed' && job.dream_id) {
    const { data: dreamRow, error: dreamErr } = await supa
      .from('dreams')
      .select('id, dream, interpretation, moods, auspice, type, weather, pages, interpretation_blocks, lucky, shared, created_at, deleted_at, translations, source_locale')
      .eq('id', job.dream_id)
      .maybeSingle()
    if (dreamErr) return NextResponse.json({ error: dreamErr.message }, { status: 500 })
    if (dreamRow) dream = toClient(dreamRow as DbDream)
  }

  return NextResponse.json({
    jobId: job.id,
    clientRunId: job.client_run_id,
    status: job.status,
    credits: job.credits_after,
    error: job.error,
    dream,
  })
}
