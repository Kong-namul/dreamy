'use client'
import { useState } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { DreamEntry } from '@/types'
import { motion } from 'framer-motion'
import { BookIcon } from '@/components/ui/Icons'
import DreamDetailModal, { DetailEntry } from '@/components/dream/DreamDetailModal'
import MoodPill from '@/components/ui/MoodPill'
import { AUSPICE_THEME, inferAuspiceFromMoods } from '@/lib/auspice'
import { useLocalizedDream } from '@/lib/translateDream'
import { useT } from '@/lib/i18n'
import { formatShortDate } from '@/lib/formatDate'

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      style={{
        width,
        height: 10,
        borderRadius: 999,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(127,119,221,0.12), rgba(255,255,255,0.05))',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
      }}
    />
  )
}

const CLAMP2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

function DreamCard({ entry: rawEntry, index, onClick, onToggleShared, onDelete }: {
  entry: DreamEntry
  index: number
  onClick: () => void
  onToggleShared: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const { entry, translating } = useLocalizedDream(rawEntry)
  const t = useT()
  const auspice = entry.auspice ?? inferAuspiceFromMoods(entry.moods ?? [])
  const theme = AUSPICE_THEME[auspice]
  const auspiceLabel = t(`auspice.${auspice}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2 } as never}
      onClick={onClick}
      style={{
        background: theme.cardBg,
        border: theme.cardBorder,
        borderRadius: 20,
        padding: 18,
        boxShadow: theme.glow,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'transform 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#8890B0' }}>
          {formatShortDate(entry.date)}
        </span>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              background: theme.badgeBg,
              color: theme.badgeFg,
              letterSpacing: 0.5,
            }}
          >
            {auspiceLabel}
          </span>
          {entry.type === 'premium' && (
            <span style={{
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              background: 'rgba(127,119,221,0.22)',
              border: '1px solid rgba(127,119,221,0.4)',
              color: '#C4C0F5',
            }}>
              {t('badge.premium')}
            </span>
          )}
          {translating && (
            <span style={{
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 600,
              background: 'rgba(127,119,221,0.12)',
              color: '#8890B0',
              letterSpacing: 0.3,
            }}>
              {t('action.translating')}
            </span>
          )}
        </div>
      </div>

      {entry.moods && entry.moods.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {entry.moods.map((m) => <MoodPill key={m} mood={m} size="sm" />)}
        </div>
      )}

      <p style={{ fontSize: 14, lineHeight: '22px', color: '#C0C4DC', ...CLAMP2 }}>
        {entry.dream}
      </p>
      {entry.interpretation && (
        <p style={{ fontSize: 12, lineHeight: '20px', color: '#6B739A', ...CLAMP2 }}>
          {entry.interpretation}
        </p>
      )}

      {/* Actions */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 2 }}
      >
        <button
          onClick={onDelete}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(196,75,114,0.1)',
            border: '1px solid rgba(196,75,114,0.25)',
            color: '#E8899A',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,75,114,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(196,75,114,0.1)')}
        >
          {t('action.delete')}
        </button>
        <button
          onClick={onToggleShared}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: entry.shared ? 'rgba(127,119,221,0.18)' : 'rgba(255,255,255,0.04)',
            border: entry.shared ? '1px solid rgba(127,119,221,0.45)' : '1px solid rgba(255,255,255,0.1)',
            color: entry.shared ? '#C4C0F5' : '#8890B0',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {entry.shared ? t('action.share') : t('action.private')}
        </button>
      </div>
    </motion.div>
  )
}

export default function MyDiaryTab() {
  const { dreams, nickname, setShared, softDeleteDream, setActiveTab, interpretJob } = useDreamStore()
  const [selected, setSelected] = useState<DetailEntry | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const t = useT()

  const handleToggleShared = (id: string, current: boolean) => {
    if (!current) {
      const ok = window.confirm(t('dialog.shareConfirm'))
      if (!ok) return
    }
    setShared(id, !current)   // 로컬 즉시 반영
    // 서버 동기화 — 실패해도 UI 는 이미 바뀜. 롤백은 추후 재시도로 처리.
    fetch(`/api/dreams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shared: !current }),
    }).catch(() => {})
  }

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    softDeleteDream(id)       // 로컬 휴지통으로 이동
    setConfirmDeleteId(null)
    // 서버 soft delete
    fetch(`/api/dreams/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  // 꿈 해석이 진행 중일 때 목록 최상단에 보여줄 스켈레톤 카드.
  const pendingSkeleton = interpretJob ? (
    <motion.div
      key="pending-skeleton"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        background: 'rgba(127,119,221,0.08)',
        border: '1px solid rgba(127,119,221,0.35)',
        borderRadius: 20,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* shimmer bar */}
      <motion.div
        aria-hidden
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, width: '40%',
          background: 'linear-gradient(90deg, transparent, rgba(196,192,245,0.12), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#8890B0' }}>{t('relative.justNow')}</span>
        <span style={{
          padding: '3px 10px',
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          background: 'rgba(127,119,221,0.25)',
          color: '#C4C0F5',
          letterSpacing: 0.5,
        }}>
          {interpretJob.type === 'premium' ? t('diary.loading.premium') : t('diary.loading.basic')}
        </span>
      </div>

      {/* skeleton text lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="100%" />
        <SkeletonLine width="86%" />
        <SkeletonLine width="62%" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4C0F5' }}
        />
        <p style={{ fontSize: 12, color: '#C4C0F5', fontWeight: 600 }}>{interpretJob.msgKey ? t(interpretJob.msgKey) : interpretJob.msg}</p>
      </div>
    </motion.div>
  ) : null

  if (dreams.length === 0 && !interpretJob) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 0', gap: 12 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(127,119,221,0.1)',
          }}
        >
          <BookIcon size={28} style={{ color: '#555E80' }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#C0C4DC' }}>{t('diary.empty.title')}</p>
        <p style={{ fontSize: 13, color: '#6B739A', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
          {t('diary.empty.hint')}
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          style={{
            marginTop: 12,
            padding: '12px 22px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(127,119,221,0.35)',
            transition: 'filter 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          {t('diary.empty.cta')}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 48 }}>
      <div style={{ padding: '0 4px', marginBottom: 4 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>{t('diary.title')}</p>
        <p style={{ fontSize: 13, color: '#8890B0', marginTop: 4 }}>
          {t('diary.subtitle')}
        </p>
      </div>
      {pendingSkeleton}
      {dreams.map((entry, i) => (
        <DreamCard
          key={entry.id}
          entry={entry}
          index={i}
          onClick={() => setSelected({ ...entry, isMine: true, authorName: nickname, authorInitial: nickname.charAt(0) } as DetailEntry)}
          onToggleShared={(e) => { e.stopPropagation(); handleToggleShared(entry.id, entry.shared) }}
          onDelete={(e) => { e.stopPropagation(); setConfirmDeleteId(entry.id) }}
        />
      ))}
      <DreamDetailModal entry={selected} onClose={() => setSelected(null)} />

      {/* 삭제 확인 모달 */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 70,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          {/* 투명 클릭 영역 — 바깥 클릭 시 닫힘, 뒤 화면 딤 없음 */}
          <div
            onClick={() => setConfirmDeleteId(null)}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 360,
            padding: 24, borderRadius: 20,
            background: '#0D1330', border: '1px solid rgba(127,119,221,0.45)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(127,119,221,0.15)',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#E8E8F4' }}>
              정말 지우시겠어요?
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8890B0' }}>
              삭제한 꿈은 <span style={{ color: '#C4C0F5', fontWeight: 600 }}>설정 → 내 일기 관리</span> 에 보관돼요.
              언제든 다시 복구할 수 있어요.
            </p>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#8890B0', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: 'rgba(196,75,114,0.25)',
                  color: '#E8899A', border: '1px solid rgba(196,75,114,0.45)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
