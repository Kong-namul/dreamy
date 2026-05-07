/**
 * Coinbase Developer Platform JWT 생성기.
 *
 * 새 CDP API 키 포맷 (2026 portal 발급분):
 *   { id: "<uuid>", privateKey: "<base64-64bytes>" }
 *   - id      → kid / sub
 *   - privateKey → base64 디코드 후 첫 32바이트가 Ed25519 seed
 *
 * 옛 PEM 포맷과 다음이 다름:
 *   - sub/kid 가 UUID 만 (옛 'organizations/.../apiKeys/UUID' 아님)
 *   - claim 이름 'uri' (단수) → 'uris' (배열)
 *   - jsonwebtoken 라이브러리가 raw Ed25519 seed 를 못 먹어서
 *     Node crypto.sign(null, ...) 로 직접 서명 (Ed25519 는 hash 인자 null)
 *
 * CDP CLI 의 동작 (기존 검증된 구현) 을 그대로 따름.
 *
 * 참고: https://docs.cdp.coinbase.com/coinbase-business/authentication-authorization
 */
import 'server-only'
import crypto from 'crypto'

const KEY_ID = process.env.COINBASE_CDP_KEY_NAME
const PRIVATE_KEY_RAW = process.env.COINBASE_CDP_PRIVATE_KEY

export function isCoinbaseConfigured(): boolean {
  return Boolean(KEY_ID && PRIVATE_KEY_RAW)
}

function base64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Coinbase Business API 호출용 JWT 1회용.
 * @param method 'POST' | 'GET' 등
 * @param path '/api/v1/checkouts' 처럼 슬래시로 시작
 */
export function generateCoinbaseJwt(method: string, path: string): string {
  if (!KEY_ID || !PRIVATE_KEY_RAW) {
    throw new Error('Coinbase CDP key not configured (COINBASE_CDP_KEY_NAME / COINBASE_CDP_PRIVATE_KEY missing)')
  }

  const now = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')
  const host = 'business.coinbase.com'

  const header = {
    alg: 'EdDSA',
    typ: 'JWT',
    kid: KEY_ID,
    nonce,
  }

  const payload = {
    sub: KEY_ID,
    iss: 'cdp',
    nbf: now,
    iat: now,
    exp: now + 120,
    uris: [`${method} ${host}${path}`],
  }

  const headerPart = base64Url(JSON.stringify(header))
  const payloadPart = base64Url(JSON.stringify(payload))
  const signingInput = `${headerPart}.${payloadPart}`

  // base64 디코드 → 첫 32바이트(seed) → PKCS8 ASN.1 래핑 → Ed25519 PrivateKey
  const decoded = Buffer.from(PRIVATE_KEY_RAW, 'base64')
  const seed = decoded.subarray(0, 32)
  const pkcs8Header = Buffer.from('302e020100300506032b657004220420', 'hex')
  const pkcs8Der = Buffer.concat([pkcs8Header, seed])

  const privateKey = crypto.createPrivateKey({
    key: pkcs8Der,
    format: 'der',
    type: 'pkcs8',
  })

  // Ed25519 는 별도 hash 인자 없음 (null) — RFC 8032
  const signature = crypto.sign(null, Buffer.from(signingInput), privateKey)

  return `${signingInput}.${base64Url(signature)}`
}
