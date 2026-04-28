'use client'
import { Mood, DreamEntry } from '@/types'
import { useDreamStore } from '@/store/dreamStore'
import MoodSelector from '@/components/dream/MoodSelector'
import { DiamondIcon, WritingPaperIcon } from '@/components/ui/Icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/lib/i18n'

const PREMIUM_LOADING_MSGS = [
  '그림일기로 옮기고 있어요...',
  '장면을 그리고 있어요...',
  '페이지를 넘기고 있어요...',
  '그림일기가 거의 완성됐어요...',
]
const PREMIUM_LOADING_KEYS = [
  'interpret.premium.1',
  'interpret.premium.2',
  'interpret.premium.3',
  'interpret.premium.4',
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

  const initialMsg = type === 'basic' ? '꿈을 해석하고 있어요...' : PREMIUM_LOADING_MSGS[0]
  const initialKey = type === 'basic' ? 'interpret.basic' : PREMIUM_LOADING_KEYS[0]
  store.setInterpretJob({ type, msg: initialMsg, msgKey: initialKey, startedAt: Date.now() })

  // premium 메시지 로테이션 (5초마다)
  let msgTimer: ReturnType<typeof setInterval> | null = null
  if (type === 'premium') {
    let idx = 0
    msgTimer = setInterval(() => {
      idx = Math.min(idx + 1, PREMIUM_LOADING_MSGS.length - 1)
      useDreamStore.getState().updateInterpretMsg(PREMIUM_LOADING_MSGS[idx], PREMIUM_LOADING_KEYS[idx])
      if (idx === PREMIUM_LOADING_MSGS.length - 1 && msgTimer) {
        clearInterval(msgTimer)
      }
    }, PREMIUM_MSG_INTERVAL_MS)
  }

  // 단일 엔드포인트로 "차감 → AI → 저장 → 실패 시 자동 환불" 까지 서버가 책임.
  try {
    const res = await fetch('/api/interpret/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        dream: draft.dream,
        moods: draft.moods,
        sourceLocale: useDreamStore.getState().locale,
      }),
    })

    if (res.status === 402) {
      // 잔액 부족 — 서버가 차감한 것도 없음. 잔액 모달.
      const body = await res.json().catch(() => ({} as { credits?: number }))
      if (typeof body?.credits === 'number') useDreamStore.getState().setCredits(body.credits)
      useDreamStore.getState().setInterpretJob(null)
      useDreamStore.getState().setCreditModalOpen(true)
      return
    }

    if (!res.ok) {
      // AI/저장 실패 — 서버가 이미 환불 완료. 사용자에겐 실패 알림만.
      const body = await res.json().catch(() => ({} as { credits?: number }))
      if (typeof body?.credits === 'number') useDreamStore.getState().setCredits(body.credits)
      useDreamStore.getState().setInterpretJob(null)
      return
    }

    const { dream: saved, credits } = await res.json() as { dream: DreamEntry; credits: number }

    const s = useDreamStore.getState()
    s.addDream(saved)
    s.setCredits(credits)
    s.setInterpretDraft({ dream: '', moods: [] })
    s.setInterpretJob(null)
    s.setActiveTab('mydiary')
  } catch {
    // 네트워크 실패 — 서버가 차감 전 실패면 무관, 차감 후 실패면 다음 로드 때 원복.
    // (offline fallback 은 이후 이슈로 분리)
    useDreamStore.getState().setInterpretJob(null)
  } finally {
    if (msgTimer) clearInterval(msgTimer)
  }
}

export default function NewDreamTab() {
  const t = useT()
  const interpretJob = useDreamStore((s) => s.interpretJob)
  const interpretDraft = useDreamStore((s) => s.interpretDraft)
  const setInterpretDraft = useDreamStore((s) => s.setInterpretDraft)

  const dream = interpretDraft.dream
  const moods = interpretDraft.moods
  const setDream = (v: string) => setInterpretDraft({ dream: v, moods })
  const setMoods = (next: Mood[]) => setInterpretDraft({ dream, moods: next })

  const isLoading = interpretJob !== null
  const loadingMsg = interpretJob
    ? (interpretJob.msgKey ? t(interpretJob.msgKey) : interpretJob.msg)
    : ''

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
            {/* Title */}
            <div style={{ padding: '0 4px' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>
                {t('new.title')}
              </p>
              <p style={{ fontSize: 13, color: '#8890B0', marginTop: 6 }}>
                {t('new.subtitle')}
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
                  placeholder={t('new.placeholder')}
                  maxLength={3000}
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
                  {dream.length}{t('new.charCount')}
                </div>
              </div>
            </div>

            {/* Mood */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#555E80' }}>{t('new.moodLabel')}</p>
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
                <span>{t('new.basic')}</span>
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
                <span>{t('new.premium')}</span>
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
