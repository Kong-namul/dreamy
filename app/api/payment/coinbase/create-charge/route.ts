/**
 * POST /api/payment/coinbase/create-charge
 *
 * Body: { packageId: 'basic' | 'popular' | 'large' }
 *
 * 1) 세션 확인
 * 2) payments row pending 생성
 * 3) Coinbase Commerce charge 생성
 * 4) hosted_url 반환 → 클라이언트가 리다이렉트
 *
 * API ref: https://docs.cloud.coinbase.com/commerce/reference/createcharge
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getCreditPackage } from '@/lib/creditPackages'

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY

export async function POST(req: Request) {
  if (!COINBASE_API_KEY) {
    return NextResponse.json({ error: 'Coinbase Commerce not configured' }, { status: 500 })
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
      method: 'coinbase_commerce',
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

  let chargeRes: Response
  try {
    chargeRes = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Dreamy ${pkg.label} 팩`,
        description: `${pkg.credits} 크레딧`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: (pkg.priceUsdCents / 100).toFixed(2),
          currency: 'USD',
        },
        metadata: {
          paymentId: paymentRow.id,
          userId: user.id,
          packageId: pkg.id,
        },
        redirect_url: `${origin}/payment/success?id=${paymentRow.id}`,
        cancel_url: `${origin}/payment/cancel?id=${paymentRow.id}`,
      }),
    })
  } catch (err) {
    return NextResponse.json({ error: 'coinbase unreachable', detail: (err as Error).message }, { status: 502 })
  }

  const chargeJson = await chargeRes.json().catch(() => ({}))
  if (!chargeRes.ok || !chargeJson?.data?.hosted_url) {
    return NextResponse.json(
      { error: 'charge creation failed', detail: chargeJson },
      { status: chargeRes.status || 502 },
    )
  }

  const charge = chargeJson.data as { id: string; hosted_url: string }

  await supa
    .from('payments')
    .update({ provider_payment_id: charge.id })
    .eq('id', paymentRow.id)

  return NextResponse.json({
    paymentId: paymentRow.id,
    chargeId: charge.id,
    checkoutUrl: charge.hosted_url,
  })
}
