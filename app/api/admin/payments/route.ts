/**
 * GET /api/admin/payments
 *
 * 최근 결제 내역 조회 (관리자 전용). 환불 처리할 때 어떤 거래에
 * 환불할지 고르기 위해 씀.
 *
 * Query:
 *  - method  (optional) 'coinbase_commerce' | 'stripe' | ...
 *  - status  (optional) 'pending' | 'confirmed' | 'refunded' | ...
 *  - limit   (optional, default 50, max 200)
 */
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminAuth'
import { supabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const method = url.searchParams.get('method')
  const status = url.searchParams.get('status')
  const limitRaw = Number(url.searchParams.get('limit') ?? '50')
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 50, 1), 200)

  const supa = supabaseServer()

  let q = supa
    .from('payments')
    .select('id, user_id, package_id, method, credits, amount_usd_cents, amount_krw, status, provider_payment_id, provider_tx_hash, confirmed_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (method) q = q.eq('method', method)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // user 의 이메일/이름도 한 번에 가져와서 화면에 보여주기 편하게.
  const userIds = Array.from(new Set((data ?? []).map(p => p.user_id)))
  let usersById: Record<string, { email: string | null; name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: users } = await supa
      .from('users')
      .select('id, email, name')
      .in('id', userIds)
    if (users) {
      usersById = Object.fromEntries(users.map(u => [u.id, { email: u.email, name: u.name }]))
    }
  }

  const enriched = (data ?? []).map(p => ({
    ...p,
    user: usersById[p.user_id] ?? null,
  }))

  return NextResponse.json({ payments: enriched })
}
