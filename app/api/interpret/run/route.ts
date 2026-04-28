/**
 * POST /api/interpret/run
 *
 * 단일 엔드포인트로 "크레딧 차감 → AI 해석 → DB 저장" 을 한 번에 처리.
 * 중간 단계에서 실패하면 사용된 크레딧을 자동으로 환불한다.
 *
 * 기존엔 클라이언트가 /api/credits/spend → /api/interpret(or /api/diary) → /api/dreams 를
 * 세 번 나눠 호출해서, 중간 단계가 실패하면 크레딧만 빠지고 결과가 없는 상황이 생겼음.
 *
 * body: { type: 'basic' | 'premium', dream: string, moods?: Mood[] }
 *   - basic   → interpretDream 호출, 5 크레딧
 *   - premium → interpretDiary + 이미지 URL 주입, 15 크레딧
 *
 * response:
 *   200 → { dream: DreamEntry, credits: number }
 *   402 → { error: 'insufficient credits', credits: number }
 *   401 → unauthorized
 *   5xx → AI/저장 실패. 이 경우 이미 환불 완료.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { interpretDream, interpretDiary } from '@/lib/claude'
import { attachImageUrls } from '@/lib/pollinations'
import type { DreamEntry, Mood } from '@/types'

// Claude 호출이 길 수 있어 타임아웃 여유.
export const maxDuration = 60

const COST = { basic: 5, premium: 15 } as const
const LABEL = { basic: '기본 해석', premium: '그림일기' } as const

// 모바일 실수 붙여넣기·악성 긴 입력으로 Claude 비용이 폭주하는 걸 막기 위한 상한.
const MAX_DREAM_LENGTH = 3000

// 현재 유저 locale 은 요청 바디로 받아서 source_locale 태깅에 사용 (자동 번역의 기반).
type RunBody = {
  type?: 'basic' | 'premium'
  dream?: string
  moods?: Mood[]
  sourceLocale?: 'ko' | 'en'
}

export async function POST(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: RunBody = {}
  try { body = await req.json() } catch {}

  const type = body.type === 'premium' ? 'premium' : 'basic'
  const dream = (body.dream ?? '').toString()
  const moods = Array.isArray(body.moods) ? body.moods : []
  const sourceLocale = body.sourceLocale === 'en' ? 'en' : 'ko'

  if (!dream.trim()) {
    return NextResponse.json({ error: '꿈 내용을 입력해주세요.' }, { status: 400 })
  }
  if (dream.length > MAX_DREAM_LENGTH) {
    return NextResponse.json(
      { error: `꿈 내용은 ${MAX_DREAM_LENGTH}자 이하로 입력해주세요.` },
      { status: 400 },
    )
  }

  const supa = supabaseServer()
  const cost = COST[type]
  const label = LABEL[type]

  // ---- 1) 원자적 크레딧 차감 -------------------------------------------------
  const { data: spendResult, error: spendErr } = await supa.rpc('spend_credits', {
    p_email: email,
    p_amount: cost,
    p_label: label,
  })
  if (spendErr) {
    if (spendErr.message === 'no user') return NextResponse.json({ error: 'no user' }, { status: 404 })
    return NextResponse.json({ error: spendErr.message }, { status: 500 })
  }
  if (typeof spendResult !== 'number') {
    return NextResponse.json({ error: 'rpc error' }, { status: 500 })
  }
  if (spendResult < 0) {
    const { data: u } = await supa
      .from('users')
      .select('credits')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()
    return NextResponse.json(
      { error: 'insufficient credits', credits: u?.credits ?? 0 },
      { status: 402 },
    )
  }
  let remainingCredits = spendResult

  // ---- 실패 시 자동 환불 헬퍼 ----------------------------------------------
  const refund = async (reason: string) => {
    const { data: ref } = await supa.rpc('refund_credits', {
      p_email: email,
      p_amount: cost,
      p_label: `${label} 자동 환불 (${reason})`,
    })
    if (typeof ref === 'number') remainingCredits = ref
  }

  // ---- 2) AI 호출 -----------------------------------------------------------
  let aiData: {
    interpretation?: string
    auspice?: 'auspicious' | 'ominous' | 'neutral'
    moods?: Mood[]
    weather?: string
    pages?: DreamEntry['pages']
    interpretationBlocks?: DreamEntry['interpretationBlocks']
    lucky?: DreamEntry['lucky']
  }
  try {
    if (type === 'basic') {
      const raw = await interpretDream(dream, moods)
      aiData = { ...raw, moods: (raw.moods ?? []) as Mood[] }
    } else {
      const diary = await interpretDiary(dream, moods)
      aiData = { ...diary, moods: (diary.moods ?? []) as Mood[], pages: attachImageUrls(diary.pages ?? []) }
    }
  } catch (e) {
    console.error('[interpret/run] AI failed:', e)
    await refund('ai-failed')
    return NextResponse.json(
      { error: 'AI 해석 중 오류가 발생했어요.', credits: remainingCredits },
      { status: 502 },
    )
  }

  // ---- 3) DB 저장 -----------------------------------------------------------
  const { data: userRow } = await supa
    .from('users').select('id').eq('email', email).is('deleted_at', null).maybeSingle()
  const userId = userRow?.id
  if (!userId) {
    await refund('no-user-at-save')
    return NextResponse.json({ error: 'no user', credits: remainingCredits }, { status: 404 })
  }

  const { data: saved, error: saveErr } = await supa
    .from('dreams')
    .insert({
      user_id: userId,
      dream,
      interpretation: aiData.interpretation ?? '',
      moods: (moods.length > 0 ? moods : aiData.moods ?? []) as string[],
      auspice: aiData.auspice ?? null,
      type,
      weather: aiData.weather ?? null,
      pages: aiData.pages ?? null,
      interpretation_blocks: aiData.interpretationBlocks ?? null,
      lucky: aiData.lucky ?? null,
      shared: false,
      source_locale: sourceLocale,
    })
    .select('id, dream, interpretation, moods, auspice, type, weather, pages, interpretation_blocks, lucky, shared, created_at, deleted_at, translations, source_locale')
    .single()

  if (saveErr || !saved) {
    console.error('[interpret/run] save failed:', saveErr)
    await refund('save-failed')
    return NextResponse.json(
      { error: saveErr?.message ?? 'save failed', credits: remainingCredits },
      { status: 500 },
    )
  }

  const dreamEntry: DreamEntry & { deletedAt?: string | null } = {
    id: saved.id as string,
    dream: saved.dream as string,
    interpretation: (saved.interpretation ?? '') as string,
    moods: (saved.moods ?? []) as Mood[],
    auspice: (saved.auspice ?? undefined) as DreamEntry['auspice'],
    type: saved.type as 'basic' | 'premium',
    weather: (saved.weather ?? undefined) as string | undefined,
    pages: (saved.pages as DreamEntry['pages']) ?? undefined,
    interpretationBlocks:
      (saved.interpretation_blocks as DreamEntry['interpretationBlocks']) ?? undefined,
    lucky: (saved.lucky as DreamEntry['lucky']) ?? undefined,
    shared: saved.shared as boolean,
    date: saved.created_at as string,
    deletedAt: (saved.deleted_at as string | null) ?? null,
    translations: (saved.translations as Record<string, unknown> | null) ?? null,
    sourceLocale: (saved.source_locale === 'en' ? 'en' : 'ko'),
  }

  return NextResponse.json({ dream: dreamEntry, credits: remainingCredits })
}
