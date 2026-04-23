/**
 * PATCH /api/user/profile
 * 현재 로그인 유저의 닉네임·아바타 업데이트.
 * body: { nickname?: string; avatar_url?: string | null }
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { nickname?: string; avatar_url?: string | null } = {}
  try { body = await req.json() } catch {}

  const update: { nickname?: string; avatar_url?: string | null } = {}

  if (typeof body.nickname === 'string') {
    const n = body.nickname.trim()
    if (!n || n.length > 12) {
      return NextResponse.json({ error: 'nickname must be 1~12 chars' }, { status: 400 })
    }
    update.nickname = n
  }
  if (body.avatar_url === null || typeof body.avatar_url === 'string') {
    update.avatar_url = body.avatar_url
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const supa = supabaseServer()
  const { data, error } = await supa
    .from('users')
    .update(update)
    .eq('email', email)
    .is('deleted_at', null)
    .select('id, nickname, avatar_url, credits')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'no active user' }, { status: 404 })

  return NextResponse.json({ user: data })
}
