'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoonIcon, CloudMoonIcon, JournalIcon } from '@/components/ui/Icons'
const SLIDES = [
  {
    Icon: MoonIcon,
    color: '#7F77DD',
    bg: 'rgba(127,119,221,0.12)',
    title: '오늘 꾼 꿈,\n기억하고 싶지 않으세요?',
    desc: '매일 아침 흐릿해지는 꿈을\nDreamy가 기록해드려요.',
  },
  {
    Icon: CloudMoonIcon,
    color: '#4A7AFF',
    bg: 'rgba(74,122,255,0.12)',
    title: 'AI가 당신의 꿈을\n따뜻하게 해석해요',
    desc: '상징과 무의식을 분석해\n3~4문장의 맞춤 해석을 드려요.',
  },
  {
    Icon: JournalIcon,
    color: '#C44B72',
    bg: 'rgba(196,75,114,0.12)',
    title: '그림일기로\n꿈을 아름답게 기록해요',
    desc: '5페이지 손그림 일기로 꿈의\n이야기를 펼쳐보세요.',
  },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [shimmer, setShimmer] = useState(false)

  const isLast = step === SLIDES.length - 1

  const handleNext = () => {
    if (isLast) {
      onDone()
    } else {
      setStep((s) => s + 1)
    }
  }

  const slide = SLIDES[step]
  const Icon = slide.Icon

  return (
    <div className="flex flex-col min-h-screen px-8 pt-10 pb-16 text-center">
      {/* Skip */}
      <div className="w-full flex justify-end shrink-0">
        <button
          onClick={() => onDone()}
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ color: '#555E80' }}
        >
          건너뛰기
        </button>
      </div>

      {/* Center group: slide + dots + button */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Icon blob */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{ background: slide.bg, border: `1px solid ${slide.color}33` }}
            >
              <Icon size={56} style={{ color: slide.color }} />
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2
                className="text-2xl leading-tight whitespace-pre-line"
                style={{ color: '#E8E8F4', WebkitTextStroke: '0.6px #E8E8F4' }}
              >
                {slide.title}
              </h2>
              <p
                className="leading-6 whitespace-pre-line"
                style={{ fontSize: 16, color: '#8890B0' }}
              >
                {slide.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots — closer to content */}
        <div className="flex items-center justify-center gap-2" style={{ marginTop: '1.25rem' }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}>
              <motion.div
                animate={{ opacity: i === step ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#7F77DD' }}
              />
            </button>
          ))}
        </div>

        {/* Button — farther from dots */}
        <div className="flex justify-center" style={{ marginTop: '3rem' }}>
          <button
            onClick={handleNext}
            onMouseEnter={() => { if (isLast && !shimmer) setShimmer(true) }}
            className="font-bold active:scale-[0.98] hover:brightness-110 transition-all"
            style={{
              fontSize: 15,
              position: 'relative',
              overflow: 'hidden',
              background: isLast
                ? 'linear-gradient(135deg, #7F77DD, #C44B72)'
                : 'rgba(127,119,221,0.85)',
              color: 'white',
              padding: '1rem 3.5rem',
              borderRadius: '1rem',
              minWidth: 160,
            }}
          >
            {isLast && shimmer && (
              <motion.span
                initial={{ x: '-100%', y: '-100%' }}
                animate={{ x: '100%', y: '100%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                onAnimationComplete={() => setShimmer(false)}
                style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(135deg, transparent 38%, rgba(160,148,240,0.4) 50%, transparent 62%)',
                  pointerEvents: 'none',
                }}
              />
            )}
            {isLast ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
