'use client'
import React from 'react'
import { color, radius } from '@/lib/tokens'

/**
 * 기본 카드 컨테이너. 반투명 글래스 톤. FeedCard 같은 리스트 아이템과 Stats/CreditHistory 섹션 공용.
 * 실제 FeedCard 등은 auspice 테마별 스타일이 있으니 필요 시 그대로 쓰고, 이 프리미티브는
 * "단순 회색 카드 박스" 가 필요한 곳에서 사용.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number | string
  interactive?: boolean   // hover 시 살짝 떠오르는 효과
}

export default function Card({
  padding = 18,
  interactive,
  style,
  children,
  ...rest
}: CardProps) {
  const base: React.CSSProperties = {
    background: color.cardBg,
    border: `1px solid ${color.cardBorder}`,
    borderRadius: radius.lg,
    padding,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: interactive ? 'transform 0.15s, border-color 0.15s' : undefined,
    cursor: interactive ? 'pointer' : undefined,
  }
  return (
    <div {...rest} style={{ ...base, ...style }}>
      {children}
    </div>
  )
}
