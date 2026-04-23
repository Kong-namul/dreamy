'use client'
import { Mood } from '@/types'
import { MOOD_LABEL, MOOD_COLOR } from '@/lib/moods'
import { useT } from '@/lib/i18n'

interface Props {
  mood: Mood
  size?: 'sm' | 'md'
}

export default function MoodPill({ mood, size = 'sm' }: Props) {
  const t = useT()
  if (!mood) return null
  const label = t(`mood.${mood}`) || MOOD_LABEL[mood]
  const color = MOOD_COLOR[mood]
  const padding = size === 'sm' ? '2px 10px' : '4px 12px'
  const fontSize = size === 'sm' ? 11 : 12

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        borderRadius: 9999,
        fontSize,
        fontWeight: 600,
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.fg,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        minWidth: size === 'sm' ? 56 : 64,   // 영·한 너비 차이를 줄이기 위한 최소 폭
      }}
    >
      {label}
    </span>
  )
}
