'use client'
import { useDreamStore } from '@/store/dreamStore'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, DiamondIcon } from '@/components/ui/Icons'
import { CreditTransaction } from '@/types'
import { useT, t as tt } from '@/lib/i18n'
import { useDreamStore as useStore } from '@/store/dreamStore'

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(17, 26, 58, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
  padding: 16,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const locale = useStore.getState().locale === 'en' ? 'en-US' : 'ko-KR'
  return d.toLocaleString(locale, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function TypeBadge({ type }: { type: CreditTransaction['type'] }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    purchase: { label: tt('creditHistory.tx.purchase'), bg: 'rgba(127,119,221,0.2)',  fg: '#C4C0F5' },
    bonus:    { label: tt('creditHistory.tx.bonus'),    bg: 'rgba(127,221,180,0.18)', fg: '#9BE5C0' },
    spend:    { label: tt('creditHistory.tx.spend'),    bg: 'rgba(196,75,114,0.18)',  fg: '#E8899A' },
    refund:   { label: tt('creditHistory.tx.refund'),   bg: 'rgba(200,200,200,0.16)', fg: '#B8C2CC' },
  }
  const entry = map[type] ?? map['spend']
  return (
    <span style={{
      display: 'inline-flex',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 700,
      background: entry.bg,
      color: entry.fg,
      flexShrink: 0,
    }}>
      {entry.label}
    </span>
  )
}

function Row({ tx, index }: { tx: CreditTransaction; index: number }) {
  const isNegative = tx.amount < 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TypeBadge type={tx.type} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#E8E8F4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#555E80' }}>{formatDate(tx.date)}</span>
          {tx.priceWon != null && (
            <span style={{ fontSize: 11, color: '#8890B0' }}>· ₩{tx.priceWon.toLocaleString()}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: isNegative ? '#E8899A' : '#C4C0F5',
        }}>
          {isNegative ? '' : '+'}{tx.amount}
        </span>
        <DiamondIcon size={12} style={{ color: isNegative ? '#E8899A' : '#C4C0F5' }} />
      </div>
    </motion.div>
  )
}

export default function CreditHistoryTab() {
  const { creditHistory, credits, setActiveTab, setCreditModalOpen } = useDreamStore()
  const t = useT()

  const totalPurchased = creditHistory
    .filter((t) => t.type === 'purchase')
    .reduce((acc, t) => acc + (t.priceWon ?? 0), 0)
  const totalSpent = Math.abs(
    creditHistory.filter((t) => t.type === 'spend').reduce((acc, t) => acc + t.amount, 0)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>
      {/* Header with back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <button
          onClick={() => setActiveTab('new')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            background: 'none',
            border: 'none',
            color: '#8890B0',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#C4C0F5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8890B0')}
        >
          <ArrowLeftIcon size={14} /> {t('common.back')}
        </button>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>{t('creditHistory.title')}</p>
        <div style={{ width: 48 }} />
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ ...CARD_STYLE, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 11, color: '#8890B0' }}>{t('settings.stats.credits')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#C4C0F5' }}>{credits}</span>
            <DiamondIcon size={12} style={{ color: '#9D96F0' }} />
          </div>
        </div>
        <div style={{ ...CARD_STYLE, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 11, color: '#8890B0' }}>{t('creditHistory.totalPurchased')}</p>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#E8E8F4' }}>₩{totalPurchased.toLocaleString()}</span>
        </div>
        <div style={{ ...CARD_STYLE, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 11, color: '#8890B0' }}>{t('creditHistory.totalSpent')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#E8899A' }}>{totalSpent}</span>
            <DiamondIcon size={12} style={{ color: '#E8899A' }} />
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#C4C0F5' }}>{t('creditHistory.title')}</p>
          <span style={{ fontSize: 11, color: '#555E80' }}>{creditHistory.length}{t('creditHistory.count')}</span>
        </div>
        {creditHistory.length === 0 ? (
          <p style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#555E80' }}>
            {t('creditHistory.empty')}
          </p>
        ) : (
          creditHistory.map((tx, i) => <Row key={tx.id} tx={tx} index={i} />)
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => setCreditModalOpen(true)}
        style={{
          padding: '14px 0',
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          transition: 'filter 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        {t('credit.title')}
      </button>
    </div>
  )
}
