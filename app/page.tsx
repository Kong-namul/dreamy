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
import { getRandomNickname, DEFAULT_NICKNAME } from '@/lib/nicknames'
import { getRandomAvatarUrl } from '@/lib/avatar'
import Onboarding from '@/components/onboarding/Onboarding'
import AuthScreen from '@/components/onboarding/AuthScreen'
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
  const { activeTab, nickname, avatarUrl, setNickname, setAvatarUrl } = useDreamStore()
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
    const key = `dreamy_welcome_bonus_${session.user.email}`
    if (!localStorage.getItem(key)) {
      setShowWelcomeBonus(true)
      // 신규 유저에게만 랜덤 닉네임·아바타 부여 (기존 유저의 직접 수정본은 유지)
      if (nickname === DEFAULT_NICKNAME) setNickname(getRandomNickname())
      if (!avatarUrl) setAvatarUrl(getRandomAvatarUrl())
    }
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
  )
}
