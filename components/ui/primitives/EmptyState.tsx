'use client'
import React from 'react'
import { color, radius } from '@/lib/tokens'

/**
 * 빈 상태 자리 ("아직 저장된 꿈이 없어요" 같은) 공통 레이아웃.
 * 아이콘(선택) + 타이틀 + 힌트 + 옵션 액션.
 */

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: React.ReactNode
  hint?: React.ReactNode
  action?: React.ReactNode
  /** 패딩 조정 — 탭 전체 빈 상태는 크게, 작은 영역은 작게 */
  padding?: number | string
}

export default function EmptyState({ icon, title, hint, action, padding = '96px 0' }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding, gap: 12,
    }}>
      {icon != null && (
        <div style={{
          width: 56, height: 56, borderRadius: radius.md,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: color.purpleTint12,
        }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: 14, fontWeight: 500, color: color.subtext }}>{title}</p>
      {hint != null && (
        <p style={{ fontSize: 12, color: color.placeholder }}>{hint}</p>
      )}
      {action}
    </div>
  )
}
