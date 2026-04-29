/**
 * POST /api/payment/stripe/create-crypto-session
 *
 * Stripe Stablecoins and Crypto payment for Dreamy credits.
 * This is different from Stripe On-ramp: the customer pays Dreamy with crypto,
 * Stripe settles the completed payment to the merchant balance in USD, and the
 * normal Stripe webhook grants credits.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getCreditPackage } from '@/lib/creditPackages'
import { stripeClient } from '@/lib/stripe'

export async function POST(req: Request) {
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
      method: 'stripe',
      credits: pkg.credits,
      amount_usd_cents: pkg.priceUsdCents,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertErr || !paymentRow) {
    return NextResponse.json({ error: insertErr?.message ?? 'insert failed' }, { status: 500 })
  }

  const stripe = stripeClient()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dreamy-tau.vercel.app'

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['crypto'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Dreamy ${pkg.label} 팩`,
            description: `${pkg.credits} 크레딧 · Stablecoin payment`,
          },
          unit_amount: pkg.priceUsdCents,
        },
        quantity: 1,
      }],
      metadata: {
        paymentId: paymentRow.id,
        userId: user.id,
        packageId: pkg.id,
        paymentRail: 'stripe_crypto',
      },
      success_url: `${origin}/payment/success?id=${paymentRow.id}`,
      cancel_url: `${origin}/payment/cancel?id=${paymentRow.id}`,
      customer_email: email,
    })

    await supa
      .from('payments')
      .update({ provider_payment_id: checkout.id })
      .eq('id', paymentRow.id)

    return NextResponse.json({
      paymentId: paymentRow.id,
      sessionId: checkout.id,
      checkoutUrl: checkout.url,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'stripe crypto session creation failed', detail: (err as Error).message },
      { status: 502 },
    )
  }
}
