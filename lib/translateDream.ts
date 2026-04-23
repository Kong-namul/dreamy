/**
 * 꿈 본문을 현재 locale 에 맞게 번역된 형태로 반환하는 React 훅.
 *
 *  · locale === 'ko' → 원본 엔트리 그대로
 *  · locale === 'en'
 *      · entry.translations?.en 이미 있으면 그걸로 머지해서 반환
 *      · 아니면 /api/translate/dream 호출 + 결과를 로컬 캐시 Map 에 저장
 *
 * 여러 개 뜨는 리스트에서도 동일 dream 한 번만 요청되도록 모듈 레벨 Map 사용.
 */
import { useEffect, useState } from 'react'
import { DreamEntry } from '@/types'
import { useDreamStore } from '@/store/dreamStore'

type EnDreamShape = Partial<{
  dream: string
  interpretation: string
  weather: string
  pages: DreamEntry['pages']
  interpretationBlocks: DreamEntry['interpretationBlocks']
  lucky: DreamEntry['lucky']
}>

type EntryWithTranslations = DreamEntry & { translations?: Record<string, unknown> | null }

const inFlight = new Map<string, Promise<EnDreamShape | null>>()
const localCache = new Map<string, EnDreamShape>()   // dreamId → translation

function extractEn(entry: EntryWithTranslations): EnDreamShape | null {
  const t = entry.translations
  if (!t || typeof t !== 'object') return null
  const en = (t as Record<string, unknown>).en
  if (!en || typeof en !== 'object') return null
  return en as EnDreamShape
}

export async function fetchDreamTranslation(dreamId: string): Promise<EnDreamShape | null> {
  if (localCache.has(dreamId)) return localCache.get(dreamId)!
  if (inFlight.has(dreamId)) return inFlight.get(dreamId)!

  const p = (async () => {
    try {
      const res = await fetch('/api/translate/dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreamId, locale: 'en' }),
      })
      if (!res.ok) return null
      const body = await res.json()
      const t = body?.translation as EnDreamShape | undefined
      if (t) localCache.set(dreamId, t)
      return t ?? null
    } catch {
      return null
    } finally {
      inFlight.delete(dreamId)
    }
  })()

  inFlight.set(dreamId, p)
  return p
}

/**
 * 화면에 실제로 표시할 엔트리 반환. 로딩 상태도 함께.
 */
export function useLocalizedDream<T extends EntryWithTranslations>(entry: T): {
  entry: T
  translating: boolean
} {
  const locale = useDreamStore((s) => s.locale)
  const [translated, setTranslated] = useState<EnDreamShape | null>(() => extractEn(entry))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (locale !== 'en') {
      setTranslated(null)
      setLoading(false)
      return
    }
    const inline = extractEn(entry)
    if (inline) {
      setTranslated(inline)
      setLoading(false)
      return
    }
    const cached = localCache.get(entry.id)
    if (cached) {
      setTranslated(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    let cancelled = false
    fetchDreamTranslation(entry.id).then((t) => {
      if (cancelled) return
      setTranslated(t)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [locale, entry.id, entry.translations])

  if (locale !== 'en' || !translated) {
    return { entry, translating: loading }
  }

  // 머지 — 번역된 필드가 있으면 덮어쓰되, 없으면 원본 유지
  const merged = {
    ...entry,
    ...('dream' in translated && translated.dream ? { dream: translated.dream } : null),
    ...('interpretation' in translated && translated.interpretation ? { interpretation: translated.interpretation } : null),
    ...('weather' in translated && translated.weather ? { weather: translated.weather } : null),
    ...('pages' in translated && translated.pages ? { pages: translated.pages } : null),
    ...('interpretationBlocks' in translated && translated.interpretationBlocks ? { interpretationBlocks: translated.interpretationBlocks } : null),
    ...('lucky' in translated && translated.lucky ? { lucky: translated.lucky } : null),
  } as T

  return { entry: merged, translating: false }
}
