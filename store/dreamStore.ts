import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DreamEntry, DreamComment, TabId, CreditTransaction } from '@/types'
import { SAMPLE_DREAMS } from '@/lib/sampleDreams'
import { inferAuspiceFromMoods } from '@/lib/auspice'

interface DreamStore {
  credits: number
  dreams: DreamEntry[]
  activeTab: TabId
  creditModalOpen: boolean
  nickname: string
  avatarUrl: string | null        // 사용자가 고른 커스텀 아바타 URL (null 이면 닉네임 매핑)
  creditHistory: CreditTransaction[]
  deletedDreams: DreamEntry[]   // 휴지통 (소프트 삭제된 꿈)
  commentsByDreamId: Record<string, DreamComment[]>  // 꿈 ID 별 댓글 (공개 꿈 포함)
  openDreamId: string | null     // 전역 상세 모달 제어

  setCredits: (n: number) => void
  spendCredits: (n: number, label?: string) => boolean
  addCredits: (n: number, tx?: Partial<CreditTransaction>) => void
  addDream: (entry: DreamEntry) => void
  deleteDream: (id: string) => void
  setShared: (id: string, shared: boolean) => void
  setActiveTab: (tab: TabId) => void
  setCreditModalOpen: (open: boolean) => void
  setNickname: (name: string) => void
  setAvatarUrl: (url: string | null) => void
  addComment: (dreamId: string, comment: DreamComment) => void
  deleteComment: (dreamId: string, commentId: string) => void
  openDream: (id: string | null) => void
  softDeleteDream: (id: string) => void    // 일반 삭제 → 휴지통 이동
  restoreDream: (id: string) => void        // 휴지통 → 복구
  permanentlyDeleteDream: (id: string) => void  // 휴지통 영구 삭제
}

const INITIAL_HISTORY: CreditTransaction[] = [
  { id: 'h-1', type: 'bonus',    amount:  50, label: '가입 축하 보너스',                   date: '2026-04-14T09:00:00.000Z' },
  { id: 'h-2', type: 'spend',    amount:  -5, label: '기본 해석 · 별빛 호수',              date: '2026-04-15T23:55:00.000Z' },
  { id: 'h-3', type: 'purchase', amount: 100, label: '기본 팩 구매',         priceWon: 1000, date: '2026-04-17T20:10:00.000Z' },
  { id: 'h-4', type: 'spend',    amount: -15, label: '그림일기 · 끝없는 복도',             date: '2026-04-18T04:25:00.000Z' },
  { id: 'h-5', type: 'spend',    amount:  -5, label: '기본 해석 · 앞니 빠지는 꿈',         date: '2026-04-16T05:42:00.000Z' },
]

export const useDreamStore = create<DreamStore>()(
  persist(
    (set, get) => ({
      credits: 50,
      dreams: [],
      activeTab: 'new',
      creditModalOpen: false,
      nickname: '꿈꾸는이',
      avatarUrl: null,
      creditHistory: [],
      deletedDreams: [],
      commentsByDreamId: {},
      openDreamId: null,

      setCredits: (n) => set({ credits: n }),
      spendCredits: (n, label) => {
        const { credits } = get()
        if (credits < n) {
          set({ creditModalOpen: true })
          return false
        }
        const tx: CreditTransaction = {
          id: `tx-${Date.now()}`,
          type: 'spend',
          amount: -n,
          label: label ?? '해석',
          date: new Date().toISOString(),
        }
        set((s) => ({
          credits: s.credits - n,
          creditHistory: [tx, ...s.creditHistory],
        }))
        return true
      },
      addCredits: (n, tx) => {
        const record: CreditTransaction = {
          id: `tx-${Date.now()}`,
          type: tx?.type ?? 'purchase',
          amount: n,
          label: tx?.label ?? '크레딧 충전',
          priceWon: tx?.priceWon,
          date: new Date().toISOString(),
        }
        set((s) => ({
          credits: s.credits + n,
          creditHistory: [record, ...s.creditHistory],
        }))
      },
      addDream: (entry) =>
        set((s) => ({
          dreams: [
            { ...entry, auspice: entry.auspice ?? inferAuspiceFromMoods(entry.moods ?? []) },
            ...s.dreams,
          ],
        })),
      deleteDream: (id) => set((s) => ({ dreams: s.dreams.filter((d) => d.id !== id) })),
      setShared: (id, shared) =>
        set((s) => ({
          dreams: s.dreams.map((d) => (d.id === id ? { ...d, shared } : d)),
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCreditModalOpen: (open) => set({ creditModalOpen: open }),
      setNickname: (name) =>
        set((s) => {
          const old = s.nickname
          if (name === old) return s
          // 내가 단 모든 댓글의 authorName 을 새 닉네임으로 마이그레이션
          const newDreams = s.dreams.map((d) => {
            if (!d.comments || d.comments.length === 0) return d
            const updated = d.comments.map((c) =>
              c.authorName === old
                ? { ...c, authorName: name, authorInitial: name.charAt(0) }
                : c
            )
            return { ...d, comments: updated }
          })
          return { nickname: name, dreams: newDreams }
        }),
      setAvatarUrl: (url) => set({ avatarUrl: url }),
      addComment: (dreamId, comment) =>
        set((s) => {
          const prev = s.commentsByDreamId[dreamId] ?? []
          return {
            commentsByDreamId: {
              ...s.commentsByDreamId,
              [dreamId]: [...prev, comment],
            },
          }
        }),
      deleteComment: (dreamId, commentId) =>
        set((s) => {
          const prev = s.commentsByDreamId[dreamId] ?? []
          return {
            commentsByDreamId: {
              ...s.commentsByDreamId,
              [dreamId]: prev.filter((c) => c.id !== commentId),
            },
          }
        }),
      openDream: (id) => set({ openDreamId: id }),
      softDeleteDream: (id) =>
        set((s) => {
          const target = s.dreams.find((d) => d.id === id)
          if (!target) return s
          return {
            dreams: s.dreams.filter((d) => d.id !== id),
            deletedDreams: [{ ...target }, ...s.deletedDreams],
          }
        }),
      restoreDream: (id) =>
        set((s) => {
          const target = s.deletedDreams.find((d) => d.id === id)
          if (!target) return s
          return {
            deletedDreams: s.deletedDreams.filter((d) => d.id !== id),
            dreams: [target, ...s.dreams],
          }
        }),
      permanentlyDeleteDream: (id) =>
        set((s) => ({
          deletedDreams: s.deletedDreams.filter((d) => d.id !== id),
        })),
    }),
    {
      name: 'dreamy-store',
      version: 3, // 3 = 이미지 URL 에 v 파라미터 추가 → 시드 재생성 필요
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted ?? {}) as Partial<DreamStore>
        if (version < 3) {
          // 이미지 URL 포맷 바뀜 — seed dreams 재시드
          return {
            ...state,
            dreams: SAMPLE_DREAMS,
            creditHistory: INITIAL_HISTORY,
          } as unknown as DreamStore
        }
        return state as DreamStore
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.dreams.length === 0) {
          state.dreams = SAMPLE_DREAMS
        }
        if (state && (state.creditHistory?.length ?? 0) === 0) {
          state.creditHistory = INITIAL_HISTORY
        }
      },
    }
  )
)
