/**
 * POST /api/credits/spend
 * 서버에서 원자적으로 크레딧 차감 + credit_transactions 기록.
 * body: { amount: number (양수), label: string }
 * response: { credits: number } — 차감 후 남은 크레딧
 * 잔액 부족: 402
 *
 * 구현: Supabase RPC `spend_credits(email, amount, label)` 호출.
 * 조건부 UPDATE … RETURNING 으로 잔액 확인·차감·트랜잭션 기록을 한 트랜잭션에 묶어
 * 동시 호출에도 중복 차감·음수 잔액이 생기지 않는다.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { amount?: number; label?: string } = {}
  try { body = await req.json() } catch {}

  const amount = Number(body.amount)
  const label = (body.label ?? '크레딧 사용').toString().slice(0, 80)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
    return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
  }

  const supa = supabaseServer()
  const { data, error } = await supa.rpc('spend_credits', {
    p_email: email,
    p_amount: Math.floor(amount),
    p_label: label,
  })

  if (error) {
    if (error.message === 'no user') return NextResponse.json({ error: 'no user' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // RPC 계약: -1 = 잔액 부족, >=0 = 차감 후 남은 크레딧
  if (typeof data !== 'number') {
    return NextResponse.json({ error: 'unexpected rpc response' }, { status: 500 })
  }
  if (data < 0) {
    // 현재 잔액을 함께 돌려주기 위해 한 번 조회
    const { data: u } = await supa
      .from('users')
      .select('credits')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()
    return NextResponse.json({ error: 'insufficient credits', credits: u?.credits ?? 0 }, { status: 402 })
  }

  return NextResponse.json({ credits: data })
}
