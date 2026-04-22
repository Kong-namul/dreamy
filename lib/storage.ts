import { DreamEntry } from '@/types'

const DREAMS_KEY = 'dreamy_dreams'
const CREDITS_KEY = 'dreamy_credits'

export function saveDream(entry: DreamEntry): void {
  const dreams = getDreams()
  dreams.unshift(entry)
  localStorage.setItem(DREAMS_KEY, JSON.stringify(dreams))
}

export function getDreams(): DreamEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DREAMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getCredits(): number {
  if (typeof window === 'undefined') return 50
  const raw = localStorage.getItem(CREDITS_KEY)
  return raw ? parseInt(raw, 10) : 50
}

export function setCredits(amount: number): void {
  localStorage.setItem(CREDITS_KEY, String(amount))
}
