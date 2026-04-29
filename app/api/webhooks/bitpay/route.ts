/**
 * POST /api/webhooks/bitpay
 *
 * BitPay 의 IPN (Instant Payment Notification) 을 받는 엔드포인트.
 * BitPay 는 HMAC 서명이 아니라 "재조회(re-query)" 방식으로 검증 → IPN body 는
 * 신뢰하지 않고, body 의 invoice.id 로 BitPay API 에 status 를 다시 물어본다.
 *
 * status transitions that grant credit:
 *   · 'confirmed'  — 전송이 컨펌됨 (블록체인 컨펌 완료)
 *   · 'complete'   — 최종 정산 완료 (BitPay 정산 계정 입금)
 *
 * 중복 처리는 payments.provider_payment_id unique index 로 방지.
 */
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

const BITPAY_API_BASE = process.env.BITPAY_API_BASE ?? 'https://test.bitpay.com'
const BITPAY_API_TOKEN = process.env.BITPAY_API_TOKEN

// 로그용 유틸
async function logWebhook(supa: ReturnType<typeof supabaseServer>, body: unknown, note: string) {
  try {
    // webhook_logs 테이블이 있으면 기록 (스키마에 있음). 실패해도 본 처리엔 영향 X.
    await supa.from('webhook_logs').insert({
      provider: 'bitpay',
      event_type: note,
      signature_ok: true,
      body: body as Record<string, unknown>,
      processed: false,
    })
  } catch { /* no-op */ }
}

export async function POST(req: Request) {
  if (!BITPAY_API_TOKEN) {
    return NextResponse.json({ error: 'BitPay not configured' }, { status: 500 })
  }

  let body: { data?: { id?: string; status?: string } } = {}
  try { body = await req.json() } catch {}

  const invoiceId = body?.data?.id
  if (!invoiceId) {
    return NextResponse.json({ error: 'missing invoice id' }, { status: 400 })
  }

  const supa = supabaseServer()
  await logWebhook(supa, body, 'ipn-received')

  // 재조회로 신뢰 확보
  let verifyRes: Response
  try {
    verifyRes = await fetch(`${BITPAY_API_BASE}/invoices/${invoiceId}?token=${BITPAY_API_TOKEN}`, {
      method: 'GET',
      headers: { 'x-accept-version': '2.0.0' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'bitpay unreachable', detail: (err as Error).message }, { status: 502 })
  }

  const verifyJson = await verifyRes.json().catch(() => ({}))
  if (!verifyRes.ok || !verifyJson?.data) {
    return NextResponse.json({ error: 'verify failed', detail: verifyJson }, { status: 502 })
  }

  const invoice = verifyJson.data as {
    id: string
    status: string          // 'new' | 'paid' | 'confirmed' | 'complete' | 'expired' | 'invalid'
    orderId?: string
    price?: number
    currency?: string
    transactions?: Array<{ txid?: string }>
  }

  // 지급 대상 상태
  const isSuccess = invoice.status === 'confirmed' || invoice.status === 'complete'
  if (!isSuccess) {
    // 중간 상태(new/paid) 는 그냥 로그만 찍고 200 반환 (BitPay 가 재시도 안 하게)
    return NextResponse.json({ ok: true, status: invoice.status, pending: true })
  }

  // payments row 조회 (orderId = 우리 payments.id)
  if (!invoice.orderId) {
    return NextResponse.json({ error: 'missing orderId' }, { status: 400 })
  }

  const { data: paymentRow, error: pErr } = await supa
    .from('payments')
    .select('id')
    .eq('id', invoice.orderId)
    .maybeSingle()
  if (pErr || !paymentRow) {
    return NextResponse.json({ error: 'payment not found' }, { status: 404 })
  }

  const txHash = invoice.transactions?.[0]?.txid ?? null

  const { data: credits, error: rpcErr } = await supa.rpc('confirm_payment_by_provider', {
    p_method: 'bitpay',
    p_provider_payment_id: invoice.id,
    p_provider_tx_hash: txHash,
    p_label: `크레딧 구매 · BitPay${BITPAY_API_BASE.includes('test.') ? ' (Testnet)' : ''}`,
  })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  if (typeof credits !== 'number') return NextResponse.json({ error: 'rpc error' }, { status: 500 })
  if (credits < 0) return NextResponse.json({ error: 'payment row not found' }, { status: 404 })

  return NextResponse.json({ ok: true, credits })
}
