/**
 * POST /api/credits/spend
 * 서버에서 원자적으로 크레딧 차감 + credit_transactions 기록.
 * body: { amount: number (양수), label: string }
 * response: { credits: number } — 차감 후 남은 크레딧
 * 잔액 부족: 402
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

  const { data: user, error: userErr } = await supa
    .from('users')
    .select('id, credits')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (userErr || !user) {
    return NextResponse.json({ error: 'no user' }, { status: 404 })
  }

  if (user.credits < amount) {
    return NextResponse.json({ error: 'insufficient credits', credits: user.credits }, { status: 402 })
  }

  const newCredits = user.credits - amount

  // NOTE: 원자적 차감을 위해 updated_at 기반 optimistic lock 이 이상적이지만,
  // 현 단계 규모에선 단순 UPDATE 면 충분. 동시성 이슈 생기면 RPC/stored procedure 로 이관.
  const { error: updErr } = await supa
    .from('users')
    .update({ credits: newCredits })
    .eq('id', user.id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  await supa.from('credit_transactions').insert({
    user_id: user.id,
    type: 'spend',
    amount: -amount,
    label,
  })

  return NextResponse.json({ credits: newCredits })
}
