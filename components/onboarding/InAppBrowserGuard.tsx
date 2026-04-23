'use client'
/**
 * 인앱 브라우저(카톡·인스타 등) 감지 → 외부 브라우저 안내 오버레이.
 * Google OAuth 가 이 환경들을 차단하므로 로그인 자체가 불가능. 사용자를
 * Chrome/Safari 로 이동시켜 정상 사용하게 한다.
 *
 * 전략:
 *  · Android + 카카오톡  → `kakaotalk://web/openExternal` 로 외부 브라우저 오픈
 *  · Android + 다른 인앱 → Chrome intent URL 시도
 *  · iOS 전체          → 자동 이동 수단 없음 → 수동 안내만
 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  detectInAppBrowser,
  isAndroid,
  isIOS,
  openInExternalKakao,
  openInChromeAndroid,
  BROWSER_LABEL,
  type InAppBrowser,
} from '@/lib/detectInAppBrowser'

export default function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [detected, setDetected] = useState<InAppBrowser>(null)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDetected(detectInAppBrowser())
  }, [])

  // 서버사이드 / 아직 판정 안 된 첫 렌더 → 자식 그대로 (플래시 방지)
  if (!mounted || !detected) return <>{children}</>

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://dreamy-tau.vercel.app'
  const android = isAndroid()
  const ios = isIOS()
  const label = BROWSER_LABEL[detected]

  const copyToClipboard = async () => {
    // 1) modern API
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(currentUrl)
        return true
      } catch { /* fall through */ }
    }
    // 2) fallback: 임시 textarea
    try {
      const ta = document.createElement('textarea')
      ta.value = currentUrl
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }

  const handleAutoOpen = async () => {
    // 1) 카카오톡 Android — 공식 외부 브라우저 스킴 우선 시도
    if (detected === 'kakaotalk' && android) {
      openInExternalKakao(currentUrl)
      // 스킴이 실패해도 사용자가 당황하지 않도록 주소도 미리 복사
      await copyToClipboard()
      return
    }
    // 2) 다른 안드로이드 인앱 — Chrome intent URL
    if (android) {
      openInChromeAndroid(currentUrl)
      await copyToClipboard()
      return
    }
    // 3) iOS 등 자동 이동 불가 — 주소 복사만
    const ok = await copyToClipboard()
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleCopyUrl = async () => {
    const ok = await copyToClipboard()
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'linear-gradient(180deg, #03050D 0%, #060C1C 50%, #0A1530 100%)',
        color: '#E8E8F4',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 360,
          padding: 28,
          borderRadius: 24,
          background: 'rgba(13,19,48,0.8)',
          border: '1px solid rgba(127,119,221,0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: 16, alignSelf: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(127,119,221,0.18)',
            border: '1px solid rgba(127,119,221,0.45)',
            fontSize: 28,
          }}
          aria-hidden
        >
          🌐
        </div>

        <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>
          {label} 인앱 브라우저에서는<br />로그인이 안 돼요
        </p>

        <p style={{ fontSize: 13, color: '#8890B0', lineHeight: 1.7 }}>
          Google 정책상 인앱 브라우저에서는<br />
          Google 로그인이 차단돼 있어요.<br />
          <strong style={{ color: '#C0C4DC' }}>Chrome 또는 Safari</strong> 에서 열어주세요.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          {android && (
            <button
              type="button"
              onClick={handleAutoOpen}
              style={{
                padding: '14px 0',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
                color: 'white', border: 'none',
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(127,119,221,0.35)',
              }}
            >
              {detected === 'kakaotalk' ? '외부 브라우저로 열기' : 'Chrome 으로 열기'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyUrl}
            style={{
              padding: '12px 0',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              color: '#C0C4DC',
              border: '1px solid rgba(127,119,221,0.3)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            주소 복사하기
          </button>
        </div>

        {/* Manual instructions */}
        <div
          style={{
            marginTop: 6, padding: 14,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: '#C4C0F5', marginBottom: 8, letterSpacing: 0.3 }}>
            수동으로 외부 브라우저 열기
          </p>
          {android ? (
            <p style={{ fontSize: 12, color: '#8890B0', lineHeight: 1.7 }}>
              ① 우측 상단 <strong style={{ color: '#C0C4DC' }}>⋮</strong> 메뉴 클릭<br />
              ② <strong style={{ color: '#C0C4DC' }}>&ldquo;Chrome 으로 열기&rdquo;</strong> 선택
            </p>
          ) : ios ? (
            <p style={{ fontSize: 12, color: '#8890B0', lineHeight: 1.7 }}>
              ① 하단 공유 아이콘 <strong style={{ color: '#C0C4DC' }}>↗</strong> 클릭<br />
              ② <strong style={{ color: '#C0C4DC' }}>&ldquo;Safari 에서 열기&rdquo;</strong> 선택
            </p>
          ) : (
            <p style={{ fontSize: 12, color: '#8890B0', lineHeight: 1.7 }}>
              브라우저 메뉴에서 외부 브라우저로 열기 옵션을 찾아주세요.
            </p>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#555E80', marginTop: 4 }}>
          복사된 주소: <span style={{ color: '#8890B0' }}>{currentUrl}</span>
        </p>
      </motion.div>
    </div>
  )
}
