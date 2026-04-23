/**
 * Stripe 서버 클라이언트. API 라우트 전용.
 */
import Stripe from 'stripe'

let cached: Stripe | null = null

export function stripeClient(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      '[stripe] STRIPE_SECRET_KEY missing. Vercel Env Vars 에 추가 필요.'
    )
  }
  cached = new Stripe(key)
  return cached
}

export function isStripeTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_')
}
