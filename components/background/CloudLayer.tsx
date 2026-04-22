'use client'
import { motion } from 'framer-motion'

export default function CloudLayer({ height = '42%', slideIn = false }: { height?: string; slideIn?: boolean }) {
  const inner = (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, #0a2a6e44 40%, #1a5fb466 100%)' }}
      />

      {/* Back cloud — left-heavy */}
      <svg
        viewBox="0 0 1440 1000"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, bottom: 0, left: '-40px', width: 'calc(100% + 80px)', height: '100%', animation: 'bob 10s ease-in-out infinite', filter: 'blur(var(--cloud-back-blur))', opacity: 'var(--cloud-back-opacity)' as unknown as number }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,360 C100,350 170,210 250,210 C330,210 380,310 430,310 C500,310 550,225 640,225 C730,225 760,305 840,305 C920,305 930,250 1020,250 C1110,250 1380,515 1440,530 L1440,1000 L0,1000 Z"
          fill="rgba(210,225,255,1)"
        />
      </svg>

      {/* Mid cloud — center-high */}
      <svg
        viewBox="0 0 1440 1000"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, bottom: 0, left: '-40px', width: 'calc(100% + 80px)', height: '100%', animation: 'bob 7s ease-in-out infinite', animationDelay: '1.2s', filter: 'blur(var(--cloud-mid-blur))', opacity: 'var(--cloud-mid-opacity)' as unknown as number }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,615 C300,608 480,437 600,437 C640,437 670,455 690,455 C710,455 775,390 795,390 C815,390 870,455 890,455 C910,455 950,437 980,437 C1100,437 1200,608 1440,615 L1440,1000 L0,1000 Z"
          fill="rgba(225,235,255,1)"
        />
      </svg>

      {/* Front cloud — right-heavy */}
      <svg
        viewBox="0 0 1440 1000"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, bottom: 0, left: '-40px', width: 'calc(100% + 80px)', height: '100%', animation: 'bob2 5.5s ease-in-out infinite', animationDelay: '0.6s', filter: 'blur(var(--cloud-front-blur))', opacity: 'var(--cloud-front-opacity)' as unknown as number }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,710 C80,705 130,690 170,685 C210,680 250,700 300,705 C350,710 400,682 450,668 C500,654 530,672 580,678 C630,683 685,648 745,625 C805,602 858,618 910,616 C962,614 1005,578 1055,544 C1090,520 1120,520 1150,520 C1180,520 1225,490 1272,456 C1310,430 1372,418 1440,412 L1440,1000 L0,1000 Z"
          fill="rgba(240,245,255,1)"
        />
      </svg>

    </div>
  )

  return (
    <motion.div
      style={{
        position: 'fixed',   // viewport 기준 고정 → 피드 스크롤해도 높이 유지
        left: 0,
        right: 0,
        bottom: '-20px',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      initial={slideIn ? { y: '100%', height } : { height }}
      animate={{ y: 0, height }}
      transition={{
        y: { duration: 1.6, ease: [0.16, 1, 0.3, 1] },
        height: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      {inner}
    </motion.div>
  )
}
