/**
 * POST /api/payment/verify-base
 *
 * Body: { baseId: string, packageId: 'basic' | 'popular' | 'large' }
 *
 * 클라이언트 Base Pay SDK 의 pay() 가 성공 반환한 id 를 받아
 * 서버에서 getPaymentStatus 로 재검증:
 *   · status === 'completed'
 *   · recipient === MERCHANT_WALLET (우리 지갑)
 *   · amount >= 패키지 정가 (USD)
 *
 * 모두 통과하면 payments row 를 confirmed 로 기록하고 credits + 1회만 지급.
 * provider_payment_id unique 제약으로 중복 호출 시 멱등 처리.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getCreditPackage } from '@/lib/creditPackages'
import { getPaymentStatus } from '@base-org/account'

export async function POST(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { baseId?: string; packageId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const { baseId, packageId } = body
  if (!baseId || !packageId) {
    return NextResponse.json({ error: 'missing baseId / packageId' }, { status: 400 })
  }

  const pkg = getCreditPackage(packageId)
  if (!pkg) return NextResponse.json({ error: 'unknown packageId' }, { status: 400 })

  const merchant = process.env.NEXT_PUBLIC_BASE_PAY_MERCHANT?.toLowerCase()
  if (!merchant) {
    return NextResponse.json({ error: 'merchant not configured' }, { status: 500 })
  }
  const testnet = process.env.NEXT_PUBLIC_BASE_PAY_TESTNET === 'true'

  const supa = supabaseServer()

  // 활성 유저 조회
  const { data: user, error: userErr } = await supa
    .from('users')
    .select('id, credits')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (userErr || !user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  // Base Pay status 조회 (SDK 내부적으로 Base RPC / API 에 쿼리)
  let status
  try {
    status = await getPaymentStatus({ id: baseId, testnet })
  } catch (err) {
    return NextResponse.json(
      { error: 'status check failed', detail: (err as Error).message },
      { status: 502 },
    )
  }

  if (!status || status.status !== 'completed') {
    return NextResponse.json(
      { error: 'payment not completed', status: status?.status ?? 'unknown' },
      { status: 402 },
    )
  }

  // 수취 지갑 검증
  if (status.recipient?.toLowerCase() !== merchant) {
    return NextResponse.json(
      { error: 'recipient mismatch', expected: merchant, got: status.recipient },
      { status: 400 },
    )
  }

  // 금액 검증 — Base Pay 는 amount 를 USD 문자열로 반환 (예: '1.90')
  const paidUsd = parseFloat(status.amount ?? '0')
  const requiredUsd = pkg.priceUsdCents / 100
  if (!isFinite(paidUsd) || paidUsd + 1e-9 < requiredUsd) {
    return NextResponse.json(
      { error: 'amount too small', expected: requiredUsd, got: paidUsd },
      { status: 400 },
    )
  }

  // payments row 를 pending 으로 먼저 확보한다.
  // 같은 baseId 동시 요청은 unique(method, provider_payment_id) 로 한 row 만 남기고,
  // 실제 confirm + credit grant 는 아래 RPC 가 row lock 으로 멱등 처리한다.
  const { data: paymentRow, error: upsertErr } = await supa
    .from('payments')
    .upsert(
      {
        user_id: user.id,
        package_id: pkg.id,
        method: 'base_pay',
        credits: pkg.credits,
        amount_usd_cents: pkg.priceUsdCents,
        status: 'pending',
        provider_payment_id: baseId,
      },
      { onConflict: 'method,provider_payment_id', ignoreDuplicates: true },
    )
    .select('id')
    .maybeSingle()

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr?.message ?? 'upsert failed' }, { status: 500 })
  }

  const { data: credits, error: rpcErr } = await supa.rpc('confirm_payment_by_provider', {
    p_method: 'base_pay',
    p_provider_payment_id: baseId,
    p_provider_tx_hash: baseId,
    p_label: `${pkg.label} 팩 · Base Pay`,
    p_price_won: pkg.priceKrw,
  })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  if (typeof credits !== 'number') return NextResponse.json({ error: 'rpc error' }, { status: 500 })
  if (credits < 0) return NextResponse.json({ error: 'payment row not found' }, { status: 404 })

  return NextResponse.json({
    ok: true,
    credits,
    paymentId: paymentRow?.id,
    packageCredits: pkg.credits,
  })
}
