'use client'
import { useEffect, useState } from 'react'

/**
 * localStorage 의 'dreamy_onboarded' 플래그를 읽어 온보딩 완료 여부를 돌려주는 훅.
 * - null: 아직 status 가 loading 이라 읽지 않음 (게이트 역할)
 * - true/false: 실제 값
 *
 * markOnboarded() 는 Onboarding 슬라이드 다음 버튼 흐름에서 호출.
 */
export function useOnboardingFlag(authStatus: 'loading' | 'authenticated' | 'unauthenticated') {
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    if (authStatus === 'loading') return
    const seen = typeof window !== 'undefined' && localStorage.getItem('dreamy_onboarded')
    setOnboarded(!!seen)
  }, [authStatus])

  const markOnboarded = () => {
    try { localStorage.setItem('dreamy_onboarded', '1') } catch {}
    setOnboarded(true)
  }

  return { onboarded, markOnboarded }
}
