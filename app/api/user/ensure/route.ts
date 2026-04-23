/**
 * POST /api/user/ensure
 * 로그인 직후 클라이언트가 호출. 활성 유저 row 가 있으면 그대로 반환,
 * 없으면 랜덤 닉네임/아바타 + 50 크레딧 + 가입 축하 보너스 트랜잭션까지 생성.
 * 탈퇴(deleted_at) 된 이전 row 는 무시되어 재가입 시 새 유저로 시작됨.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getRandomNickname } from '@/lib/nicknames'
import { getRandomAvatarUrl } from '@/lib/avatar'

export async function POST() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supa = supabaseServer()

  // 1) 기존 활성 유저 조회
  const { data: existing, error: findErr } = await supa
    .from('users')
    .select('id, email, nickname, avatar_url, credits, created_at')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
  if (existing) {
    return NextResponse.json({ user: existing, created: false })
  }

  // 2) 신규 생성 — 닉/아바타 랜덤 + 가입 보너스
  const insertPayload = {
    email,
    nickname: getRandomNickname(),
    avatar_url: getRandomAvatarUrl(),
    credits: 50,
  }

  const { data: created, error: insertErr } = await supa
    .from('users')
    .insert(insertPayload)
    .select('id, email, nickname, avatar_url, credits, created_at')
    .single()

  if (insertErr || !created) {
    return NextResponse.json({ error: insertErr?.message ?? 'insert failed' }, { status: 500 })
  }

  // 3) 가입 축하 보너스 트랜잭션 기록 (실패해도 가입 자체는 성공)
  await supa.from('credit_transactions').insert({
    user_id: created.id,
    type: 'bonus',
    amount: 50,
    label: '가입 축하 보너스',
  })

  return NextResponse.json({ user: created, created: true })
}
