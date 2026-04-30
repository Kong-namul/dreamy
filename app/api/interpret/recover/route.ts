/**
 * POST /api/interpret/recover
 *
 * Repairs interrupted interpretation attempts for the current user.
 * If credits were spent but no dream was saved around that attempt, refund it.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

const STALE_AFTER_MS = 3 * 60 * 1000
const LOOKBACK_MS = 24 * 60 * 60 * 1000
const MAX_JOB_MS = 20 * 60 * 1000

type TxRow = {
  id: string
  type: 'purchase' | 'spend' | 'bonus' | 'refund'
  amount: number
  label: string | null
  created_at: string
}

type DreamRow = {
  id: string
  type: 'basic' | 'premium'
  created_at: string
}

function spendKind(tx: TxRow): { type: 'basic' | 'premium'; cost: number; label: string } | null {
  if (tx.type !== 'spend') return null
  if (tx.amount === -5 || tx.label === '기본 해석') {
    return { type: 'basic', cost: 5, label: '기본 해석' }
  }
  if (tx.amount === -15 || tx.label === '그림일기') {
    return { type: 'premium', cost: 15, label: '그림일기' }
  }
  return null
}

export async function POST() {
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

  const since = new Date(Date.now() - LOOKBACK_MS).toISOString()

  const { data: txRows, error: txErr } = await supa
    .from('credit_transactions')
    .select('id, type, amount, label, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(200)
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  const { data: dreamRows, error: dreamErr } = await supa
    .from('dreams')
    .select('id, type, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(200)
  if (dreamErr) return NextResponse.json({ error: dreamErr.message }, { status: 500 })

  const txs = (txRows ?? []) as TxRow[]
  const dreams = (dreamRows ?? []) as DreamRow[]
  const spendTxs = txs.filter((tx) => spendKind(tx))
  const now = Date.now()

  const recovered: Array<{ txId: string; amount: number; label: string }> = []

  for (let i = 0; i < spendTxs.length; i += 1) {
    const tx = spendTxs[i]
    const kind = spendKind(tx)
    if (!kind) continue

    const spentAt = new Date(tx.created_at).getTime()
    if (now - spentAt < STALE_AFTER_MS) continue

    const nextSpendAt = spendTxs[i + 1]
      ? new Date(spendTxs[i + 1].created_at).getTime()
      : spentAt + MAX_JOB_MS
    const windowEnd = Math.min(nextSpendAt, spentAt + MAX_JOB_MS)

    const hasSavedDream = dreams.some((dream) => {
      const dreamAt = new Date(dream.created_at).getTime()
      return dream.type === kind.type && dreamAt >= spentAt && dreamAt <= windowEnd
    })
    if (hasSavedDream) continue

    const hasRecoveryRefund = txs.some((candidate) => {
      return (
        candidate.type === 'refund' &&
        candidate.amount === kind.cost &&
        (candidate.label ?? '').includes('자동 복구 환불') &&
        (candidate.label ?? '').includes(tx.id.slice(0, 8))
      )
    })
    if (hasRecoveryRefund) continue

    const refundLabel = `${kind.label} 자동 복구 환불 ${tx.id.slice(0, 8)}`
    const { error: refundErr } = await supa.rpc('refund_credits', {
      p_email: email,
      p_amount: kind.cost,
      p_label: refundLabel,
    })
    if (refundErr) return NextResponse.json({ error: refundErr.message }, { status: 500 })

    recovered.push({ txId: tx.id, amount: kind.cost, label: refundLabel })
  }

  return NextResponse.json({ recovered })
}
