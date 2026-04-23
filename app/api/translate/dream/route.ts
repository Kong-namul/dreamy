/**
 * POST /api/translate/dream
 * body: { dreamId: string, locale: 'ko' | 'en' }
 *
 * 꿈을 요청한 locale 로 번역. 원본이 이미 해당 언어면 그대로 반환 (캐시 기록 안함).
 * 그렇지 않으면 dreams.translations[locale] 캐시 또는 Claude 호출 후 캐시.
 *
 * 번역 대상 필드:
 *   dream, interpretation, weather,
 *   pages[*].{title, text, imagePrompt},
 *   interpretationBlocks[*].{heading, body},
 *   lucky.{item, colorName, advice, avoid[], luckyDirection}
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

// Claude 번역이 길 땐 10~20초 걸릴 수 있어 Vercel 기본 10s 타임아웃을 늘린다.
// Hobby 플랜은 상한(10s) 으로 자동 clamp, Pro 플랜은 60s 까지 사용.
export const maxDuration = 60

type DreamRow = {
  id: string
  user_id: string
  dream: string
  interpretation: string | null
  weather: string | null
  pages: unknown
  interpretation_blocks: unknown
  lucky: unknown
  translations: Record<string, unknown> | null
  source_locale: string | null
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'anthropic not configured' }, { status: 500 })

  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: {
    dreamId?: string
    locale?: string
    content?: {
      dream?: string
      interpretation?: string | null
      weather?: string | null
      pages?: unknown
      interpretationBlocks?: unknown
      lucky?: unknown
      sourceLocale?: 'ko' | 'en'
    }
  } = {}
  try { body = await req.json() } catch {}

  const dreamId = body.dreamId
  const locale = body.locale
  if (!dreamId || (locale !== 'en' && locale !== 'ko')) {
    return NextResponse.json({ error: 'dreamId and locale (ko|en) required' }, { status: 400 })
  }

  const supa = supabaseServer()

  const { data: dream } = await supa
    .from('dreams')
    .select('id, user_id, dream, interpretation, weather, pages, interpretation_blocks, lucky, translations, source_locale')
    .eq('id', dreamId)
    .maybeSingle()

  // DB 에 없는 꿈 (seed / sample) 은 inline content 로 번역, DB 캐싱 안함
  const inlineOnly = !dream
  if (inlineOnly && !body.content?.dream) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const d = (dream ?? null) as DreamRow | null

  // source_locale 태그가 실제 본문 언어와 다른 경우 (예: 영어 UI 에서 한국어로 작성하며 태그가 'en' 으로 붙음)
  // 본문의 한글 비율로 실제 언어를 감지하고 태그보다 우선. 그렇지 않으면
  // "sameAsSource" 로 오판해 원문 한글이 그대로 영어권 사용자에게 노출됨.
  const actualText = (d?.dream ?? body.content?.dream ?? '') as string
  const tagged = (d?.source_locale ?? body.content?.sourceLocale ?? 'ko') as 'ko' | 'en'
  const detected: 'ko' | 'en' = (() => {
    if (!actualText) return tagged
    let hangul = 0, latin = 0
    for (const ch of actualText) {
      const code = ch.codePointAt(0)!
      if (code >= 0xac00 && code <= 0xd7a3) hangul++
      else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) latin++
    }
    const total = hangul + latin
    if (total === 0) return tagged
    return hangul / total >= 0.2 ? 'ko' : 'en'
  })()
  const source: 'ko' | 'en' = tagged === detected ? tagged : detected

  // 요청 언어가 원본과 같으면 번역 불필요 → 원본 반환
  if (source === locale) {
    return NextResponse.json({ translation: null, sameAsSource: true })
  }

  // 캐시 히트 (DB 있는 경우만) — 단, 비어있거나 dream 본문이 누락된 경우는 무효로 간주
  if (d?.translations && d.translations[locale]) {
    const cached = d.translations[locale] as Record<string, unknown>
    const hasAny = !!cached && typeof cached === 'object' && Object.keys(cached).length > 0 && !!cached.dream
    if (hasAny) {
      return NextResponse.json({ translation: cached })
    }
  }

  // 번역 대상 JSON 구성
  const payload = d
    ? {
        dream: d.dream,
        interpretation: d.interpretation ?? '',
        weather: d.weather ?? '',
        pages: d.pages ?? null,
        interpretationBlocks: d.interpretation_blocks ?? null,
        lucky: d.lucky ?? null,
      }
    : {
        dream: body.content!.dream ?? '',
        interpretation: body.content!.interpretation ?? '',
        weather: body.content!.weather ?? '',
        pages: body.content!.pages ?? null,
        interpretationBlocks: body.content!.interpretationBlocks ?? null,
        lucky: body.content!.lucky ?? null,
      }

  const anthropic = new Anthropic({ apiKey })

  const sourceName = source === 'en' ? 'English' : 'Korean'
  const targetName = locale === 'en' ? 'English' : 'Korean'
  const toneHint = locale === 'en'
    ? 'friendly, gentle, slightly poetic English. Pages use casual narration ("I was…"); interpretationBlocks use polite warm prose.'
    : '따뜻하고 약간 시적인 한국어. pages 는 반말 친근체(\"~이었어\"), interpretationBlocks 는 존댓말(\"~예요\").'

  const systemPrompt = `You translate dream-journal content from ${sourceName} to ${targetName} for the Dreamy app.
- Tone: ${toneHint}
- Keep emojis and markdown (**bold**) intact.
- Keep culturally-specific references; add light context if helpful.
- Return ONLY a JSON object with the same shape as the input, all text fields translated.
- Empty strings or null fields stay empty/null.`

  let translated: Record<string, unknown>
  try {
    const msg = await anthropic.messages.create({
      // Haiku 4.5 = Sonnet 대비 2~3배 빠름. 피드 번역은 속도가 UX 의 전부라 Haiku 사용.
      // 번역 품질은 여전히 자연스러운 수준.
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Translate this ${sourceName} dream content to ${targetName}. Return ONLY the JSON object, no prose.\n\n${JSON.stringify(payload, null, 2)}`,
      }],
    })

    const text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text).join('\n').trim()

    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    translated = JSON.parse(jsonStr)
  } catch (err) {
    return NextResponse.json(
      { error: 'translation failed', detail: (err as Error).message },
      { status: 502 },
    )
  }

  if (d) {
    const prev = (d.translations ?? {}) as Record<string, unknown>
    const next = { ...prev, [locale]: translated }
    await supa.from('dreams').update({ translations: next }).eq('id', dreamId)
  }

  return NextResponse.json({ translation: translated })
}
