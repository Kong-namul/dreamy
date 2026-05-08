'use client'
import type React from 'react'
import { useDreamStore } from '@/store/dreamStore'

const UPDATED_AT = '2026-05-08'
const SUPPORT_EMAIL = 'sangsang0@parametacorp.com'

const mailLinkStyle: React.CSSProperties = {
  color: '#9D96F0',
  textDecoration: 'underline',
}

type Locale = 'ko' | 'en'

interface SectionContent {
  title: string
  body?: string
  bullets?: React.ReactNode[]
  extra?: React.ReactNode
}

const C: Record<Locale, {
  brand: string
  pageTitle: string
  updatedLabel: string
  intro: string
  sections: SectionContent[]
  refundPolicyLabel: string
  refundBullets: React.ReactNode[]
  contactBody: string
  toggle: { current: string; switchTo: string }
  footer: string
}> = {
  ko: {
    brand: 'Dreamy',
    pageTitle: '이용약관 및 정책',
    updatedLabel: `최종 업데이트: ${UPDATED_AT}.`,
    intro: '이 문서는 Dreamy 서비스 이용 조건, 개인정보 처리, 크레딧 및 결제 정책의 기본 안내입니다.',
    refundPolicyLabel: '환불 정책 요약',
    refundBullets: [
      <><strong style={{ color: '#E8E8F4' }}>요청 기한</strong>: 결제 후 7일 이내.</>,
      <><strong style={{ color: '#E8E8F4' }}>환불 가능 범위</strong>: 미사용 크레딧 한도 내. 이미 해석/그림일기 생성에 소비된 크레딧은 환불되지 않습니다.</>,
      <><strong style={{ color: '#E8E8F4' }}>처리 기간</strong>: 영업일 기준 1~3일. 크립토 결제는 블록체인 컨펌 시간이 추가될 수 있습니다.</>,
      <><strong style={{ color: '#E8E8F4' }}>네트워크 수수료</strong>: 크립토 결제(Coinbase 등)의 경우 결제 처리 수수료(약 1%)는 환불되지 않습니다. 실제 환불 금액은 결제 시 발생한 수수료를 제외한 금액입니다.</>,
      <><strong style={{ color: '#E8E8F4' }}>요청 방법</strong>:{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Dreamy 환불 요청`} style={mailLinkStyle}>{SUPPORT_EMAIL}</a>
        {' '}으로 결제 일시·금액·사유를 적어 보내주세요.
      </>,
    ],
    contactBody: '서비스 이용, 결제, 환불, 개인정보, 탈퇴와 관련한 문의는 아래 이메일로 접수해 주세요. 영업일 기준 1~3일 이내에 답변드립니다.',
    toggle: { current: 'KO', switchTo: 'EN' },
    footer: '이 문서는 제품 초기 운영을 위한 기본 초안입니다. 정식 출시 전 법률 검토에 따라 내용이 변경될 수 있습니다.',
    sections: [
      {
        title: '1. 서비스 소개',
        body: 'Dreamy는 사용자가 입력한 꿈 내용을 바탕으로 해몽, 그림일기, 드림피드, 크레딧 기반 생성 기능을 제공하는 서비스입니다. 해석 결과는 오락과 자기성찰을 위한 콘텐츠이며, 의학, 법률, 재무, 심리치료 등 전문 조언을 대체하지 않습니다.',
      },
      {
        title: '2. 계정과 이용 책임',
        bullets: [
          '사용자는 본인의 Google 계정 등 인증 수단을 통해 Dreamy를 이용할 수 있습니다.',
          '타인의 개인정보, 민감정보, 불법적이거나 유해한 내용을 입력하거나 공유하지 않아야 합니다.',
          '서비스 남용, 자동화된 과도한 요청, 보안 우회 시도는 제한될 수 있습니다.',
        ],
      },
      {
        title: '3. 꿈 콘텐츠와 공개 범위',
        bullets: [
          '사용자가 작성한 꿈은 기본적으로 비공개로 저장됩니다.',
          '사용자가 직접 공개한 꿈만 드림피드에 표시될 수 있습니다.',
          '공개된 꿈에는 다른 사용자가 댓글을 남길 수 있으며, 사용자는 공개 상태를 변경하거나 삭제할 수 있습니다.',
          'AI가 생성한 해몽과 그림은 입력 내용과 모델 특성에 따라 부정확하거나 예상과 다를 수 있습니다.',
        ],
      },
      {
        title: '4. 크레딧, 결제, 환불',
        bullets: [
          'Dreamy의 일부 기능은 크레딧을 사용합니다. 예: 기본 해석, 그림일기 생성.',
          '크레딧은 결제, 보너스, 운영상 보정 등을 통해 지급될 수 있습니다.',
          'AI 생성 또는 저장이 실패한 경우, 시스템은 가능한 범위에서 차감된 크레딧을 자동 복구합니다.',
          '결제 수단별 환불 가능 여부와 처리 기간은 Stripe, Coinbase 등 결제 제공자의 정책에 영향을 받을 수 있습니다.',
          '테스트 모드 결제는 실제 구매가 아니며, 운영 검증 목적으로만 사용됩니다.',
        ],
      },
      {
        title: '5. 개인정보 처리',
        body: 'Dreamy는 서비스 제공을 위해 계정 이메일, 닉네임, 아바타, 꿈 작성 내용, 공개 여부, 댓글, 크레딧 거래 내역, 결제 상태, 오류 진단 로그 등을 처리할 수 있습니다.',
        bullets: [
          '계정 정보는 로그인, 사용자 식별, 크레딧 관리에 사용됩니다.',
          '꿈과 댓글 데이터는 저장, 조회, 번역, 공유 기능 제공에 사용됩니다.',
          '결제 관련 데이터는 결제 확인, 중복 지급 방지, 환불 및 고객 지원에 사용됩니다.',
          '오류 로그는 장애 분석과 서비스 안정화를 위해 사용됩니다.',
        ],
      },
      {
        title: '6. 외부 서비스',
        body: 'Dreamy는 인증, 데이터 저장, 결제, AI 생성, 이미지 생성 등을 위해 Google, Supabase, Vercel, Stripe, Anthropic 및 기타 외부 서비스를 사용할 수 있습니다. 각 외부 서비스의 처리 방식은 해당 제공자의 약관과 개인정보 처리방침을 따를 수 있습니다.',
      },
      {
        title: '7. 탈퇴와 데이터 삭제',
        bullets: [
          '사용자는 설정 화면에서 계정 탈퇴를 요청할 수 있습니다.',
          '탈퇴 시 계정은 비활성 처리되며, 서비스 운영과 정산, 보안, 분쟁 대응에 필요한 일부 기록은 일정 기간 보관될 수 있습니다.',
          '공개 콘텐츠와 댓글은 삭제 또는 비공개 처리 정책에 따라 서비스에서 더 이상 표시되지 않도록 처리될 수 있습니다.',
        ],
      },
      {
        title: '8. 책임 제한',
        body: 'Dreamy는 안정적인 서비스를 제공하기 위해 노력하지만, AI 결과의 정확성, 외부 API 장애, 네트워크 문제, 결제 제공자 장애 등 모든 상황을 보장하지는 않습니다. 중요한 의사결정에는 Dreamy의 해석 결과만을 근거로 사용하지 마세요.',
      },
    ],
  },
  en: {
    brand: 'Dreamy',
    pageTitle: 'Terms & Policies',
    updatedLabel: `Last updated: ${UPDATED_AT}.`,
    intro: 'This document is the basic guide to Dreamy’s service terms, privacy practices, and credit / payment policies.',
    refundPolicyLabel: 'Refund policy summary',
    refundBullets: [
      <><strong style={{ color: '#E8E8F4' }}>Window</strong>: within 7 days of payment.</>,
      <><strong style={{ color: '#E8E8F4' }}>Eligibility</strong>: only credits that have not yet been spent. Credits already consumed by interpretations or dream-diary generations cannot be refunded.</>,
      <><strong style={{ color: '#E8E8F4' }}>Processing time</strong>: 1–3 business days. Crypto payments may take additional time for blockchain confirmations.</>,
      <><strong style={{ color: '#E8E8F4' }}>Network fees</strong>: For crypto payments (e.g. Coinbase), the payment processing fee (about 1%) is not refunded. The actual refund amount excludes the fee originally taken at payment time.</>,
      <><strong style={{ color: '#E8E8F4' }}>How to request</strong>:{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Dreamy refund request`} style={mailLinkStyle}>{SUPPORT_EMAIL}</a>
        {' '}— please include the payment date, amount, and reason.
      </>,
    ],
    contactBody: 'For questions about service usage, payments, refunds, privacy, or account deletion, please email us. We respond within 1–3 business days.',
    toggle: { current: 'EN', switchTo: 'KO' },
    footer: 'This document is an early-operations draft. Wording may change as a formal legal review is completed before official launch.',
    sections: [
      {
        title: '1. About the service',
        body: 'Dreamy is a service that interprets dreams you describe and produces readings, dream-diary illustrations, a feed, and other credit-based features. Outputs are intended for entertainment and self-reflection, and do not replace medical, legal, financial, or therapeutic advice.',
      },
      {
        title: '2. Account & responsible use',
        bullets: [
          'You can use Dreamy through your Google account or another supported sign-in method.',
          'Do not enter or share other people’s personal information, sensitive data, or unlawful or harmful content.',
          'Service abuse, automated heavy traffic, and security bypass attempts may be restricted.',
        ],
      },
      {
        title: '3. Dream content & visibility',
        bullets: [
          'Dreams you write are private by default.',
          'Only dreams you explicitly choose to share appear on the public feed.',
          'Public dreams can receive comments from other users; you can change visibility or delete them at any time.',
          'AI-generated readings and images may be inaccurate or differ from expectations depending on input and model behavior.',
        ],
      },
      {
        title: '4. Credits, payments, refunds',
        bullets: [
          'Some Dreamy features consume credits — e.g. basic interpretation, dream-diary generation.',
          'Credits can be obtained through purchase, bonuses, or operational adjustments.',
          'If AI generation or saving fails, the system attempts to automatically restore the consumed credits where possible.',
          'Refund eligibility and processing time depend on the policies of the payment provider (Stripe, Coinbase, etc.).',
          'Test-mode payments are not real purchases and exist only for operational verification.',
        ],
      },
      {
        title: '5. Privacy',
        body: 'To operate the service, Dreamy may process account email, nickname, avatar, dream content, visibility settings, comments, credit transaction history, payment status, and error diagnostic logs.',
        bullets: [
          'Account data is used for sign-in, identification, and credit management.',
          'Dreams and comments are used to provide storage, retrieval, translation, and sharing features.',
          'Payment data is used for confirmation, deduplication, refunds, and customer support.',
          'Error logs are used for incident analysis and service stability.',
        ],
      },
      {
        title: '6. External services',
        body: 'Dreamy may use Google, Supabase, Vercel, Stripe, Anthropic, and other external services for authentication, storage, payments, AI generation, image generation, and related needs. Each provider’s processing follows their own terms and privacy policy.',
      },
      {
        title: '7. Account deletion',
        bullets: [
          'You can request account deletion from the settings screen.',
          'Upon deletion, the account is deactivated; some records required for operations, accounting, security, and dispute resolution may be retained for a limited period.',
          'Public content and comments are removed or hidden from the service in line with deletion / privacy policies.',
        ],
      },
      {
        title: '8. Limitation of liability',
        body: 'We work hard to keep the service stable, but cannot guarantee every situation — including AI accuracy, external API outages, network issues, or payment provider incidents. Please do not rely solely on Dreamy outputs for important decisions.',
      },
    ],
  },
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '22px 0',
  borderTop: '1px solid rgba(255,255,255,0.08)',
}

const paragraphStyle: React.CSSProperties = {
  color: '#C0C4DC',
  fontSize: 14,
  lineHeight: 1.8,
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#C0C4DC',
  fontSize: 14,
  lineHeight: 1.75,
  paddingLeft: 18,
}

function Section({ title, body, bullets, extra }: SectionContent) {
  return (
    <section style={sectionStyle}>
      <h2 style={{ color: '#E8E8F4', fontSize: 20, fontWeight: 800, letterSpacing: 0 }}>
        {title}
      </h2>
      {body && <p style={paragraphStyle}>{body}</p>}
      {bullets && (
        <ul style={listStyle}>
          {bullets.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
      {extra}
    </section>
  )
}

export default function LegalPage() {
  const { locale, toggleLocale } = useDreamStore()
  const t = C[(locale === 'en' ? 'en' : 'ko') as Locale]
  const isKo = locale !== 'en'

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #03050D 0%, #060C1C 48%, #0A1530 100%)',
        color: '#E8E8F4',
        padding: '40px 20px 72px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 760, margin: '0 auto' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 26, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <p style={{ color: '#9D96F0', fontSize: 13, fontWeight: 700 }}>{t.brand}</p>
            <button
              onClick={toggleLocale}
              aria-label="Toggle language"
              style={{
                padding: '6px 12px',
                background: 'rgba(127,119,221,0.14)',
                border: '1px solid rgba(127,119,221,0.3)',
                borderRadius: 999,
                color: '#9D96F0',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.toggle.current} → {t.toggle.switchTo}
            </button>
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 900, letterSpacing: 0 }}>
            {t.pageTitle}
          </h1>
          <p style={{ ...paragraphStyle, color: '#8890B0' }}>
            {t.updatedLabel} {t.intro}
          </p>
        </header>

        {t.sections.map((s, i) => {
          // Section 4: Credits, payments, refunds — append refund policy block.
          if (s.title.startsWith('4.')) {
            return (
              <Section
                key={i}
                {...s}
                extra={
                  <>
                    <p style={{ ...paragraphStyle, marginTop: 6 }}>
                      <strong style={{ color: '#E8E8F4' }}>{t.refundPolicyLabel}</strong>
                    </p>
                    <ul style={listStyle}>
                      {t.refundBullets.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </>
                }
              />
            )
          }
          return <Section key={i} {...s} />
        })}

        <section style={sectionStyle}>
          <h2 style={{ color: '#E8E8F4', fontSize: 20, fontWeight: 800, letterSpacing: 0 }}>
            {isKo ? '9. 문의' : '9. Contact'}
          </h2>
          <p style={paragraphStyle}>{t.contactBody}</p>
          <p style={paragraphStyle}>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                background: 'rgba(127,119,221,0.14)',
                border: '1px solid rgba(127,119,221,0.3)',
                borderRadius: 8,
                color: '#9D96F0',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: 0.2,
              }}
            >
              ✉️ {SUPPORT_EMAIL}
            </a>
          </p>
        </section>

        <footer style={{ paddingTop: 24, color: '#555E80', fontSize: 12, lineHeight: 1.7 }}>
          {t.footer}
        </footer>
      </div>
    </main>
  )
}
