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
                          en: 'Write freely — sensory details deepen the reading.' },
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
  'relative.justNow':      { ko: '방금',           en: 'Just now' },

  // Interpret progress messages
  'interpret.basic':         { ko: '꿈을 해석하고 있어요...',       en: 'Interpreting your dream...' },
  'interpret.premium.1':     { ko: '그림일기로 옮기고 있어요...',    en: 'Moving it into a dream diary...' },
  'interpret.premium.2':     { ko: '장면을 그리고 있어요...',       en: 'Painting the scenes...' },
  'interpret.premium.3':     { ko: '페이지를 넘기고 있어요...',     en: 'Turning the pages...' },
  'interpret.premium.4':     { ko: '그림일기가 거의 완성됐어요...', en: 'Your dream diary is almost ready...' },

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

  // Credit packages
  'credit.pkg.basic':   { ko: '기본', en: 'Starter' },
  'credit.pkg.popular': { ko: '인기', en: 'Popular' },
  'credit.pkg.large':   { ko: '대용량', en: 'Value' },
  'credit.pkg.suffix':  { ko: '팩', en: ' pack' },
  'credit.currency':    { ko: '크레딧', en: 'credits' },
  'credit.walletWaiting': { ko: '지갑에서 승인 대기 중…', en: 'Waiting for wallet confirmation…' },
  'credit.pm.coinbase.sub': { ko: '멀티체인 크립토 결제 (BTC · ETH · USDC)', en: 'Multichain crypto (BTC · ETH · USDC)' },
  'credit.pm.base.sub':    { ko: 'Base Account · USDC 원클릭', en: 'Base Account · One-tap USDC' },
  'credit.pm.bitpay.sub':  { ko: 'Bitcoin · Lightning · 스테이블코인', en: 'Bitcoin · Lightning · Stablecoins' },
  'credit.pm.stripe.sub':  { ko: '카드 결제', en: 'Card payment' },
  'credit.pm.stripeOnramp.sub': { ko: '크립토 구매용 · 크레딧 자동 지급 없음', en: 'Buy crypto · credits are not added automatically' },
  'credit.pm.binance.sub': { ko: 'Binance 지갑 P2P 결제', en: 'Binance Wallet peer-to-peer' },
  'credit.err.cancelled':  { ko: '결제가 취소되었거나 ID를 받지 못했어요.', en: 'The payment was cancelled or no ID was returned.' },
  'credit.err.merchant':   { ko: 'Base Pay merchant 주소가 설정되지 않았어요.', en: 'The Base Pay merchant address is not configured.' },
  'credit.err.verify':     { ko: '검증 실패', en: 'Verification failed' },
  'credit.err.session':    { ko: 'Stripe 세션 생성 실패', en: 'Stripe session could not be created' },
  'credit.err.onramp':     { ko: 'Stripe 온램프 세션 생성 실패', en: 'Stripe on-ramp session could not be created' },
  'credit.err.popup':      { ko: '팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.',
                             en: 'Popup blocked. Allow popups in your browser and try again.' },
  'credit.err.invoice':    { ko: 'invoice 생성 실패', en: 'Invoice could not be created' },
  'credit.err.order':      { ko: 'Binance Pay 주문 생성 실패', en: 'Binance Pay order could not be created' },
  'credit.err.noLink':     { ko: 'Binance Pay 응답에 결제 링크가 없어요', en: 'Binance Pay did not return a checkout link' },
  'credit.err.generic':    { ko: '알 수 없는 오류', en: 'Unknown error' },

  // Common dialogs
  'dialog.shareConfirm':   { ko: '이 꿈을 드림피드에 공개할까요?\n다른 사람이 볼 수 있게 돼요.',
                             en: 'Share this dream to the feed?\nOthers will be able to see it.' },
  'dialog.networkError':   { ko: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
                             en: 'Network error. Please try again in a moment.' },
  'dialog.comingSoon':     { ko: '준비 중이에요', en: 'Coming soon' },

  // Header mobile profile card
  'header.userFallback':   { ko: '꿈꾸는 사람', en: 'Dreamer' },
  'header.stats.dreams':   { ko: '기록한 꿈', en: 'Dreams' },
  'header.stats.credits':  { ko: '보유 크레딧', en: 'Credits' },
  'header.stats.dreamUnit':{ ko: '개', en: '' },

  // Dream detail badges
  'detail.author.me':      { ko: '나', en: 'Me' },
  'detail.author.anon':    { ko: '익명', en: 'Anonymous' },
  'detail.type.premium':   { ko: '그림일기', en: 'Picture diary' },
  'detail.type.basic':     { ko: '기본 해석', en: 'Basic read' },

  // Common
  'common.cancel':      { ko: '취소', en: 'Cancel' },
  'common.save':        { ko: '저장', en: 'Save' },
  'common.close':       { ko: '닫기', en: 'Close' },
  'common.back':        { ko: '뒤로', en: 'Back' },
  'common.confirm':     { ko: '확인', en: 'Confirm' },
  'common.deleteOnce':  { ko: '삭제', en: 'Delete' },
  'common.retry':       { ko: '다시 시도', en: 'Retry' },

  // Auspice labels
  'auspice.auspicious': { ko: '길몽', en: 'Auspicious' },
  'auspice.ominous':    { ko: '흉몽', en: 'Ominous' },
  'auspice.neutral':    { ko: '중립몽', en: 'Neutral' },

  // Moods
  'mood.happy':         { ko: '행복한', en: 'Happy' },
  'mood.peaceful':      { ko: '평온한', en: 'Peaceful' },
  'mood.excited':       { ko: '설레는', en: 'Excited' },
  'mood.fascinating':   { ko: '신비로운', en: 'Fascinating' },
  'mood.nostalgic':     { ko: '그리운', en: 'Nostalgic' },
  'mood.weird':         { ko: '이상한', en: 'Weird' },
  'mood.confused':      { ko: '혼란스러운', en: 'Confused' },
  'mood.anxious':       { ko: '불안한', en: 'Anxious' },
  'mood.scary':         { ko: '무서운', en: 'Scary' },
  'mood.sad':           { ko: '슬픈', en: 'Sad' },

  // Feed (DiaryTab)
  'feed.endMessage':    { ko: '모든 꿈을 다 보셨어요', en: "You've seen every dream" },
  'feed.comments':      { ko: '댓글', en: 'Comments' },
  'feed.commentCount':  { ko: '댓글 {n}개', en: '{n} comments' },
  'feed.anonymous':     { ko: '익명', en: 'Anonymous' },

  // Stats (StatsTab)
  'stats.title':        { ko: '드림로그', en: 'Stats' },
  'stats.subtitle':     { ko: '내 꿈 기록을 한눈에', en: 'Your dream journal at a glance' },
  'stats.totalDreams':  { ko: '기록한 꿈', en: 'Dreams logged' },
  'stats.thisWeek':     { ko: '이번 주', en: 'This week' },
  'stats.spentCredits': { ko: '누적 크레딧', en: 'Credits spent' },
  'stats.moodChart':    { ko: '기분별 분포', en: 'Mood distribution' },
  'stats.empty':        { ko: '아직 통계가 없어요', en: 'No stats yet' },

  // Credit history
  'creditHistory.title':    { ko: '충전 히스토리', en: 'Purchase history' },
  'creditHistory.empty':    { ko: '아직 거래가 없어요', en: 'No transactions yet' },
  'creditHistory.count':    { ko: '건', en: '' },
  'creditHistory.totalPurchased': { ko: '누적 충전', en: 'Total purchased' },
  'creditHistory.totalSpent':     { ko: '누적 사용', en: 'Total spent' },
  'creditHistory.tx.purchase': { ko: '충전', en: 'Top-up' },
  'creditHistory.tx.spend':    { ko: '사용', en: 'Used' },
  'creditHistory.tx.bonus':    { ko: '보너스', en: 'Bonus' },
  'creditHistory.tx.refund':   { ko: '환불', en: 'Refund' },
  'creditHistory.label.signupBonus': { ko: '가입 축하 보너스', en: 'Welcome bonus' },
  'creditHistory.label.basic':  { ko: '기본 해석', en: 'Basic interpretation' },
  'creditHistory.label.premium': { ko: '그림일기', en: 'Dream Diary' },

  // Trash (내 일기 관리)
  'trash.title':        { ko: '내 일기 관리', en: 'Manage diary' },
  'trash.subtitle':     { ko: '휴지통에는 삭제된 꿈이 보관돼요. 복구하거나 영구 삭제할 수 있어요.',
                          en: 'Deleted dreams are kept here. You can restore them or delete them permanently.' },
  'trash.empty.title':  { ko: '휴지통이 비어있어요', en: 'Trash is empty' },
  'trash.empty.hint':   { ko: '삭제한 꿈은 여기에 보관됩니다', en: 'Deleted dreams will appear here' },
  'trash.restore':      { ko: '복구', en: 'Restore' },
  'trash.deletePermanent': { ko: '영구 삭제', en: 'Delete permanently' },
  'trash.confirm.title': { ko: '정말 영구 삭제할까요?', en: 'Delete permanently?' },
  'trash.confirm.body':  { ko: '이 꿈은 완전히 사라져요. 되돌릴 수 없어요.',
                           en: 'This dream will be removed forever. This cannot be undone.' },

  // Dream detail modal
  'detail.dreamContent': { ko: '꿈 내용', en: 'Dream' },
  'detail.interpretation': { ko: '해석', en: 'Interpretation' },
  'detail.detailedInterpretation': { ko: '상세 해석', en: 'Detailed interpretation' },
  'detail.share':       { ko: '공개하기', en: 'Share to feed' },
  'detail.unshare':     { ko: '비공개로', en: 'Make private' },
  'detail.fortune':     { ko: '오늘의 운세', en: "Today's fortune" },
  'detail.fortuneLoading': { ko: '불러오는 중...', en: 'Loading…' },
  'detail.saveToDiary': { ko: '일기장 저장', en: 'Save to diary' },
  'detail.saved':       { ko: '저장됨', en: 'Saved' },
  'detail.lucky.title': { ko: '오늘의 길잡이', en: "Today's guide" },
  'detail.lucky.item':  { ko: '가지고 다니면 좋은 것', en: 'Carry with you' },
  'detail.lucky.color': { ko: '행운 컬러', en: 'Lucky color' },
  'detail.lucky.direction': { ko: '행운의 방향', en: 'Lucky direction' },
  'detail.lucky.number': { ko: '행운의 숫자', en: 'Lucky number' },
  'detail.lucky.avoid': { ko: '오늘 피하면 좋은 것', en: 'Best to avoid today' },
  'detail.original':    { ko: '내가 쓴 원문 보기', en: 'Show my original text' },
  'detail.hideOriginal':{ ko: '원문 숨기기', en: 'Hide original' },
  'detail.commentsEmpty': { ko: '아직 댓글이 없어요. 첫 공감을 남겨보세요.', en: 'No comments yet. Be the first to share warmth.' },
  'detail.commentPlaceholder': { ko: '따뜻한 댓글을 남겨주세요', en: 'Leave a kind comment' },
  'detail.commentSend': { ko: '등록', en: 'Post' },
  'detail.commentsLabel': { ko: '댓글', en: 'Comments' },
  'detail.translating':   { ko: '번역 중…', en: 'Translating…' },

  // Profile editor
  'profile.title':      { ko: '프로필 수정', en: 'Edit profile' },
  'profile.nickname':   { ko: '닉네임', en: 'Nickname' },
  'profile.nicknameHint': { ko: '12자 이내. 바꾸면 내가 남긴 댓글도 함께 업데이트돼요.',
                            en: 'Up to 12 chars. Changing updates your past comments too.' },
  'profile.avatar':     { ko: '아바타', en: 'Avatar' },
  'profile.customUrl':  { ko: '또는 이미지 URL 직접 입력', en: 'Or paste an image URL' },
  'profile.apply':      { ko: '적용', en: 'Apply' },
  'profile.preview':    { ko: '미리보기', en: 'Preview' },
  'profile.defaultAvatar': { ko: '기본 아이콘', en: 'Default icon' },
  'profile.errEmpty':   { ko: '닉네임을 입력해주세요', en: 'Please enter a nickname' },
  'profile.errLen':     { ko: '12자 이내로 입력해주세요', en: 'Must be 12 characters or fewer' },
  'profile.errTaken':   { ko: '이미 사용 중인 닉네임이에요', en: 'That nickname is taken' },

  // Withdraw modal
  'withdraw.title':     { ko: '정말 탈퇴하시겠어요?', en: 'Delete your account?' },
  'withdraw.intro':     { ko: '탈퇴 시 다음 항목이 모두 초기화돼요:',
                          en: 'The following will all be reset:' },
  'withdraw.item.dreams': { ko: '기록한 꿈 전체', en: 'All logged dreams' },
  'withdraw.item.credits':{ ko: '보유 크레딧 및 충전 내역', en: 'Credit balance and history' },
  'withdraw.item.profile':{ ko: '닉네임·아바타·프로필', en: 'Nickname, avatar, profile' },
  'withdraw.item.comments':{ ko: '내가 단 댓글', en: 'Comments you left' },
  'withdraw.footnote':  { ko: '동일한 구글 계정으로 다시 로그인해도 새 계정으로 시작되며 이전 기록은 복구되지 않아요.',
                          en: 'Signing in again with the same Google account starts a fresh account; previous records cannot be restored.' },
  'withdraw.continue':  { ko: '계속 진행', en: 'Continue' },
  'withdraw.finalTitle':{ ko: '마지막 확인', en: 'Final confirmation' },
  'withdraw.finalBody': { ko: '계속하려면 아래 칸에 "탈퇴" 두 글자를 입력해주세요. 이 작업은 되돌릴 수 없어요.',
                          en: 'To continue, type "DELETE" below. This cannot be undone.' },
  'withdraw.confirmWord': { ko: '탈퇴', en: 'DELETE' },
  'withdraw.confirm':   { ko: '탈퇴 확정', en: 'Confirm deletion' },
  'withdraw.processing':{ ko: '처리 중...', en: 'Processing…' },

  // Onboarding slides
  'onboard.record.title':    { ko: '오늘 꾼 꿈,\n기억하고 싶지 않으세요?',
                               en: "Don't want tonight's\ndream to fade away?" },
  'onboard.record.desc':     { ko: '매일 아침 흐릿해지는 꿈을\nDreamy가 기록해드려요.',
                               en: 'Dreamy captures it before\nthe morning blurs everything.' },
  'onboard.interpret.title': { ko: 'AI가 당신의 꿈을\n따뜻하게 해석해요',
                               en: 'Warm AI interpretations\ntailored to you' },
  'onboard.interpret.desc':  { ko: '상징과 무의식을 분석해\n3~4문장의 맞춤 해석을 드려요.',
                               en: 'Symbols and subconscious cues\nturned into a few thoughtful lines.' },
  'onboard.diary.title':     { ko: '그림일기로\n꿈을 아름답게 기록해요',
                               en: 'Turn dreams into\na 5-page picture diary' },
  'onboard.diary.desc':      { ko: '5페이지 손그림 일기로 꿈의\n이야기를 펼쳐보세요.',
                               en: 'Unfold the story of your dream\nin five illustrated pages.' },
  'onboard.next':            { ko: '다음', en: 'Next' },
  'onboard.start':           { ko: '시작하기', en: 'Get started' },

  // Auth screen
  'auth.subtitle':      { ko: 'AI 꿈 해석 서비스', en: 'AI dream interpretation' },
  'auth.google':        { ko: 'Google로 시작하기', en: 'Continue with Google' },
  'auth.loading':       { ko: '로그인 중...', en: 'Signing in…' },
  'auth.tos':           { ko: '이용약관 및 개인정보 처리방침에 동의합니다.',
                          en: 'I agree to the terms and privacy policy.' },

  // In-app browser guard
  'iabg.title':         { ko: '{browser} 인앱 브라우저에서는 로그인이 안 돼요',
                          en: "Login isn't available inside {browser}'s in-app browser" },
  'iabg.body':          { ko: 'Google 정책상 인앱 브라우저에서는 Google 로그인이 차단돼 있어요. Chrome 또는 Safari 에서 열어주세요.',
                          en: 'Google blocks sign-in inside in-app browsers. Please open this in Chrome or Safari.' },
  'iabg.openExternal':  { ko: '외부 브라우저로 열기', en: 'Open in external browser' },
  'iabg.openChrome':    { ko: 'Chrome 으로 열기', en: 'Open in Chrome' },
  'iabg.copyUrl':       { ko: '주소 복사하기', en: 'Copy URL' },
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
