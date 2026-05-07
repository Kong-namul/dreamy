/**
 * Coinbase Developer Platform JWT 생성기.
 *
 * 새 Coinbase Business API (Checkouts 등) 는 매 요청마다 ES256 서명된
 * 단명 JWT 를 Authorization: Bearer 로 요구. 옛 Commerce 의 X-CC-Api-Key
 * 단순 헤더 인증과 다름.
 *
 * 참고: https://docs.cdp.coinbase.com/coinbase-business/authentication-authorization
 */
import 'server-only'
import jwt, { type JwtHeader } from 'jsonwebtoken'
import crypto from 'crypto'

const KEY_NAME = process.env.COINBASE_CDP_KEY_NAME
const PRIVATE_KEY_RAW = process.env.COINBASE_CDP_PRIVATE_KEY

export function isCoinbaseConfigured(): boolean {
  return Boolean(KEY_NAME && PRIVATE_KEY_RAW)
}

/**
 * Coinbase Business API 호출용 JWT 1회용.
 * @param method 'POST' | 'GET' 등
 * @param path '/api/v1/checkouts' 처럼 슬래시로 시작
 */
export function generateCoinbaseJwt(method: string, path: string): string {
  if (!KEY_NAME || !PRIVATE_KEY_RAW) {
    throw new Error('Coinbase CDP key not configured (COINBASE_CDP_KEY_NAME / COINBASE_CDP_PRIVATE_KEY missing)')
  }

  // Vercel 환경변수에 PEM 을 넣을 때 줄바꿈이 \n 문자로 들어오는 경우가 있음 → 실제 줄바꿈으로 복원
  const privateKey = PRIVATE_KEY_RAW.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const uri = `${method} business.coinbase.com${path}`

  return jwt.sign(
    {
      iss: 'cdp',
      sub: KEY_NAME,
      nbf: now,
      exp: now + 120,
      uri,
    },
    privateKey,
    {
      algorithm: 'ES256',
      // CDP 는 표준 JwtHeader 외에 nonce 헤더를 요구함 → 타입 확장.
      header: {
        kid: KEY_NAME,
        nonce: crypto.randomBytes(16).toString('hex'),
        alg: 'ES256',
        typ: 'JWT',
      } as JwtHeader & { nonce: string },
    },
  )
}
