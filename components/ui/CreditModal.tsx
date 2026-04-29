'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { DiamondIcon, CloseIcon, ArrowLeftIcon, ChevronRightIcon } from '@/components/ui/Icons'
import { pay } from '@base-org/account'
import { useT } from '@/lib/i18n'

interface Package {
  id: string
  labelKey: string
  credits: number
  price: number
  badge?: string
}

const PACKAGES: Package[] = [
  { id: 'basic',   labelKey: 'credit.pkg.basic',   credits: 100, price: 1000 },
  { id: 'popular', labelKey: 'credit.pkg.popular', credits: 300, price: 2500, badge: 'BEST' },
  { id: 'large',   labelKey: 'credit.pkg.large',   credits: 700, price: 5000 },
]

interface PaymentMethod {
  id: string
  label: string
  subKey: string   // i18n key for sub-label
  color: string
  initial: string
  logoUrl: string
}

// 로고 소스:
//  · Simple Icons CDN (https://cdn.simpleicons.org/<slug>/<hex>) — coinbase/bitcoin/stripe/binance 지원
//  · Base: GitHub org 아바타 (Base 전용 파란 원형 B 로고)
//  · 실패 시 initial 폴백
const PAYMENTS: PaymentMethod[] = [
  {
    id: 'base',
    label: 'Base Pay',
    subKey: 'credit.pm.base.sub',
    color: '#0052FF',
    initial: 'B',
    logoUrl: 'https://avatars.githubusercontent.com/u/108554348?s=64',
  },
  {
    id: 'coinbase',
    label: 'Coinbase Commerce',
    subKey: 'credit.pm.coinbase.sub',
    color: '#1652F0',
    initial: 'C',
    logoUrl: 'https://cdn.simpleicons.org/coinbase/FFFFFF',
  },
  {
    id: 'bitpay',
    label: 'BitPay',
    subKey: 'credit.pm.bitpay.sub',
    color: '#1A2A44',
    initial: 'Ƀ',
    logoUrl: 'https://framerusercontent.com/images/2iIIkkV5Qoskq2dfhwja8G8rFW0.png',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    subKey: 'credit.pm.stripe.sub',
    color: '#635BFF',
    initial: 'S',
    logoUrl: 'https://cdn.simpleicons.org/stripe/FFFFFF',
  },
  {
    id: 'stripe_onramp',
    label: 'Stripe Crypto',
    subKey: 'credit.pm.stripeOnramp.sub',
    color: '#635BFF',
    initial: 'S',
    logoUrl: 'https://cdn.simpleicons.org/stripe/FFFFFF',
  },
  {
    id: 'binance',
    label: 'Binance Pay',
    subKey: 'credit.pm.binance.sub',
    color: '#F3BA2F',
    initial: 'ß',
    logoUrl: 'https://cdn.simpleicons.org/binance/FFFFFF',
  },
]

// Base Pay 아이콘 — 2024 리브랜드: 파란 둥근 사각형 배경 + 흰 Base 심볼 (원 + 오른쪽 수평선)
// 부모 타일(borderRadius 10)에 이미 파란 바탕이라 SVG 안에서는 symbol 만 그린다.
function BaseSymbol() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 111 111" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" />
    </svg>
  )
}

// Coinbase 2022 모노그램 (Pentagram 리디자인) — 흰 원반에 가운데 정사각형 cut-out
// 정사각형이 "C" 의 네거티브 스페이스 형성. 타일 bg 가 사각형 안으로 비침.
function CoinbaseSymbol() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="white"
        d="M 50 2 A 48 48 0 1 1 50 98 A 48 48 0 1 1 50 2 Z M 32 32 L 68 32 L 68 68 L 32 68 Z"
      />
    </svg>
  )
}

function PaymentLogo({ pm }: { pm: PaymentMethod }) {
  const [err, setErr] = useState(false)
  // 구조 단순화: 36px 타일 안에 padding 으로 로고 크기 조절.
  //   padding 큼  → 로고 작음
  //   padding 작음 → 로고 큼
  // 브랜드별 padding: base 풀블리드(0), coinbase 약간(7), bitpay 거의풀(4), stripe 크게(10), 나머지 중간(8)
  const padding =
    pm.id === 'base' ? 9 :     // 리브랜드 후 더 "app icon" 느낌: 바탕 여백 늘려서 rounded-square 가독성 ↑
    pm.id === 'coinbase' ? 7 :
    pm.id === 'bitpay' ? 0 :   // 앱 아이콘 — 타일에 꽉차게
    pm.id === 'stripe' ? 10 :
    8

  const tileBorderRadius = pm.id === 'base' ? 12 : 10   // Base 는 더 둥글게 (iOS app icon 스타일)

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: tileBorderRadius,
        background: pm.color,
        color: 'white',
        flexShrink: 0,
        overflow: 'hidden',
        padding,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {pm.id === 'base' ? (
        <BaseSymbol />
      ) : pm.id === 'coinbase' ? (
        <CoinbaseSymbol />
      ) : err ? (
        <span style={{ fontSize: 16, fontWeight: 700 }}>{pm.initial}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pm.logoUrl}
          alt={pm.label}
          onError={() => setErr(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}

type Step = 'select' | 'pay' | 'success'

export default function CreditModal() {
  const { creditModalOpen, setCreditModalOpen, addCredits, setActiveTab } = useDreamStore()
  const [step, setStep] = useState<Step>('select')
  const [picked, setPicked] = useState<Package | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [successCredits, setSuccessCredits] = useState<number | null>(null)
  const t = useT()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  // 모달 열린 동안 body 스크롤 잠금
  useEffect(() => {
    if (!creditModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [creditModalOpen])

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!creditModalOpen) {
      setTimeout(() => {
        setStep('select')
        setPicked(null)
        setSuccessCredits(null)
      }, 250)
    }
  }, [creditModalOpen])

  // Stripe 새 탭에서 결제 완료 시 postMessage 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type !== 'STRIPE_PAYMENT_DONE') return
      if (e.data.status === 'confirmed') {
        setSuccessCredits(e.data.credits)
        setStep('success')
        setCreditModalOpen(true)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [setCreditModalOpen])

  const handlePickPackage = (pkg: Package) => {
    setPicked(pkg)
    setStep('pay')
  }

  const handleBasePay = async () => {
    if (!picked) return
    setPayError(null)
    setPayingId('base')

    const merchant = process.env.NEXT_PUBLIC_BASE_PAY_MERCHANT
    const testnet = process.env.NEXT_PUBLIC_BASE_PAY_TESTNET === 'true'

    if (!merchant) {
      setPayError(t('credit.err.merchant'))
      setPayingId(null)
      return
    }

    // 패키지 USD 금액 (크레딧 패키지 마스터와 동일)
    const amountUsd = picked.id === 'basic' ? '0.75'
                    : picked.id === 'popular' ? '1.90'
                    : '3.75'

    try {
      // Base Pay SDK — 지갑 앱이 열려 송금 확인을 받음
      const result = await pay({
        amount: amountUsd,
        to: merchant,
        testnet,
      })
      if (!result || !('id' in result) || !result.id) {
        throw new Error(t('credit.err.cancelled'))
      }

      // 서버 검증 → 크레딧 지급
      const res = await fetch('/api/payment/verify-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseId: result.id, packageId: picked.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? t('credit.err.verify'))
      }

      // 성공 → 로컬 store 에도 크레딧 반영 (서버는 이미 반영함)
      addCredits(picked.credits, {
        type: 'purchase',
        label: `${t(picked.labelKey)}${t('credit.pkg.suffix')} · Base Pay${testnet ? ' (Testnet)' : ''}`,
        priceWon: picked.price,
      })
      setCreditModalOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('credit.err.generic')
      setPayError(msg)
    } finally {
      setPayingId(null)
    }
  }

  const handleStripe = async () => {
    if (!picked) return
    setPayError(null)
    setPayingId('stripe')

    // async 함수 안에서 window.open 하면 브라우저가 팝업 차단 + 현재 탭도 이동시키는 버그 발생.
    // fetch 전에 동기적으로 새 탭 먼저 열고, URL 받아서 거기로 보내는 방식으로 해결.
    const newTab = window.open('', '_blank')

    try {
      const res = await fetch('/api/payment/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: picked.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.checkoutUrl) {
        newTab?.close()
        throw new Error(body.error ?? t('credit.err.session'))
      }
      if (newTab) {
        newTab.location.href = body.checkoutUrl
      } else {
        // 팝업 차단된 경우 — 현재 페이지는 유지하고 안내
        setPayError(t('credit.err.popup'))
        setPayingId(null)
        return
      }
      setPayingId(null)
    } catch (err) {
      newTab?.close()
      const msg = err instanceof Error ? err.message : t('credit.err.generic')
      setPayError(msg)
      setPayingId(null)
    }
  }

  const handleStripeOnramp = async () => {
    if (!picked) return
    setPayError(null)
    setPayingId('stripe_onramp')

    const newTab = window.open('', '_blank')

    try {
      const res = await fetch('/api/payment/stripe/create-onramp-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: picked.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.redirectUrl) {
        newTab?.close()
        throw new Error(body.error ?? t('credit.err.onramp'))
      }
      if (newTab) {
        newTab.location.href = body.redirectUrl
      } else {
        setPayError(t('credit.err.popup'))
      }
    } catch (err) {
      newTab?.close()
      const msg = err instanceof Error ? err.message : t('credit.err.generic')
      setPayError(msg)
    } finally {
      setPayingId(null)
    }
  }

  const handleBinance = async () => {
    if (!picked) return
    setPayError(null)
    setPayingId('binance')
    try {
      const res = await fetch('/api/payment/binance/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: picked.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? t('credit.err.order'))
      }
      // 모바일: deeplink / 데스크톱: checkoutUrl (or QR). 일단 checkoutUrl 우선.
      const target = body.checkoutUrl ?? body.universalUrl ?? body.deeplink ?? body.qrCodeLink
      if (!target) {
        throw new Error(t('credit.err.noLink'))
      }
      window.location.assign(target)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('credit.err.generic')
      setPayError(msg)
      setPayingId(null)
    }
  }

  const handleCoinbase = async () => {
    if (!picked) return
    setPayError(null)
    setPayingId('coinbase')
    try {
      const res = await fetch('/api/payment/coinbase/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: picked.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.checkoutUrl) {
        throw new Error(body.error ?? t('credit.err.invoice'))
      }
      window.location.assign(body.checkoutUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('credit.err.generic')
      setPayError(msg)
      setPayingId(null)
    }
  }

  const handleBitPay = async () => {
    if (!picked) return
    setPayError(null)
    setPayingId('bitpay')
    try {
      const res = await fetch('/api/payment/bitpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: picked.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.checkoutUrl) {
        throw new Error(body.error ?? t('credit.err.invoice'))
      }
      // BitPay 호스팅 체크아웃으로 리다이렉트 — 결제 완료 시 /payment/success 로 복귀
      window.location.assign(body.checkoutUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('credit.err.generic')
      setPayError(msg)
      setPayingId(null)
    }
  }

  const handlePay = (payment: PaymentMethod) => {
    if (payingId) return  // 이미 진행 중이면 무시
    if (payment.id === 'base') {
      handleBasePay()
      return
    }
    if (payment.id === 'coinbase') {
      handleCoinbase()
      return
    }
    if (payment.id === 'bitpay') {
      handleBitPay()
      return
    }
    if (payment.id === 'stripe') {
      handleStripe()
      return
    }
    if (payment.id === 'stripe_onramp') {
      handleStripeOnramp()
      return
    }
    if (payment.id === 'binance') {
      handleBinance()
      return
    }
  }

  const handleViewHistory = () => {
    setCreditModalOpen(false)
    setActiveTab('history')
  }

  return (
    <AnimatePresence>
      {creditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {/* Top-center toast — 포지셔닝 wrapper 와 애니메이션 motion 을 분리해
              framer-motion 의 transform 이 중앙 정렬을 덮어쓰지 않게 한다. */}
          <AnimatePresence>
            {toast && (
              <div
                key="toast-wrapper"
                style={{
                  position: 'fixed',
                  top: 24,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  zIndex: 100,
                  pointerEvents: 'none',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '11px 20px',
                    borderRadius: 999,
                    background: '#C4C0F5',  // 앱 포인트 보라 (밝은 계열)
                    color: '#03050D',       // 가장 어두운 네이비
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  {toast}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreditModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              minHeight: 480,
              padding: 24,
              borderRadius: 24,
              background: '#090E22',
              border: '1px solid rgba(127,119,221,0.28)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {step === 'pay' ? (
                <button
                  onClick={() => setStep('select')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    fontSize: 13,
                    background: 'none',
                    border: 'none',
                    color: '#8890B0',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C4C0F5')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8890B0')}
                >
                  <ArrowLeftIcon size={14} /> {t('common.back')}
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DiamondIcon size={16} style={{ color: '#9D96F0' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8E8F4' }}>{t('credit.title')}</h2>
                </div>
              )}
              <button
                onClick={() => setCreditModalOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#555E80',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <CloseIcon size={13} />
              </button>
            </div>

            {/* Body — AnimatePresence swaps step content inline */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                {step === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, flex: 1, textAlign: 'center' }}
                  >
                    <div style={{
                      width: 72, height: 72, borderRadius: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(127,119,221,0.35), rgba(196,75,114,0.25))',
                      border: '1px solid rgba(127,119,221,0.5)',
                    }}>
                      <DiamondIcon size={36} style={{ color: '#C4C0F5' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: '#E8E8F4' }}>결제 완료!</p>
                      {successCredits != null && (
                        <p style={{ fontSize: 14, color: '#8890B0' }}>
                          총 보유 크레딧{' '}
                          <span style={{ color: '#C4C0F5', fontWeight: 700 }}>{successCredits}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setCreditModalOpen(false)}
                      style={{
                        marginTop: 8,
                        width: '100%',
                        padding: '13px 0',
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
                        color: 'white',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      확인
                    </button>
                  </motion.div>
                ) : step === 'select' ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {PACKAGES.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => handlePickPackage(pkg)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            borderRadius: 16,
                            background: pkg.badge ? 'rgba(127,119,221,0.15)' : 'rgba(255,255,255,0.04)',
                            border: pkg.badge
                              ? '1px solid rgba(127,119,221,0.45)'
                              : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 36, height: 36, borderRadius: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: pkg.badge ? 'rgba(127,119,221,0.25)' : 'rgba(255,255,255,0.06)',
                                flexShrink: 0,
                              }}
                            >
                              <DiamondIcon size={16} style={{ color: pkg.badge ? '#9D96F0' : '#8890B0' }} />
                            </div>
                            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#E8E8F4' }}>
                                  {pkg.credits.toLocaleString()}
                                </span>
                                <DiamondIcon size={11} style={{ color: '#9D96F0' }} />
                                {pkg.badge && (
                                  <span
                                    style={{
                                      fontSize: 10, fontWeight: 700,
                                      padding: '2px 6px', borderRadius: 999,
                                      background: '#7F77DD', color: 'white',
                                      marginLeft: 4,
                                    }}
                                  >
                                    {pkg.badge}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 12, color: '#8890B0' }}>{t(pkg.labelKey)}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#C4C0F5' }}>
                            ₩{pkg.price.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleViewHistory}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 500,
                        background: 'transparent',
                        color: '#8890B0',
                        border: '1px solid rgba(255,255,255,0.07)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        marginTop: 'auto',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {t('credit.history')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pay"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}
                  >
                    {/* Summary of picked package */}
                    {picked && (
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: 'linear-gradient(135deg, rgba(127,119,221,0.15), rgba(196,75,114,0.1))',
                          border: '1px solid rgba(127,119,221,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <DiamondIcon size={18} style={{ color: '#9D96F0' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#E8E8F4' }}>
                              {picked.credits.toLocaleString()} {t('credit.currency')}
                            </span>
                            <span style={{ fontSize: 11, color: '#8890B0' }}>{t(picked.labelKey)}{t('credit.pkg.suffix')}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#C4C0F5' }}>
                          ₩{picked.price.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80', letterSpacing: 0.5 }}>
                      {t('credit.selectMethod')}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {PAYMENTS.map((pm) => {
                        const busy = payingId === pm.id
                        const disabled = !!payingId
                        return (
                          <button
                            key={pm.id}
                            onClick={() => handlePay(pm)}
                            disabled={disabled}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 14px',
                              borderRadius: 12,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              opacity: disabled && !busy ? 0.5 : 1,
                              transition: 'background 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              if (disabled) return
                              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                              e.currentTarget.style.borderColor = `${pm.color}88`
                            }}
                            onMouseLeave={(e) => {
                              if (disabled) return
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                            }}
                          >
                            <PaymentLogo pm={pm} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F4', display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {pm.label}
                                {((pm.id === 'base' && process.env.NEXT_PUBLIC_BASE_PAY_TESTNET === 'true')
                                  || (pm.id === 'bitpay' && process.env.NEXT_PUBLIC_BITPAY_TESTNET === 'true')) && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#C4C0F5', background: 'rgba(127,119,221,0.18)', padding: '2px 6px', borderRadius: 999 }}>
                                    TESTNET
                                  </span>
                                )}
                              </span>
                              <span style={{ fontSize: 11, color: '#8890B0' }}>
                                {busy ? t('credit.walletWaiting') : t(pm.subKey)}
                              </span>
                            </div>
                            <ChevronRightIcon size={14} style={{ color: '#555E80' }} />
                          </button>
                        )
                      })}
                    </div>

                    {payError && (
                      <p style={{ fontSize: 12, color: '#E8899A', padding: '0 4px' }}>
                        ⚠️ {payError}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
