/**
 * POST /api/webhooks/coinbase
 *
 * Coinbase Commerce webhook.
 * X-CC-Webhook-Signature 헤더 (HMAC-SHA256) 로 서명 검증.
 *
 * charge:confirmed 이벤트 수신 시 크레딧 지급.
 * 멱등성: payments.provider_payment_id unique + status === 'confirmed' 체크.
 *
 * ref: https://docs.cloud.coinbase.com/commerce/docs/webhooks-overview
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase/server'

const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 })
  }

  const sig = req.headers.get('x-cc-webhook-signature')
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  const rawBody = await req.text()

  // HMAC-SHA256 검증
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  const sigOk = (() => {
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    } catch {
      return false
    }
  })()

  if (!sigOk) {
    return NextResponse.json({ error: 'signature mismatch' }, { status: 401 })
  }

  let event: {
    type?: string
    data?: {
      id?: string
      metadata?: { paymentId?: string; userId?: string }
      payments?: Array<{ transaction_id?: string }>
    }
  } = {}
  try { event = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  // 관심 이벤트만 처리
  if (event.type !== 'charge:confirmed' && event.type !== 'charge:resolved') {
    return NextResponse.json({ ok: true, ignored: event.type })
  }

  const chargeId = event.data?.id
  const paymentId = event.data?.metadata?.paymentId
  if (!chargeId || !paymentId) {
    return NextResponse.json({ error: 'missing chargeId or paymentId' }, { status: 400 })
  }

  const supa = supabaseServer()

  const { data: payment } = await supa
    .from('payments')
    .select('id, user_id, credits, status')
    .eq('id', paymentId)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: 'payment not found' }, { status: 404 })
  }

  if (payment.status === 'confirmed') {
    return NextResponse.json({ ok: true, alreadyProcessed: true })
  }

  const txId = event.data?.payments?.[0]?.transaction_id ?? null
  const nowIso = new Date().toISOString()

  await supa
    .from('payments')
    .update({
      status: 'confirmed',
      provider_tx_hash: txId,
      confirmed_at: nowIso,
    })
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
    label: '크레딧 구매 · Coinbase Commerce',
  })

  return NextResponse.json({ ok: true, credits: newCredits })
}
