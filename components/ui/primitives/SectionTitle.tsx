'use client'
import React from 'react'
import { color } from '@/lib/tokens'

/**
 * 탭/섹션 상단에 반복되는 "큰 제목 + 작은 서브텍스트" 헤더.
 * 예: Dream Feed / Browse shared dreams
 */

export interface SectionTitleProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** 제목 옆에 붙는 우측 액션 (필터/전환 버튼 등) */
  action?: React.ReactNode
  style?: React.CSSProperties
}

export default function SectionTitle({ title, subtitle, action, style }: SectionTitleProps) {
  return (
    <div style={{ padding: '0 4px', marginBottom: 4, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: color.text }}>{title}</p>
        {action}
      </div>
      {subtitle != null && (
        <p style={{ fontSize: 13, color: color.subtext, marginTop: 4 }}>{subtitle}</p>
      )}
    </div>
  )
}
