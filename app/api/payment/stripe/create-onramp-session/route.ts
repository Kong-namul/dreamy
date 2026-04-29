/**
 * POST /api/payment/stripe/create-onramp-session
 *
 * Stripe Crypto On-ramp is a public-preview API and is not wrapped by the
 * current Stripe Node SDK, so call /v1/crypto/onramp_sessions directly.
 *
 * This opens Stripe's hosted crypto on-ramp only. It does not grant Dreamy
 * credits because on-ramp purchases deliver crypto to the user's wallet.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCreditPackage } from '@/lib/creditPackages'

export const runtime = 'nodejs'

type OnrampResponse = {
  id?: string
  redirect_url?: string | null
  client_secret?: string
  error?: { message?: string }
}

function getCustomerIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip') || null
}

export async function POST(req: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  let body: { packageId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const pkg = getCreditPackage(body.packageId ?? '')
  if (!pkg) return NextResponse.json({ error: 'unknown packageId' }, { status: 400 })

  const form = new URLSearchParams()
  form.set('source_amount', (pkg.priceUsdCents / 100).toFixed(2))
  form.set('source_currency', 'usd')
  form.append('destination_currencies[]', 'usdc')
  form.append('destination_networks[]', 'base')
  form.append('destination_networks[]', 'ethereum')
  form.append('destination_networks[]', 'polygon')
  form.set('metadata[email]', email)
  form.set('metadata[packageId]', pkg.id)
  form.set('metadata[purpose]', 'dreamy_crypto_onramp')

  const customerIp = getCustomerIp(req)
  if (customerIp) form.set('customer_ip_address', customerIp)

  let stripeRes: Response
  try {
    stripeRes = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'stripe on-ramp unreachable', detail: (err as Error).message },
      { status: 502 },
    )
  }

  const json = await stripeRes.json().catch(() => ({})) as OnrampResponse
  if (!stripeRes.ok) {
    return NextResponse.json(
      { error: json.error?.message ?? 'stripe on-ramp session creation failed', detail: json },
      { status: stripeRes.status || 502 },
    )
  }

  if (!json.redirect_url) {
    return NextResponse.json(
      { error: 'stripe on-ramp did not return a redirect URL', sessionId: json.id },
      { status: 502 },
    )
  }

  return NextResponse.json({
    sessionId: json.id,
    redirectUrl: json.redirect_url,
  })
}
