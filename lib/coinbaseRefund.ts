/**
 * Coinbase Business — Refund Checkout API 호출.
 *
 * 흐름:
 *   1. dreamy 관리자가 환불 트리거 (UI 버튼)
 *   2. 우리 서버가 이 함수로 Coinbase API 호출
 *   3. Coinbase 가 손님 지갑으로 USDC 자동 송금 시작
 *   4. 송금 완료 시점에 Coinbase 가 우리 webhook 한테
 *      `checkout.refund.success` 이벤트 발사
 *   5. 우리 webhook handler 가 revoke_credits_by_provider RPC 호출
 *      → 크레딧 자동 차감
 *
 * 즉 이 함수는 "환불 시작" 만 담당. 실제 크레딧 차감은
 * webhook 도착 후에 일어남 (비동기).
 *
 * ref: https://docs.cdp.coinbase.com/api-reference/business-api/rest-api/checkouts/refund-checkout
 */
import 'server-only'
import crypto from 'crypto'
import { generateCoinbaseJwt } from './coinbaseJwt'

const HOST = 'business.coinbase.com'

export interface RefundResult {
  ok: true
  refundId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  amount: string
  transactionHash?: string
}

export interface RefundError {
  ok: false
  status: number
  error: string
}

/**
 * @param checkoutId Coinbase 가 발급한 checkout 의 ID (24-char hex)
 * @param amount     환불 금액 (양수, 소수점 둘째자리까지). USDC 또는 결제 통화 기준.
 * @param reason     선택. 최대 500자.
 */
export async function refundCheckout(
  checkoutId: string,
  amount: string,
  reason?: string,
): Promise<RefundResult | RefundError> {
  const path = `/api/v1/checkouts/${checkoutId}/refund`
  const url = `https://${HOST}${path}`

  let token: string
  try {
    token = generateCoinbaseJwt('POST', path)
  } catch (err) {
    return { ok: false, status: 500, error: `jwt failed: ${(err as Error).message}` }
  }

  const body: Record<string, string> = { amount }
  if (reason) body.reason = reason.slice(0, 500)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    return { ok: false, status: 500, error: `fetch failed: ${(err as Error).message}` }
  }

  const rawText = await res.text()
  let json: unknown = null
  try { json = JSON.parse(rawText) } catch { /* leave null */ }

  if (!res.ok) {
    // Coinbase 가 어떤 모양으로든 에러 본문을 줄 수 있어, 가능한 후보 다 훑고
    // 마지막엔 raw text 일부를 같이 노출 (진단 우선).
    const j = json as Record<string, unknown> | null
    const fields = [
      j?.message,
      j?.error,
      (j?.error as Record<string, unknown> | undefined)?.message,
      (j?.errors as unknown[])?.[0],
    ].filter(v => typeof v === 'string') as string[]

    const detail =
      fields[0] ??
      (rawText ? rawText.slice(0, 240) : `HTTP ${res.status}`)

    console.error('[coinbase][refund] failed', {
      status: res.status,
      checkoutId,
      amount,
      body: rawText.slice(0, 800),
    })

    return { ok: false, status: res.status, error: detail }
  }

  const refund = (json as { refund?: { id?: string; status?: string; amount?: string; transactionHash?: string } } | null)?.refund
  if (!refund?.id || !refund?.status) {
    return { ok: false, status: 500, error: 'malformed refund response' }
  }

  return {
    ok: true,
    refundId: refund.id,
    status: refund.status as RefundResult['status'],
    amount: refund.amount ?? amount,
    transactionHash: refund.transactionHash,
  }
}
