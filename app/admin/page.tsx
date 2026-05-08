/**
 * 관리자 대시보드 (최소 기능판).
 *
 * 현재 한 가지 기능만:
 *  - 최근 결제 목록 보기
 *  - confirmed 상태인 coinbase_commerce 결제에 환불 트리거
 *
 * 인증: ADMIN_EMAILS env 에 등록된 이메일로 로그인된 세션만.
 * 그 외에는 안내 문구 + 메인으로 돌아가기 버튼.
 */
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminAuth'
import { supabaseServer } from '@/lib/supabase/server'
import RefundButton from './RefundButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PaymentRow {
  id: string
  user_id: string
  package_id: string
  method: string
  credits: number
  amount_usd_cents: number | null
  amount_krw: number | null
  status: string
  provider_payment_id: string | null
  provider_tx_hash: string | null
  confirmed_at: string | null
  created_at: string
}

interface UserRow {
  id: string
  email: string | null
  name: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFB347',
  confirmed: '#7FE3A0',
  refunded: '#9D96F0',
  failed: '#E36B7F',
  expired: '#8890B0',
}

const METHOD_LABELS: Record<string, string> = {
  coinbase_commerce: 'Coinbase',
  stripe: 'Stripe',
  base_pay: 'Base Pay',
  bitpay: 'BitPay',
  binance_pay: 'Binance',
}

export default async function AdminPage() {
  const admin = await getAdminSession()
  if (!admin) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #03050D 0%, #060C1C 48%, #0A1530 100%)',
          color: '#E8E8F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ color: '#9D96F0', fontSize: 13, fontWeight: 700 }}>Dreamy Admin</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0 }}>접근 권한 없음</h1>
          <p style={{ color: '#8890B0', fontSize: 14, lineHeight: 1.7 }}>
            관리자 이메일로 로그인 후 다시 접근하세요. 본인 계정인데 보이지 않으면
            ADMIN_EMAILS 환경변수에 이메일이 등록되어 있는지 확인해 주세요.
          </p>
          <a
            href="/"
            style={{
              marginTop: 12,
              display: 'inline-block',
              padding: '10px 18px',
              background: '#7F77DD',
              color: '#0A0E1F',
              fontWeight: 700,
              borderRadius: 999,
              textDecoration: 'none',
            }}
          >
            메인으로
          </a>
        </div>
      </main>
    )
  }

  const supa = supabaseServer()
  const { data: rawPayments, error } = await supa
    .from('payments')
    .select('id, user_id, package_id, method, credits, amount_usd_cents, amount_krw, status, provider_payment_id, provider_tx_hash, confirmed_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <main style={{ padding: 40, color: '#E36B7F' }}>
        결제 목록 조회 실패: {error.message}
      </main>
    )
  }

  const payments = (rawPayments ?? []) as PaymentRow[]
  const userIds = Array.from(new Set(payments.map(p => p.user_id)))

  let usersById: Record<string, UserRow> = {}
  if (userIds.length > 0) {
    const { data: users } = await supa
      .from('users')
      .select('id, email, name')
      .in('id', userIds)
    if (users) {
      usersById = Object.fromEntries((users as UserRow[]).map(u => [u.id, u]))
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #03050D 0%, #060C1C 48%, #0A1530 100%)',
        color: '#E8E8F4',
        padding: '40px 20px 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 28 }}>
          <p style={{ color: '#9D96F0', fontSize: 13, fontWeight: 700 }}>Dreamy Admin · {admin.email}</p>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 900, letterSpacing: 0 }}>
            결제 관리
          </h1>
          <p style={{ color: '#8890B0', fontSize: 13, lineHeight: 1.7 }}>
            최근 결제 50건. confirmed 상태의 Coinbase 결제에 환불 트리거 가능.
            환불 후 크레딧 차감은 Coinbase webhook 도착 시 자동으로 일어남 (보통 1~2분).
          </p>
        </header>

        {payments.length === 0 ? (
          <p style={{ color: '#8890B0', fontSize: 14, padding: '24px 0' }}>아직 결제 기록 없음.</p>
        ) : (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'rgba(8,12,28,0.6)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                  <th style={thStyle}>일시</th>
                  <th style={thStyle}>사용자</th>
                  <th style={thStyle}>방식</th>
                  <th style={thStyle}>금액</th>
                  <th style={thStyle}>크레딧</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>환불</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const u = usersById[p.user_id] ?? null
                  const amountLabel =
                    p.amount_usd_cents != null
                      ? `$${(p.amount_usd_cents / 100).toFixed(2)}`
                      : p.amount_krw != null
                        ? `₩${p.amount_krw.toLocaleString()}`
                        : '—'
                  const isCoinbaseConfirmed = p.method === 'coinbase_commerce' && p.status === 'confirmed'
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={tdStyle}>
                        <div style={{ color: '#C0C4DC' }}>{formatDate(p.created_at)}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: '#E8E8F4', fontWeight: 600 }}>{u?.name ?? '—'}</div>
                        <div style={{ color: '#8890B0', fontSize: 11 }}>{u?.email ?? p.user_id.slice(0, 8)}</div>
                      </td>
                      <td style={tdStyle}>{METHOD_LABELS[p.method] ?? p.method}</td>
                      <td style={tdStyle}>{amountLabel}</td>
                      <td style={tdStyle}>{p.credits}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'rgba(127,119,221,0.12)',
                            color: STATUS_COLORS[p.status] ?? '#C0C4DC',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {isCoinbaseConfirmed ? (
                          <RefundButton paymentId={p.id} />
                        ) : (
                          <span style={{ color: '#5A6080', fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: '#8890B0',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}

const tdStyle: React.CSSProperties = {
  padding: '14px',
  color: '#C0C4DC',
  verticalAlign: 'top',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}
