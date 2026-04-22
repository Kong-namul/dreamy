'use client'
import { useState, useRef, useEffect } from 'react'
import { Mood, DreamEntry } from '@/types'
import { useDreamStore } from '@/store/dreamStore'
import MoodSelector from '@/components/dream/MoodSelector'
import { DiamondIcon, WritingPaperIcon } from '@/components/ui/Icons'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'idle' | 'loading'

const PREMIUM_LOADING_MSGS = [
  '그림일기로 옮기고 있어요...',
  '장면을 그리고 있어요...',
  '페이지를 넘기고 있어요...',
  '그림일기가 거의 완성됐어요...',
]
const PREMIUM_MSG_INTERVAL_MS = 5000

export default function NewDreamTab() {
  const { spendCredits, addDream, setActiveTab } = useDreamStore()
  const [dream, setDream] = useState('')
  const [moods, setMoods] = useState<Mood[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [loadingMsg, setLoadingMsg] = useState('')
  const premiumMsgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPremiumMsgRotation = () => {
    if (premiumMsgTimerRef.current) {
      clearInterval(premiumMsgTimerRef.current)
      premiumMsgTimerRef.current = null
    }
  }

  useEffect(() => () => stopPremiumMsgRotation(), [])

  const startPremiumMsgRotation = () => {
    stopPremiumMsgRotation()
    let idx = 0
    setLoadingMsg(PREMIUM_LOADING_MSGS[0])
    premiumMsgTimerRef.current = setInterval(() => {
      idx = Math.min(idx + 1, PREMIUM_LOADING_MSGS.length - 1)
      setLoadingMsg(PREMIUM_LOADING_MSGS[idx])
      if (idx === PREMIUM_LOADING_MSGS.length - 1) stopPremiumMsgRotation()
    }, PREMIUM_MSG_INTERVAL_MS)
  }

  const finish = (entry: DreamEntry) => {
    stopPremiumMsgRotation()
    addDream(entry)              // 자동 저장 (최신순이라 내 일기 상단에 노출)
    setDream('')
    setMoods([])
    setPhase('idle')
    setActiveTab('mydiary')      // 내 일기 탭으로 이동 → 방금 저장된 꿈이 최상단에 보임
  }

  const handleBasic = async () => {
    if (!dream.trim()) return
    const ok = spendCredits(5, '기본 해석')
    if (!ok) return
    setPhase('loading')
    setLoadingMsg('꿈을 해석하고 있어요...')
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream, moods }),
      })
      const data = await res.json()
      finish({
        id: Date.now().toString(),
        dream,
        interpretation: data.interpretation ?? '해석을 불러오지 못했어요.',
        moods: (moods.length > 0 ? moods : (data.moods ?? [])) as Mood[],
        auspice: data.auspice,
        type: 'basic',
        date: new Date().toISOString(),
        shared: false,
      })
    } catch {
      stopPremiumMsgRotation()
      setPhase('idle')
    }
  }

  const handlePremium = async () => {
    if (!dream.trim()) return
    const ok = spendCredits(15, '그림일기')
    if (!ok) return
    setPhase('loading')
    startPremiumMsgRotation()
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream, moods }),
      })
      const data = await res.json()
      finish({
        id: Date.now().toString(),
        dream,
        interpretation: data.interpretation ?? '',
        moods: (moods.length > 0 ? moods : (data.moods ?? [])) as Mood[],
        type: 'premium',
        weather: data.weather,
        pages: data.pages,
        interpretationBlocks: data.interpretationBlocks,
        lucky: data.lucky,
        auspice: data.auspice,
        date: new Date().toISOString(),
        shared: false,
      })
    } catch {
      stopPremiumMsgRotation()
      setPhase('idle')
    }
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {/* Title */}
            <div style={{ padding: '0 4px' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>
                어떤 꿈을 꾸셨나요?
              </p>
              <p style={{ fontSize: 13, color: '#8890B0', marginTop: 6 }}>
                떠오르는 대로 적어주세요. 색·소리·냄새 디테일이 있을수록 해석이 풍부해져요.
              </p>
            </div>

            {/* Book-shaped input */}
            <div
              style={{
                display: 'flex',
                borderRadius: '8px 16px 16px 8px',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(0,0,0,0.55), 4px 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{
                width: 26,
                flexShrink: 0,
                background: 'linear-gradient(90deg, #12103A 0%, #2A2475 55%, #1E1A58 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ width: 1, height: '75%', background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '20px 20px 12px',
                  background: `repeating-linear-gradient(transparent, transparent 27px, #E8D5C4 27px, #E8D5C4 28px), #FFF8EC`,
                }}
              >
                <textarea
                  value={dream}
                  onChange={(e) => setDream(e.target.value)}
                  placeholder="오늘 밤 꾼 꿈을 적어주세요..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    outline: 'none',
                    resize: 'none',
                    border: 'none',
                    fontFamily: "'Jua', sans-serif",
                    color: '#2D1F0E',
                    fontSize: 17,
                    lineHeight: '28px',
                    minHeight: 196,
                    caretColor: '#7F77DD',
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: '#9B8060', marginTop: 4 }}>
                  {dream.length}자
                </div>
              </div>
            </div>

            {/* Mood */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#555E80' }}>꿈의 기분</p>
              <MoodSelector values={moods} onChange={setMoods} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <button
                onClick={handleBasic}
                disabled={!dream.trim()}
                style={{
                  padding: '18px 0',
                  borderRadius: 16,
                  fontWeight: 700,
                  fontSize: 15,
                  background: '#C44B72',
                  color: 'white',
                  border: 'none',
                  cursor: dream.trim() ? 'pointer' : 'not-allowed',
                  opacity: dream.trim() ? 1 : 0.35,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'filter 0.15s',
                }}
                onMouseEnter={(e) => { if (dream.trim()) e.currentTarget.style.filter = 'brightness(1.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
              >
                <span>기본 해석</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: 0.85 }}>
                  <DiamondIcon size={10} /> 5
                </span>
              </button>

              <button
                onClick={handlePremium}
                disabled={!dream.trim()}
                style={{
                  padding: '18px 0',
                  borderRadius: 16,
                  fontWeight: 700,
                  fontSize: 15,
                  background: 'linear-gradient(145deg, #7F77DD, #C44B72)',
                  color: 'white',
                  border: 'none',
                  cursor: dream.trim() ? 'pointer' : 'not-allowed',
                  opacity: dream.trim() ? 1 : 0.35,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'filter 0.15s',
                }}
                onMouseEnter={(e) => { if (dream.trim()) e.currentTarget.style.filter = 'brightness(1.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
              >
                <span>그림일기</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: 0.85 }}>
                  <DiamondIcon size={10} /> 15
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
              gap: 20,
            }}
          >
            <motion.div
              animate={{ rotate: [-4, 4, -4], y: [0, -2, 0] }}
              transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(127,119,221,0.14)',
                border: '1px solid rgba(127,119,221,0.3)',
              }}
            >
              <WritingPaperIcon size={40} style={{ color: '#C4C0F5' }} />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                style={{ fontSize: 14, color: '#8890B0' }}
              >
                {loadingMsg}
              </motion.p>
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#7F77DD',
                    animation: 'twinkle 1.1s ease-in-out infinite',
                    animationDelay: `${i * 0.25}s`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
