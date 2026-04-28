/**
 * 서버 Supabase 클라이언트 (secret key).
 * 모든 테이블에 RLS 를 우회하여 접근 가능. API 라우트·서버 컴포넌트 전용.
 * 브라우저로 import 금지.
 */
import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function supabaseServer(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !secretKey) {
    throw new Error(
      '[supabase/server] Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY. ' +
      'Vercel Project Settings → Environment Variables 에 추가 후 redeploy 필요.'
    )
  }

  cached = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'dreamy-server' } },
  })
  return cached
}
