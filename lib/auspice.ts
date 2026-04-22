import { Auspice, Mood } from '@/types'

/**
 * 사용자가 선택한 무드를 기반으로 기본 길몽/흉몽을 추정.
 * 실제 서비스에선 AI 해석 응답의 auspice 필드를 우선 사용.
 */
const POSITIVE: Mood[] = ['happy', 'excited', 'peaceful', 'fascinating']
const NEGATIVE: Mood[] = ['scary', 'anxious', 'sad', 'confused']

export function inferAuspiceFromMoods(moods: Mood[]): Auspice {
  if (!moods || moods.length === 0) return 'neutral'
  const pos = moods.filter((m) => POSITIVE.includes(m)).length
  const neg = moods.filter((m) => NEGATIVE.includes(m)).length
  if (pos > neg) return 'auspicious'
  if (neg > pos) return 'ominous'
  return 'neutral'
}

// 하위 호환용 단일 버전
export function inferAuspiceFromMood(mood: Mood | null | Mood[]): Auspice {
  if (Array.isArray(mood)) return inferAuspiceFromMoods(mood)
  if (!mood) return 'neutral'
  return inferAuspiceFromMoods([mood])
}

export const AUSPICE_LABEL: Record<Auspice, string> = {
  auspicious: '길몽',
  ominous: '흉몽',
  neutral: '중립몽',
}

/**
 * 카드 전체 디자인 테마 — 길몽은 따뜻하고 좋은 기운, 흉몽은 어둡고 무거운 기운, 중립은 차분한 톤.
 */
export const AUSPICE_THEME: Record<Auspice, {
  cardBg: string
  cardBorder: string
  accent: string
  accentFg: string
  badgeBg: string
  badgeFg: string
  glow: string
}> = {
  auspicious: {
    cardBg: 'linear-gradient(145deg, rgba(255,193,120,0.12) 0%, rgba(255,165,150,0.08) 50%, rgba(127,119,221,0.06) 100%)',
    cardBorder: '1px solid rgba(255,193,120,0.28)',
    accent: 'rgba(255,193,120,0.22)',
    accentFg: '#F5C97A',
    badgeBg: 'linear-gradient(135deg, #F5C97A, #FFA685)',
    badgeFg: '#3A2410',
    glow: '0 8px 32px rgba(255,180,100,0.12)',
  },
  ominous: {
    cardBg: 'linear-gradient(145deg, rgba(40,20,35,0.55) 0%, rgba(60,25,50,0.45) 50%, rgba(30,15,45,0.55) 100%)',
    cardBorder: '1px solid rgba(150,70,110,0.32)',
    accent: 'rgba(196,75,114,0.2)',
    accentFg: '#E8899A',
    badgeBg: 'linear-gradient(135deg, #3A1A2E, #5C1F3A)',
    badgeFg: '#F5A8BE',
    glow: '0 8px 32px rgba(60,15,35,0.5)',
  },
  neutral: {
    cardBg: 'rgba(17, 26, 58, 0.7)',
    cardBorder: '1px solid rgba(255, 255, 255, 0.08)',
    accent: 'rgba(127,119,221,0.18)',
    accentFg: '#C4C0F5',
    badgeBg: 'rgba(127,119,221,0.25)',
    badgeFg: '#C4C0F5',
    glow: '0 4px 16px rgba(0,0,0,0.3)',
  },
}
