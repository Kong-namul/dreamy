'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { DiamondIcon, CloseIcon, ArrowLeftIcon, ChevronRightIcon } from '@/components/ui/Icons'

interface Package {
  id: string
  label: string
  credits: number
  price: number
  badge?: string
}

const PACKAGES: Package[] = [
  { id: 'basic',   label: '기본',   credits: 100, price: 1000 },
  { id: 'popular', label: '인기',   credits: 300, price: 2500, badge: 'BEST' },
  { id: 'large',   label: '대용량', credits: 700, price: 5000 },
]

interface PaymentMethod {
  id: string
  label: string
  sub: string
  color: string
  initial: string
  logoUrl: string  // Simple Icons CDN — 흰색 SVG
}

// 로고 소스:
//  · Simple Icons CDN (https://cdn.simpleicons.org/<slug>/<hex>) — coinbase/bitcoin/stripe/binance 지원
//  · Base: GitHub org 아바타 (Base 전용 파란 원형 B 로고)
//  · 실패 시 initial 폴백
const PAYMENTS: PaymentMethod[] = [
  {
    id: 'base',
    label: 'Base Pay',
    sub: 'Base Account · USDC 원클릭',
    color: '#0052FF',
    initial: 'B',
    logoUrl: 'https://avatars.githubusercontent.com/u/108554348?s=64', // base-org 공식 로고
  },
  {
    id: 'coinbase',
    label: 'Coinbase Commerce',
    sub: '멀티체인 크립토 결제 (BTC · ETH · USDC)',
    color: '#1652F0',
    initial: 'C',
    logoUrl: 'https://cdn.simpleicons.org/coinbase/FFFFFF',
  },
  {
    id: 'bitpay',
    label: 'BitPay',
    sub: 'Bitcoin · Lightning · 스테이블코인',
    color: '#1A2A44',
    initial: 'Ƀ',
    // BitPay 앱 아이콘 (B-only, 180x180 PNG) — bitpay.com apple-touch-icon
    logoUrl: 'https://framerusercontent.com/images/2iIIkkV5Qoskq2dfhwja8G8rFW0.png',
  },
  {
    id: 'stripe',
    label: 'Stripe Crypto',
    sub: '카드 결제 + 크립토 온램프',
    color: '#635BFF',
    initial: 'S',
    logoUrl: 'https://cdn.simpleicons.org/stripe/FFFFFF',
  },
  {
    id: 'binance',
    label: 'Binance Pay',
    sub: 'Binance 지갑 P2P 결제',
    color: '#F3BA2F',
    initial: 'ß',
    logoUrl: 'https://cdn.simpleicons.org/binance/FFFFFF',
  },
]

// Base 공식 심볼 — 원 + 오른쪽 수평선 패턴. 부모 박스 100% 채움.
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
    pm.id === 'base' ? 7 :
    pm.id === 'coinbase' ? 7 :
    pm.id === 'bitpay' ? 0 :   // 앱 아이콘 — 타일에 꽉차게
    pm.id === 'stripe' ? 10 :
    8

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
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

type Step = 'select' | 'pay'

export default function CreditModal() {
  const { creditModalOpen, setCreditModalOpen, addCredits, setActiveTab } = useDreamStore()
  const [step, setStep] = useState<Step>('select')
  const [picked, setPicked] = useState<Package | null>(null)

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
      }, 250)
    }
  }, [creditModalOpen])

  const handlePickPackage = (pkg: Package) => {
    setPicked(pkg)
    setStep('pay')
  }

  const handlePay = (payment: PaymentMethod) => {
    if (!picked) return
    addCredits(picked.credits, {
      type: 'purchase',
      label: `${picked.label} 팩 · ${payment.label}`,
      priceWon: picked.price,
    })
    setCreditModalOpen(false)
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
                  <ArrowLeftIcon size={14} /> 뒤로
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DiamondIcon size={16} style={{ color: '#9D96F0' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8E8F4' }}>크레딧 충전</h2>
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
                {step === 'select' ? (
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
                              <span style={{ fontSize: 12, color: '#8890B0' }}>{pkg.label}</span>
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
                      충전 히스토리 보기
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
                              {picked.credits.toLocaleString()} 크레딧
                            </span>
                            <span style={{ fontSize: 11, color: '#8890B0' }}>{picked.label} 팩</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#C4C0F5' }}>
                          ₩{picked.price.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <p style={{ fontSize: 11, fontWeight: 600, color: '#555E80', letterSpacing: 0.5 }}>
                      결제 방법 선택
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {PAYMENTS.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => handlePay(pm)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            transition: 'background 0.15s, border-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                            e.currentTarget.style.borderColor = `${pm.color}88`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                          }}
                        >
                          <PaymentLogo pm={pm} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8F4' }}>
                              {pm.label}
                            </span>
                            <span style={{ fontSize: 11, color: '#8890B0' }}>{pm.sub}</span>
                          </div>
                          <ChevronRightIcon size={14} style={{ color: '#555E80' }} />
                        </button>
                      ))}
                    </div>
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
