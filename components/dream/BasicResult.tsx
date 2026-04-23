'use client'
import { motion } from 'framer-motion'
import { useDreamStore } from '@/store/dreamStore'
import { DreamEntry } from '@/types'
import { useState } from 'react'
import { SparkleIcon, SaveIcon, SunIcon, DiamondIcon } from '@/components/ui/Icons'

interface Props {
  entry: DreamEntry
  onSave: () => void
  onFortune: () => void
  fortuneText: string | null
  fortuneLoading: boolean
}

export default function BasicResult({ entry, onSave, onFortune, fortuneText, fortuneLoading }: Props) {
  const { spendCredits, setCredits, setCreditModalOpen } = useDreamStore()
  const [saved, setSaved] = useState(false)

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <SparkleIcon size={16} style={{ color: '#9D96F0' }} />
        <span className="text-sm font-semibold" style={{ color: '#C4C0F5' }}>꿈 해석 결과</span>
      </div>

      <p className="text-sm leading-7" style={{ color: '#D0D0EC' }}>
        {entry.interpretation}
      </p>

      {fortuneText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 space-y-1"
          style={{ background: 'rgba(250,238,180,0.08)', border: '1px solid rgba(250,238,180,0.18)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <SunIcon size={13} style={{ color: '#F5D78B' }} />
            <p className="text-xs font-semibold" style={{ color: '#F5D78B' }}>오늘의 운세</p>
          </div>
          <p className="text-sm leading-6" style={{ color: '#E8D5A0' }}>{fortuneText}</p>
        </motion.div>
      )}

      <div className="flex gap-2 pt-1">
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
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(245,215,139,0.1)',
              border: '1px solid rgba(245,215,139,0.22)',
              color: '#F5D78B',
            }}
          >
            {fortuneLoading ? (
              <span className="opacity-60">불러오는 중...</span>
            ) : (
              <>
                <SunIcon size={15} />
                <span>오늘의 운세</span>
                <span className="flex items-center gap-0.5 opacity-70"><DiamondIcon size={10} />3</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}
