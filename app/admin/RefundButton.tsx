'use client'
import { useState } from 'react'

type State =
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'submitting' }
  | { kind: 'done'; refundId: string; refundStatus: string }
  | { kind: 'error'; message: string }

export default function RefundButton({ paymentId }: { paymentId: string }) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [reason, setReason] = useState('')

  if (state.kind === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ color: '#7FE3A0', fontSize: 11, fontWeight: 700 }}>환불 시작 ✓</span>
        <span style={{ color: '#8890B0', fontSize: 10 }}>
          {state.refundStatus} · 1~2분 후 크레딧 자동 차감
        </span>
      </div>
    )
  }

  if (state.kind === 'confirming') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
        <input
          type="text"
          placeholder="사유 (선택)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{
            padding: '6px 8px',
            fontSize: 11,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#E8E8F4',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={async () => {
              setState({ kind: 'submitting' })
              try {
                const res = await fetch('/api/admin/refund', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, reason: reason || undefined }),
                })
                const body = await res.json().catch(() => ({}))
                if (!res.ok) {
                  setState({ kind: 'error', message: body.error ?? `HTTP ${res.status}` })
                  return
                }
                setState({
                  kind: 'done',
                  refundId: body.refundId,
                  refundStatus: body.refundStatus,
                })
              } catch (err) {
                setState({ kind: 'error', message: (err as Error).message })
              }
            }}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              background: '#E36B7F',
              color: '#0A0E1F',
              fontWeight: 700,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              flex: 1,
            }}
          >
            환불 확정
          </button>
          <button
            onClick={() => setState({ kind: 'idle' })}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              background: 'rgba(255,255,255,0.06)',
              color: '#C0C4DC',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  if (state.kind === 'submitting') {
    return <span style={{ color: '#9D96F0', fontSize: 11 }}>처리 중...</span>
  }

  if (state.kind === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
        <span style={{ color: '#E36B7F', fontSize: 11 }}>실패: {state.message}</span>
        <button
          onClick={() => setState({ kind: 'idle' })}
          style={{
            padding: '4px 8px',
            fontSize: 11,
            background: 'rgba(255,255,255,0.06)',
            color: '#C0C4DC',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState({ kind: 'confirming' })}
      style={{
        padding: '6px 12px',
        fontSize: 11,
        background: 'rgba(227,107,127,0.14)',
        color: '#E36B7F',
        fontWeight: 700,
        border: '1px solid rgba(227,107,127,0.3)',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      환불
    </button>
  )
}
