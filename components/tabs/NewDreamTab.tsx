'use client'
import { Mood, DreamEntry } from '@/types'
import { useDreamStore } from '@/store/dreamStore'
import MoodSelector from '@/components/dream/MoodSelector'
import { DiamondIcon, WritingPaperIcon } from '@/components/ui/Icons'
import { motion, AnimatePresence } from 'framer-motion'

const PREMIUM_LOADING_MSGS = [
  '그림일기로 옮기고 있어요...',
  '장면을 그리고 있어요...',
  '페이지를 넘기고 있어요...',
  '그림일기가 거의 완성됐어요...',
]
const PREMIUM_MSG_INTERVAL_MS = 5000

/**
 * 해석 본 실행기.
 * store 레벨 action 이 아니라 모듈 레벨 함수로 선언 — 따라서
 * 탭 전환으로 컴포넌트가 언마운트 돼도 fetch 가 중단되지 않는다.
 */
async function runInterpret(type: 'basic' | 'premium') {
  const store = useDreamStore.getState()
  if (store.interpretJob) return   // 이미 진행 중
  const draft = store.interpretDraft
  if (!draft.dream.trim()) return

  const cost = type === 'basic' ? 5 : 15
  const label = type === 'basic' ? '기본 해석' : '그림일기'
  if (!store.spendCredits(cost, label)) return

  const initialMsg = type === 'basic' ? '꿈을 해석하고 있어요...' : PREMIUM_LOADING_MSGS[0]
  store.setInterpretJob({ type, msg: initialMsg, startedAt: Date.now() })

  // premium 메시지 로테이션 (5초마다)
  let msgTimer: ReturnType<typeof setInterval> | null = null
  if (type === 'premium') {
    let idx = 0
    msgTimer = setInterval(() => {
      idx = Math.min(idx + 1, PREMIUM_LOADING_MSGS.length - 1)
      useDreamStore.getState().updateInterpretMsg(PREMIUM_LOADING_MSGS[idx])
      if (idx === PREMIUM_LOADING_MSGS.length - 1 && msgTimer) {
        clearInterval(msgTimer)
      }
    }, PREMIUM_MSG_INTERVAL_MS)
  }

  try {
    const endpoint = type === 'basic' ? '/api/interpret' : '/api/diary'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream: draft.dream, moods: draft.moods }),
    })
    const data = await res.json()

    const entry: Partial<DreamEntry> = {
      dream: draft.dream,
      interpretation: data.interpretation ?? '',
      moods: (draft.moods.length > 0 ? draft.moods : (data.moods ?? [])) as Mood[],
      auspice: data.auspice,
      type,
      weather: data.weather,
      pages: data.pages,
      interpretationBlocks: data.interpretationBlocks,
      lucky: data.lucky,
      shared: false,
    }

    // 서버에 저장해 서버 생성 id 받아오기 (다른 기기에서도 보이려면 필수)
    let saved: DreamEntry | null = null
    try {
      const save = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (save.ok) {
        const j = await save.json()
        if (j?.dream) saved = j.dream as DreamEntry
      }
    } catch { /* 네트워크 실패해도 로컬에는 저장 — 오프라인 fallback */ }

    const finalEntry: DreamEntry = saved ?? {
      ...entry,
      id: `local-${Date.now()}`,
      date: new Date().toISOString(),
    } as DreamEntry

    const s = useDreamStore.getState()
    s.addDream(finalEntry)
    s.setInterpretDraft({ dream: '', moods: [] })
    s.setInterpretJob(null)
    s.setActiveTab('mydiary')
  } catch {
    useDreamStore.getState().setInterpretJob(null)
  } finally {
    if (msgTimer) clearInterval(msgTimer)
  }
}

export default function NewDreamTab() {
  const interpretJob = useDreamStore((s) => s.interpretJob)
  const interpretDraft = useDreamStore((s) => s.interpretDraft)
  const setInterpretDraft = useDreamStore((s) => s.setInterpretDraft)

  const dream = interpretDraft.dream
  const moods = interpretDraft.moods
  const setDream = (v: string) => setInterpretDraft({ dream: v, moods })
  const setMoods = (next: Mood[]) => setInterpretDraft({ dream, moods: next })

  const isLoading = interpretJob !== null
  const loadingMsg = interpretJob?.msg ?? ''

  const handleBasic = () => { void runInterpret('basic') }
  const handlePremium = () => { void runInterpret('premium') }

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div style={{ padding: '0 4px' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>어떤 꿈을 꾸셨나요?</p>
              <p style={{ fontSize: 13, color: '#8890B0', marginTop: 4 }}>
                기억나는 장면·감각·감정을 자유롭게 적어주세요
              </p>
            </div>

            <textarea
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder="오늘 꾼 꿈을 적어보세요..."
              rows={7}
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(127,119,221,0.2)',
                color: '#E8E8F4',
                fontSize: 15,
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />

            <MoodSelector values={moods} onChange={setMoods} />

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={handleBasic}
                disabled={!dream.trim()}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: 14,
                  background: 'rgba(127,119,221,0.16)',
                  color: '#C4C0F5',
                  border: '1px solid rgba(127,119,221,0.4)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: dream.trim() ? 'pointer' : 'not-allowed',
                  opacity: dream.trim() ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
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
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
                  color: 'white',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: dream.trim() ? 'pointer' : 'not-allowed',
                  opacity: dream.trim() ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'filter 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
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

        {isLoading && (
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
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <WritingPaperIcon size={64} strokeWidth={1.0} style={{ color: '#C4C0F5' }} />
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
