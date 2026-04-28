import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * 이미지 프록시 + 디스크 캐시
 *   1) 해시 캐시 히트 → 즉시 반환
 *   2) Pollinations turbo (45s)
 *   3) Pollinations flux (50s)
 *   4) 전부 실패 → 프롬프트 무관 랜덤 사진 대신 **컨셉에 맞는 SVG 플레이스홀더**
 *      (페이지 제목을 보여주는 수채화 톤 그라데이션 — 캐시하지 않음, 다음 요청 때 재시도)
 */

const CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'dreamy-images-v2') // v2: Picsum 잔재 버림
const STYLE =
  'watercolor dreamy illustration, soft pastel palette, storybook style, muted colors, no text, no letters, no humans with faces'

async function ensureCacheDir() {
  try { await fs.mkdir(CACHE_DIR, { recursive: true }) } catch {}
}

function cacheKey(prompt: string, seed: string, w: string, h: string) {
  return createHash('sha1').update(`v2|${prompt}|${seed}|${w}|${h}`).digest('hex')
}

async function readCached(key: string) {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.jpg`)
    const buffer = await fs.readFile(filePath)
    return { buffer, contentType: 'image/jpeg' as const }
  } catch { return null }
}

async function writeCached(key: string, buffer: Buffer) {
  try {
    await ensureCacheDir()
    await fs.writeFile(path.join(CACHE_DIR, `${key}.jpg`), buffer)
  } catch {}
}

async function tryPollinations(url: string, timeoutMs: number): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.startsWith('image/')) return null
    const buf = await res.arrayBuffer()
    // 너무 작은 응답(에러 placeholder 등) 은 실패 처리
    if (buf.byteLength < 2048) return null
    return buf
  } catch { return null }
}

/**
 * 최종 폴백 — 프롬프트와 무관한 Picsum 사진 대신,
 * 꿈 페이지 톤(수채화 파스텔 그라데이션)의 SVG 이미지를 즉석 생성.
 * prompt/seed 로 결정적 색상 고르고, 타이틀 텍스트는 제외(캐리어별 텍스트 방지) — 단순 질감.
 */
function makePlaceholderSvg(prompt: string, seed: string, w: number, h: number): string {
  // seed 로 해시 생성해 색 조합 고름
  const hash = createHash('md5').update(`${prompt}|${seed}`).digest()
  const hue1 = hash[0] * 360 / 255
  const hue2 = (hue1 + 30 + hash[1] * 60 / 255) % 360
  const hue3 = (hue1 + 200 + hash[2] * 60 / 255) % 360
  const c1 = `hsl(${hue1.toFixed(0)},45%,78%)`
  const c2 = `hsl(${hue2.toFixed(0)},50%,72%)`
  const c3 = `hsl(${hue3.toFixed(0)},40%,68%)`
  // 여러 방사형 그라데이션 + 블러로 몽환적 배경
  const r = hash[3] / 255
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <filter id="b"><feGaussianBlur stdDeviation="${(8 + r * 12).toFixed(1)}"/></filter>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="55%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g filter="url(#b)" opacity="0.7">
      <circle cx="${(hash[4] / 255 * w).toFixed(0)}" cy="${(hash[5] / 255 * h).toFixed(0)}" r="${(w * 0.25).toFixed(0)}" fill="${c1}"/>
      <circle cx="${(hash[6] / 255 * w).toFixed(0)}" cy="${(hash[7] / 255 * h).toFixed(0)}" r="${(w * 0.3).toFixed(0)}" fill="${c3}"/>
      <circle cx="${(hash[8] / 255 * w).toFixed(0)}" cy="${(hash[9] / 255 * h).toFixed(0)}" r="${(w * 0.2).toFixed(0)}" fill="${c2}"/>
    </g>
  </svg>`
}

// 비정상 값으로 외부 API 비용·메모리를 폭주시키는 걸 막는 입력 가드.
const MIN_DIM = 256
const MAX_DIM = 1024
const MAX_PROMPT_LEN = 500
const MAX_SEED_LEN = 32
function clampDim(raw: string | null, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.max(MIN_DIM, Math.min(MAX_DIM, Math.round(n)))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawPrompt = (searchParams.get('p') ?? 'dream').trim()
  const prompt = rawPrompt.slice(0, MAX_PROMPT_LEN) || 'dream'
  const seed = (searchParams.get('s') ?? '0').slice(0, MAX_SEED_LEN)
  const width = String(clampDim(searchParams.get('w'), 640))
  const height = String(clampDim(searchParams.get('h'), 400))

  const key = cacheKey(prompt, seed, width, height)

  // 1) 캐시 히트
  const cached = await readCached(key)
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        'content-type': cached.contentType,
        'cache-control': 'public, max-age=31536000, immutable',
        'x-dreamy-cache': 'hit',
      },
    })
  }

  const composed = `${STYLE}, ${prompt}`
  const encoded = encodeURIComponent(composed)

  // 2) Pollinations turbo
  // 외부 fetch 타임아웃은 한 요청당 합계 ~40s 로 제한 (turbo 20s + flux 20s).
  // 길게 잡으면 단일 악성 요청이 서버리스 함수를 점유해 비용·동시성 압박이 커진다.
  const turboUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=turbo&nologo=true&seed=${seed}`
  let bytes = await tryPollinations(turboUrl, 20000)
  let source: 'turbo' | 'flux' | 'placeholder' = 'turbo'

  // 3) Pollinations flux (품질 좋으나 느림)
  if (!bytes) {
    source = 'flux'
    const fluxUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`
    bytes = await tryPollinations(fluxUrl, 20000)
  }

  if (bytes) {
    const buffer = Buffer.from(bytes)
    await writeCached(key, buffer)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-dreamy-cache': 'miss-stored',
        'x-dreamy-source': source,
      },
    })
  }

  // 4) 최종 폴백 — 랜덤 사진 대신 프롬프트 기반 파스텔 SVG
  // 캐시하지 않음 (다음번엔 Pollinations 재시도 기회)
  const svg = makePlaceholderSvg(prompt, seed, parseInt(width), parseInt(height))
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'no-store',
      'x-dreamy-cache': 'miss-placeholder',
      'x-dreamy-source': 'placeholder',
    },
  })
}
