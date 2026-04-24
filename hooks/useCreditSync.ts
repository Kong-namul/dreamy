'use client'
import { useEffect } from 'react'
import { useDreamStore } from '@/store/dreamStore'

/**
 * 로그인 후 서버 크레딧 트랜잭션 히스토리를 가져와 store 에 hydrate.
 */
export function useCreditSync(email: string | null | undefined) {
  const hydrateCreditHistory = useDreamStore((s) => s.hydrateCreditHistory)

  useEffect(() => {
    if (!email) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/credits/history')
        if (!res.ok) return
        const { history } = await res.json()
        if (!cancelled && Array.isArray(history)) hydrateCreditHistory(history)
      } catch { /* 네트워크 실패 시 로컬 유지 */ }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])
}
