'use client'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDreamStore } from '@/store/dreamStore'
import { TabId } from '@/types'
import { DreamyLogo, DiamondIcon, CloseIcon, PersonIcon } from '@/components/ui/Icons'
import { getAvatarAsset } from '@/lib/avatar'

const TAB_LABELS: Record<TabId & ('new' | 'feed' | 'log'), { ko: string; en: string }> = {
  new:  { ko: '오늘의꿈', en: 'New dream' },
  feed: { ko: '드림피드', en: 'Feed' },
  log:  { ko: '드림로그', en: 'Stats' },
} as const

const TAB_IDS: ('new' | 'feed' | 'log')[] = ['new', 'feed', 'log']

function InitialAvatar({ name, size = 32 }: { name?: string | null; size?: number }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold select-none"
      style={{
        width: size, height: size, fontSize: 15,
        background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
        color: 'white',
      }}
    >
      {initial}
    </div>
  )
}

function ProfileModal({ session, credits, onClose }: { session: Session; credits: number; onClose: () => void }) {
  const { dreams } = useDreamStore()
  const user = session.user
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        <motion.div
          className="relative w-full max-w-sm rounded-3xl p-6 space-y-5"
          style={{ background: '#0D1330', border: '1px solid rgba(255,255,255,0.1)' }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full transition-colors hover:bg-white/10"
          >
            <CloseIcon size={16} style={{ color: '#8890B0' }} />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-4">
            {user?.image
              ? <img src={user.image} alt="avatar" className="w-16 h-16 rounded-2xl" />
              : <InitialAvatar name={user?.name} size={64} />
            }
            <div>
              <p className="text-lg font-bold" style={{ color: '#E8E8F4' }}>{user?.name ?? '꿈꾸는 사람'}</p>
              <p className="text-sm" style={{ color: '#8890B0' }}>{user?.email ?? 'dreamer@dreamy.app'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '기록한 꿈', value: `${dreams.length}개` },
              { label: '보유 크레딧', value: `${credits} 💎` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)' }}>
                <p className="text-xs mb-1" style={{ color: '#8890B0' }}>{label}</p>
                <p className="text-xl font-bold" style={{ color: '#C4C0F5' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: 'rgba(196,75,114,0.15)', border: '1px solid rgba(196,75,114,0.3)', color: '#D4537E' }}
          >
            로그아웃
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Header({ session }: { session: Session }) {
  const { credits, setCreditModalOpen, activeTab, setActiveTab, nickname, avatarUrl, locale, toggleLocale } = useDreamStore()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const user = session.user

  const asset = getAvatarAsset(nickname, avatarUrl)

  const AvatarButton = ({ size = 32 }: { size?: number }) => (
    <button
      onClick={() => { setAvatarOpen(!avatarOpen); setProfileOpen(false) }}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        padding: 0,
        border: 'none',
        background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
      }}
    >
      {asset.type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <PersonIcon size={Math.round(size * 0.55)} />
      )}
    </button>
  )

  const menuItemStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 14,
    borderRadius: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#E8E8F4',
    display: 'block',
  }

  const Dropdown = ({ topClass }: { topClass: string }) => (
    avatarOpen ? (
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: topClass === 'top-10' ? 40 : 44,
          borderRadius: 12,
          padding: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 50,
          minWidth: 144,
          background: '#090E22',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={() => { setActiveTab('mydiary'); setAvatarOpen(false) }}
          style={menuItemStyle}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {locale === 'en' ? 'My Diary' : '내 일기'}
        </button>
        <button
          onClick={() => { toggleLocale() }}
          style={menuItemStyle}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          aria-label="Toggle language"
        >
          한글 ⇄ English
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setAvatarOpen(false) }}
          style={menuItemStyle}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {locale === 'en' ? 'Settings' : '설정'}
        </button>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{ ...menuItemStyle, color: '#D4537E' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {locale === 'en' ? 'Log out' : '로그아웃'}
        </button>
      </div>
    ) : null
  )

  return (
    <>
      <header style={{ position: 'relative', zIndex: 20, width: '100%' }}>
        {/* ── Mobile ── */}
        <div
          className="mobile-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label="Dreamy 홈으로"
          >
            <DreamyLogo size={42} style={{ color: '#C4C0F5' }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#E8E8F4', fontFamily: "'Nunito', sans-serif", letterSpacing: -0.3 }}>Dreamy</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setCreditModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center',
                borderRadius: 9999,
                fontWeight: 500,
                background: 'rgba(127,119,221,0.18)',
                border: '1px solid rgba(127,119,221,0.4)',
                color: '#C4C0F5',
                padding: '0 10px',
                gap: 6,
                height: 34,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              <DiamondIcon size={13} style={{ color: '#A09AEE' }} />
              <span>{credits}</span>
            </button>
            <div style={{ position: 'relative' }}>
              <AvatarButton size={32} />
              <Dropdown topClass="top-10" />
            </div>
          </div>
        </div>

        {/* ── Desktop GNB ── */}
        <div
          className="desktop-only"
          style={{
            width: '100%',
            background: 'rgba(4,6,14,0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="h-16 flex items-center justify-between gap-8" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className="flex items-center gap-1.5 shrink-0"
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Dreamy 홈으로"
            >
              <DreamyLogo size={36} style={{ color: '#C4C0F5' }} />
              <span className="text-xl font-bold tracking-tight" style={{ color: '#E8E8F4', fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>Dreamy</span>
            </button>

            <nav style={{ display: 'flex', height: 64, alignItems: 'center', gap: 32 }}>
              {TAB_IDS.map((id) => {
                const active = activeTab === id
                const label = TAB_LABELS[id][locale]
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      fontSize: 16,
                      fontWeight: 500,
                      color: active ? '#E8E8F4' : '#555E80',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                  >
                    <span style={{ transform: 'translateY(2px)' }}>{label}</span>
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 2,
                          borderRadius: 9999,
                          background: '#E8E8F4',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setCreditModalOpen(true)}
                className="flex items-center rounded-full font-medium transition-all hover:brightness-110"
                style={{ background: 'rgba(127,119,221,0.18)', border: '1px solid rgba(127,119,221,0.35)', color: '#C4C0F5', padding: '0 10px', gap: 6, height: 34, fontSize: 15 }}
              >
                <DiamondIcon size={13} style={{ color: '#A09AEE' }} />
                <span>{credits}</span>
              </button>
              <div className="relative">
                <AvatarButton size={34} />
                <Dropdown topClass="top-11" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {profileOpen && (
        <ProfileModal
          session={session}
          credits={credits}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  )
}
