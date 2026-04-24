/**
 * GET /api/feed?cursor=<iso>&limit=<n>
 *
 * 전역 드림피드. shared = true · deleted_at IS NULL 인 모든 유저의 꿈을 최신순으로 반환.
 * - cursor: 이전 페이지 마지막 아이템의 created_at (ISO). 없으면 첫 페이지.
 * - limit:  한 페이지 아이템 수 (기본 8, 최대 30).
 *
 * 각 아이템에는 작성자 닉네임/아바타 + 댓글 수를 포함한다.
 * 인덱스: public.dreams_shared_feed_idx (shared, created_at desc) where shared=true and deleted_at is null
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import type { DreamEntry, Mood, Auspice } from '@/types'

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 30

type FeedRow = {
  id: string
  user_id: string
  dream: string
  interpretation: string | null
  moods: string[] | null
  auspice: Auspice | null
  type: 'basic' | 'premium'
  weather: string | null
  pages: unknown
  interpretation_blocks: unknown
  lucky: unknown
  shared: boolean
  created_at: string
  translations: Record<string, unknown> | null
  source_locale: string | null
}

export interface FeedItem extends DreamEntry {
  authorName: string
  authorInitial: string
  authorAvatarUrl: string | null
  commentCount: number
  isMine: boolean
}

export async function GET(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  // 로그인 없이도 피드 공개 가능한 정책을 잡아도 되지만, 현재 앱은 로그인 후 진입이라 그대로 유지.
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supa = supabaseServer()

  // 현재 유저 id (isMine 판별 용)
  const { data: me } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  const myUserId = me?.id ?? null

  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor')
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT)

  let q = supa
    .from('dreams')
    .select(
      'id, user_id, dream, interpretation, moods, auspice, type, weather, pages, interpretation_blocks, lucky, shared, created_at, translations, source_locale',
    )
    .eq('shared', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1) // +1 로 다음 페이지 존재 여부 판별

  if (cursor) q = q.lt('created_at', cursor)

  const { data: rows, error } = await q
  if (error) {
    return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 })
  }

  const dreams = (rows ?? []) as FeedRow[]
  const hasMore = dreams.length > limit
  const page = hasMore ? dreams.slice(0, limit) : dreams
  const nextCursor = hasMore ? page[page.length - 1].created_at : null

  if (page.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  // 작성자 정보 배치 조회
  const authorIds = Array.from(new Set(page.map((d) => d.user_id)))
  const { data: authors } = await supa
    .from('users')
    .select('id, nickname, avatar_url')
    .in('id', authorIds)
  const authorMap = new Map<string, { nickname: string; avatar_url: string | null }>()
  for (const a of authors ?? []) {
    authorMap.set(a.id as string, {
      nickname: (a.nickname as string) ?? '꿈꾸는이',
      avatar_url: (a.avatar_url as string) ?? null,
    })
  }

  // 댓글 수 배치 집계 — dream 당 개별 head count 쿼리 실행 (소량 병렬)
  const dreamIds = page.map((d) => d.id)
  const commentCounts = new Map<string, number>()
  await Promise.all(
    dreamIds.map(async (id) => {
      const { count } = await supa
        .from('dream_comments')
        .select('id', { count: 'exact', head: true })
        .eq('dream_id', id)
      commentCounts.set(id, count ?? 0)
    }),
  )

  const items: FeedItem[] = page.map((d) => {
    const a = authorMap.get(d.user_id)
    const nickname = a?.nickname ?? '꿈꾸는이'
    return {
      id: d.id,
      dream: d.dream,
      interpretation: d.interpretation ?? '',
      moods: (d.moods ?? []) as Mood[],
      auspice: d.auspice ?? undefined,
      type: d.type,
      weather: d.weather ?? undefined,
      pages: (d.pages as DreamEntry['pages']) ?? undefined,
      interpretationBlocks:
        (d.interpretation_blocks as DreamEntry['interpretationBlocks']) ?? undefined,
      lucky: (d.lucky as DreamEntry['lucky']) ?? undefined,
      shared: d.shared,
      date: d.created_at,
      translations: d.translations,
      sourceLocale: (d.source_locale === 'en' ? 'en' : 'ko'),
      authorName: nickname,
      authorInitial: nickname.charAt(0) || '꿈',
      authorAvatarUrl: a?.avatar_url ?? null,
      commentCount: commentCounts.get(d.id) ?? 0,
      isMine: myUserId != null && d.user_id === myUserId,
    }
  })

  return NextResponse.json({ items, nextCursor })
}
