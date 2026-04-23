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

  // 중복 처리 가드: 같은 baseId 가 이미 confirmed 이면 no-op 반환
  const { data: existing } = await supa
    .from('payments')
    .select('id, status, credits')
    .eq('method', 'base_pay')
    .eq('provider_payment_id', baseId)
    .maybeSingle()
  if (existing?.status === 'confirmed') {
    return NextResponse.json({ ok: true, alreadyProcessed: true, credits: user.credits })
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

  const nowIso = new Date().toISOString()

  // payments row upsert (pending 있었으면 confirm, 없었으면 새로 생성)
  const { data: paymentRow, error: upsertErr } = await supa
    .from('payments')
    .upsert(
      {
        user_id: user.id,
        package_id: pkg.id,
        method: 'base_pay',
        credits: pkg.credits,
        amount_usd_cents: pkg.priceUsdCents,
        status: 'confirmed',
        provider_payment_id: baseId,
        confirmed_at: nowIso,
      },
      { onConflict: 'method,provider_payment_id' },
    )
    .select('id')
    .single()

  if (upsertErr || !paymentRow) {
    return NextResponse.json({ error: upsertErr?.message ?? 'upsert failed' }, { status: 500 })
  }

  // 크레딧 지급 + 트랜잭션 기록 (간단한 2단계. 실패 시 부분 반영 가능성은
  // MVP 단계에서 허용. Phase 2 에서 RPC/stored procedure 로 원자화 예정.)
  const newCredits = user.credits + pkg.credits
  const { error: updErr } = await supa
    .from('users')
    .update({ credits: newCredits })
    .eq('id', user.id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  await supa.from('credit_transactions').insert({
    user_id: user.id,
    type: 'purchase',
    amount: pkg.credits,
    label: `${pkg.label} 팩 · Base Pay`,
    price_won: pkg.priceKrw,
  })

  return NextResponse.json({
    ok: true,
    credits: newCredits,
    paymentId: paymentRow.id,
    packageCredits: pkg.credits,
  })
}
