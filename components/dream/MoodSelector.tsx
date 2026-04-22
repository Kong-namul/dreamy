'use client'
import { Mood } from '@/types'

const MOODS: { value: Mood; label: string }[] = [
  { value: 'happy',       label: '행복한' },
  { value: 'excited',     label: '설레는' },
  { value: 'peaceful',    label: '평온한' },
  { value: 'nostalgic',   label: '그리운' },
  { value: 'fascinating', label: '신기한' },
  { value: 'weird',       label: '이상한' },
  { value: 'confused',    label: '혼란스러운' },
  { value: 'anxious',     label: '불안한' },
  { value: 'scary',       label: '무서운' },
  { value: 'sad',         label: '슬픈' },
]

interface Props {
  values: Mood[]
  onChange: (moods: Mood[]) => void
}

export default function MoodSelector({ values, onChange }: Props) {
  const toggle = (m: Mood) => {
    if (values.includes(m)) onChange(values.filter((v) => v !== m))
    else onChange([...values, m])
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {MOODS.map((m) => {
        const active = values.includes(m.value)
        return (
          <button
            key={m.value}
            onClick={() => toggle(m.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: 13,
              background: active ? 'rgba(127,119,221,0.3)' : 'rgba(255,255,255,0.06)',
              border: active ? '1px solid rgba(127,119,221,0.7)' : '1px solid rgba(255,255,255,0.1)',
              color: active ? '#C4C0F5' : '#8890B0',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
