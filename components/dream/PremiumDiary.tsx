'use client'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { DreamEntry } from '@/types'
import { useDreamStore } from '@/store/dreamStore'
import { SaveIcon, SunIcon, DiamondIcon } from '@/components/ui/Icons'

const STICKERS = ['🌲', '🗝️', '💭', '💝', '🌟']
const ROTATIONS = [-2, 1.5, -1, 2, -1.5]

interface Props {
  entry: DreamEntry
  onSave: () => void
  onFortune: () => void
  fortuneText: string | null
  fortuneLoading: boolean
}

function DiaryPageCard({ page, index, visible }: { page: { title: string; text: string }; index: number; visible: boolean }) {
  const rot = ROTATIONS[index % ROTATIONS.length]
  const sticker = STICKERS[index % STICKERS.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: rot }}
      animate={visible ? { opacity: 1, y: 0, rotate: rot } : { opacity: 0, y: 20, rotate: rot }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative diary-paper rounded-2xl p-6 shadow-xl"
      style={{ minHeight: 160 }}
    >
      <span className="absolute top-3 left-4 text-xs font-gaegu" style={{ color: '#B89A80' }}>
        {index + 1} / 5
      </span>
      <span
        className="absolute top-3 right-4 text-2xl"
        style={{ animation: 'bobSticker 3s ease-in-out infinite', animationDelay: `${index * 0.5}s` }}
      >
        {sticker}
      </span>
      <div className="mt-4 space-y-2">
        <h3 className="font-bold text-base font-gaegu" style={{ color: '#5A3E28' }}>{page.title}</h3>
        <p className="text-sm leading-7 font-gaegu" style={{ color: '#6B4C38' }}>{page.text}</p>
      </div>
      {index === 4 && (
        <div className="mt-3 text-center text-xs font-gaegu" style={{ color: '#9B7A60' }}>— 끝 —</div>
      )}
    </motion.div>
  )
}

export default function PremiumDiary({ entry, onSave, onFortune, fortuneText, fortuneLoading }: Props) {
  const { spendCredits, setCredits, setCreditModalOpen } = useDreamStore()
  const [visibleCount, setVisibleCount] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!entry.pages) return
    const timers: ReturnType<typeof setTimeout>[] = []
    entry.pages.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), i * 800 + 400))
    })
    return () => timers.forEach(clearTimeout)
  }, [entry.pages])

  const handleSave = () => { onSave(); setSaved(true) }
  const handleFortune = async () => {
    try {
      const res = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 3, label: '오늘의 운세' }),
      })
      if (!res.ok) { setCreditModalOpen(true); return }
      const body = await res.json()
      if (typeof body?.credits === 'number') setCredits(body.credits)
      onFortune()
    } catch {
      if (spendCredits(3, '오늘의 운세')) onFortune()
    }
  }

  if (!entry.pages) return null

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="diary-paper rounded-2xl p-6 text-center shadow-xl"
      >
        <p className="text-3xl mb-2">{entry.weather}</p>
        <p className="font-bold text-lg font-gaegu" style={{ color: '#5A3E28' }}>나의 꿈 일기</p>
        <p className="text-sm mt-1 font-gaegu" style={{ color: '#9B7A60' }}>
          {new Date(entry.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {entry.pages.map((page, i) => (
        <DiaryPageCard key={i} page={page} index={i} visible={i < visibleCount} />
      ))}

      {visibleCount >= 5 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: saved ? 'rgba(127,119,221,0.08)' : 'rgba(127,119,221,0.18)',
              border: '1px solid rgba(127,119,221,0.35)',
              color: saved ? '#555E80' : '#C4C0F5',
            }}
          >
            <SaveIcon size={15} />
            {saved ? '저장 완료' : '일기장 저장'}
          </button>
          {!fortuneText && (
            <button
              onClick={handleFortune}
              disabled={fortuneLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(245,215,139,0.1)', border: '1px solid rgba(245,215,139,0.22)', color: '#F5D78B' }}
            >
              {fortuneLoading ? '불러오는 중...' : <><SunIcon size={15} /><span>오늘의 운세</span><span className="flex items-center gap-0.5 opacity-70"><DiamondIcon size={10} />3</span></>}
            </button>
          )}
        </motion.div>
      )}

      {fortuneText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 space-y-1"
          style={{ background: 'rgba(245,215,139,0.08)', border: '1px solid rgba(245,215,139,0.2)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <SunIcon size={13} style={{ color: '#F5D78B' }} />
            <p className="text-xs font-semibold" style={{ color: '#F5D78B' }}>오늘의 운세</p>
          </div>
          <p className="text-sm leading-6" style={{ color: '#E8D5A0' }}>{fortuneText}</p>
        </motion.div>
      )}
    </div>
  )
}
