'use client'
import { useSession, signOut } from 'next-auth/react'
import { useDreamStore } from '@/store/dreamStore'
import { motion } from 'framer-motion'
import { DiamondIcon, ChevronRightIcon, PersonIcon, CloseIcon } from '@/components/ui/Icons'
import { useState } from 'react'
import { getAvatarAsset, AVATAR_PRESETS, isNicknameAvailable, AVATAR_ICON_SENTINEL } from '@/lib/avatar'

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(17, 26, 58, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
}

function UserAvatar({
  nickname, customUrl, size = 64,
}: { nickname: string; customUrl: string | null; size?: number }) {
  const asset = getAvatarAsset(nickname, customUrl)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
        color: 'white',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {asset.type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt={nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <PersonIcon size={Math.round(size * 0.55)} />
      )}
    </div>
  )
}

export default function SettingsTab() {
  const { data: session } = useSession()
  const { credits, dreams, nickname, avatarUrl, setNickname, setAvatarUrl, setActiveTab } = useDreamStore()
  const [editing, setEditing] = useState(false)

  const user = session?.user
  const publicDreams = dreams.filter((d) => d.shared).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Header — 설정 메인은 뒤로 버튼 없이 좌측 정렬 타이틀만 */}
      <div style={{ padding: '0 4px' }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>설정</p>
      </div>

      {/* Profile card — 아바타·닉네임 수정 진입점 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...CARD_STYLE, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <UserAvatar nickname={nickname} customUrl={avatarUrl} size={64} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#E8E8F4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {nickname}
            </p>
            <button
              onClick={() => setEditing(true)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#C4C0F5',
                background: 'rgba(127,119,221,0.15)',
                border: '1px solid rgba(127,119,221,0.35)',
                borderRadius: 999,
                padding: '3px 10px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              수정
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#8890B0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'dreamer@dreamy.app'}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ ...CARD_STYLE, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 11, color: '#8890B0' }}>기록한 꿈</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>{dreams.length}</p>
        </div>
        <div style={{ ...CARD_STYLE, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 11, color: '#8890B0' }}>공개한 꿈</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#C4C0F5' }}>{publicDreams}</p>
        </div>
        <div style={{ ...CARD_STYLE, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 11, color: '#8890B0' }}>보유 크레딧</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#C4C0F5' }}>{credits}</span>
            <DiamondIcon size={12} style={{ color: '#9D96F0' }} />
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ ...CARD_STYLE, padding: 4, overflow: 'hidden' }}>
        <MenuButton label="충전 히스토리" onClick={() => setActiveTab('history')} />
        <Divider />
        <MenuButton label="내 일기 관리" onClick={() => setActiveTab('trash')} />
        <Divider />
        <MenuButton label="약관 및 정책" onClick={() => alert('준비 중이에요')} />
      </div>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 600,
          background: 'rgba(196,75,114,0.12)',
          color: '#E8899A',
          border: '1px solid rgba(196,75,114,0.3)',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,75,114,0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(196,75,114,0.12)')}
      >
        로그아웃
      </button>

      {/* 통합 프로필 편집 모달 */}
      {editing && (
        <ProfileEditorModal
          currentNickname={nickname}
          currentAvatar={avatarUrl}
          onClose={() => setEditing(false)}
          onSave={(newNick, newAvatar) => {
            if (newNick !== nickname) setNickname(newNick)
            if (newAvatar !== avatarUrl) setAvatarUrl(newAvatar)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * 닉네임 + 아바타 통합 편집 모달
 */
function ProfileEditorModal({
  currentNickname, currentAvatar, onClose, onSave,
}: {
  currentNickname: string
  currentAvatar: string | null
  onClose: () => void
  onSave: (nickname: string, avatar: string | null) => void
}) {
  const [nick, setNick] = useState(currentNickname)
  const [nickError, setNickError] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(currentAvatar)
  const [customInput, setCustomInput] = useState('')

  const handleSave = () => {
    const trimmed = nick.trim()
    if (!trimmed) {
      setNickError('닉네임을 입력해주세요')
      return
    }
    if (trimmed.length > 12) {
      setNickError('12자 이내로 입력해주세요')
      return
    }
    if (!isNicknameAvailable(trimmed, currentNickname)) {
      setNickError('이미 사용 중인 닉네임이에요')
      return
    }
    onSave(trimmed, picked)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      />
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto',
          padding: 24, borderRadius: 24,
          background: '#0D1330', border: '1px solid rgba(127,119,221,0.28)',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#E8E8F4' }}>프로필 수정</p>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8890B0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseIcon size={13} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserAvatar nickname={nick || currentNickname} customUrl={picked} size={56} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F4' }}>{nick || currentNickname}</p>
            <p style={{ fontSize: 11, color: '#8890B0' }}>미리보기</p>
          </div>
        </div>

        {/* Nickname input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80' }}>닉네임</p>
          <input
            value={nick}
            onChange={(e) => { setNick(e.target.value); setNickError(null) }}
            maxLength={12}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: nickError ? '1px solid rgba(232,137,154,0.6)' : '1px solid rgba(127,119,221,0.3)',
              color: '#E8E8F4',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {nickError
            ? <p style={{ fontSize: 11, color: '#E8899A' }}>{nickError}</p>
            : <p style={{ fontSize: 11, color: '#555E80' }}>12자 이내. 바꾸면 내가 남긴 댓글도 함께 업데이트돼요.</p>
          }
        </div>

        {/* Avatar presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80' }}>아바타</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {/* 기본 아이콘 */}
            <button
              onClick={() => setPicked(AVATAR_ICON_SENTINEL)}
              style={{
                aspectRatio: '1',
                borderRadius: 12,
                border: picked === AVATAR_ICON_SENTINEL ? '2px solid #C4C0F5' : '2px solid transparent',
                background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
              }}
              aria-label="기본 아이콘"
            >
              <PersonIcon size={24} />
            </button>
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPicked(p.url)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 12,
                  border: picked === p.url ? '2px solid #C4C0F5' : '2px solid transparent',
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)',
                }}
                aria-label={p.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        </div>

        {/* URL 직접 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80' }}>또는 이미지 URL 직접 입력</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="https://..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(127,119,221,0.3)',
                color: '#E8E8F4', fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={() => { if (customInput.trim()) setPicked(customInput.trim()) }}
              disabled={!customInput.trim()}
              style={{
                padding: '0 14px',
                borderRadius: 10,
                background: customInput.trim() ? 'rgba(127,119,221,0.25)' : 'rgba(255,255,255,0.05)',
                color: customInput.trim() ? '#C4C0F5' : '#555E80',
                border: '1px solid rgba(127,119,221,0.35)',
                fontSize: 13, fontWeight: 600,
                cursor: customInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              적용
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            onClick={onClose}
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
            onClick={handleSave}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
              color: 'white', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        color: '#E8E8F4',
        fontSize: 14,
        cursor: 'pointer',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <span>{label}</span>
      <ChevronRightIcon size={14} style={{ color: '#555E80' }} />
    </button>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />
}
