'use client'
import { useEffect } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import type { DreamEntry } from '@/types'

/**
 * 로그인 후 서버 꿈 목록을 받아 zustand 에 hydrate 한다.
 * 로컬에만 있던 꿈 (오프라인/예전 버전) 은 서버로 backfill 업로드 후 병합.
 * 휴지통(deletedDreams) 도 동일하게 처리.
 *
 * 이 훅은 한 번의 '로그인 세션' 안에서 email 이 바뀔 때마다 1회 실행된다.
 */
export function useDreamSync(email: string | null | undefined) {
  const hydrateFromServer   = useDreamStore((s) => s.hydrateFromServer)
  const localDreams         = useDreamStore.getState().dreams
  const localDeletedDreams  = useDreamStore.getState().deletedDreams

  useEffect(() => {
    if (!email) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dreams')
        if (!res.ok) return
        const { dreams: serverDreams, deletedDreams: serverDeleted } =
          await res.json() as { dreams: DreamEntry[]; deletedDreams: DreamEntry[] }
        if (cancelled || !Array.isArray(serverDreams)) return

        const serverIds        = new Set(serverDreams.map((d) => d.id))
        const serverDeletedIds = new Set((serverDeleted ?? []).map((d) => d.id))

        // 로컬 전용 active 꿈 서버 업로드
        const onlyLocalActive = localDreams.filter(
          (d) => !serverIds.has(d.id) && !serverDeletedIds.has(d.id),
        )
        const uploaded: DreamEntry[] = []
        for (const dream of onlyLocalActive) {
          if (cancelled) return
          try {
            const up = await fetch('/api/dreams', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dream),
            })
            if (up.ok) {
              const { dream: saved } = await up.json()
              if (saved) uploaded.push(saved)
            }
          } catch { /* skip */ }
        }

        // 로컬 전용 휴지통 꿈 → 서버 생성 후 즉시 soft delete
        const onlyLocalDeleted = localDeletedDreams.filter(
          (d) => !serverIds.has(d.id) && !serverDeletedIds.has(d.id),
        )
        const uploadedDeleted: DreamEntry[] = []
        for (const dream of onlyLocalDeleted) {
          if (cancelled) return
          try {
            const up = await fetch('/api/dreams', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dream),
            })
            if (up.ok) {
              const { dream: saved } = await up.json()
              if (saved) {
                await fetch(`/api/dreams/${saved.id}`, { method: 'DELETE' })
                uploadedDeleted.push({ ...saved, deletedAt: new Date().toISOString() })
              }
            }
          } catch { /* skip */ }
        }

        if (cancelled) return
        const mergedActive  = [...uploaded, ...serverDreams]
        const mergedDeleted = [...uploadedDeleted, ...(serverDeleted ?? [])]
        hydrateFromServer(mergedActive, mergedDeleted)
      } catch { /* 네트워크 실패 시 로컬 유지 */ }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])
}
