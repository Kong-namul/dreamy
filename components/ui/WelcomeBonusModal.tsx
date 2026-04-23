'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { DiamondIcon } from '@/components/ui/Icons'
import { useT } from '@/lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
}

export default function WelcomeBonusModal({ open, onClose }: Props) {
  const t = useT()
  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              pointerEvents: 'auto',
              width: '100%', maxWidth: 340,
              padding: '28px 24px',
              borderRadius: 24,
              background: 'linear-gradient(160deg, #13183A 0%, #0D1330 100%)',
              border: '1px solid rgba(127,119,221,0.45)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(127,119,221,0.18), 0 0 60px rgba(127,119,221,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64, height: 64, borderRadius: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(127,119,221,0.35), rgba(196,75,114,0.25))',
                border: '1px solid rgba(127,119,221,0.5)',
              }}
            >
              <DiamondIcon size={32} style={{ color: '#C4C0F5' }} />
            </div>

            <p style={{ fontSize: 18, fontWeight: 800, color: '#E8E8F4', lineHeight: 1.4 }}>
              {t('welcome.title')}
            </p>

            <p style={{ fontSize: 14, color: '#C0C4DC', lineHeight: 1.6 }}>
              {t('welcome.body')}<br />
              <span style={{ color: '#C4C0F5', fontWeight: 700 }}>
                <DiamondIcon size={14} style={{ color: '#A09AEE', display: 'inline-block', verticalAlign: 'middle', marginRight: 3 }} />
                {t('welcome.credits')}
              </span>
              {t('welcome.closing')}
            </p>

            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 6,
                width: '100%',
                padding: '12px 0',
                borderRadius: 14,
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #7F77DD, #C44B72)',
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(127,119,221,0.35)',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {t('welcome.cta')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
