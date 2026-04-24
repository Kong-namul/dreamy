'use client'
import React from 'react'
import { radius } from '@/lib/tokens'

/**
 * Pill 형태 배지. 길몽·그림일기·번역중 등 짧은 상태 라벨 공통 스타일.
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  background?: string
  color?: string
  borderColor?: string
  size?: 'sm' | 'md'
}

export default function Badge({
  background = 'rgba(127,119,221,0.22)',
  color: fg = '#C4C0F5',
  borderColor,
  size = 'md',
  style,
  children,
  ...rest
}: BadgeProps) {
  const padding = size === 'sm' ? '3px 10px' : '4px 12px'
  const fontSize = size === 'sm' ? 10 : 11
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: radius.pill,
        fontSize,
        fontWeight: 700,
        background,
        color: fg,
        letterSpacing: 0.5,
        border: borderColor ? `1px solid ${borderColor}` : 'none',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
