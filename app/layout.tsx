import type { Metadata, Viewport } from 'next'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://dreamy-tau.vercel.app'),
  title: {
    default: 'Dreamy — AI 꿈 해석',
    template: '%s · Dreamy',
  },
  description: '당신의 꿈을 AI가 해석해드려요. 한국 전통 해몽과 심리학을 블렌딩한 해석을 기본 텍스트 또는 그림일기로.',
  keywords: ['꿈 해석', '해몽', 'AI 꿈풀이', '태몽', 'Dreamy', '그림일기'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'Dreamy — AI 꿈 해석',
    description: '당신의 꿈을 AI가 해석해드려요.',
    siteName: 'Dreamy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dreamy — AI 꿈 해석',
    description: '당신의 꿈을 AI가 해석해드려요.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#05080F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
