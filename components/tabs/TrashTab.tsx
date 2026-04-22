'use client'
import { useDreamStore } from '@/store/dreamStore'
import { DreamEntry } from '@/types'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, BookIcon } from '@/components/ui/Icons'
import { useState } from 'react'
import MoodPill from '@/components/ui/MoodPill'

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(17, 26, 58, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
}

export default function TrashTab() {
  const { deletedDreams, restoreDream, permanentlyDeleteDream, setActiveTab } = useDreamStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    permanentlyDeleteDream(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <button
          onClick={() => setActiveTab('settings')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'none', border: 'none', color: '#8890B0', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeftIcon size={14} /> 뒤로
        </button>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>내 일기 관리</p>
        <div style={{ width: 48 }} />
      </div>

      <p style={{ fontSize: 12, color: '#8890B0', padding: '0 4px', lineHeight: 1.6 }}>
        휴지통에는 삭제된 꿈이 보관돼요. 복구하거나 영구 삭제할 수 있어요.
      </p>

      {deletedDreams.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(127,119,221,0.1)' }}>
            <BookIcon size={28} style={{ color: '#555E80' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#8890B0' }}>휴지통이 비어있어요</p>
          <p style={{ fontSize: 12, color: '#3C4260' }}>삭제한 꿈은 여기에 보관됩니다</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deletedDreams.map((entry, i) => (
            <TrashCard
              key={entry.id}
              entry={entry}
              index={i}
              onRestore={() => restoreDream(entry.id)}
              onDeleteRequest={() => setConfirmDeleteId(entry.id)}
            />
          ))}
        </div>
      )}

      {/* 영구 삭제 확인 모달 */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 70,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div
            onClick={() => setConfirmDeleteId(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 360,
            padding: 24, borderRadius: 20,
            background: '#0D1330', border: '1px solid rgba(196,75,114,0.35)',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#E8E8F4' }}>
              정말 영구 삭제할까요?
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8890B0' }}>
              영구 삭제하면 <span style={{ color: '#E8899A', fontWeight: 600 }}>다시는 복구할 수 없어요.</span>
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
                  background: 'rgba(196,75,114,0.3)',
                  color: '#F5A8BE', border: '1px solid rgba(196,75,114,0.55)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrashCard({
  entry, index, onRestore, onDeleteRequest,
}: {
  entry: DreamEntry
  index: number
  onRestore: () => void
  onDeleteRequest: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ ...CARD_STYLE, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.85 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#555E80' }}>
            {new Date(entry.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
          {entry.moods && entry.moods.length > 0 && entry.moods.slice(0, 2).map((m) => (
            <MoodPill key={m} mood={m} size="sm" />
          ))}
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 999,
          background: entry.type === 'premium' ? 'rgba(127,119,221,0.2)' : 'rgba(196,75,114,0.18)',
          color: entry.type === 'premium' ? '#C4C0F5' : '#E8899A',
          flexShrink: 0,
        }}>
          {entry.type === 'premium' ? '그림일기' : '기본'}
        </span>
      </div>
      <p style={{
        fontSize: 13,
        lineHeight: '20px',
        color: '#8890B0',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {entry.dream}
      </p>

      <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
        <button
          onClick={onRestore}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 10,
            background: 'rgba(127,119,221,0.15)',
            color: '#C4C0F5', border: '1px solid rgba(127,119,221,0.35)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          복구
        </button>
        <button
          onClick={onDeleteRequest}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 10,
            background: 'rgba(196,75,114,0.1)',
            color: '#E8899A', border: '1px solid rgba(196,75,114,0.25)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          영구 삭제
        </button>
      </div>
    </motion.div>
  )
}
