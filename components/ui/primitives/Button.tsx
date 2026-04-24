'use client'
import React from 'react'
import { color, radius } from '@/lib/tokens'

/**
 * 기본 버튼 컴포넌트. 인라인 스타일 기반 디자인 시스템 입구.
 *
 * variants
 * - primary  : 보라 배경 + 흰 글자 (CTA)
 * - secondary: 카드톤 배경 + 보라 테두리 (서브 액션)
 * - ghost    : 배경 없음, hover 시 살짝 강조 (목록의 작은 액션)
 *
 * size
 * - sm: 인라인/카드 내부
 * - md: 기본
 * - lg: 전면 CTA
 */

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

const PADDING: Record<Size, string> = {
  sm: '6px 12px',
  md: '10px 18px',
  lg: '14px 22px',
}
const FONT_SIZE: Record<Size, number> = { sm: 12, md: 14, lg: 15 }

function getVariantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: color.purple,
        color: 'white',
        border: 'none',
      }
    case 'secondary':
      return {
        background: color.purpleTint12,
        color: color.purpleSoft,
        border: `1px solid ${color.purpleBorder}`,
      }
    case 'ghost':
    default:
      return {
        background: 'transparent',
        color: color.text,
        border: 'none',
      }
  }
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  leadingIcon,
  trailingIcon,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: PADDING[size],
    fontSize: FONT_SIZE[size],
    fontWeight: 600,
    borderRadius: radius.md,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : loading ? 0.75 : 1,
    transition: 'transform 0.15s, filter 0.15s, opacity 0.15s',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
  }
  const vs = getVariantStyle(variant)

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{ ...base, ...vs, ...style }}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
}
