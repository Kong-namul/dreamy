/**
 * 최소 i18n 헬퍼.
 * 현재는 UI 토글만 지원하고, 주요 UI 문자열을 점진적으로 번역해 추가한다.
 * 키는 '화면/컨텍스트 · 의미' 수준으로 단순하게 짓고, 번역이 없으면 한글
 * 원문을 그대로 반환해 기능이 깨지지 않게 한다.
 */
import { useDreamStore } from '@/store/dreamStore'

export type Locale = 'ko' | 'en'

const TRANSLATIONS: Record<string, { ko: string; en: string }> = {
  // Header
  'menu.myDiary':       { ko: '내 일기',     en: 'My Diary' },
  'menu.settings':      { ko: '설정',       en: 'Settings' },
  'menu.logout':        { ko: '로그아웃',    en: 'Log out' },
  'tab.new':            { ko: '오늘의꿈',    en: 'New dream' },
  'tab.feed':           { ko: '드림피드',    en: 'Feed' },
  'tab.log':            { ko: '드림로그',    en: 'Stats' },

  // Credit modal
  'credit.title':       { ko: '크레딧 충전', en: 'Top up credits' },
  'credit.selectMethod': { ko: '결제 방법 선택', en: 'Select payment method' },
  'credit.history':     { ko: '충전 히스토리 보기', en: 'View top-up history' },
  'credit.comingSoon':  { ko: '준비 중',     en: 'Coming soon' },
  'credit.comingSoonToast': { ko: '는 준비 중이에요', en: ' is coming soon' },

  // New dream
  'new.title':          { ko: '어떤 꿈을 꾸셨나요?', en: 'What did you dream about?' },
  'new.subtitle':       { ko: '떠오르는 대로 적어주세요. 색·소리·냄새 디테일이 있을수록 해석이 풍부해져요.',
                          en: 'Write whatever comes to mind. Colors, sounds, and smells make the interpretation richer.' },
  'new.placeholder':    { ko: '오늘 밤 꾼 꿈을 적어주세요...',
                          en: 'Write the dream you had tonight...' },
  'new.moodLabel':      { ko: '꿈의 기분',  en: 'Mood of the dream' },
  'new.charCount':      { ko: '자',         en: ' chars' },
  'new.basic':          { ko: '기본 해석',  en: 'Basic read' },
  'new.premium':        { ko: '그림일기',   en: 'Dream diary' },

  // My diary
  'diary.title':        { ko: '내 일기',     en: 'My Diary' },
  'diary.subtitle':     { ko: '내 꿈은 기본 비공개예요. 공개 버튼을 누르면 드림피드에 나타나요',
                          en: 'Your dreams are private by default. Tap share to post them to the feed.' },
  'diary.empty.title':  { ko: '아직 저장된 꿈이 없어요', en: 'No dreams saved yet' },
  'diary.empty.hint':   { ko: '오늘 꾼 꿈을 해석해보세요. 해석하면 이곳에 자동으로 저장돼요.',
                          en: 'Interpret a dream you had today. It will be saved here automatically.' },
  'diary.empty.cta':    { ko: '꿈 해석하러 가기', en: 'Interpret a dream' },
  'diary.loading.basic':   { ko: '일기 해석 중',    en: 'Interpreting dream' },
  'diary.loading.premium': { ko: '그림일기 작성 중', en: 'Drawing dream diary' },

  // Dream card badges / actions
  'badge.premium':      { ko: '그림일기', en: 'Dream Diary' },
  'action.share':       { ko: '공개됨 · 피드 노출', en: 'Public · Shown in feed' },
  'action.private':     { ko: '비공개 · 나만 보기', en: 'Private · Only me' },
  'action.delete':      { ko: '삭제', en: 'Delete' },
  'action.translating': { ko: '영어로 번역 중…', en: 'Translating to English…' },

  // Feed
  'feed.title':         { ko: '드림피드',    en: 'Dream Feed' },
  'feed.subtitle':      { ko: '공개된 꿈들을 둘러보세요', en: 'Browse shared dreams' },
  'feed.empty.title':   { ko: '공유된 꿈이 아직 없어요', en: 'No dreams shared yet' },
  'feed.empty.hint':    { ko: '내 꿈을 공개하면 이곳에 나타나요', en: 'Share a dream of yours to post here' },

  // Settings
  'settings.title':     { ko: '설정', en: 'Settings' },
  'settings.edit':      { ko: '수정', en: 'Edit' },
  'settings.stats.totalDreams': { ko: '기록한 꿈', en: 'Dreams' },
  'settings.stats.publicDreams': { ko: '공개한 꿈', en: 'Public' },
  'settings.stats.credits': { ko: '보유 크레딧', en: 'Credits' },
  'settings.menu.history': { ko: '충전 히스토리', en: 'Purchase history' },
  'settings.menu.trash':   { ko: '내 일기 관리', en: 'Manage diary' },
  'settings.menu.terms':   { ko: '약관 및 정책', en: 'Terms & policy' },
  'settings.logout':       { ko: '로그아웃', en: 'Log out' },
  'settings.withdraw':     { ko: '탈퇴하기', en: 'Delete account' },

  // Welcome bonus modal
  'welcome.title':      { ko: '기록의 시작을 환영해요', en: 'Welcome to your journal' },
  'welcome.body':       { ko: '첫 일기를 응원하는 마음으로', en: 'To celebrate your first entry' },
  'welcome.credits':    { ko: '크레딧 50', en: '50 credits' },
  'welcome.closing':    { ko: '을 드려요.', en: ' on us.' },
  'welcome.cta':        { ko: '기록 시작하기', en: 'Start journaling' },

  // Common
  'common.cancel':      { ko: '취소', en: 'Cancel' },
  'common.save':        { ko: '저장', en: 'Save' },
  'common.close':       { ko: '닫기', en: 'Close' },
  'common.back':        { ko: '뒤로', en: 'Back' },
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
