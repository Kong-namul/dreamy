/**
 * POST /api/admin/refund
 *
 * 관리자가 특정 결제를 환불 트리거. Coinbase Refund Checkout API 호출.
 *
 * 흐름:
 *  1. 관리자 인증
 *  2. paymentId 로 DB 에서 payments row 조회
 *  3. method = coinbase_commerce, status = confirmed 인 행만 환불 가능
 *  4. provider_payment_id (= checkout id) 로 Coinbase Refund API 호출
 *  5. 성공 시 즉시 응답 (크레딧 차감은 webhook 도착 후 별도 RPC 가 처리)
 *
 * Body: { paymentId: string, reason?: string, amount?: string }
 *  - amount 안 주면 결제 전액 (USDC) 으로 환불
 */
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { supabaseServer } from '@/lib/supabase/server'
import { refundCheckout } from '@/lib/coinbaseRefund'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { paymentId?: string; reason?: string; amount?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const paymentId = body.paymentId
  if (!paymentId) return NextResponse.json({ error: 'missing paymentId' }, { status: 400 })

  const supa = supabaseServer()

  const { data: payment, error: pErr } = await supa
    .from('payments')
    .select('id, method, status, credits, provider_payment_id, amount_usd_cents')
    .eq('id', paymentId)
    .maybeSingle()

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
  if (!payment) return NextResponse.json({ error: 'payment not found' }, { status: 404 })

  if (payment.method !== 'coinbase_commerce') {
    return NextResponse.json({ error: `refund via API only supported for coinbase_commerce (got ${payment.method})` }, { status: 400 })
  }
  if (payment.status !== 'confirmed') {
    return NextResponse.json({ error: `payment status must be confirmed (got ${payment.status})` }, { status: 400 })
  }
  if (!payment.provider_payment_id) {
    return NextResponse.json({ error: 'payment missing provider_payment_id' }, { status: 400 })
  }

  // 기본: 결제 전액 환불 (amount_usd_cents → "0.75")
  // body.amount 가 명시되면 우선.
  const amount =
    body.amount ??
    (payment.amount_usd_cents
      ? (payment.amount_usd_cents / 100).toFixed(2)
      : null)

  if (!amount) {
    return NextResponse.json({ error: 'cannot infer refund amount' }, { status: 400 })
  }

  const result = await refundCheckout(payment.provider_payment_id, amount, body.reason)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, providerStatus: result.status },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    refundId: result.refundId,
    refundStatus: result.status,
    amount: result.amount,
    transactionHash: result.transactionHash ?? null,
    note: '크레딧 차감은 Coinbase 가 환불 완료 webhook 을 보낸 후 자동으로 처리됨.',
  })
}
