import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 응답 헤더에서 'X-Powered-By: Next.js' 제거 — 서버 스택 노출 최소화.
  poweredByHeader: false,
}

export default nextConfig
