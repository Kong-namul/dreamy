/**
 * GET /api/payment/:paymentId/status
 * /payment/success 페이지가 폴링용으로 호출. 본인 결제만 조회 가능.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(_: NextRequest, ctx: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await ctx.params
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supa = supabaseServer()

  const { data: user } = await supa
    .from('users')
    .select('id, credits')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (!user) return NextResponse.json({ error: 'no user' }, { status: 404 })

  const { data: payment, error } = await supa
    .from('payments')
    .select('id, status, user_id')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!payment) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({
    status: payment.status,
    credits: user.credits,
  })
}
