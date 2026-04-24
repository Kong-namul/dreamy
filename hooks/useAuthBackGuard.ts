'use client'
import { useEffect } from 'react'
import type { Session } from 'next-auth'

/**
 * 로그인 세션이 살아있는 동안 브라우저 뒤로가기를 현재 위치로 고정한다.
 * next-auth 의 OAuth 리다이렉트가 히스토리에 남아, back 을 누르면 Google 로그인 URL 로
 * 돌아가버리는 문제를 막기 위함. 세션이 없으면 (로그아웃 상태) 아무 것도 안 한다.
 */
export function useAuthBackGuard(session: Session | null | undefined) {
  useEffect(() => {
    if (!session) return
    window.history.pushState(null, '', window.location.href)
    const onPop = () => window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [session])
}
