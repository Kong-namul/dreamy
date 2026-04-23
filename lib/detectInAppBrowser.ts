/**
 * 인앱 브라우저(카톡·인스타·페북 등) 감지.
 * Google OAuth 가 disallowed_useragent 로 차단하므로, 이 경우
 * 외부 브라우저로 열도록 안내해야 한다.
 */

export type InAppBrowser =
  | 'kakaotalk'
  | 'instagram'
  | 'facebook'
  | 'line'
  | 'naver'
  | 'daum'
  | 'band'
  | 'kakaostory'
  | 'wirtschaftsWoche'   // generic webview fallback
  | null

export function detectInAppBrowser(ua?: string): InAppBrowser {
  if (typeof window === 'undefined' && !ua) return null
  const userAgent = (ua ?? navigator.userAgent ?? '').toLowerCase()

  if (userAgent.includes('kakaotalk')) return 'kakaotalk'
  if (userAgent.includes('instagram')) return 'instagram'
  if (userAgent.includes('fban') || userAgent.includes('fbav')) return 'facebook'
  if (userAgent.includes('line/')) return 'line'
  if (userAgent.includes('naver(inapp') || userAgent.includes('naver;')) return 'naver'
  if (userAgent.includes('daumapps') || userAgent.includes('daum/')) return 'daum'
  if (userAgent.includes('band/')) return 'band'
  if (userAgent.includes('kakaostory')) return 'kakaostory'

  return null
}

export function isAndroid(ua?: string): boolean {
  const userAgent = (ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '').toLowerCase()
  return userAgent.includes('android')
}

export function isIOS(ua?: string): boolean {
  const userAgent = (ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '').toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
}

/**
 * 카카오톡 인앱브라우저 → 외부 브라우저로 URL 열기 (Android only).
 * 카카오톡 공식 지원 스킴: kakaotalk://web/openExternal?url=<encoded>
 */
export function openInExternalKakao(url: string): void {
  const encoded = encodeURIComponent(url)
  window.location.href = `kakaotalk://web/openExternal?url=${encoded}`
}

/**
 * Android 에서 Chrome 으로 강제 열기 (intent URL).
 * 카톡 외 다른 인앱브라우저에서 Android 라면 이걸 시도.
 */
export function openInChromeAndroid(url: string): void {
  const withoutProtocol = url.replace(/^https?:\/\//, '')
  window.location.href = `intent://${withoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`
}

export const BROWSER_LABEL: Record<NonNullable<InAppBrowser>, string> = {
  kakaotalk: '카카오톡',
  instagram: 'Instagram',
  facebook: 'Facebook',
  line: 'LINE',
  naver: 'NAVER',
  daum: 'Daum',
  band: 'BAND',
  kakaostory: '카카오스토리',
  wirtschaftsWoche: '인앱',
}
