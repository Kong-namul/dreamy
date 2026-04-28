# Dreamy — AI 꿈 해석 서비스

당신의 꿈을 AI가 해석해드려요. 한국 전통 해몽과 서구 심리학(Jung/Freud)을 블렌딩한 해석을 **기본 텍스트** 또는 **5장짜리 그림일기** 형식으로 받아볼 수 있어요.

🔗 **Live**: https://dreamy-tau.vercel.app

## ✨ 주요 기능

- **기본 해석 (5💎)** — 600~900자 구구절절한 4단 해석 (풍경·상징·심리·조언)
- **그림일기 해석 (15💎)** — 꿈을 5장짜리 삽화 일기로 재구성 + 상세 해석 블록 + 오늘의 행운
- **드림피드** — 다른 사용자의 공개 꿈 둘러보기, 댓글 달기
- **내 일기** — 내가 해석한 꿈 모아보기, 공개/비공개 전환
- **크레딧 시스템** — 가입 시 50💎 증정. 결제 수단 현황:
  - **Stripe (테스트 모드)** — 카드 결제 코드 연동 완료, Sandbox 키로 동작 (Live 전환은 KYB 통과 후)
  - **Coinbase Commerce / BitPay / Base Pay / Binance Pay** — 코드 스캐폴드만 있음, 실연동 예정 (UI에서는 "준비 중" 표시 필요)

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind v4 + inline styles + framer-motion
- **State**: Zustand + persist
- **Auth**: NextAuth (Google OAuth)
- **AI**: Anthropic Claude API
- **Image**: Pollinations (그림일기 일러스트) + Picsum 폴백
- **Deploy**: Vercel + GitHub 연동 자동 배포

## 📚 문서

- [`docs/dream-interpretation-rules.md`](docs/dream-interpretation-rules.md) — 해몽 품질·상징·톤·데이터 구조 레퍼런스
- [`docs/payment-architecture.md`](docs/payment-architecture.md) — 결제 시스템 실서비스 설계

## 🚀 로컬 개발

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 생성)
ANTHROPIC_API_KEY=sk-ant-...
AUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<Google Cloud OAuth Client ID>
GOOGLE_CLIENT_SECRET=<Google Cloud OAuth Client Secret>
NEXTAUTH_URL=http://localhost:3000

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속.

## 📜 라이선스

개인 프로젝트 (비공개 라이선스).
