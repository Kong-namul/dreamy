/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook. 서명을 반드시 검증하여 위조된 요청 차단.
 * checkout.session.completed 이벤트 수신 시:
 *   · payments.provider_payment_id == session.id 로 매칭
 *   · 아직 confirmed 아니면 credits 지급 + tx 기록
 */
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { stripeClient, isStripeTestMode } from '@/lib/stripe'

export const runtime = 'nodejs'   // stripe raw body needs Node runtime

async function readRawBody(req: Request): Promise<string> {
  // Next 의 Request 는 .text() 로 원문을 가져올 수 있음
  return await req.text()
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  const rawBody = await readRawBody(req)

  const stripe = stripeClient()
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    return NextResponse.json(
      { error: 'signature verification failed', detail: (err as Error).message },
      { status: 400 },
    )
  }

  // 관심 있는 이벤트만 처리
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, ignored: event.type })
  }

  const session = event.data.object as {
    id: string
    payment_status?: string
    metadata?: Record<string, string>
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ ok: true, pending: true, payment_status: session.payment_status })
  }

  const supa = supabaseServer()

  // payments confirm + credits 가산 + tx insert 를 RPC 한 번으로 원자화.
  // webhook 재전송·동시 호출 시 row lock + idempotent confirmed 분기로 중복 지급을 막는다.
  const label = `크레딧 구매 · Stripe${isStripeTestMode() ? ' (Test)' : ''}`
  const { data: rpcResult, error: rpcErr } = await supa.rpc('confirm_stripe_payment', {
    p_session_id: session.id,
    p_label: label,
  })

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }
  if (typeof rpcResult !== 'number') {
    return NextResponse.json({ error: 'rpc error' }, { status: 500 })
  }
  if (rpcResult < 0) {
    return NextResponse.json({ error: 'payment row not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, credits: rpcResult })
}
