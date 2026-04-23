'use client'
/**
 * 브라우저 Supabase 클라이언트 (publishable key).
 * RLS 정책에 의해서만 접근 가능. 현재는 정책이 비어있어 실제로는
 * 거의 사용하지 않음 — 모든 DB 작업은 서버 API 라우트 경유를 권장.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  // 빌드 시점에 env 가 없으면 친절한 에러. 운영에선 Vercel 환경변수로 채워짐.
  console.warn('[supabase/browser] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing')
}

export const supabaseBrowser = createClient(url ?? '', publishableKey ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
})
