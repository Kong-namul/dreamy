import { Mood } from '@/types'

export const MOOD_LABEL: Record<Exclude<Mood, null>, string> = {
  happy: '행복한',
  excited: '설레는',
  peaceful: '평온한',
  nostalgic: '그리운',
  fascinating: '신기한',
  weird: '이상한',
  confused: '혼란스러운',
  anxious: '불안한',
  scary: '무서운',
  sad: '슬픈',
}

/**
 * 무드별 색상 — MoodSelector 활성 상태 톤을 기본으로,
 * 카테고리에 따라 살짝 색상을 다르게 적용.
 */
export const MOOD_COLOR: Record<Exclude<Mood, null>, { bg: string; border: string; fg: string }> = {
  happy:       { bg: 'rgba(255,193,110,0.18)', border: 'rgba(255,193,110,0.45)', fg: '#F5C97A' },
  excited:     { bg: 'rgba(255,145,180,0.18)', border: 'rgba(255,145,180,0.45)', fg: '#FFA6C4' },
  peaceful:    { bg: 'rgba(127,221,180,0.16)', border: 'rgba(127,221,180,0.42)', fg: '#9BE5C0' },
  nostalgic:   { bg: 'rgba(220,160,120,0.18)', border: 'rgba(220,160,120,0.45)', fg: '#E6B897' },
  fascinating: { bg: 'rgba(127,119,221,0.22)', border: 'rgba(127,119,221,0.55)', fg: '#C4C0F5' },
  weird:       { bg: 'rgba(180,150,230,0.18)', border: 'rgba(180,150,230,0.45)', fg: '#C8B8EF' },
  confused:    { bg: 'rgba(140,160,200,0.18)', border: 'rgba(140,160,200,0.45)', fg: '#B0BDD9' },
  anxious:     { bg: 'rgba(196,75,114,0.18)',  border: 'rgba(196,75,114,0.45)',  fg: '#E8899A' },
  scary:       { bg: 'rgba(90,90,140,0.28)',   border: 'rgba(90,90,140,0.55)',   fg: '#B8B8DC' },
  sad:         { bg: 'rgba(110,140,190,0.18)', border: 'rgba(110,140,190,0.45)', fg: '#9DB4D6' },
}
