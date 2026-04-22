/**
 * 신규 유저에게 랜덤 배정되는 꿈 관련 닉네임 풀.
 * 전부 공백 포함 6자 이하로 사전 검증되어 있음.
 */
export const RANDOM_NICKNAMES = [
  '꿈꾸는 곰',
  '꿈꾸는 쥐',
  '꿈꾸는 양',
  '꿈꾸는 소',
  '졸린 하마',
  '졸린 여우',
  '졸린 토끼',
  '졸린 사슴',
  '졸린 수달',
  '졸린 펭귄',
  '졸린 고래',
  '졸린 판다',
  '졸린 다람쥐',
  '졸린 너구리',
  '나른한 곰',
  '나른한 양',
  '꾸벅 판다',
  '꾸벅 하마',
  '꾸벅 여우',
  '꾸벅 사슴',
  '비몽 토끼',
  '비몽 수달',
  '몽롱 고래',
  '몽롱 펭귄',
  '조는 하마',
  '조는 여우',
  '조는 너구리',
  '잠든 다람쥐',
  '잠든 너구리',
  '꿈결 토끼',
  '꿈결 여우',
  '꿈결 사슴',
  '몽실 고래',
  '뒤척 토끼',
  '느릿 거북',
]

export const DEFAULT_NICKNAME = '꿈꾸는이'

export function getRandomNickname(): string {
  const idx = Math.floor(Math.random() * RANDOM_NICKNAMES.length)
  return RANDOM_NICKNAMES[idx]
}
