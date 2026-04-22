'use client'
import { useDreamStore } from '@/store/dreamStore'
import { motion } from 'framer-motion'

const MOOD_MAP: Record<string, string> = {
  happy: '😊', scary: '😱', weird: '🤔', sad: '😢',
}

export default function ShareTab() {
  const { dreams } = useDreamStore()
  const shared = dreams.filter((d) => d.shared).slice(0, 10)

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl px-4 py-3 text-xs flex items-start gap-2"
        style={{ background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)', color: '#C4C0F5' }}
      >
        <span>🌐</span>
        <span>이 탭의 꿈들은 다른 사용자에게도 보여요</span>
      </div>

      {shared.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <span className="text-5xl">🌐</span>
          <p className="text-sm" style={{ color: '#8890B0' }}>공유된 꿈이 없어요</p>
          <p className="text-xs" style={{ color: '#4A5070' }}>꿈을 저장하면 자동으로 공유돼요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shared.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#8890B0' }}
                >
                  익명
                </span>
                <span className="text-xs" style={{ color: '#8890B0' }}>
                  {new Date(entry.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
                {entry.mood && (
                  <span className="text-sm">{MOOD_MAP[entry.mood]}</span>
                )}
              </div>
              <p className="text-sm leading-6 line-clamp-3" style={{ color: '#C0C4DC' }}>
                {entry.dream.slice(0, 100)}{entry.dream.length > 100 ? '...' : ''}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
