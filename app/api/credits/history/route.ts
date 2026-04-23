/**
 * GET /api/credits/history
 * 현재 활성 유저의 credit_transactions 를 최신순으로 반환.
 * 클라이언트 CreditHistoryTab / SettingsTab 가 사용.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supa = supabaseServer()

  const { data: user } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (!user) return NextResponse.json({ error: 'no user' }, { status: 404 })

  const { data, error } = await supa
    .from('credit_transactions')
    .select('id, type, amount, label, price_won, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 클라이언트 타입 (CreditTransaction) 에 맞춰 변환
  const history = (data ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    label: tx.label,
    priceWon: tx.price_won ?? undefined,
    date: tx.created_at,
  }))
  return NextResponse.json({ history })
}
