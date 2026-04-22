import { Mood } from '@/types'
import { MOOD_LABEL, MOOD_COLOR } from '@/lib/moods'

interface Props {
  mood: Mood
  size?: 'sm' | 'md'
}

export default function MoodPill({ mood, size = 'sm' }: Props) {
  if (!mood) return null
  const label = MOOD_LABEL[mood]
  const color = MOOD_COLOR[mood]
  const padding = size === 'sm' ? '2px 10px' : '4px 12px'
  const fontSize = size === 'sm' ? 11 : 12

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: 9999,
        fontSize,
        fontWeight: 600,
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.fg,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
