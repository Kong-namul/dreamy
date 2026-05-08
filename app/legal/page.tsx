import type React from 'react'

const UPDATED_AT = '2026-05-08'

// 운영자 고객지원 이메일.
const SUPPORT_EMAIL = 'sangsang0@parametacorp.com'

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

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={{ color: '#E8E8F4', fontSize: 20, fontWeight: 800, letterSpacing: 0 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function LegalPage() {
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
        <header style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 26 }}>
          <p style={{ color: '#9D96F0', fontSize: 13, fontWeight: 700 }}>
            Dreamy
          </p>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 900, letterSpacing: 0 }}>
            이용약관 및 정책
          </h1>
          <p style={{ ...paragraphStyle, color: '#8890B0' }}>
            최종 업데이트: {UPDATED_AT}. 이 문서는 Dreamy 서비스 이용 조건, 개인정보 처리, 크레딧 및 결제 정책의 기본 안내입니다.
          </p>
        </header>

        <Section title="1. 서비스 소개">
          <p style={paragraphStyle}>
            Dreamy는 사용자가 입력한 꿈 내용을 바탕으로 해몽, 그림일기, 드림피드, 크레딧 기반 생성 기능을 제공하는 서비스입니다. 해석 결과는 오락과 자기성찰을 위한 콘텐츠이며, 의학, 법률, 재무, 심리치료 등 전문 조언을 대체하지 않습니다.
          </p>
        </Section>

        <Section title="2. 계정과 이용 책임">
          <ul style={listStyle}>
            <li>사용자는 본인의 Google 계정 등 인증 수단을 통해 Dreamy를 이용할 수 있습니다.</li>
            <li>타인의 개인정보, 민감정보, 불법적이거나 유해한 내용을 입력하거나 공유하지 않아야 합니다.</li>
            <li>서비스 남용, 자동화된 과도한 요청, 보안 우회 시도는 제한될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="3. 꿈 콘텐츠와 공개 범위">
          <ul style={listStyle}>
            <li>사용자가 작성한 꿈은 기본적으로 비공개로 저장됩니다.</li>
            <li>사용자가 직접 공개한 꿈만 드림피드에 표시될 수 있습니다.</li>
            <li>공개된 꿈에는 다른 사용자가 댓글을 남길 수 있으며, 사용자는 공개 상태를 변경하거나 삭제할 수 있습니다.</li>
            <li>AI가 생성한 해몽과 그림은 입력 내용과 모델 특성에 따라 부정확하거나 예상과 다를 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="4. 크레딧, 결제, 환불">
          <ul style={listStyle}>
            <li>Dreamy의 일부 기능은 크레딧을 사용합니다. 예: 기본 해석, 그림일기 생성.</li>
            <li>크레딧은 결제, 보너스, 운영상 보정 등을 통해 지급될 수 있습니다.</li>
            <li>AI 생성 또는 저장이 실패한 경우, 시스템은 가능한 범위에서 차감된 크레딧을 자동 복구합니다.</li>
            <li>결제 수단별 환불 가능 여부와 처리 기간은 Stripe, Coinbase 등 결제 제공자의 정책에 영향을 받을 수 있습니다.</li>
            <li>테스트 모드 결제는 실제 구매가 아니며, 운영 검증 목적으로만 사용됩니다.</li>
          </ul>
          <p style={{ ...paragraphStyle, marginTop: 6 }}>
            <strong style={{ color: '#E8E8F4' }}>환불 정책 요약</strong>
          </p>
          <ul style={listStyle}>
            <li><strong style={{ color: '#E8E8F4' }}>요청 기한</strong>: 결제 후 7일 이내.</li>
            <li><strong style={{ color: '#E8E8F4' }}>환불 가능 범위</strong>: 미사용 크레딧 한도 내. 이미 해석/그림일기 생성에 소비된 크레딧은 환불되지 않습니다.</li>
            <li><strong style={{ color: '#E8E8F4' }}>처리 기간</strong>: 영업일 기준 1~3일. 크립토 결제는 블록체인 컨펌 시간이 추가될 수 있습니다.</li>
            <li><strong style={{ color: '#E8E8F4' }}>네트워크 수수료</strong>: 크립토 결제(Coinbase 등)의 경우 결제 처리 수수료(약 1%)는 환불되지 않습니다. 실제 환불 금액은 결제 시 발생한 수수료를 제외한 금액입니다.</li>
            <li><strong style={{ color: '#E8E8F4' }}>요청 방법</strong>:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Dreamy 환불 요청`} style={{ color: '#9D96F0', textDecoration: 'underline' }}>
                {SUPPORT_EMAIL}
              </a>
              {' '}으로 결제 일시·금액·사유를 적어 보내주세요.
            </li>
          </ul>
        </Section>

        <Section title="5. 개인정보 처리">
          <p style={paragraphStyle}>
            Dreamy는 서비스 제공을 위해 계정 이메일, 닉네임, 아바타, 꿈 작성 내용, 공개 여부, 댓글, 크레딧 거래 내역, 결제 상태, 오류 진단 로그 등을 처리할 수 있습니다.
          </p>
          <ul style={listStyle}>
            <li>계정 정보는 로그인, 사용자 식별, 크레딧 관리에 사용됩니다.</li>
            <li>꿈과 댓글 데이터는 저장, 조회, 번역, 공유 기능 제공에 사용됩니다.</li>
            <li>결제 관련 데이터는 결제 확인, 중복 지급 방지, 환불 및 고객 지원에 사용됩니다.</li>
            <li>오류 로그는 장애 분석과 서비스 안정화를 위해 사용됩니다.</li>
          </ul>
        </Section>

        <Section title="6. 외부 서비스">
          <p style={paragraphStyle}>
            Dreamy는 인증, 데이터 저장, 결제, AI 생성, 이미지 생성 등을 위해 Google, Supabase, Vercel, Stripe, Anthropic 및 기타 외부 서비스를 사용할 수 있습니다. 각 외부 서비스의 처리 방식은 해당 제공자의 약관과 개인정보 처리방침을 따를 수 있습니다.
          </p>
        </Section>

        <Section title="7. 탈퇴와 데이터 삭제">
          <ul style={listStyle}>
            <li>사용자는 설정 화면에서 계정 탈퇴를 요청할 수 있습니다.</li>
            <li>탈퇴 시 계정은 비활성 처리되며, 서비스 운영과 정산, 보안, 분쟁 대응에 필요한 일부 기록은 일정 기간 보관될 수 있습니다.</li>
            <li>공개 콘텐츠와 댓글은 삭제 또는 비공개 처리 정책에 따라 서비스에서 더 이상 표시되지 않도록 처리될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="8. 책임 제한">
          <p style={paragraphStyle}>
            Dreamy는 안정적인 서비스를 제공하기 위해 노력하지만, AI 결과의 정확성, 외부 API 장애, 네트워크 문제, 결제 제공자 장애 등 모든 상황을 보장하지는 않습니다. 중요한 의사결정에는 Dreamy의 해석 결과만을 근거로 사용하지 마세요.
          </p>
        </Section>

        <Section title="9. 문의">
          <p style={paragraphStyle}>
            서비스 이용, 결제, 환불, 개인정보, 탈퇴와 관련한 문의는 아래 이메일로 접수해 주세요. 영업일 기준 1~3일 이내에 답변드립니다.
          </p>
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
        </Section>

        <footer style={{ paddingTop: 24, color: '#555E80', fontSize: 12, lineHeight: 1.7 }}>
          이 문서는 제품 초기 운영을 위한 기본 초안입니다. 정식 출시 전 법률 검토에 따라 내용이 변경될 수 있습니다.
        </footer>
      </div>
    </main>
  )
}
