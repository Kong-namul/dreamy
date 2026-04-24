/**
 * POST /api/credits/refund
 * body: { amount: number (양수), label: string }
 * response: { credits: number } — 환불 후 크레딧
 *
 * 서버 내부 오케스트레이션에서 "크레딧은 차감됐는데 AI 작업 실패" 상황을 즉시 복구하는 용도.
 * 공개 클라이언트에서 직접 호출해도 무방하지만 abuse 방지를 위해
 * 로그인 세션 + label 길이 제한만 두고 별도 rate-limit 은 이후에.
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
  const label = (body.label ?? '환불').toString().slice(0, 80)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
    return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
  }

  const supa = supabaseServer()
  const { data, error } = await supa.rpc('refund_credits', {
    p_email: email,
    p_amount: Math.floor(amount),
    p_label: label,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ credits: data })
}
