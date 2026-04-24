/**
 * 디자인 토큰 — inline style 에서 직접 쓰는 값들.
 *
 * 프로젝트 정책: Tailwind 유틸리티는 사용하지 않고 inline style 을 쓴다.
 * 그래서 색/radius/글로우 같은 디자인 토큰을 이 객체에서 꺼내 쓰면, 한곳에서
 * 바꿔 전역 업데이트가 가능하다. CSS 변수 (globals.css) 와 값이 동기화되어 있다.
 */

export const color = {
  bgDeep:     '#05080F',
  bgNavy:     '#0A1128',
  bgSurface:  '#111A3A',

  purple:     '#7F77DD',
  purpleSoft: '#C4C0F5',
  blueGlow:   '#4A7AFF',
  pink:       '#D4537E',
  redSoft:    '#E8899A',

  text:         '#E8E8F4',
  textDim:      '#C0C4DC',
  subtext:      '#8890B0',
  subtextDim:   '#6B739A',
  hint:         '#555E80',
  placeholder:  '#3C4260',

  cardBg:      'rgba(17, 26, 58, 0.7)',
  cardBorder:  'rgba(255, 255, 255, 0.08)',

  purpleTint12: 'rgba(127, 119, 221, 0.12)',
  purpleTint22: 'rgba(127, 119, 221, 0.22)',
  purpleTint30: 'rgba(127, 119, 221, 0.30)',
  purpleBorder: 'rgba(127, 119, 221, 0.40)',
} as const

export const radius = {
  sm:   10,
  md:   16,
  lg:   20,
  pill: 9999,
} as const

export const glow = {
  purple: '0 0 20px rgba(127, 119, 221, 0.35)',
  pink:   '0 0 20px rgba(212, 83, 126, 0.35)',
} as const

export const duration = {
  fast: '0.15s',
  mid:  '0.22s',
} as const
