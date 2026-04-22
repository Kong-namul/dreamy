'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { DreamEntry, InterpretationBlock, LuckyToday } from '@/types'
import { PublicDream } from '@/lib/sampleDreams'
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/Icons'
import MoodPill from '@/components/ui/MoodPill'
import { AUSPICE_THEME, AUSPICE_LABEL, inferAuspiceFromMoods } from '@/lib/auspice'
import { useDreamStore } from '@/store/dreamStore'
import { useState, useEffect } from 'react'
import { DreamComment } from '@/types'

/**
 * 모달이 열린 동안 body 스크롤 잠금. 여러 모달이 동시에 열려도 카운터로 안전하게 처리.
 */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const body = document.body
    const previous = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = previous
    }
  }, [locked])
}

export type DetailEntry = (DreamEntry | PublicDream) & {
  isMine?: boolean
  authorName?: string
  authorInitial?: string
}

interface Props {
  entry: DetailEntry | null
  onClose: () => void
}

export default function DreamDetailModal({ entry, onClose }: Props) {
  useBodyScrollLock(entry !== null)
  return (
    <AnimatePresence>
      {entry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              borderRadius: 24,
              background: '#090E22',
              border: '1px solid rgba(127,119,221,0.28)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Fixed header */}
            <DetailHeader entry={entry} onClose={onClose} />

            {/* Scrollable middle with top/bottom gradient fade */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div
                className="dream-modal-scroll"
                style={{
                  overflowY: 'auto',
                  padding: '14px 24px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                  flex: 1,
                }}
              >
                <DetailBody entry={entry} />
              </div>
              {/* Top fade — 스크롤바 영역 비움 */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 10,
                height: 20,
                background: 'linear-gradient(to bottom, #090E22 0%, rgba(9,14,34,0.7) 50%, rgba(9,14,34,0) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
              {/* Bottom fade — 스크롤바 영역 비움 */}
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 10,
                height: 20,
                background: 'linear-gradient(to top, #090E22 0%, rgba(9,14,34,0.7) 50%, rgba(9,14,34,0) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
            </div>

            {/* Fixed comment input footer */}
            <CommentInputFooter entry={entry} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function DetailHeader({ entry, onClose }: { entry: DetailEntry; onClose: () => void }) {
  const auspice = entry.auspice ?? inferAuspiceFromMoods(entry.moods ?? [])
  const theme = AUSPICE_THEME[auspice]
  const auspiceLabel = AUSPICE_LABEL[auspice]
  const authorLabel = entry.authorName ?? (entry.isMine ? '나' : '익명')

  return (
    <div style={{
      padding: '22px 24px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 999,
            background: theme.badgeBg, color: theme.badgeFg, letterSpacing: 0.5,
          }}>
            {auspiceLabel}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 999,
            background: entry.type === 'premium' ? 'rgba(127,119,221,0.22)' : 'rgba(196,75,114,0.18)',
            border: entry.type === 'premium' ? '1px solid rgba(127,119,221,0.4)' : '1px solid rgba(196,75,114,0.35)',
            color: entry.type === 'premium' ? '#C4C0F5' : '#E8899A',
          }}>
            {entry.type === 'premium' ? '그림일기' : '기본 해석'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: entry.isMine ? '#C4C0F5' : '#E8E8F4' }}>
            {authorLabel}
          </span>
          <span style={{ fontSize: 12, color: '#555E80' }}>
            {new Date(entry.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, flexShrink: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)', border: 'none',
          cursor: 'pointer', color: '#8890B0',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      >
        <CloseIcon size={14} />
      </button>
    </div>
  )
}

function DetailBody({ entry }: { entry: DetailEntry }) {
  const hasPages = entry.type === 'premium' && entry.pages && entry.pages.length > 0
  const hasBlocks = entry.type === 'premium' && entry.interpretationBlocks && entry.interpretationBlocks.length > 0

  return (
    <>
      {/* Dream content section — includes user's mood pill inside */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 22,              // 플래그(MoodPill) 와 동일 높이 박스로 강제
            fontSize: 11,
            fontWeight: 600,
            color: '#555E80',
            letterSpacing: 0.5,
            lineHeight: 1,
          }}>
            꿈 내용
          </span>
          {entry.moods && entry.moods.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              {entry.moods.map((m) => <MoodPill key={m} mood={m} size="sm" />)}
            </div>
          )}
        </div>

        {hasPages ? (
          <DiaryCarousel pages={entry.pages!} />
        ) : (
          <div
            style={{
              padding: '20px 22px',
              borderRadius: 12,
              background: `repeating-linear-gradient(transparent, transparent 27px, #E8D5C4 27px, #E8D5C4 28px), #FFF8EC`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              color: '#2D1F0E',
              fontFamily: "'Jua', sans-serif",
              fontSize: 15,
              lineHeight: '28px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {entry.dream}
          </div>
        )}
      </section>

      {/* Interpretation section */}
      {hasBlocks ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80', letterSpacing: 0.5 }}>상세 해석</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entry.interpretationBlocks!.map((block, i) => (
              <InterpretationBlockCard key={i} block={block} index={i} />
            ))}
          </div>
        </section>
      ) : (
        entry.interpretation && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80', letterSpacing: 0.5 }}>해석</p>
            <FormattedInterpretation text={entry.interpretation} />
          </section>
        )
      )}

      {/* Lucky today */}
      {entry.type === 'premium' && entry.lucky && <LuckyCard lucky={entry.lucky} />}

      {/* Premium original dream collapsible */}
      {hasPages && (
        <details style={{ marginTop: 4 }}>
          <summary style={{
            fontSize: 11,
            color: '#555E80',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '8px 4px',
          }}>
            내가 쓴 원문 보기
          </summary>
          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 13,
              lineHeight: '22px',
              color: '#8890B0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {entry.dream}
          </div>
        </details>
      )}

      {/* Comment list (입력폼은 푸터로 분리) */}
      <CommentList entry={entry} />
    </>
  )
}

function InterpretationBlockCard({ block, index }: { block: InterpretationBlock; index: number }) {
  // 상세 해석은 이미지 없이 텍스트만. 이미지는 그림일기 pages 전용.
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background: 'rgba(127,119,221,0.06)',
        border: '1px solid rgba(127,119,221,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {block.heading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(127,119,221,0.25)',
              color: '#C4C0F5', fontSize: 11, fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#C4C0F5' }}>{block.heading}</p>
        </div>
      )}
      <p style={{ fontSize: 13, lineHeight: '22px', color: '#C0C4DC', whiteSpace: 'pre-wrap' }}>
        {renderInlineBold(block.body)}
      </p>
    </div>
  )
}

function LuckyCard({ lucky }: { lucky: LuckyToday }) {
  return (
    <section
      style={{
        padding: 20,
        borderRadius: 18,
        background: `linear-gradient(135deg, ${lucky.colorHex}2A 0%, rgba(127,119,221,0.1) 100%)`,
        border: `1px solid ${lucky.colorHex}66`,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: '#E8E8F4', letterSpacing: 0.5 }}>
        오늘의 길잡이
      </p>

      {/* 가지고 다닐 것 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#8890B0' }}>가지고 다니면 좋은 것</p>
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 14, color: '#E8E8F4', fontWeight: 500 }}>{lucky.item}</p>
        </div>
      </div>

      {/* 색상 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#8890B0' }}>행운 컬러</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: lucky.colorHex,
              border: '2px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
              boxShadow: `0 4px 16px ${lucky.colorHex}55`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F4' }}>{lucky.colorName}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8890B0' }}>{lucky.colorHex}</span>
          </div>
        </div>
      </div>

      {/* 피해야 할 것 */}
      {lucky.avoid && lucky.avoid.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#8890B0' }}>오늘 피하면 좋은 것</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lucky.avoid.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(196,75,114,0.08)',
                  border: '1px solid rgba(196,75,114,0.22)',
                  fontSize: 13,
                  color: '#E8C4CD',
                  lineHeight: '20px',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direction & number */}
      {(lucky.luckyDirection || lucky.luckyNumber != null) && (
        <div style={{ display: 'grid', gridTemplateColumns: lucky.luckyDirection && lucky.luckyNumber != null ? '1fr 1fr' : '1fr', gap: 10 }}>
          {lucky.luckyDirection && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 11, color: '#8890B0', marginBottom: 2 }}>행운의 방향</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F4' }}>{lucky.luckyDirection}</p>
            </div>
          )}
          {lucky.luckyNumber != null && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 11, color: '#8890B0', marginBottom: 2 }}>행운의 숫자</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F4' }}>{lucky.luckyNumber}</p>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, lineHeight: '20px', color: '#C0C4DC', paddingTop: 4 }}>
        {lucky.advice}
      </p>
    </section>
  )
}

/**
 * Basic 해석의 canonical 3단 소제목 (오프닝 다음부터 나옴).
 * 이 이름으로 시작하는 단락은 자동으로 볼드 소제목 + 본문으로 분리 렌더.
 */
const CANONICAL_HEADINGS = [
  '상징 해석',
  '심리적 의미',
  '오늘의 조언',
  // 레거시/변형 호환
  '상징 풀이',
  '심리학적 의미',
  '현재 당신의 상태',
  '한국 전통 해몽',
]

function FormattedInterpretation({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim()
        const lines = trimmed.split('\n')
        const firstLine = lines[0]?.trim() ?? ''

        // 1) 소제목이 첫 줄, 본문이 뒤따르는 단락 → 볼드 헤더 + 본문 분리 렌더
        const matchedHeading = CANONICAL_HEADINGS.find((h) => firstLine === h || firstLine.startsWith(h + ' '))
        if (matchedHeading && lines.length > 1) {
          const body = lines.slice(1).join('\n').trim()
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#E8E8F4' }}>
                {firstLine}
              </p>
              <p style={{ fontSize: 14, lineHeight: '26px', color: '#C0C4DC', whiteSpace: 'pre-wrap' }}>
                {renderInlineBold(body)}
              </p>
            </div>
          )
        }

        // 2) 단락 전체가 볼드 래핑된 경우 → 기존 헤더 스타일
        if (/^\*\*.+\*\*$/.test(trimmed)) {
          return (
            <p key={i} style={{ fontSize: 14, fontWeight: 700, color: '#E8E8F4', marginTop: 4 }}>
              {trimmed.replace(/\*\*/g, '')}
            </p>
          )
        }

        // 3) 일반 단락
        return (
          <p key={i} style={{ fontSize: 14, lineHeight: '26px', color: '#C0C4DC', whiteSpace: 'pre-wrap' }}>
            {renderInlineBold(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} style={{ color: '#E8E8F4', fontWeight: 700 }}>
          {part.replace(/\*\*/g, '')}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

/**
 * 그림일기 좌우 플리킹 캐러셀 — 드래그/스와이프 + 좌우 버튼 + 인디케이터
 */
function DiaryCarousel({ pages }: { pages: Array<{ title: string; text: string; illustration?: string; imagePrompt?: string; imageUrl?: string }> }) {
  const [index, setIndex] = useState(0)
  const total = pages.length
  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(total - 1, i + 1))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stage */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
        <AnimatePresence mode="wait" custom={index}>
          <motion.div
            key={index}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) next()
              else if (info.offset.x > 80) prev()
            }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{ cursor: 'grab' }}
          >
            <DiaryPageCard page={pages[index]} index={index} total={total} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls: arrows + dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button
          onClick={prev}
          disabled={index === 0}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: index === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(127,119,221,0.15)',
            border: index === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(127,119,221,0.35)',
            color: index === 0 ? '#3C4260' : '#C4C0F5',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          <ChevronLeftIcon size={16} />
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: i === index ? '#C4C0F5' : 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.2s, background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === total - 1}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: index === total - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(127,119,221,0.15)',
            border: index === total - 1 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(127,119,221,0.35)',
            color: index === total - 1 ? '#3C4260' : '#C4C0F5',
            cursor: index === total - 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  )
}

/**
 * 그림일기 페이지 한 장 — 캐러셀 내부에서 렌더
 * 상단에 AI 생성 이미지(Pollinations), 하단에 손글씨 본문.
 */
function DiaryPageCard({ page, index, total }: {
  page: { title: string; text: string; illustration?: string; imagePrompt?: string; imageUrl?: string }
  index: number
  total: number
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: '#FFF8EC',
        boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
      }}
    >
      {/* Image area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 10',
          background: 'linear-gradient(135deg, #EFE3CD 0%, #F7EBD5 100%)',
          borderBottom: '1px dashed #C9AE88',
          overflow: 'hidden',
        }}
      >
        {page.imageUrl && !imgError ? (
          <>
            {!imgLoaded && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8B6C45', fontSize: 12, fontFamily: "'Jua', sans-serif",
              }}>
                그림 그리는 중...
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.imageUrl}
              alt={page.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.4s',
                display: 'block',
              }}
            />
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8B6C45', fontFamily: "'Jua', sans-serif", fontSize: 14,
          }}>
            {page.title}
          </div>
        )}

        {/* Page indicator corner */}
        <span style={{
          position: 'absolute',
          top: 8, right: 10,
          fontSize: 11,
          fontFamily: "'Jua', sans-serif",
          color: '#5C3E1F',
          background: 'rgba(255,248,236,0.85)',
          padding: '2px 8px',
          borderRadius: 999,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Text block */}
      <div
        style={{
          padding: '16px 18px 18px',
          background: `repeating-linear-gradient(transparent, transparent 25px, #E8D5C4 25px, #E8D5C4 26px), #FFF8EC`,
        }}
      >
        <p style={{
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "'Jua', sans-serif",
          color: '#5C3E1F',
          marginBottom: 6,
        }}>
          {page.title}
        </p>
        <p style={{ fontSize: 14, fontFamily: "'Jua', sans-serif", color: '#2D1F0E', lineHeight: '26px', whiteSpace: 'pre-wrap' }}>
          {page.text}
        </p>
      </div>
    </div>
  )
}

/**
 * 댓글 목록 — 스크롤 영역에 들어감 (입력폼 없음)
 */
function CommentList({ entry }: { entry: DetailEntry }) {
  const { commentsByDreamId, nickname, deleteComment } = useDreamStore()
  // 시드(entry.comments) + 저장된(store.commentsByDreamId) 합치기 (시간순)
  const seed = entry.comments ?? []
  const stored = commentsByDreamId[entry.id] ?? []
  const comments = [...seed, ...stored].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // 내가 쓴 댓글은 stored 내에서만 존재 (seed 는 삭제 불가 샘플)
  const storedIds = new Set(stored.map((c) => c.id))
  const isMine = (c: typeof comments[number]) => c.authorName === nickname && storedIds.has(c.id)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80', letterSpacing: 0.5 }}>
        댓글 {comments.length > 0 ? `· ${comments.length}` : ''}
      </p>

      {comments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map((c) => {
            const mine = isMine(c)
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  borderRadius: '50%',
                  background: mine
                    ? 'linear-gradient(135deg, #7F77DD, #C44B72)'
                    : 'linear-gradient(135deg, #3C4260, #555E80)',
                  color: 'white', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {c.authorInitial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: mine ? '#C4C0F5' : '#E8E8F4' }}>{c.authorName}</span>
                    <span style={{ fontSize: 10, color: '#555E80' }}>
                      {new Date(c.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: '20px', color: '#C0C4DC' }}>{c.text}</p>
                </div>
                {mine && (
                  <button
                    onClick={() => deleteComment(entry.id, c.id)}
                    aria-label="내 댓글 삭제"
                    style={{
                      width: 22, height: 22, flexShrink: 0, alignSelf: 'flex-start',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#8890B0',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                      fontSize: 11,
                      lineHeight: 1,
                      marginTop: 2,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,75,114,0.2)'; e.currentTarget.style.color = '#E8899A' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8890B0' }}
                  >
                    <CloseIcon size={10} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#555E80' }}>아직 댓글이 없어요. 첫 공감을 남겨보세요.</p>
      )}
    </section>
  )
}

/**
 * 댓글 입력 — 모달 하단 고정 푸터
 */
function CommentInputFooter({ entry }: { entry: DetailEntry }) {
  const { addComment, nickname } = useDreamStore()
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim()) return
    const comment: DreamComment = {
      id: `c-${Date.now()}`,
      authorName: nickname,
      authorInitial: nickname.charAt(0),
      text: text.trim(),
      date: new Date().toISOString(),
    }
    addComment(entry.id, comment)
    setText('')
  }

  return (
    <div style={{
      padding: '14px 24px 18px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: '#090E22',
      display: 'flex',
      gap: 8,
      flexShrink: 0,
    }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        placeholder="따뜻한 공감 한마디를 남겨보세요"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#E8E8F4',
          fontSize: 13,
          outline: 'none',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        style={{
          padding: '0 16px',
          borderRadius: 12,
          background: text.trim() ? 'linear-gradient(135deg, #7F77DD, #C44B72)' : 'rgba(255,255,255,0.08)',
          color: 'white',
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          opacity: text.trim() ? 1 : 0.5,
        }}
      >
        등록
      </button>
    </div>
  )
}
