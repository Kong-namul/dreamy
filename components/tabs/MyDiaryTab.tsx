'use client'
import { useState } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { DreamEntry } from '@/types'
import { motion } from 'framer-motion'
import { BookIcon } from '@/components/ui/Icons'
import DreamDetailModal, { DetailEntry } from '@/components/dream/DreamDetailModal'
import MoodPill from '@/components/ui/MoodPill'
import { AUSPICE_THEME, AUSPICE_LABEL, inferAuspiceFromMoods } from '@/lib/auspice'

const CLAMP2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

function DreamCard({ entry, index, onClick, onToggleShared, onDelete }: {
  entry: DreamEntry
  index: number
  onClick: () => void
  onToggleShared: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const auspice = entry.auspice ?? inferAuspiceFromMoods(entry.moods ?? [])
  const theme = AUSPICE_THEME[auspice]
  const auspiceLabel = AUSPICE_LABEL[auspice]

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
          {new Date(entry.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
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
              그림일기
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
          삭제
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
          {entry.shared ? '공개됨 · 피드 노출' : '비공개 · 나만 보기'}
        </button>
      </div>
    </motion.div>
  )
}

export default function MyDiaryTab() {
  const { dreams, nickname, setShared, softDeleteDream } = useDreamStore()
  const [selected, setSelected] = useState<DetailEntry | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleToggleShared = (id: string, current: boolean) => {
    if (!current) {
      const ok = window.confirm('이 꿈을 드림피드에 공개할까요?\n다른 사람이 볼 수 있게 돼요.')
      if (!ok) return
    }
    setShared(id, !current)
  }

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    softDeleteDream(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  if (dreams.length === 0) {
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
        <p style={{ fontSize: 14, fontWeight: 500, color: '#8890B0' }}>아직 저장된 꿈이 없어요</p>
        <p style={{ fontSize: 12, color: '#3C4260' }}>꿈을 해석하면 자동으로 여기에 저장돼요</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 48 }}>
      <div style={{ padding: '0 4px', marginBottom: 4 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>내 일기</p>
        <p style={{ fontSize: 13, color: '#8890B0', marginTop: 4 }}>
          내 꿈은 기본 비공개예요. 공개 버튼을 누르면 드림피드에 나타나요
        </p>
      </div>
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
