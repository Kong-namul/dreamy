/**
 * /api/dreams/[id]/comments
 *   · GET  → 해당 꿈의 모든 댓글
 *   · POST → 내 닉네임으로 댓글 추가. body: { text: string }
 *
 * dream_comments 는 꿈 작성자뿐 아니라 드림피드의 공개 꿈에도 누구나 달 수 있어야
 * 하므로 '꿈의 소유자' 체크 없이 '본인 유저가 로그인 되어있다'만 체크한다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supa = supabaseServer()

  const { data, error } = await supa
    .from('dream_comments')
    .select('id, author_name, author_initial, text, created_at, source_locale, translations')
    .eq('dream_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const comments = (data ?? []).map((c) => ({
    id: c.id,
    authorName: c.author_name,
    authorInitial: c.author_initial,
    text: c.text,
    date: c.created_at,
    sourceLocale: (c.source_locale === 'en' ? 'en' : 'ko') as 'ko' | 'en',
    translations: (c.translations as Record<string, string> | null) ?? undefined,
  }))
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: dreamId } = await ctx.params
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { text?: string; sourceLocale?: 'ko' | 'en' } = {}
  try { body = await req.json() } catch {}
  const text = body.text?.trim()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  if (text.length > 500) return NextResponse.json({ error: 'text too long' }, { status: 400 })
  const sourceLocale = body.sourceLocale === 'en' ? 'en' : 'ko'

  const supa = supabaseServer()

  const { data: user } = await supa
    .from('users')
    .select('id, nickname')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (!user) return NextResponse.json({ error: 'no user' }, { status: 404 })

  const { data: dream } = await supa
    .from('dreams')
    .select('id')
    .eq('id', dreamId)
    .maybeSingle()
  if (!dream) return NextResponse.json({ error: 'dream not found' }, { status: 404 })

  const authorName = user.nickname || '꿈꾸는이'
  const authorInitial = authorName.charAt(0) || '?'

  const { data, error } = await supa
    .from('dream_comments')
    .insert({
      dream_id: dreamId,
      author_user_id: user.id,
      author_name: authorName,
      author_initial: authorInitial,
      text,
      source_locale: sourceLocale,
    })
    .select('id, author_name, author_initial, text, created_at, source_locale')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 })

  return NextResponse.json({
    comment: {
      id: data.id,
      authorName: data.author_name,
      authorInitial: data.author_initial,
      text: data.text,
      date: data.created_at,
      sourceLocale: (data.source_locale === 'en' ? 'en' : 'ko') as 'ko' | 'en',
    },
  })
}
