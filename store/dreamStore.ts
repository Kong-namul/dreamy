import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DreamEntry, DreamComment, TabId, CreditTransaction, Mood } from '@/types'
import { inferAuspiceFromMoods } from '@/lib/auspice'

// 진행 중 해석 작업 — store 레벨에 두어 탭 전환/언마운트에도 중단되지 않음.
interface InterpretJob {
  type: 'basic' | 'premium'
  msg: string                  // deprecated — legacy string (비어 있을 수 있음)
  msgKey?: string              // i18n 키 (예: 'interpret.basic', 'interpret.premium.1'). 렌더 시점에 번역.
  startedAt: number
}

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
  interpretJob: InterpretJob | null   // 진행 중 해석 (탭 전환에도 살아남음)
  interpretDraft: { dream: string; moods: Mood[] }  // 작성 중 꿈 본문 (탭 전환해도 유지)
  locale: 'ko' | 'en'                // UI 언어
  currentUserEmail: string | null    // persist 된 로컬 데이터의 소유자

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
  resetAll: () => void                       // 탈퇴 시 모든 로컬 상태 초기화
  hydrateFromServer: (dreams: DreamEntry[], deletedDreams: DreamEntry[]) => void   // 로그인 시 DB → 로컬 싱크
  hydrateCreditHistory: (history: CreditTransaction[]) => void
  setInterpretDraft: (draft: { dream: string; moods: Mood[] }) => void
  setInterpretJob: (job: InterpretJob | null) => void
  updateInterpretMsg: (msg: string, msgKey?: string) => void
  setLocale: (locale: 'ko' | 'en') => void
  toggleLocale: () => void
  setCurrentUserEmail: (email: string | null) => void
}

const INITIAL_STATE = {
  credits: 50,
  dreams: [] as DreamEntry[],
  activeTab: 'new' as TabId,
  creditModalOpen: false,
  nickname: '꿈꾸는이',
  avatarUrl: null as string | null,
  creditHistory: [] as CreditTransaction[],
  deletedDreams: [] as DreamEntry[],
  commentsByDreamId: {} as Record<string, DreamComment[]>,
  openDreamId: null as string | null,
  interpretJob: null as InterpretJob | null,
  interpretDraft: { dream: '', moods: [] as Mood[] },
  locale: 'ko' as 'ko' | 'en',
  currentUserEmail: null as string | null,
}

const welcomeBonusTx = (): CreditTransaction => ({
  id: `welcome-${Date.now()}`,
  type: 'bonus',
  amount: 50,
  label: '가입 축하 보너스',
  date: new Date().toISOString(),
})

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
      interpretJob: null,
      interpretDraft: { dream: '', moods: [] },
      locale: 'ko',
      currentUserEmail: null,

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
          const newCommentsByDreamId = Object.fromEntries(
            Object.entries(s.commentsByDreamId).map(([dreamId, comments]) => [
              dreamId,
              comments.map((c) =>
                c.authorName === old
                  ? { ...c, authorName: name, authorInitial: name.charAt(0) }
                  : c
              ),
            ]),
          )
          return { nickname: name, dreams: newDreams, commentsByDreamId: newCommentsByDreamId }
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
      resetAll: () => {
        // 탈퇴 시: 모든 로컬 상태 초기화. 다음 로그인 시 ensure API 가
        // DB 에서 새 유저 row 를 만들어주면 welcome bonus 도 다시 부여됨.
        set({ ...INITIAL_STATE })
      },
      hydrateFromServer: (dreams, deletedDreams) => {
        set({ dreams, deletedDreams })
      },
      hydrateCreditHistory: (history) => set({ creditHistory: history }),
      setInterpretDraft: (draft) => set({ interpretDraft: draft }),
      setInterpretJob: (job) => set({ interpretJob: job }),
      updateInterpretMsg: (msg: string, msgKey?: string) => set((s) => s.interpretJob ? { interpretJob: { ...s.interpretJob, msg, msgKey } } : {}),
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((s) => ({ locale: s.locale === 'ko' ? 'en' : 'ko' })),
      setCurrentUserEmail: (email) => set({ currentUserEmail: email }),
    }),
    {
      name: 'dreamy-store',
      version: 4, // 4 = 실서비스 전환: seed 꿈·더미 히스토리 제거, 가입 보너스만 제공
      migrate: (persisted: unknown, version: number) => {
        const state = (persisted ?? {}) as Partial<DreamStore>
        if (version < 4) {
          // 실서비스 전환: 이전 seed 더미 데이터 전면 초기화
          return {
            ...state,
            dreams: [],
            creditHistory: [welcomeBonusTx()],
            credits: 50,
          } as unknown as DreamStore
        }
        return state as DreamStore
      },
      onRehydrateStorage: () => (state) => {
        // 신규 유저(persist 없는 상태) → 가입 축하 보너스 1건만 기본 제공
        if (state && (state.creditHistory?.length ?? 0) === 0) {
          state.creditHistory = [welcomeBonusTx()]
        }
      },
    }
  )
)
