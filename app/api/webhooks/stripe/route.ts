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

  const { data: payment } = await supa
    .from('payments')
    .select('id, user_id, credits, status')
    .eq('method', 'stripe')
    .eq('provider_payment_id', session.id)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: 'payment row not found' }, { status: 404 })
  }

  if (payment.status === 'confirmed') {
    return NextResponse.json({ ok: true, alreadyProcessed: true })
  }

  const nowIso = new Date().toISOString()

  await supa
    .from('payments')
    .update({ status: 'confirmed', confirmed_at: nowIso })
    .eq('id', payment.id)

  const { data: userRow } = await supa
    .from('users')
    .select('credits')
    .eq('id', payment.user_id)
    .maybeSingle()
  const newCredits = (userRow?.credits ?? 0) + payment.credits

  await supa.from('users').update({ credits: newCredits }).eq('id', payment.user_id)
  await supa.from('credit_transactions').insert({
    user_id: payment.user_id,
    type: 'purchase',
    amount: payment.credits,
    label: `크레딧 구매 · Stripe${isStripeTestMode() ? ' (Test)' : ''}`,
  })

  return NextResponse.json({ ok: true, credits: newCredits })
}
