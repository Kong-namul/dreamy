/**
 * POST /api/payment/bitpay/create
 *
 * Body: { packageId: 'basic' | 'popular' | 'large' }
 *
 * 1) 활성 유저 확인
 * 2) payments 테이블에 pending row 생성 → invoice reference 로 사용
 * 3) BitPay REST API 로 invoice 생성
 * 4) 클라이언트에 hosted checkout URL 반환
 *
 * BitPay API ref: https://developer.bitpay.com/reference/create-an-invoice
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getCreditPackage } from '@/lib/creditPackages'

const BITPAY_API_BASE = process.env.BITPAY_API_BASE ?? 'https://test.bitpay.com'
const BITPAY_API_TOKEN = process.env.BITPAY_API_TOKEN

export async function POST(req: Request) {
  if (!BITPAY_API_TOKEN) {
    return NextResponse.json({ error: 'BitPay not configured' }, { status: 500 })
  }

  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { packageId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const pkg = getCreditPackage(body.packageId ?? '')
  if (!pkg) return NextResponse.json({ error: 'unknown packageId' }, { status: 400 })

  const supa = supabaseServer()

  const { data: user, error: userErr } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (userErr || !user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  // pending payments row 먼저 만들어두기 — BitPay orderId 로 이 id 를 쓴다
  const { data: paymentRow, error: insertErr } = await supa
    .from('payments')
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      method: 'bitpay',
      credits: pkg.credits,
      amount_usd_cents: pkg.priceUsdCents,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertErr || !paymentRow) {
    return NextResponse.json({ error: insertErr?.message ?? 'insert failed' }, { status: 500 })
  }

  // BitPay invoice 생성
  const origin = req.headers.get('origin') ?? 'https://dreamy-tau.vercel.app'
  const invoicePayload = {
    token: BITPAY_API_TOKEN,
    price: pkg.priceUsdCents / 100,
    currency: 'USD',
    orderId: paymentRow.id,
    itemDesc: `Dreamy ${pkg.label} 팩 · ${pkg.credits} 크레딧`,
    notificationURL: `${origin}/api/webhooks/bitpay`,
    redirectURL: `${origin}/payment/success?id=${paymentRow.id}`,
    closeURL: `${origin}/payment/cancel?id=${paymentRow.id}`,
    extendedNotifications: true,
  }

  let invoiceRes: Response
  try {
    invoiceRes = await fetch(`${BITPAY_API_BASE}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-accept-version': '2.0.0',
      },
      body: JSON.stringify(invoicePayload),
    })
  } catch (err) {
    return NextResponse.json({ error: 'bitpay unreachable', detail: (err as Error).message }, { status: 502 })
  }

  const invoiceJson = await invoiceRes.json().catch(() => ({}))
  if (!invoiceRes.ok || !invoiceJson?.data?.url) {
    return NextResponse.json(
      { error: 'invoice creation failed', detail: invoiceJson },
      { status: invoiceRes.status || 502 },
    )
  }

  const invoice = invoiceJson.data as { id: string; url: string }

  // payments 에 BitPay invoice id 저장 (webhook 매칭용)
  await supa
    .from('payments')
    .update({ provider_payment_id: invoice.id })
    .eq('id', paymentRow.id)

  return NextResponse.json({
    paymentId: paymentRow.id,
    invoiceId: invoice.id,
    checkoutUrl: invoice.url,
  })
}
