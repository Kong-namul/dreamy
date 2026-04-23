/**
 * POST /api/translate/dream
 * body: { dreamId: string, locale: 'en' }
 *
 * 원본이 한국어로 저장된 꿈을 요청한 locale 로 번역.
 * 이미 DB 에 캐시된 번역이 있으면 Claude 호출 없이 반환.
 * 처음 번역한 경우 Anthropic 호출 후 dreams.translations JSONB 에 저장.
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
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'anthropic not configured' }, { status: 500 })

  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { dreamId?: string; locale?: string } = {}
  try { body = await req.json() } catch {}

  const dreamId = body.dreamId
  const locale = body.locale
  if (!dreamId || locale !== 'en') {
    return NextResponse.json({ error: 'dreamId and locale=en required' }, { status: 400 })
  }

  const supa = supabaseServer()

  // 본인 꿈인지 확인
  const { data: user } = await supa
    .from('users').select('id').eq('email', email).is('deleted_at', null).maybeSingle()
  if (!user) return NextResponse.json({ error: 'no user' }, { status: 404 })

  const { data: dream, error } = await supa
    .from('dreams')
    .select('id, user_id, dream, interpretation, weather, pages, interpretation_blocks, lucky, translations')
    .eq('id', dreamId)
    .maybeSingle()
  if (error || !dream) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const d = dream as DreamRow
  // 드림피드 공개 꿈도 번역 가능해야 하므로 owner check 는 하지 않음

  // 캐시 히트
  if (d.translations && d.translations[locale]) {
    return NextResponse.json({ translation: d.translations[locale] })
  }

  // 번역 대상 JSON 구성
  const payload = {
    dream: d.dream,
    interpretation: d.interpretation ?? '',
    weather: d.weather ?? '',
    pages: d.pages ?? null,
    interpretationBlocks: d.interpretation_blocks ?? null,
    lucky: d.lucky ?? null,
  }

  const anthropic = new Anthropic({ apiKey })

  const systemPrompt = `You translate Korean dream-journal content into natural, warm English for the Dreamy app.
- Preserve the tone: friendly, gentle, slightly poetic.
- Keep emojis and markdown (**bold**) intact.
- Translate 'pages[*].text' in casual English (like "I was..." / "It felt...").
- Translate 'interpretationBlocks[*].body' in polite warm English.
- Keep culturally-specific references intact but add light context if helpful.
- Return ONLY a JSON object with the same shape as the input, all text fields translated.
- Empty strings or null fields stay empty/null.`

  let translated: Record<string, unknown>
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Translate this Korean dream content to English. Return ONLY the JSON object, no prose.\n\n${JSON.stringify(payload, null, 2)}`,
      }],
    })

    const text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text).join('\n').trim()

    // strip ```json fences if any
    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    translated = JSON.parse(jsonStr)
  } catch (err) {
    return NextResponse.json(
      { error: 'translation failed', detail: (err as Error).message },
      { status: 502 },
    )
  }

  // DB 캐시 저장 (기존 translations 에 머지)
  const prev = (d.translations ?? {}) as Record<string, unknown>
  const next = { ...prev, [locale]: translated }
  await supa.from('dreams').update({ translations: next }).eq('id', dreamId)

  return NextResponse.json({ translation: translated })
}
