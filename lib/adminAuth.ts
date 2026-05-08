/**
 * 관리자 인증 헬퍼.
 *
 * env `ADMIN_EMAILS` 에 콤마로 구분한 이메일 목록을 두고, NextAuth 세션의
 * 이메일이 그 안에 있어야만 admin 라우트/페이지 접근을 허용.
 *
 * 일부러 단순하게 유지: dreamy 는 관리자 1~2명 규모라 별도 권한 모델
 * (역할/스코프) 안 넣음. 관리자 늘면 이 파일에서 분기하면 됨.
 */
import 'server-only'
import { auth } from '@/auth'

function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email) return null

  const allowed = adminEmails()
  if (allowed.size === 0) return null  // env 비어있으면 아무도 admin 아님 (안전 기본값)
  if (!allowed.has(email)) return null

  return { email }
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = adminEmails()
  return allowed.has(email.toLowerCase())
}
