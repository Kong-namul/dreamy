/**
 * 닉네임 → 아바타 이미지/아이콘 매핑 + 커스텀 URL 저장.
 * DiaryTab 피드 + GNB Header + SettingsTab 공용.
 */

export type AvatarAsset =
  | { type: 'image'; url: string }
  | { type: 'icon' }

// 센티넬 — 사용자가 "기본 아이콘" 을 명시적으로 고름 (닉네임 fallback 무시)
export const AVATAR_ICON_SENTINEL = 'icon:default'

// 프리셋 아바타 — 설정에서 고를 수 있는 옵션 + 자동 닉네임 매핑용
export const AVATAR_PRESETS: { id: string; label: string; url: string }[] = [
  { id: 'cloud',  label: '구름',     url: 'https://images.unsplash.com/photo-1505533321630-975218a5f66f?w=160&h=160&fit=crop' },
  { id: 'star',   label: '별',       url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&h=160&fit=crop' },
  { id: 'bird',   label: '새',       url: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=160&h=160&fit=crop' },
  { id: 'latte',  label: '라떼',     url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=160&h=160&fit=crop' },
  { id: 'flower', label: '꽃',       url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=160&h=160&fit=crop' },
  { id: 'book',   label: '책',       url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=160&h=160&fit=crop' },
  { id: 'ocean',  label: '바다',     url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=160&h=160&fit=crop' },
  { id: 'forest', label: '숲',       url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=160&h=160&fit=crop' },
]

// 닉네임 기반 자동 매핑 (customUrl 없을 때)
function pickByNickname(authorName?: string | null): AvatarAsset {
  if (!authorName) return { type: 'icon' }
  if (authorName.includes('구름')) return { type: 'image', url: AVATAR_PRESETS[0].url }
  if (authorName.includes('별'))   return { type: 'image', url: AVATAR_PRESETS[1].url }
  if (authorName.includes('꿈꾸는')) return { type: 'image', url: AVATAR_PRESETS[2].url }
  if (authorName.includes('카페') || authorName.includes('라떼')) return { type: 'image', url: AVATAR_PRESETS[3].url }
  return { type: 'icon' }
}

export function getAvatarAsset(
  authorName?: string | null,
  customUrl?: string | null,
): AvatarAsset {
  if (customUrl === AVATAR_ICON_SENTINEL) return { type: 'icon' }  // 사용자가 기본 아이콘 선택
  if (customUrl) return { type: 'image', url: customUrl }
  return pickByNickname(authorName)
}

// 중복 불가 — 공개 샘플 유저들의 닉네임
export const RESERVED_NICKNAMES = new Set<string>([
  '달빛여우',
  '별헤는밤',
  '구름산책',
  '밤하늘도서관',
  '소나기소녀',
  '해몽러버',
  '카페라떼',
  '새벽산책',
  '공감백배',
])

export function isNicknameAvailable(nickname: string, currentNickname: string): boolean {
  const trimmed = nickname.trim()
  if (!trimmed) return false
  if (trimmed === currentNickname) return true  // 본인 닉 유지는 OK
  return !RESERVED_NICKNAMES.has(trimmed)
}
