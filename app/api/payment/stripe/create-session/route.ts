/**
 * POST /api/payment/stripe/create-session
 *
 * Body: { packageId: 'basic' | 'popular' | 'large' }
 *
 * 1) 활성 유저 확인
 * 2) payments row pending 생성
 * 3) Stripe Checkout Session 생성 (KRW, card)
 * 4) client 에 session.url 반환 → window.location = url
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
      amount_krw: pkg.priceKrw,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertErr || !paymentRow) {
    return NextResponse.json({ error: insertErr?.message ?? 'insert failed' }, { status: 500 })
  }

  const stripe = stripeClient()
  // origin 헤더는 클라이언트가 위변조 가능하므로 redirect URL 에는 사용하지 않는다.
  // 운영 URL 은 NEXT_PUBLIC_APP_URL 로 고정, 로컬 개발 시 .env.local 로 덮어쓴다.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dreamy-tau.vercel.app'

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'krw',
          product_data: {
            name: `Dreamy ${pkg.label} 팩`,
            description: `${pkg.credits} 크레딧`,
          },
          unit_amount: pkg.priceKrw,
        },
        quantity: 1,
      }],
      metadata: {
        paymentId: paymentRow.id,
        userId: user.id,
        packageId: pkg.id,
      },
      success_url: `${origin}/payment/success?id=${paymentRow.id}`,
      cancel_url: `${origin}/payment/cancel?id=${paymentRow.id}`,
      customer_email: email,
    })

    // stripe session id 를 payments row 에 저장 (webhook 매칭용)
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
      { error: 'stripe session creation failed', detail: (err as Error).message },
      { status: 502 },
    )
  }
}
