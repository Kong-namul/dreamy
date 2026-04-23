/**
 * 현재 로케일 기준 날짜 포맷 헬퍼.
 */
import { useDreamStore } from '@/store/dreamStore'

function intlLocale(locale: 'ko' | 'en'): string {
  return locale === 'en' ? 'en-US' : 'ko-KR'
}

export function formatShortDate(date: string | number | Date, locale?: 'ko' | 'en'): string {
  const actual = locale ?? useDreamStore.getState().locale
  return new Date(date).toLocaleDateString(intlLocale(actual), { month: 'short', day: 'numeric' })
}

export function formatLongDate(date: string | number | Date, locale?: 'ko' | 'en'): string {
  const actual = locale ?? useDreamStore.getState().locale
  return new Date(date).toLocaleDateString(intlLocale(actual), { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatShortTime(date: string | number | Date, locale?: 'ko' | 'en'): string {
  const actual = locale ?? useDreamStore.getState().locale
  return new Date(date).toLocaleString(intlLocale(actual), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
