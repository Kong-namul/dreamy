'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import StarField from '@/components/background/StarField'
import CloudLayer from '@/components/background/CloudLayer'
import Header from '@/components/layout/Header'
import TabBar from '@/components/layout/TabBar'
import NewDreamTab from '@/components/tabs/NewDreamTab'
import DiaryTab from '@/components/tabs/DiaryTab'
import MyDiaryTab from '@/components/tabs/MyDiaryTab'
import StatsTab from '@/components/tabs/StatsTab'
import CreditHistoryTab from '@/components/tabs/CreditHistoryTab'
import SettingsTab from '@/components/tabs/SettingsTab'
import TrashTab from '@/components/tabs/TrashTab'
import CreditModal from '@/components/ui/CreditModal'
import WelcomeBonusModal from '@/components/ui/WelcomeBonusModal'
import GlobalDreamModal from '@/components/dream/GlobalDreamModal'
import { DEFAULT_NICKNAME } from '@/lib/nicknames'
import Onboarding from '@/components/onboarding/Onboarding'
import AuthScreen from '@/components/onboarding/AuthScreen'
import InAppBrowserGuard from '@/components/onboarding/InAppBrowserGuard'
import { AnimatePresence, motion } from 'framer-motion'

const TAB_MAP = {
  new: NewDreamTab,
  feed: DiaryTab,
  log: StatsTab,
  mydiary: MyDiaryTab,
  history: CreditHistoryTab,
  settings: SettingsTab,
  trash: TrashTab,
}

const BG      = 'linear-gradient(180deg, #03050D 0%, #060C1C 50%, #0A1530 100%)'
const BG_DARK = 'linear-gradient(180deg, #010204 0%, #020608 40%, #040C18 100%)'

export default function Home() {
  const { data: session, status } = useSession()
  const { activeTab, nickname, avatarUrl, setNickname, setAvatarUrl, hydrateFromServer, setCredits } = useDreamStore()
  const [onboarded, setOnboarded] = useState<boolean | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    const seen = localStorage.getItem('dreamy_onboarded')
    setOnboarded(!!seen)
  }, [status])

  useEffect(() => {
    if (!session?.user?.email) return
    let cancelled = false
    // DB 측 유저 row 를 보장. ensure API 의 created=true 일 때만 welcome bonus 표시
    // (=완전 신규 가입 또는 탈퇴 후 재가입). 기존 로그인은 조용히 동기화만.
    ;(async () => {
      try {
        const res = await fetch('/api/user/ensure', { method: 'POST' })
        if (!res.ok) return
        const { user, created } = await res.json() as {
          user: { nickname: string; avatar_url: string | null; credits?: number } | null
          created: boolean
        }
        if (cancelled) return

        // 신규 생성 → 서버가 부여한 랜덤 닉/아바타·크레딧 반영 + welcome 팝업
        if (created && user) {
          setNickname(user.nickname)
          if (user.avatar_url) setAvatarUrl(user.avatar_url)
          if (typeof user.credits === 'number') setCredits(user.credits)
          setShowWelcomeBonus(true)
          return
        }

        // 기존 유저 — DB 가 진실의 원천. 항상 서버 값으로 동기화해서
        // 기기별 로컬 캐시 차이를 제거한다. 닉네임·아바타·크레딧 모두.
        if (user) {
          if (user.nickname && user.nickname !== nickname) setNickname(user.nickname)
          if (user.avatar_url !== undefined && user.avatar_url !== avatarUrl) {
            setAvatarUrl(user.avatar_url ?? null)
          }
          if (typeof user.credits === 'number') setCredits(user.credits)
        }

        // 꿈 목록 서버 동기화 — 다른 기기에서도 보이게
        try {
          const dreamsRes = await fetch('/api/dreams')
          if (dreamsRes.ok) {
            const { dreams, deletedDreams } = await dreamsRes.json()
            if (!cancelled && Array.isArray(dreams)) {
              hydrateFromServer(dreams, Array.isArray(deletedDreams) ? deletedDreams : [])
            }
          }
        } catch { /* 네트워크 실패 시 로컬 유지 */ }
      } catch {
        /* 네트워크 오류 시 조용히 무시 — 다음 세션에서 재시도됨 */
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email])

  const handleCloseWelcomeBonus = () => {
    if (session?.user?.email) {
      localStorage.setItem(`dreamy_welcome_bonus_${session.user.email}`, '1')
    }
    setShowWelcomeBonus(false)
  }

  const handleGoToAuth = () => {
    localStorage.setItem('dreamy_onboarded', '1')
    setOnboarded(true)
    setShowAuth(true)
  }

  const TabContent = TAB_MAP[activeTab as keyof typeof TAB_MAP] ?? TAB_MAP['new']

  const showClouds = !!(onboarded || showAuth || session)
  const cloudHeight = session ? '42%' : '30%'

  return (
    <InAppBrowserGuard>
    <div className="relative min-h-screen overflow-hidden" style={{ background: BG }}>
      <StarField />
      {showClouds && <CloudLayer slideIn height={cloudHeight} />}

      <div className="relative z-10">
        {!session ? (
          // Unauthenticated — wait until onboarded state is resolved
          <div className="min-h-screen">
            {onboarded === null ? null : (!onboarded && !showAuth)
              ? <Onboarding onDone={handleGoToAuth} />
              : <AuthScreen />
            }
          </div>
        ) : (
          // Authenticated
          <div className="flex flex-col min-h-screen w-full">
            <Header session={session} />
            <main className="flex-1 w-full overflow-y-auto pb-24 lg:pb-12">
              <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.875rem 1.5rem 0' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <TabContent />
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
            <TabBar />
          </div>
        )}
      </div>

      {session && <CreditModal />}
      {session && <GlobalDreamModal />}
      {session && <WelcomeBonusModal open={showWelcomeBonus} onClose={handleCloseWelcomeBonus} />}
    </div>
    </InAppBrowserGuard>
  )
}
