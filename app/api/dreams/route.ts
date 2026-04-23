/**
 * /api/dreams
 *
 *  · GET  → 현재 유저의 꿈 전부 (삭제 안 된 것 + 휴지통 포함)
 *           클라이언트가 로그인 시 한 번 호출해 zustand 를 서버값으로 하이드레이트.
 *  · POST → 해석 완료된 꿈 1건 저장. body 는 DreamEntry 형태.
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

async function getActiveUserId(email: string) {
  const supa = supabaseServer()
  const { data } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const userId = await getActiveUserId(email)
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 404 })

  const supa = supabaseServer()
  const { data, error } = await supa
    .from('dreams')
    .select('id, dream, interpretation, moods, auspice, type, weather, pages, interpretation_blocks, lucky, shared, created_at, deleted_at, translations, source_locale')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as DbDream[]
  const active = rows.filter((d) => !d.deleted_at).map(toClient)
  const deleted = rows.filter((d) => d.deleted_at).map(toClient)

  return NextResponse.json({ dreams: active, deletedDreams: deleted })
}

export async function POST(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const userId = await getActiveUserId(email)
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 404 })

  let body: Partial<DreamEntry> & { sourceLocale?: 'ko' | 'en' }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  if (!body.dream || !body.type) {
    return NextResponse.json({ error: 'dream and type required' }, { status: 400 })
  }

  const supa = supabaseServer()
  const sourceLocale = body.sourceLocale === 'en' ? 'en' : 'ko'
  const { data, error } = await supa
    .from('dreams')
    .insert({
      user_id: userId,
      dream: body.dream,
      interpretation: body.interpretation ?? '',
      moods: body.moods ?? [],
      auspice: body.auspice ?? null,
      type: body.type,
      weather: body.weather ?? null,
      pages: body.pages ?? null,
      interpretation_blocks: body.interpretationBlocks ?? null,
      lucky: body.lucky ?? null,
      shared: body.shared ?? false,
      source_locale: sourceLocale,
    })
    .select('id, dream, interpretation, moods, auspice, type, weather, pages, interpretation_blocks, lucky, shared, created_at, deleted_at, translations, source_locale')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 })
  }

  return NextResponse.json({ dream: toClient(data as DbDream) })
}
