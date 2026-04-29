'use client'
import { useEffect, useState } from 'react'
import { useDreamStore } from '@/store/dreamStore'

/**
 * 로그인 직후 /api/user/ensure 호출해 DB 유저 row 를 보장하고,
 * 결과에 따라 닉네임·아바타·크레딧을 store 와 동기화한다.
 *
 * - created === true 면 완전 신규 가입(또는 탈퇴 후 재가입). showWelcomeBonus=true.
 * - 기존 유저면 조용히 DB → store 동기화만.
 *
 * 반환: { showWelcomeBonus, closeWelcomeBonus }
 */
export function useUserBootstrap(email: string | null | undefined) {
  const setNickname  = useDreamStore((s) => s.setNickname)
  const setAvatarUrl = useDreamStore((s) => s.setAvatarUrl)
  const setCredits   = useDreamStore((s) => s.setCredits)
  const resetAll     = useDreamStore((s) => s.resetAll)
  const setCurrentUserEmail = useDreamStore((s) => s.setCurrentUserEmail)
  const nickname     = useDreamStore((s) => s.nickname)
  const avatarUrl    = useDreamStore((s) => s.avatarUrl)

  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false)

  useEffect(() => {
    if (!email) return
    let cancelled = false
    ;(async () => {
      try {
        const state = useDreamStore.getState()
        const ownerEmail = state.currentUserEmail
        const hasUnownedLocalData =
          state.dreams.length > 0 ||
          state.deletedDreams.length > 0 ||
          Object.keys(state.commentsByDreamId).length > 0

        if (ownerEmail && ownerEmail !== email) {
          resetAll()
          setCurrentUserEmail(email)
        } else if (!ownerEmail) {
          if (hasUnownedLocalData) resetAll()
          setCurrentUserEmail(email)
        }

        const res = await fetch('/api/user/ensure', { method: 'POST' })
        if (!res.ok) return
        const { user, created } = await res.json() as {
          user: { nickname: string; avatar_url: string | null; credits?: number } | null
          created: boolean
        }
        if (cancelled) return

        if (created && user) {
          setNickname(user.nickname)
          if (user.avatar_url) setAvatarUrl(user.avatar_url)
          if (typeof user.credits === 'number') setCredits(user.credits)
          setShowWelcomeBonus(true)
          return
        }

        if (user) {
          if (user.nickname && user.nickname !== nickname) setNickname(user.nickname)
          if (user.avatar_url !== undefined && user.avatar_url !== avatarUrl) {
            setAvatarUrl(user.avatar_url ?? null)
          }
          if (typeof user.credits === 'number') setCredits(user.credits)
        }
      } catch { /* silent; 다음 세션에서 재시도 */ }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const closeWelcomeBonus = () => {
    if (email) {
      try { localStorage.setItem(`dreamy_welcome_bonus_${email}`, '1') } catch {}
    }
    setShowWelcomeBonus(false)
  }

  return { showWelcomeBonus, closeWelcomeBonus }
}
