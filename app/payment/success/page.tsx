'use client'
/**
 * /payment/success?id=<paymentId>
 * BitPay (및 기타 redirect-flow PG) 결제 완료 후 돌아오는 랜딩.
 * 서버 웹훅이 아직 안 왔을 수 있으니 상태를 폴링한다.
 */
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DiamondIcon } from '@/components/ui/Icons'

type Status = 'pending' | 'confirmed' | 'failed' | 'expired' | 'unknown'

export default function PaymentSuccessPage() {
  const params = useSearchParams()
  const router = useRouter()
  const paymentId = params.get('id')
  const [status, setStatus] = useState<Status>('pending')
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (!paymentId) return
    let cancelled = false
    let tries = 0

    const poll = async () => {
      if (cancelled) return
      tries += 1
      try {
        const res = await fetch(`/api/payment/${paymentId}/status`, { cache: 'no-store' })
        if (res.ok) {
          const body = await res.json() as { status: Status; credits?: number }
          if (!cancelled) {
            setStatus(body.status)
            if (body.credits != null) setCredits(body.credits)
            if (body.status === 'confirmed' || body.status === 'failed' || body.status === 'expired') {
              return
            }
          }
        }
      } catch { /* retry */ }

      if (tries < 60 && !cancelled) {
        setTimeout(poll, 2000)
      } else if (!cancelled) {
        setStatus('unknown')
      }
    }

    poll()
    return () => { cancelled = true }
  }, [paymentId])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #03050D 0%, #060C1C 50%, #0A1530 100%)',
        color: '#E8E8F4',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%', maxWidth: 360,
          padding: 28, borderRadius: 24,
          background: 'rgba(13,19,48,0.8)',
          border: '1px solid rgba(127,119,221,0.35)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}
      >
        {status === 'pending' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid rgba(127,119,221,0.3)',
                borderTopColor: '#C4C0F5',
              }}
            />
            <p style={{ fontSize: 16, fontWeight: 700 }}>결제 확인 중…</p>
            <p style={{ fontSize: 13, color: '#8890B0', lineHeight: 1.6 }}>
              블록체인 컨펌을 기다리고 있어요.<br />
              보통 1~2분 이내에 처리돼요.
            </p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(127,119,221,0.35), rgba(196,75,114,0.25))',
              border: '1px solid rgba(127,119,221,0.5)',
            }}>
              <DiamondIcon size={32} style={{ color: '#C4C0F5' }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800 }}>결제 완료</p>
            {credits != null && (
              <p style={{ fontSize: 14, color: '#C0C4DC' }}>
                총 보유 크레딧:{' '}
                <span style={{ color: '#C4C0F5', fontWeight: 700 }}>{credits}</span>
              </p>
            )}
          </>
        )}

        {(status === 'failed' || status === 'expired') && (
          <>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#E8899A' }}>결제 실패</p>
            <p style={{ fontSize: 13, color: '#8890B0' }}>
              {status === 'expired' ? '결제 시간이 만료됐어요.' : '결제가 정상적으로 처리되지 않았어요.'}
            </p>
          </>
        )}

        {status === 'unknown' && (
          <>
            <p style={{ fontSize: 16, fontWeight: 700 }}>상태 확인 지연</p>
            <p style={{ fontSize: 13, color: '#8890B0' }}>
              잠시 후 설정 → 충전 히스토리에서 결과를 확인해주세요.
            </p>
          </>
        )}

        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '12px 0',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
            color: 'white',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          홈으로
        </button>
      </motion.div>
    </div>
  )
}
