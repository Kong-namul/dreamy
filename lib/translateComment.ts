/**
 * 댓글을 현재 locale 에 맞게 번역된 텍스트로 반환하는 React 훅.
 * 원본 언어(source)와 현재 locale 이 같으면 원본 그대로.
 */
import { useEffect, useState } from 'react'
import { useDreamStore } from '@/store/dreamStore'

const localCache = new Map<string, string>()
const inFlight = new Map<string, Promise<string | null>>()

function cacheKey(id: string, locale: string): string { return `${id}:${locale}` }

export async function fetchCommentTranslation(commentId: string, locale: 'ko' | 'en'): Promise<string | null> {
  const key = cacheKey(commentId, locale)
  if (localCache.has(key)) return localCache.get(key)!
  if (inFlight.has(key)) return inFlight.get(key)!

  const p = (async () => {
    try {
      const res = await fetch('/api/translate/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, locale }),
      })
      if (!res.ok) return null
      const body = await res.json()
      if (body?.sameAsSource) {
        localCache.set(key, '')   // 빈 문자열 = 원본 사용 신호
        return ''
      }
      const t = body?.translation as string | undefined
      if (typeof t === 'string') localCache.set(key, t)
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

interface CommentLike {
  id: string
  text: string
  sourceLocale?: 'ko' | 'en'
  translations?: Record<string, string> | null
}

export function useLocalizedComment(comment: CommentLike): { text: string; translating: boolean } {
  const locale = useDreamStore((s) => s.locale)
  const source = (comment.sourceLocale ?? 'ko') as 'ko' | 'en'
  const [text, setText] = useState<string>(() => {
    if (locale === source) return comment.text
    const cached = comment.translations?.[locale]
    if (cached) return cached
    const local = localCache.get(cacheKey(comment.id, locale))
    if (local) return local
    return comment.text
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (locale === source) {
      setText(comment.text)
      setLoading(false)
      return
    }
    const inline = comment.translations?.[locale]
    if (inline) { setText(inline); setLoading(false); return }
    const cached = localCache.get(cacheKey(comment.id, locale))
    if (cached) { setText(cached); setLoading(false); return }

    setLoading(true)
    let cancelled = false
    fetchCommentTranslation(comment.id, locale).then((t) => {
      if (cancelled) return
      if (t && t.length > 0) setText(t)
      else setText(comment.text) // 번역 실패 시 원본 유지
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [locale, source, comment.id, comment.text, comment.translations])

  return { text, translating: loading }
}
