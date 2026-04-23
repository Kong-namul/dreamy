/**
 * /api/dreams/[id]
 *   · PATCH — 본인 꿈의 일부 필드 업데이트 (shared 공개/비공개, 복구 등)
 *       body: { shared?: boolean, restore?: boolean }
 *   · DELETE — 본인 꿈 soft delete (deleted_at = now)
 *       query ?permanent=1 이면 완전 삭제 (휴지통에서 제거)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

async function getUserAndVerifyDream(email: string, dreamId: string) {
  const supa = supabaseServer()

  const { data: user } = await supa
    .from('users')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()
  if (!user) return { error: 'no user', status: 404 as const }

  const { data: dream } = await supa
    .from('dreams')
    .select('id, user_id')
    .eq('id', dreamId)
    .maybeSingle()
  if (!dream) return { error: 'not found', status: 404 as const }
  if (dream.user_id !== user.id) return { error: 'forbidden', status: 403 as const }

  return { user, dream, supa }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const gate = await getUserAndVerifyDream(email, id)
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: { shared?: boolean; restore?: boolean } = {}
  try { body = await req.json() } catch {}

  const update: { shared?: boolean; deleted_at?: null } = {}
  if (typeof body.shared === 'boolean') update.shared = body.shared
  if (body.restore) update.deleted_at = null

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { error } = await gate.supa.from('dreams').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await auth()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const gate = await getUserAndVerifyDream(email, id)
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const permanent = req.nextUrl.searchParams.get('permanent') === '1'

  if (permanent) {
    const { error } = await gate.supa.from('dreams').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, permanent: true })
  }

  const { error } = await gate.supa
    .from('dreams')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, softDeleted: true })
}
