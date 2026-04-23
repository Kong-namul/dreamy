'use client'
import { useDreamStore } from '@/store/dreamStore'
import { motion } from 'framer-motion'
import { MoonIcon, BarChartIcon, DiamondIcon } from '@/components/ui/Icons'

const ChevronRight = ({ size = 12, color = '#8890B0' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
import { MOOD_LABEL, MOOD_COLOR } from '@/lib/moods'
import { Mood } from '@/types'
import { useT } from '@/lib/i18n'

const MOOD_ORDER: Exclude<Mood, null>[] = [
  'happy', 'excited', 'peaceful', 'nostalgic', 'fascinating',
  'weird', 'confused', 'anxious', 'scary', 'sad',
]

const CalIcon = ({ size = 20, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(17, 26, 58, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
}

export default function StatsTab() {
  const { dreams, setActiveTab } = useDreamStore()
  const t = useT()

  const totalDreams = dreams.length
  const thisWeek = dreams.filter((d) => Date.now() - new Date(d.date).getTime() < 7 * 86400000).length
  const spentCredits = dreams.reduce((acc, d) => acc + (d.type === 'premium' ? 15 : 5), 0)

  const moodCounts = MOOD_ORDER.map((key) => ({
    key,
    count: dreams.filter((d) => (d.moods ?? []).includes(key)).length,
  }))
  const maxCount = Math.max(...moodCounts.map((m) => m.count), 1)

  const metrics = [
    { key: 'total', label: t('stats.totalDreams'), value: totalDreams, Icon: MoonIcon, color: '#7F77DD', clickable: false },
    { key: 'week', label: t('stats.thisWeek'), value: thisWeek, Icon: CalIcon, color: '#4A7AFF', clickable: false },
    { key: 'spent', label: t('stats.spentCredits'), value: spentCredits, Icon: DiamondIcon, color: '#C44B72', clickable: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ padding: '0 4px', marginBottom: 4 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>{t('stats.title')}</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {metrics.map((m, i) => {
          const Icon = m.Icon
          const clickable = m.clickable
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={clickable ? () => setActiveTab('history') : undefined}
              style={{
                ...CARD_STYLE,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                cursor: clickable ? 'pointer' : 'default',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
              whileHover={clickable ? { y: -2 } as never : undefined}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${m.color}22`,
                  flexShrink: 0,
                }}
              >
                <Icon size={18} style={{ color: m.color }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#E8E8F4', lineHeight: 1 }}>{m.value}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <p style={{ fontSize: 11, textAlign: 'center', color: '#8890B0', lineHeight: 1.3 }}>{m.label}</p>
                {clickable && <ChevronRight size={11} color="#8890B0" />}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Mood distribution */}
      <div style={{ ...CARD_STYLE, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChartIcon size={16} style={{ color: '#9D96F0' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#C4C0F5' }}>{t('stats.moodChart')}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOOD_ORDER.map((key, i) => {
            const count = moodCounts.find((m) => m.key === key)?.count ?? 0
            const pct = (count / maxCount) * 100
            const label = t(`mood.${key}`)
            const color = MOOD_COLOR[key].fg
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: count > 0 ? '#E8E8F4' : '#8890B0' }}>{label}</span>
                  <span style={{ color: '#555E80' }}>{count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 9999,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 9999, background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {totalDreams === 0 && (
        <p style={{ textAlign: 'center', fontSize: 12, padding: '8px 0', color: '#3C4260' }}>
          꿈을 기록하면 통계가 표시돼요
        </p>
      )}
    </div>
  )
}
