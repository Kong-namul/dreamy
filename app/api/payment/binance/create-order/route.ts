/**
 * POST /api/payment/binance/create-order
 *
 * Body: { packageId: 'basic' | 'popular' | 'large' }
 *
 * Binance Pay order 생성. 응답에는 QR code link 와 deeplink 가 포함돼
 * 클라이언트는 모바일이면 deeplink 를 열고 데스크톱이면 QR 을 보여줌.
 *
 * 인증: HMAC-SHA512
 * 문서: https://developers.binance.com/docs/binance-pay/api-order-create-v2
 */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'
import { getCreditPackage } from '@/lib/creditPackages'

const BINANCE_API_BASE = 'https://bpay.binanceapi.com'
const BINANCE_API_KEY = process.env.BINANCE_PAY_API_KEY
const BINANCE_API_SECRET = process.env.BINANCE_PAY_API_SECRET

function signPayload(timestamp: number, nonce: string, body: string): string {
  const toSign = `${timestamp}\n${nonce}\n${body}\n`
  return crypto
    .createHmac('sha512', BINANCE_API_SECRET!)
    .update(toSign)
    .digest('hex')
    .toUpperCase()
}

function randomNonce(len = 32): string {
  return crypto.randomBytes(len).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, len)
}

export async function POST(req: Request) {
  if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
    return NextResponse.json({ error: 'Binance Pay not configured' }, { status: 500 })
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

  // pending payments row 미리 생성 → merchantTradeNo 로 사용 (32자 초과 금지, uuid 그대로 OK)
  const { data: paymentRow, error: insertErr } = await supa
    .from('payments')
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      method: 'binance_pay',
      credits: pkg.credits,
      amount_usd_cents: pkg.priceUsdCents,
      status: 'pending',
    })
    .select('id')
    .single()
  if (insertErr || !paymentRow) {
    return NextResponse.json({ error: insertErr?.message ?? 'insert failed' }, { status: 500 })
  }

  const origin = req.headers.get('origin') ?? 'https://dreamy-tau.vercel.app'
  const payload = {
    env: { terminalType: 'WEB' },
    merchantTradeNo: paymentRow.id.replace(/-/g, ''),   // 32자, uuid 하이픈 제거
    orderAmount: (pkg.priceUsdCents / 100).toFixed(2),
    currency: 'USDT',
    goods: {
      goodsType: '02',          // '02' = digital goods
      goodsCategory: 'Z000',    // Z000 = Others
      referenceGoodsId: pkg.id,
      goodsName: `Dreamy ${pkg.label} 팩`,
      goodsDetail: `${pkg.credits} 크레딧`,
    },
    webhookUrl: `${origin}/api/webhooks/binance`,
    returnUrl: `${origin}/payment/success?id=${paymentRow.id}`,
  }

  const jsonBody = JSON.stringify(payload)
  const timestamp = Date.now()
  const nonce = randomNonce()
  const signature = signPayload(timestamp, nonce, jsonBody)

  let apiRes: Response
  try {
    apiRes = await fetch(`${BINANCE_API_BASE}/binancepay/openapi/v2/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': String(timestamp),
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': BINANCE_API_KEY,
        'BinancePay-Signature': signature,
      },
      body: jsonBody,
    })
  } catch (err) {
    return NextResponse.json({ error: 'binance unreachable', detail: (err as Error).message }, { status: 502 })
  }

  const apiJson = await apiRes.json().catch(() => ({}))
  if (!apiRes.ok || apiJson?.status !== 'SUCCESS' || !apiJson?.data) {
    return NextResponse.json(
      { error: 'order creation failed', detail: apiJson },
      { status: apiRes.status || 502 },
    )
  }

  const data = apiJson.data as {
    prepayId: string
    qrcodeLink: string
    qrContent: string
    deeplink: string
    universalUrl?: string
    checkoutUrl?: string
  }

  // payments row 에 prepayId 저장 (webhook 매칭용)
  await supa
    .from('payments')
    .update({ provider_payment_id: data.prepayId })
    .eq('id', paymentRow.id)

  return NextResponse.json({
    paymentId: paymentRow.id,
    prepayId: data.prepayId,
    qrCodeLink: data.qrcodeLink,
    qrContent: data.qrContent,
    deeplink: data.deeplink,
    universalUrl: data.universalUrl,
    checkoutUrl: data.checkoutUrl,
  })
}
