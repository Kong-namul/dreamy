'use client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
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
import Onboarding from '@/components/onboarding/Onboarding'
import AuthScreen from '@/components/onboarding/AuthScreen'
import InAppBrowserGuard from '@/components/onboarding/InAppBrowserGuard'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthBackGuard } from '@/hooks/useAuthBackGuard'
import { useOnboardingFlag } from '@/hooks/useOnboardingFlag'
import { useUserBootstrap } from '@/hooks/useUserBootstrap'
import { useDreamSync } from '@/hooks/useDreamSync'
import { useCreditSync } from '@/hooks/useCreditSync'

/**
 * 이 파일은 "어떤 화면을 조립해 보여줄지" 만 결정한다.
 * 세션·유저·꿈·크레딧 동기화와 back-button guard 등 부수 효과는 모두 훅으로 분리.
 * 관련 훅은 hooks/ 아래에 위치.
 */

const TAB_MAP = {
  new: NewDreamTab,
  feed: DiaryTab,
  log: StatsTab,
  mydiary: MyDiaryTab,
  history: CreditHistoryTab,
  settings: SettingsTab,
  trash: TrashTab,
}

const BG = 'linear-gradient(180deg, #03050D 0%, #060C1C 50%, #0A1530 100%)'

export default function Home() {
  const { data: session, status } = useSession()
  const activeTab = useDreamStore((s) => s.activeTab)
  const email = session?.user?.email ?? null

  // 관제탑 훅들 — 각각 책임이 하나씩.
  useAuthBackGuard(session)
  const { onboarded, markOnboarded } = useOnboardingFlag(status)
  const { showWelcomeBonus, closeWelcomeBonus } = useUserBootstrap(email)
  useDreamSync(email)
  useCreditSync(email)

  const [showAuth, setShowAuth] = useState(false)

  const handleGoToAuth = () => {
    markOnboarded()
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
        {session && <WelcomeBonusModal open={showWelcomeBonus} onClose={closeWelcomeBonus} />}
      </div>
    </InAppBrowserGuard>
  )
}
