/**
 * DELETE /api/dreams/[id]/comments/[commentId]
 * 본인이 작성한 댓글만 삭제 가능.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseServer } from '@/lib/supabase/server'

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string; commentId: string }> }) {
  const { commentId } = await ctx.params
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

  const { data: comment } = await supa
    .from('dream_comments')
    .select('author_user_id')
    .eq('id', commentId)
    .maybeSingle()
  if (!comment) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (comment.author_user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { error } = await supa.from('dream_comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
