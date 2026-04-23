'use client'
import { signIn, useSession } from 'next-auth/react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { DreamyLogo, SwapArrowsIcon } from '@/components/ui/Icons'
import { useDreamStore } from '@/store/dreamStore'
import { useT } from '@/lib/i18n'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function AuthScreen() {
  const [loading, setLoading] = useState(false)
  const { update } = useSession()
  const { setActiveTab } = useDreamStore()
  const toggleLocale = useDreamStore((s) => s.toggleLocale)
  const t = useT()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setActiveTab('new')  // 로그인 시 항상 오늘의 꿈 탭으로 초기화
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex flex-col items-center justify-center min-h-screen px-8 pb-52 text-center"
    >
      {/* Language toggle — fixed top-right, matches Onboarding */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 50,
        }}
      >
        <button
          onClick={toggleLocale}
          aria-label="Toggle language"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
            padding: '6px 12px', borderRadius: 9999,
            background: 'rgba(127,119,221,0.12)',
            border: '1px solid rgba(127,119,221,0.3)',
            color: '#C0C4DC', cursor: 'pointer',
          }}
        >
          <span>한글</span>
          <SwapArrowsIcon size={12} style={{ color: '#8890B0' }} />
          <span>ENG</span>
        </button>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
        style={{ marginBottom: '2.25rem' }}
      >
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(127,119,221,0.15)', border: '1px solid rgba(127,119,221,0.3)' }}
        >
          <DreamyLogo size={78} style={{ color: '#C4C0F5' }} />
        </div>
        <h1 className="text-3xl font-bold" style={{ color: '#E8E8F4', marginTop: '1rem', fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>Dreamy</h1>
        <p style={{ color: '#8890B0', marginTop: '0.5rem', fontSize: 16 }}>{t('auth.subtitle')}</p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col"
        style={{ gap: '1.25rem' }}
      >
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center gap-3 font-semibold transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'white', color: '#1a1a2e', padding: '1rem 2rem', borderRadius: '1rem', fontSize: 15 }}
        >
          <GoogleIcon />
          {loading ? t('auth.loading') : t('auth.google')}
        </button>
        <p style={{ color: '#5C6480', fontSize: 14 }}>
          {t('auth.tos')}
        </p>
      </motion.div>
    </motion.div>
  )
}
