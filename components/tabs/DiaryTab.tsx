'use client'
import { useState, useEffect, useRef } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { DreamEntry } from '@/types'
import { motion } from 'framer-motion'
import { GlobeIcon, PersonIcon } from '@/components/ui/Icons'
import { getAvatarAsset } from '@/lib/avatar'
import { PUBLIC_DREAMS, PublicDream } from '@/lib/sampleDreams'
import DreamDetailModal, { DetailEntry } from '@/components/dream/DreamDetailModal'
import { AUSPICE_THEME, AUSPICE_LABEL, inferAuspiceFromMoods } from '@/lib/auspice'
import MoodPill from '@/components/ui/MoodPill'

type FeedItem = (DreamEntry | PublicDream) & { isMine?: boolean; authorName?: string; authorInitial?: string }

const CLAMP2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const PAGE_SIZE = 4

function Avatar({ authorName, mine, customUrl }: { authorName: string; mine?: boolean; customUrl?: string | null }) {
  // 내 글이면 store.avatarUrl 우선, 아니면 닉네임 매핑
  const asset = getAvatarAsset(authorName, mine ? customUrl : null)
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: mine
            ? 'linear-gradient(135deg, #7F77DD, #C44B72)'
            : 'linear-gradient(135deg, #3C4260, #555E80)',
          color: 'rgba(255,255,255,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {asset.type === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={authorName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <PersonIcon size={20} />
        )}
      </div>
      {/* 드림피드 전용 "나" 배지 */}
      {mine && (
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
            color: 'white',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0A1128',
            lineHeight: 1,
          }}
        >
          나
        </span>
      )}
    </div>
  )
}

function FeedCard({ entry, index, onClick, myAvatarUrl }: { entry: FeedItem; index: number; onClick: () => void; myAvatarUrl?: string | null }) {
  const auspice = entry.auspice ?? inferAuspiceFromMoods(entry.moods ?? [])
  const theme = AUSPICE_THEME[auspice]
  const auspiceLabel = AUSPICE_LABEL[auspice]
  const authorLabel = entry.authorName ?? '익명'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
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
        transition: 'transform 0.15s, border-color 0.15s',
      }}
    >
      {/* Top row: author + auspice badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Avatar authorName={authorLabel} mine={entry.isMine} customUrl={myAvatarUrl} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: entry.isMine ? '#C4C0F5' : '#E8E8F4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authorLabel}
            </span>
            <span style={{ fontSize: 11, color: '#555E80' }}>
              {new Date(entry.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Flags — 길몽/흉몽 + 그림일기 */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: theme.badgeBg,
              color: theme.badgeFg,
              letterSpacing: 0.5,
              textShadow: auspice === 'ominous' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {auspiceLabel}
          </span>
          {entry.type === 'premium' && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(127,119,221,0.22)',
                border: '1px solid rgba(127,119,221,0.4)',
                color: '#C4C0F5',
              }}
            >
              그림일기
            </span>
          )}
        </div>
      </div>

      {/* Mood pills (multi-select user tags) */}
      {entry.moods && entry.moods.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {entry.moods.map((m) => <MoodPill key={m} mood={m} size="sm" />)}
        </div>
      )}

      {/* Dream text (2 line clamp) */}
      <p style={{ fontSize: 14, lineHeight: '22px', color: '#C0C4DC', ...CLAMP2 }}>
        {entry.dream}
      </p>

      {/* Interpretation preview */}
      {entry.interpretation && (
        <p style={{ fontSize: 12, lineHeight: '20px', color: '#6B739A', ...CLAMP2 }}>
          {entry.interpretation}
        </p>
      )}

      {/* Comments count */}
      {entry.comments && entry.comments.length > 0 && (
        <p style={{ fontSize: 11, color: '#555E80' }}>
          댓글 {entry.comments.length}개
        </p>
      )}
    </motion.div>
  )
}

export default function DiaryTab() {
  const { dreams, nickname, avatarUrl } = useDreamStore()
  const [selected, setSelected] = useState<DetailEntry | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const mySharedDreams: FeedItem[] = dreams
    .filter((d) => d.shared)
    .map((d) => ({
      ...d,
      isMine: true,
      authorName: nickname,
      authorInitial: nickname.charAt(0),
    }))

  const publicDreams: FeedItem[] = PUBLIC_DREAMS.map((d) => ({ ...d, isMine: false }))

  const feed = [...mySharedDreams, ...publicDreams].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const visibleFeed = feed.slice(0, pageCount * PAGE_SIZE)
  const hasMore = visibleFeed.length < feed.length

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPageCount((c) => c + 1)
        }
      },
      { rootMargin: '100px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, visibleFeed.length])

  if (feed.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 0', gap: 12 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(127,119,221,0.1)',
          }}
        >
          <GlobeIcon size={28} style={{ color: '#555E80' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#8890B0' }}>공유된 꿈이 아직 없어요</p>
        <p style={{ fontSize: 12, color: '#3C4260' }}>내 꿈을 공개하면 이곳에 나타나요</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 48 }}>
      <div style={{ padding: '0 4px', marginBottom: 4 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>드림피드</p>
        <p style={{ fontSize: 13, color: '#8890B0', marginTop: 4 }}>
          다른 사람들이 공유한 꿈과 내가 공개한 꿈이 모이는 곳이에요
        </p>
      </div>

      {visibleFeed.map((entry, i) => (
        <FeedCard
          key={entry.id}
          entry={entry}
          index={i}
          onClick={() => setSelected(entry)}
          myAvatarUrl={avatarUrl}
        />
      ))}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} style={{ padding: '20px 0', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#7F77DD',
                  animation: `twinkle 1.1s ease-in-out infinite`,
                  animationDelay: `${i * 0.25}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!hasMore && feed.length > PAGE_SIZE && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#C4C0F5', padding: '16px 0 32px' }}>
          모든 꿈을 다 보셨어요
        </p>
      )}

      <DreamDetailModal entry={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
