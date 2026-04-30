// Supabase Edge Function: interpret-worker
//
// Runs long dream interpretation jobs outside Vercel's 60s function limit.
// The function returns immediately and continues the job with waitUntil.
// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

type Job = {
  id: string
  user_id: string
  email: string
  client_run_id: string
  type: 'basic' | 'premium'
  dream: string
  moods: string[] | null
  source_locale: 'ko' | 'en'
  cost: number
  status: string
}

type BasicInterpretation = {
  auspice: 'auspicious' | 'ominous' | 'neutral'
  moods: string[]
  interpretation: string
}

type DiaryInterpretation = {
  auspice: 'auspicious' | 'ominous' | 'neutral'
  moods: string[]
  weather: string
  pages: Array<{ title: string; text: string; imagePrompt?: string; imageUrl?: string }>
  interpretationBlocks: Array<{ heading: string; body: string; imagePrompt?: string; imageUrl?: string }>
  lucky: {
    item: string
    colorName: string
    colorHex: string
    advice: string
    avoid: string[]
    luckyDirection?: string
    luckyNumber?: number
  }
}

const MOOD_VALUES = `'happy' | 'excited' | 'peaceful' | 'nostalgic' | 'fascinating' | 'weird' | 'confused' | 'anxious' | 'scary' | 'sad'`

const SYSTEM_BASIC = `당신은 한국 민속 해몽과 융 심리학에 능통한 따뜻한 해몽가입니다.

반드시 아래 JSON 스키마만 출력 (마크다운 백틱 없이 순수 JSON):
{
  "auspice": "auspicious" | "ominous" | "neutral",
  "moods": [${MOOD_VALUES}, ...] (1~3개),
  "interpretation": "string"
}

interpretation 작성 규칙:
첫 오프닝 1~2문장.

상징 해석
• 불릿 1
• 불릿 2
• 불릿 3

심리적 의미
2~3문장.

오늘의 조언
1~2문장.

존댓말. 이모지 금지. 전체 600~900자. 의료·재무·법률 자문 금지.`

const SYSTEM_DIARY = `당신은 한국 민속 해몽과 융 심리학에 능통한 해몽가입니다. 사용자의 꿈을 그림일기 + 상세 해석 + 오늘의 길잡이 JSON 으로 돌려주세요.

반드시 아래 스키마만 출력 (마크다운 백틱 없이 순수 JSON):
{
  "auspice": "auspicious" | "ominous" | "neutral",
  "moods": [${MOOD_VALUES}, ...],
  "weather": "3~6자 한국어",
  "pages": [
    {
      "title": "5~8자 제목",
      "text": "2~3문장, 반말 친근체",
      "imagePrompt": "English prompt, 30~60 chars"
    }
  ],
  "interpretationBlocks": [
    {
      "heading": "소제목",
      "body": "150~280자, 존댓말",
      "imagePrompt": "English prompt, 30~60 chars"
    }
  ],
  "lucky": {
    "item": "가지고 다닐 수 있는 구체 아이템",
    "colorName": "한글 색상명",
    "colorHex": "#RRGGBB",
    "advice": "1문장",
    "avoid": ["피해야 할 것 1", "2", "3"],
    "luckyDirection": "방향",
    "luckyNumber": 숫자
  }
}

pages는 총 5개. interpretationBlocks는 5~7개, 총 1200~2000자.
이미지 프롬프트는 영어, 한국어 텍스트·실명·브랜드 금지.
이모지 금지. 단정적 예언, 의료·재무 자문 금지.`

const URL_VERSION = 'v2'

function appOrigin() {
  return Deno.env.get('APP_URL') ?? Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://dreamy-tau.vercel.app'
}

function buildImageUrl(prompt: string, seed: number) {
  const params = new URLSearchParams({
    p: prompt,
    s: String(seed),
    w: '640',
    h: '400',
    v: URL_VERSION,
  })
  return `${appOrigin()}/api/image?${params.toString()}`
}

function attachImageUrls<T extends { title: string; text: string; imagePrompt?: string }>(pages: T[]) {
  const baseSeed = Math.floor(Math.random() * 99999)
  return pages.map((page, index) => ({
    ...page,
    imageUrl: buildImageUrl(page.imagePrompt || `${page.title} ${page.text.slice(0, 40)}`, baseSeed + index),
  }))
}

function parseJson<T>(text: string): T {
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''))
}

async function callAnthropic(system: string, userText: string, maxTokens: number) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userText }],
    }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Anthropic error ${res.status}`)
  }

  const text = body?.content?.[0]?.text
  if (!text) throw new Error('Anthropic returned empty content')
  return text as string
}

async function interpretBasic(dream: string, moods: string[]): Promise<BasicInterpretation> {
  const moodText = moods.length > 0 ? `\n사용자가 선택한 기분: ${moods.join(', ')}` : ''
  const text = await callAnthropic(SYSTEM_BASIC, `꿈 내용:\n${dream}${moodText}`, 2000)
  try {
    return parseJson<BasicInterpretation>(text)
  } catch {
    return { auspice: 'neutral', moods: [], interpretation: text }
  }
}

async function interpretDiary(dream: string, moods: string[]): Promise<DiaryInterpretation> {
  const moodText = moods.length > 0 ? `\n사용자가 선택한 기분: ${moods.join(', ')}` : ''
  const text = await callAnthropic(SYSTEM_DIARY, `꿈 내용:\n${dream}${moodText}`, 4500)
  const parsed = parseJson<DiaryInterpretation>(text)
  return { ...parsed, pages: attachImageUrls(parsed.pages ?? []) }
}

function supabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!url || !key) throw new Error('Supabase service env missing')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function processJob(jobId: string) {
  const supa = supabaseAdmin()

  const { data: job, error: jobErr } = await supa
    .from('interpret_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()
  if (jobErr || !job) throw new Error(jobErr?.message ?? 'job not found')

  const current = job as Job
  if (current.status !== 'pending') return

  await supa
    .from('interpret_jobs')
    .update({ status: 'running', started_at: new Date().toISOString(), error: null })
    .eq('id', current.id)

  let creditsAfter: number | null = null
  let spent = false

  const fail = async (message: string, shouldRefund: boolean) => {
    if (shouldRefund && spent) {
      const { data: refundCredits } = await supa.rpc('refund_credits', {
        p_email: current.email,
        p_amount: current.cost,
        p_label: `${current.type === 'premium' ? '그림일기' : '기본 해석'} 자동 환불 (${current.client_run_id})`,
      })
      if (typeof refundCredits === 'number') creditsAfter = refundCredits
    }

    await supa
      .from('interpret_jobs')
      .update({
        status: shouldRefund && spent ? 'refunded' : 'failed',
        error: message,
        credits_after: creditsAfter,
        completed_at: new Date().toISOString(),
      })
      .eq('id', current.id)
  }

  try {
    const label = current.type === 'premium' ? '그림일기' : '기본 해석'
    const moods = current.moods ?? []
    const aiData = current.type === 'premium'
      ? await interpretDiary(current.dream, moods)
      : await interpretBasic(current.dream, moods)

    const { data: spendResult, error: spendErr } = await supa.rpc('spend_credits', {
      p_email: current.email,
      p_amount: current.cost,
      p_label: label,
    })
    if (spendErr) throw new Error(spendErr.message)
    if (typeof spendResult !== 'number') throw new Error('spend rpc error')
    if (spendResult < 0) {
      await fail('크레딧이 부족해요.', false)
      return
    }
    spent = true
    creditsAfter = spendResult

    const { data: saved, error: saveErr } = await supa
      .from('dreams')
      .insert({
        user_id: current.user_id,
        dream: current.dream,
        interpretation: current.type === 'premium' ? '' : aiData.interpretation ?? '',
        moods: moods.length > 0 ? moods : aiData.moods ?? [],
        auspice: aiData.auspice ?? null,
        type: current.type,
        weather: 'weather' in aiData ? aiData.weather ?? null : null,
        pages: 'pages' in aiData ? aiData.pages ?? null : null,
        interpretation_blocks: 'interpretationBlocks' in aiData ? aiData.interpretationBlocks ?? null : null,
        lucky: 'lucky' in aiData ? aiData.lucky ?? null : null,
        shared: false,
        source_locale: current.source_locale,
      })
      .select('id')
      .single()
    if (saveErr || !saved) throw new Error(saveErr?.message ?? 'save failed')

    await supa
      .from('interpret_jobs')
      .update({
        status: 'completed',
        dream_id: saved.id,
        credits_after: creditsAfter,
        completed_at: new Date().toISOString(),
      })
      .eq('id', current.id)
  } catch (error) {
    await fail(error instanceof Error ? error.message : 'unknown error', true)
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 })
  }

  const body = await req.json().catch(() => ({}))
  const jobId = body?.jobId
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'missing jobId' }), { status: 400 })
  }

  EdgeRuntime.waitUntil(processJob(jobId))
  return new Response(JSON.stringify({ ok: true, jobId }), {
    status: 202,
    headers: { 'content-type': 'application/json' },
  })
})
