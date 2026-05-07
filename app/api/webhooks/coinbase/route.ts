/**
 * POST /api/webhooks/coinbase
 *
 * Coinbase Business Checkouts webhook (Hook0 표준 서명).
 *
 * 옛 Commerce 와 차이:
 *  - 헤더: X-CC-Webhook-Signature → X-Hook0-Signature
 *  - 서명 대상: rawBody → `${timestamp}.${headerNames}.${headerValues}.${rawBody}`
 *  - 5분 replay 윈도우
 *  - 이벤트: charge:confirmed → checkout.payment.success
 *
 * 멱등성: payments(method, provider_payment_id) unique + RPC row lock.
 *
 * ref: https://docs.cdp.coinbase.com/coinbase-business/checkout-apis/webhooks
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase/server'

const WEBHOOK_SECRET = process.env.COINBASE_CHECKOUT_WEBHOOK_SECRET
const MAX_AGE_SECONDS = 5 * 60

export const runtime = 'nodejs'

/**
 * Hook0 시그니처 헤더 파싱.
 * 형식 예: "t=1714578900,h=x-foo x-bar,v0=abc123..."
 */
function parseHook0Header(headerValue: string): {
  timestamp?: string
  headerNames?: string
  signature?: string
} {
  const out: { timestamp?: string; headerNames?: string; signature?: string } = {}
  for (const part of headerValue.split(',')) {
    const [k, ...rest] = part.split('=')
    const v = rest.join('=').trim()
    const key = k?.trim()
    if (key === 't') out.timestamp = v
    else if (key === 'h') out.headerNames = v
    else if (key === 'v0') out.signature = v
  }
  return out
}

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 })
  }

  const sigHeader = req.headers.get('x-hook0-signature')
  if (!sigHeader) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  const { timestamp, headerNames, signature } = parseHook0Header(sigHeader)
  if (!timestamp || !signature) {
    return NextResponse.json({ error: 'malformed signature header' }, { status: 400 })
  }

  // 5분 replay 윈도우
  const tsNum = Number(timestamp)
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > MAX_AGE_SECONDS) {
    return NextResponse.json({ error: 'timestamp out of range' }, { status: 401 })
  }

  const rawBody = await req.text()

  // signed payload = `${timestamp}.${headerNames}.${headerValues}.${rawBody}`
  // headerValues: h 필드의 헤더이름들을 공백 분리 → 각각의 실제 값을 dot-join
  const headerValues = (headerNames ?? '')
    .split(' ')
    .filter(Boolean)
    .map(name => req.headers.get(name) ?? '')
    .join('.')

  const signedPayload = `${timestamp}.${headerNames ?? ''}.${headerValues}.${rawBody}`
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex')

  const sigOk = (() => {
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    } catch {
      return false
    }
  })()

  if (!sigOk) {
    return NextResponse.json({ error: 'signature mismatch' }, { status: 401 })
  }

  let event: {
    eventType?: string
    type?: string
    id?: string
    metadata?: { paymentId?: string; userId?: string }
    transactionHash?: string
    status?: string
  } = {}
  try { event = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  // payload 가 Hook0 envelope 으로 감쌀 가능성 대비: top-level 또는 data.* 둘 다 시도
  const payloadAny = event as unknown as { data?: typeof event }
  const checkout = payloadAny.data ?? event
  const eventType = event.eventType ?? event.type
  const checkoutId = checkout.id
  const paymentId = checkout.metadata?.paymentId

  if (eventType !== 'checkout.payment.success') {
    return NextResponse.json({ ok: true, ignored: eventType ?? 'unknown' })
  }

  if (!checkoutId || !paymentId) {
    return NextResponse.json({ error: 'missing checkoutId or paymentId' }, { status: 400 })
  }

  const supa = supabaseServer()

  const { data: payment } = await supa
    .from('payments')
    .select('id')
    .eq('id', paymentId)
    .eq('provider_payment_id', checkoutId)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: 'payment not found' }, { status: 404 })
  }

  const txHash = checkout.transactionHash ?? null

  const { data: credits, error: rpcErr } = await supa.rpc('confirm_payment_by_provider', {
    p_method: 'coinbase_commerce',
    p_provider_payment_id: checkoutId,
    p_provider_tx_hash: txHash,
    p_label: '크레딧 구매 · Coinbase',
  })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  if (typeof credits !== 'number') return NextResponse.json({ error: 'rpc error' }, { status: 500 })
  if (credits < 0) return NextResponse.json({ error: 'payment row not found' }, { status: 404 })

  return NextResponse.json({ ok: true, credits })
}
