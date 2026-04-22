import type { Metadata, Viewport } from 'next'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'Dreamy - AI 꿈 해석',
  description: '당신의 꿈을 AI가 해석해드려요',
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
