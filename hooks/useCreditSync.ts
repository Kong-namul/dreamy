'use client'
import { useEffect } from 'react'
import { useDreamStore } from '@/store/dreamStore'

/**
 * 로그인 후 서버 크레딧 트랜잭션 히스토리를 가져와 store 에 hydrate.
 */
export function useCreditSync(email: string | null | undefined) {
  const hydrateCreditHistory = useDreamStore((s) => s.hydrateCreditHistory)
  const setRecoveryNotice = useDreamStore((s) => s.setRecoveryNotice)

  useEffect(() => {
    if (!email) return
    let cancelled = false
    ;(async () => {
      try {
        const recovered = await fetch('/api/interpret/recover', { method: 'POST' })
          .then((res) => res.ok ? res.json() : null)
          .catch(() => null) as { recovered?: Array<{ amount: number }> } | null
        if (!cancelled && recovered?.recovered && recovered.recovered.length > 0) {
          const total = recovered.recovered.reduce((sum, item) => sum + item.amount, 0)
          setRecoveryNotice(`저장되지 않은 일기 ${recovered.recovered.length}건의 크레딧 ${total}개를 자동으로 돌려드렸어요.`)
        }
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
