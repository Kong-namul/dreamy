'use client'
import { useDreamStore } from '@/store/dreamStore'
import { TabId } from '@/types'
import { MoonIcon, BookIcon, BarChartIcon } from '@/components/ui/Icons'

const TABS: { id: TabId; icon: React.FC<{ size?: number; style?: React.CSSProperties }>; label: string }[] = [
  { id: 'new',  icon: MoonIcon,     label: '오늘의꿈' },
  { id: 'feed', icon: BookIcon,     label: '드림피드' },
  { id: 'log',  icon: BarChartIcon, label: '드림로그' },
]

export default function TabBar() {
  const { activeTab, setActiveTab } = useDreamStore()

  return (
    <nav
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        background: 'rgba(8,12,28,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '12px 0 10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#9D96F0' : '#555E80',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0 }}>{tab.label}</span>
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 32,
                  height: 2,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #7F77DD, #D4537E)',
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
