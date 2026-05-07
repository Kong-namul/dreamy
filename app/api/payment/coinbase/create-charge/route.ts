/**
 * POST /api/payment/coinbase/create-charge
 *
 * Body: { packageId: 'basic' | 'popular' | 'large' }
 *
 * 1) 세션 확인
 * 2) payments row pending 생성
 * 3) Coinbase Business Checkouts API 로 checkout 생성 (USDC on Base)
 * 4) checkout url 반환 → 클라이언트가 리다이렉트
 *
 * 옛 Coinbase Commerce 와 다른 점:
 *  - 주소: api.commerce.coinbase.com → business.coinbase.com
 *  - 인증: X-CC-Api-Key → ES256 JWT Bearer (lib/coinbaseJwt.ts)
 *  - 통화: USD (다중 코인 자동환산) → USDC 고정 (Base 네트워크)
 *  - 응답: data.hosted_url → url (top-level)
 *
 * API ref: https://docs.cdp.coinbase.com/coinbase-business/checkout-apis
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getCreditPackage } from '@/lib/creditPackages'
import { generateCoinbaseJwt, isCoinbaseConfigured } from '@/lib/coinbaseJwt'

const CHECKOUT_PATH = '/api/v1/checkouts'
const CHECKOUT_URL = `https://business.coinbase.com${CHECKOUT_PATH}`

export async function POST(req: Request) {
  if (!isCoinbaseConfigured()) {
    return NextResponse.json({ error: 'Coinbase Business not configured' }, { status: 500 })
  }

  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { packageId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const pkg = getCreditPackage(body.packageId ?? '')
  if (!pkg) return NextResponse.json({ error: 'unknown packageId' }, { status: 400 })

  const supa = supabaseServer()

  const { data: user } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const { data: paymentRow, error: insertErr } = await supa
    .from('payments')
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      method: 'coinbase_commerce', // DB enum 호환 위해 기존 값 재사용 (실은 Checkouts API)
      credits: pkg.credits,
      amount_usd_cents: pkg.priceUsdCents,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertErr || !paymentRow) {
    return NextResponse.json({ error: insertErr?.message ?? 'insert failed' }, { status: 500 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dreamy-tau.vercel.app'

  let token: string
  try {
    token = generateCoinbaseJwt('POST', CHECKOUT_PATH)
  } catch (err) {
    return NextResponse.json({ error: 'jwt failed', detail: (err as Error).message }, { status: 500 })
  }

  let checkoutRes: Response
  try {
    checkoutRes = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentRow.id,
      },
      body: JSON.stringify({
        amount: (pkg.priceUsdCents / 100).toFixed(2),
        currency: 'USDC',
        network: 'base',
        description: `Dreamy ${pkg.label} 팩 · ${pkg.credits} 크레딧`,
        metadata: {
          paymentId: paymentRow.id,
          userId: user.id,
          packageId: pkg.id,
        },
        successRedirectUrl: `${origin}/payment/success?id=${paymentRow.id}`,
        failRedirectUrl: `${origin}/payment/cancel?id=${paymentRow.id}`,
      }),
    })
  } catch (err) {
    return NextResponse.json({ error: 'coinbase unreachable', detail: (err as Error).message }, { status: 502 })
  }

  const checkoutJson = await checkoutRes.json().catch(() => ({})) as {
    id?: string
    url?: string
    // 혹시 응답이 data 로 감싸져 오면 fallback
    data?: { id?: string; url?: string }
  }

  const checkoutId = checkoutJson.id ?? checkoutJson.data?.id
  const checkoutUrl = checkoutJson.url ?? checkoutJson.data?.url

  if (!checkoutRes.ok || !checkoutId || !checkoutUrl) {
    return NextResponse.json(
      { error: 'checkout creation failed', status: checkoutRes.status, detail: checkoutJson },
      { status: checkoutRes.status || 502 },
    )
  }

  await supa
    .from('payments')
    .update({ provider_payment_id: checkoutId })
    .eq('id', paymentRow.id)

  return NextResponse.json({
    paymentId: paymentRow.id,
    chargeId: checkoutId,
    checkoutUrl,
  })
}
