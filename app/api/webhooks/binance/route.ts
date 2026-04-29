/**
 * POST /api/webhooks/binance
 *
 * Binance Pay webhook. 서명 검증 필수.
 *   BinancePay-Timestamp, BinancePay-Nonce, BinancePay-Signature 헤더
 *   를 사용해 HMAC-SHA512 로 본문 검증.
 *
 * bizStatus === 'PAY_SUCCESS' 이면 크레딧 지급.
 * 응답은 반드시 { returnCode: 'SUCCESS', returnMessage: null } 형태여야
 * Binance 가 재전송하지 않음.
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase/server'

const BINANCE_API_SECRET = process.env.BINANCE_PAY_API_SECRET

function verifySignature(timestamp: string, nonce: string, rawBody: string, signature: string): boolean {
  if (!BINANCE_API_SECRET) return false
  const toSign = `${timestamp}\n${nonce}\n${rawBody}\n`
  const expected = crypto
    .createHmac('sha512', BINANCE_API_SECRET)
    .update(toSign)
    .digest('hex')
    .toUpperCase()
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature.toUpperCase()),
  )
}

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!BINANCE_API_SECRET) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'not configured' }, { status: 500 })
  }

  const timestamp = req.headers.get('binancepay-timestamp')
  const nonce = req.headers.get('binancepay-nonce')
  const signature = req.headers.get('binancepay-signature')
  if (!timestamp || !nonce || !signature) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'missing signature headers' }, { status: 400 })
  }

  const rawBody = await req.text()
  if (!verifySignature(timestamp, nonce, rawBody, signature)) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'signature mismatch' }, { status: 401 })
  }

  let parsed: {
    bizType?: string
    bizStatus?: string
    data?: string    // JSON string
  } = {}
  try { parsed = JSON.parse(rawBody) } catch {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'bad body' }, { status: 400 })
  }

  // 관심 있는 이벤트: bizType=PAY, bizStatus=PAY_SUCCESS
  if (parsed.bizType !== 'PAY' || parsed.bizStatus !== 'PAY_SUCCESS') {
    return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null })
  }

  let data: { merchantTradeNo?: string; prepayId?: string; transactionId?: string } = {}
  try { data = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : (parsed.data ?? {}) }
  catch {}

  if (!data.prepayId && !data.merchantTradeNo) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'missing id' }, { status: 400 })
  }

  const supa = supabaseServer()

  // prepayId 매칭 우선, 없으면 merchantTradeNo (uuid no-hyphen) 로 찾음
  let paymentRow: { id: string; provider_payment_id: string | null } | null = null
  if (data.prepayId) {
    const { data: row } = await supa
      .from('payments')
      .select('id, provider_payment_id')
      .eq('method', 'binance_pay')
      .eq('provider_payment_id', data.prepayId)
      .maybeSingle()
    paymentRow = row
  }

  if (!paymentRow && data.merchantTradeNo) {
    // uuid 에 하이픈 넣어 복원
    const uuid =
      data.merchantTradeNo.slice(0, 8) + '-' +
      data.merchantTradeNo.slice(8, 12) + '-' +
      data.merchantTradeNo.slice(12, 16) + '-' +
      data.merchantTradeNo.slice(16, 20) + '-' +
      data.merchantTradeNo.slice(20)
    const { data: row } = await supa
      .from('payments')
      .select('id, provider_payment_id')
      .eq('id', uuid)
      .maybeSingle()
    paymentRow = row
  }

  if (!paymentRow) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'payment row not found' }, { status: 404 })
  }

  const providerPaymentId = data.prepayId ?? paymentRow.provider_payment_id
  if (!providerPaymentId) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'missing provider payment id' }, { status: 400 })
  }

  const { data: credits, error: rpcErr } = await supa.rpc('confirm_payment_by_provider', {
    p_method: 'binance_pay',
    p_provider_payment_id: providerPaymentId,
    p_provider_tx_hash: data.transactionId ?? null,
    p_label: 'USDT 크레딧 구매 · Binance Pay',
  })

  if (rpcErr) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: rpcErr.message }, { status: 500 })
  }
  if (typeof credits !== 'number' || credits < 0) {
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'payment row not found' }, { status: 404 })
  }

  return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null })
}
