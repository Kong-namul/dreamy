'use client'
import React from 'react'
import { color } from '@/lib/tokens'

/**
 * 무한 스크롤 / 페이지 로딩 등에서 쓰는 3점 반짝임 인디케이터.
 */

export interface LoadingDotsProps {
  dotColor?: string
  size?: number
  gap?: number
  style?: React.CSSProperties
}

export default function LoadingDots({
  dotColor = color.purple,
  size = 6,
  gap = 6,
  style,
}: LoadingDotsProps) {
  return (
    <div style={{ display: 'inline-flex', gap, ...style }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: size, height: size, borderRadius: '50%',
            background: dotColor,
            animation: 'twinkle 1.1s ease-in-out infinite',
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
    </div>
  )
}
