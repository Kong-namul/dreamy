'use client'
import { Mood } from '@/types'
import { useT } from '@/lib/i18n'

const MOOD_ORDER: Mood[] = ['happy', 'excited', 'peaceful', 'nostalgic', 'fascinating', 'weird', 'confused', 'anxious', 'scary', 'sad']

interface Props {
  values: Mood[]
  onChange: (moods: Mood[]) => void
}

export default function MoodSelector({ values, onChange }: Props) {
  const t = useT()
  const toggle = (m: Mood) => {
    if (values.includes(m)) onChange(values.filter((v) => v !== m))
    else onChange([...values, m])
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {MOOD_ORDER.map((m) => {
        if (!m) return null
        const active = values.includes(m)
        const label = t(`mood.${m}`)
        return (
          <button
            key={m}
            onClick={() => toggle(m)}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: 13,
              background: active ? 'rgba(127,119,221,0.3)' : 'rgba(255,255,255,0.06)',
              border: active ? '1px solid rgba(127,119,221,0.7)' : '1px solid rgba(255,255,255,0.1)',
              color: active ? '#C4C0F5' : '#8890B0',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 72,   // 한글/영문 너비 차이 완화
              textAlign: 'center',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
