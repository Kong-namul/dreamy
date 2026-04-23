/**
 * POST /api/translate/comment
 * body: { commentId: string, locale: 'ko' | 'en' }
 *
 * 댓글을 요청 locale 로 번역. 원본과 같은 언어면 그대로 반환.
 * dream_comments.translations[locale] 에 캐시.
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'anthropic not configured' }, { status: 500 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { commentId?: string; locale?: string } = {}
  try { body = await req.json() } catch {}

  const commentId = body.commentId
  const locale = body.locale
  if (!commentId || (locale !== 'ko' && locale !== 'en')) {
    return NextResponse.json({ error: 'commentId and locale required' }, { status: 400 })
  }

  const supa = supabaseServer()
  const { data: comment, error } = await supa
    .from('dream_comments')
    .select('id, text, translations, source_locale')
    .eq('id', commentId)
    .maybeSingle()
  if (error || !comment) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const source = (comment.source_locale ?? 'ko') as 'ko' | 'en'
  if (source === locale) {
    return NextResponse.json({ translation: null, sameAsSource: true })
  }

  const translations = (comment.translations as Record<string, string> | null) ?? {}
  if (translations[locale]) {
    return NextResponse.json({ translation: translations[locale] })
  }

  const anthropic = new Anthropic({ apiKey })
  const sourceName = source === 'en' ? 'English' : 'Korean'
  const targetName = locale === 'en' ? 'English' : 'Korean'

  let translated = ''
  try {
    const msg = await anthropic.messages.create({
      // Haiku 4.5 — 댓글 번역처럼 짧고 회전율 높은 작업은 속도 우선.
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `Translate casual Korean/English social comments between languages for a dream-journal app. Keep warmth and casual tone. Return ONLY the translated text, no quotes, no prose.`,
      messages: [{
        role: 'user',
        content: `Translate this ${sourceName} comment to ${targetName}. Return plain text only.\n\n${comment.text}`,
      }],
    })
    translated = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text).join(' ').trim()
      .replace(/^["'“”'']|["'“”'']$/g, '')
  } catch (err) {
    return NextResponse.json({ error: 'translation failed', detail: (err as Error).message }, { status: 502 })
  }

  const next = { ...translations, [locale]: translated }
  await supa.from('dream_comments').update({ translations: next }).eq('id', commentId)

  return NextResponse.json({ translation: translated })
}
