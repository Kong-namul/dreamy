/**
 * 꿈 본문을 현재 locale 에 맞게 번역된 형태로 반환하는 React 훅.
 *
 * 양방향 지원:
 *   · 원본 언어(entry.sourceLocale, 기본 'ko')와 현재 locale 이 같으면 원본 그대로
 *   · 다르면:
 *       · entry.translations?.[locale] 캐시 있으면 그걸로 머지
 *       · 아니면 /api/translate/dream 호출 (서버도 DB 캐시 사용)
 *
 * 모듈 레벨 캐시·inFlight Map 으로 같은 꿈에 대한 중복 요청 방지.
 */
import { useEffect, useState } from 'react'
import { DreamEntry } from '@/types'
import { useDreamStore } from '@/store/dreamStore'

type TranslatedDreamShape = Partial<{
  dream: string
  interpretation: string
  weather: string
  pages: DreamEntry['pages']
  interpretationBlocks: DreamEntry['interpretationBlocks']
  lucky: DreamEntry['lucky']
}>

type EntryWithMeta = DreamEntry & {
  translations?: Record<string, unknown> | null
  sourceLocale?: 'ko' | 'en'
}

// dreamId + locale → translation
const localCache = new Map<string, TranslatedDreamShape>()
const inFlight = new Map<string, Promise<TranslatedDreamShape | null>>()

function cacheKey(id: string, locale: string): string { return `${id}:${locale}` }

function extractCached(entry: EntryWithMeta, locale: 'ko' | 'en'): TranslatedDreamShape | null {
  const t = entry.translations
  if (!t || typeof t !== 'object') return null
  const v = (t as Record<string, unknown>)[locale]
  if (!v || typeof v !== 'object') return null
  return v as TranslatedDreamShape
}

export async function fetchDreamTranslation(
  dreamId: string,
  locale: 'ko' | 'en',
  contentFallback?: {
    dream: string
    interpretation?: string | null
    weather?: string | null
    pages?: unknown
    interpretationBlocks?: unknown
    lucky?: unknown
    sourceLocale?: 'ko' | 'en'
  },
): Promise<TranslatedDreamShape | null> {
  const key = cacheKey(dreamId, locale)
  if (localCache.has(key)) return localCache.get(key)!
  if (inFlight.has(key)) return inFlight.get(key)!

  const p = (async () => {
    try {
      const res = await fetch('/api/translate/dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreamId, locale, content: contentFallback }),
      })
      if (!res.ok) return null
      const body = await res.json()
      if (body?.sameAsSource) {
        // 원본과 동일 언어 — 번역 불필요 신호. null 캐시
        localCache.set(key, {})
        return {}
      }
      const t = body?.translation as TranslatedDreamShape | undefined
      if (t) localCache.set(key, t)
      return t ?? null
    } catch {
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, p)
  return p
}

export function useLocalizedDream<T extends EntryWithMeta>(entry: T): {
  entry: T
  translating: boolean
} {
  const locale = useDreamStore((s) => s.locale)
  const source = (entry.sourceLocale ?? 'ko') as 'ko' | 'en'
  const [translated, setTranslated] = useState<TranslatedDreamShape | null>(() =>
    locale === source ? null : extractCached(entry, locale),
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (locale === source) {
      setTranslated(null)
      setLoading(false)
      return
    }
    const inline = extractCached(entry, locale)
    if (inline) {
      setTranslated(inline)
      setLoading(false)
      return
    }
    const cached = localCache.get(cacheKey(entry.id, locale))
    if (cached) {
      setTranslated(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    let cancelled = false
    fetchDreamTranslation(entry.id, locale, {
      dream: entry.dream,
      interpretation: entry.interpretation ?? null,
      weather: entry.weather ?? null,
      pages: entry.pages ?? null,
      interpretationBlocks: entry.interpretationBlocks ?? null,
      lucky: entry.lucky ?? null,
      sourceLocale: source,
    }).then((t) => {
      if (cancelled) return
      setTranslated(t)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [locale, source, entry.id, entry.translations])

  if (locale === source || !translated) {
    return { entry, translating: loading }
  }

  // 머지 — 번역된 필드가 있으면 덮어쓰되, 없으면 원본 유지
  const merged = {
    ...entry,
    ...(translated.dream ? { dream: translated.dream } : null),
    ...(translated.interpretation ? { interpretation: translated.interpretation } : null),
    ...(translated.weather ? { weather: translated.weather } : null),
    ...(translated.pages ? { pages: translated.pages } : null),
    ...(translated.interpretationBlocks ? { interpretationBlocks: translated.interpretationBlocks } : null),
    ...(translated.lucky ? { lucky: translated.lucky } : null),
  } as T

  return { entry: merged, translating: false }
}
