/**
 * 최소 i18n 헬퍼.
 * 현재는 UI 토글만 지원하고, 주요 UI 문자열을 점진적으로 번역해 추가한다.
 * 키는 '화면/컨텍스트 · 의미' 수준으로 단순하게 짓고, 번역이 없으면 한글
 * 원문을 그대로 반환해 기능이 깨지지 않게 한다.
 */
import { useDreamStore } from '@/store/dreamStore'

export type Locale = 'ko' | 'en'

const TRANSLATIONS: Record<string, { ko: string; en: string }> = {
  // Header dropdown
  'menu.myDiary':       { ko: '내 일기',     en: 'My Diary' },
  'menu.settings':      { ko: '설정',       en: 'Settings' },
  'menu.logout':        { ko: '로그아웃',    en: 'Log out' },
  'menu.language':      { ko: '한글 ⇄ English', en: '한글 ⇄ English' },

  // Tabs
  'tab.new':            { ko: '오늘의꿈',    en: 'New dream' },
  'tab.feed':           { ko: '드림피드',    en: 'Feed' },
  'tab.log':            { ko: '드림로그',    en: 'Stats' },

  // Credit modal
  'credit.title':       { ko: '크레딧 충전', en: 'Top up credits' },
  'credit.selectMethod': { ko: '결제 방법 선택', en: 'Select payment method' },
  'credit.history':     { ko: '충전 히스토리 보기', en: 'View top-up history' },
  'credit.comingSoon':  { ko: '준비 중',     en: 'Coming soon' },

  // My diary
  'diary.title':        { ko: '내 일기',     en: 'My Diary' },
  'diary.subtitle':     { ko: '내 꿈은 기본 비공개예요. 공개 버튼을 누르면 드림피드에 나타나요',
                          en: 'Your dreams are private by default. Tap share to post them to the feed.' },
  'diary.empty.title':  { ko: '아직 저장된 꿈이 없어요', en: 'No dreams saved yet' },
  'diary.empty.cta':    { ko: '꿈 해석하러 가기', en: 'Interpret a dream' },
  'diary.loading.basic':   { ko: '일기 해석 중',    en: 'Interpreting dream' },
  'diary.loading.premium': { ko: '그림일기 작성 중', en: 'Drawing dream diary' },
}

export function t(key: string, locale?: Locale): string {
  const actual = locale ?? useDreamStore.getState().locale
  const entry = TRANSLATIONS[key]
  if (!entry) return key
  return entry[actual] ?? entry.ko
}

export function useT() {
  const locale = useDreamStore((s) => s.locale)
  return (key: string) => t(key, locale)
}
