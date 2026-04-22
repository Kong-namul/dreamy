/**
 * 이미지 URL 빌더.
 * 브라우저에서 직접 Pollinations 를 치면 타임아웃·CORS 이슈가 있어
 * Next.js 서버 프록시 `/api/image` 를 경유.
 * 서버에서 Pollinations → Picsum 폴백 체인 처리.
 */

export interface PollinationsOptions {
  width?: number
  height?: number
  seed?: number
}

// URL 버전 — 올릴 때마다 브라우저 캐시 무효화 (immutable 헤더 우회)
const URL_VERSION = 'v2'

export function buildPollinationsUrl(prompt: string, opts: PollinationsOptions = {}): string {
  const { width = 640, height = 400, seed = Math.floor(Math.random() * 99999) } = opts
  const params = new URLSearchParams({
    p: prompt,
    s: String(seed),
    w: String(width),
    h: String(height),
    v: URL_VERSION,
  })
  return `/api/image?${params.toString()}`
}

/**
 * pages 배열에 imageUrl 주입.
 */
export function attachImageUrls<T extends { title: string; text: string; imagePrompt?: string }>(
  pages: T[],
  baseSeed = Math.floor(Math.random() * 99999)
): Array<T & { imageUrl: string }> {
  return pages.map((p, i) => {
    const prompt = p.imagePrompt || `${p.title} ${p.text.slice(0, 40)}`
    return {
      ...p,
      imageUrl: buildPollinationsUrl(prompt, { seed: baseSeed + i }),
    }
  })
}
