'use client'
import { useDreamStore } from '@/store/dreamStore'
import DreamDetailModal from '@/components/dream/DreamDetailModal'

/**
 * 앱 전역에서 openDream(id) 를 호출하면 열리는 상세 모달.
 * 새 꿈 생성 직후 / 피드 / 내 일기에서 공용 사용.
 */
export default function GlobalDreamModal() {
  const { dreams, openDreamId, openDream, nickname } = useDreamStore()
  const entry = dreams.find((d) => d.id === openDreamId) ?? null
  return (
    <DreamDetailModal
      entry={entry ? { ...entry, isMine: true, authorName: nickname, authorInitial: nickname.charAt(0) } as never : null}
      onClose={() => openDream(null)}
    />
  )
}
