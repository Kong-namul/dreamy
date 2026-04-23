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

// 저장된 sourceLocale 이 실제 내용과 불일치하는 경우를 방어.
// 한글 음절(U+AC00–D7A3) 이 전체 글자 중 20% 이상이면 'ko', 아니면 'en'.
// 이 값이 entry.sourceLocale 보다 우선. (예: 영어 모드에서 한국어로 적어 저장된 꿈)
function detectLocale(text: string): 'ko' | 'en' {
  if (!text) return 'ko'
  let hangul = 0
  let latin = 0
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    if (code >= 0xac00 && code <= 0xd7a3) hangul++
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) latin++
  }
  const total = hangul + latin
  if (total === 0) return 'ko'
  return hangul / total >= 0.2 ? 'ko' : 'en'
}

function extractCached(entry: EntryWithMeta, locale: 'ko' | 'en'): TranslatedDreamShape | null {
  const t = entry.translations
  if (!t || typeof t !== 'object') return null
  const v = (t as Record<string, unknown>)[locale]
  if (!v || typeof v !== 'object') return null
  // 실제 번역된 내용이 하나라도 있어야 유효 캐시로 인정.
  // (과거 버그나 sameAsSource 캐시로 인해 {} 빈 오브젝트가 남아 있으면 무시하고 새로 번역.)
  const shape = v as TranslatedDreamShape
  const hasAny =
    !!shape.dream ||
    !!shape.interpretation ||
    !!shape.weather ||
    (Array.isArray(shape.pages) && shape.pages.length > 0) ||
    (Array.isArray(shape.interpretationBlocks) && shape.interpretationBlocks.length > 0) ||
    !!shape.lucky
  return hasAny ? shape : null
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
  // sourceLocale 태그를 신뢰하되, 실제 본문이 다른 언어로 보이면 본문 기준을 우선.
  const tagged = (entry.sourceLocale ?? 'ko') as 'ko' | 'en'
  const detected = detectLocale(entry.dream ?? '')
  const source: 'ko' | 'en' = tagged === detected ? tagged : detected
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
