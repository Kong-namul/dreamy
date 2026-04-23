/**
 * POST /api/user/withdraw
 * 현재 로그인된 사용자의 활성 row 를 soft-delete (deleted_at = now()).
 * 연관 데이터(dreams, credit_transactions 등)는 보존되어 기록으로 남음.
 * 동일 이메일로 다시 로그인하면 ensure API 가 새 row 를 만들어 신규 유저처럼 시작.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supa = supabaseServer()
  const nowIso = new Date().toISOString()

  const { data, error } = await supa
    .from('users')
    .update({ deleted_at: nowIso })
    .eq('email', email)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'no active user' }, { status: 404 })

  return NextResponse.json({ ok: true, deletedUserId: data.id, deletedAt: nowIso })
}
