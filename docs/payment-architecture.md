# Dreamy 결제 아키텍처 설계

> 5개 결제 수단(Stripe · Coinbase Commerce · BitPay · Base Pay · Binance Pay)을 **실서비스**로 연동하기 위한 전체 설계.
> 프로토타입 방식(클라이언트가 직접 크레딧 증가)은 **모두 제거**하고 서버 중심 검증 플로우로 재구성.

---

## 1. 핵심 원칙

1. **크레딧 지급은 서버에서만** — 클라이언트가 보낸 결제 성공 신호는 절대 신뢰하지 않는다.
2. **webhook 서명 검증 필수** — 모든 provider 는 webhook 으로 결제 완료를 통지, 반드시 HMAC/서명 검증.
3. **멱등성 (Idempotency)** — webhook 재전송·네트워크 재시도로 중복 지급이 절대 나지 않도록 `payments.provider_tx_id` 를 unique 로 두고 처리.
4. **금액 서버 확정** — 패키지 가격·크레딧 수량은 서버 DB 에서만 결정, 클라이언트 요청 body 는 `packageId` 만 받는다.
5. **감사 로그** — 모든 webhook 원본·서명·처리 결과를 `webhook_logs` 에 저장 (분쟁/디버깅용).

---

## 2. 공통 시퀀스 다이어그램

### 결제 생성 (Initiate)

```
┌────────┐          ┌──────────────────┐          ┌──────────┐          ┌─────────────┐
│ Client │          │ Next.js API      │          │ Postgres │          │  Provider   │
│ (React)│          │ /api/payment/... │          │ (Supabase)│         │  (Stripe등) │
└────┬───┘          └────────┬─────────┘          └────┬─────┘          └──────┬──────┘
     │                       │                         │                        │
     │ 1. POST /create       │                         │                        │
     │  { packageId, method }│                         │                        │
     ├──────────────────────>│                         │                        │
     │                       │                         │                        │
     │                       │ 2. 세션 검증(NextAuth)  │                        │
     │                       │    → userId 추출         │                        │
     │                       │                         │                        │
     │                       │ 3. SELECT package        │                        │
     │                       │    (amount, credits)     │                        │
     │                       ├────────────────────────>│                        │
     │                       │<────────────────────────┤                        │
     │                       │                         │                        │
     │                       │ 4. INSERT payment(status=pending)                 │
     │                       │    paymentId 생성                                  │
     │                       ├────────────────────────>│                        │
     │                       │                         │                        │
     │                       │ 5. provider API 호출 (amount, metadata={paymentId, userId})
     │                       ├─────────────────────────────────────────────────>│
     │                       │<─────────────────────────────────────────────────┤
     │                       │ 6. { hostedUrl | qrCode | txRequest, providerRef }│
     │                       │                         │                        │
     │                       │ 7. UPDATE payment       │                        │
     │                       │    SET provider_ref      │                        │
     │                       ├────────────────────────>│                        │
     │                       │                         │                        │
     │<──────────────────────┤ 8. { paymentId, redirect/qr/tx }                 │
     │                       │                         │                        │
     │ 9. redirect / QR 노출  │                         │                        │
     │  / WalletConnect       │                         │                        │
     │                       │                         │                        │
```

### 결제 확정 (Confirm, via Webhook)

```
┌──────────┐          ┌──────────────────┐          ┌──────────┐
│ Provider │          │ Next.js API      │          │ Postgres │
│  (Stripe)│          │ /api/webhooks/.. │          │          │
└────┬─────┘          └────────┬─────────┘          └────┬─────┘
     │                         │                         │
     │ 1. POST webhook         │                         │
     │  (signed payload)       │                         │
     ├────────────────────────>│                         │
     │                         │                         │
     │                         │ 2. 서명 검증 (HMAC/공개키) │
     │                         │    실패 → 400 즉시 반환   │
     │                         │                         │
     │                         │ 3. INSERT webhook_log    │
     │                         │    (event_id, raw_body)  │
     │                         ├────────────────────────>│
     │                         │                         │
     │                         │ 4. SELECT payment         │
     │                         │    WHERE provider_tx_id   │
     │                         ├────────────────────────>│
     │                         │<────────────────────────┤
     │                         │                         │
     │                         │ 5. 이미 confirmed? → 200  │
     │                         │    (멱등성 보장)          │
     │                         │                         │
     │                         │ 6. 트랜잭션 시작           │
     │                         │    ├ UPDATE payment       │
     │                         │    │   SET status=confirmed│
     │                         │    ├ UPDATE users         │
     │                         │    │   SET credits=credits+X│
     │                         │    └ INSERT credit_tx     │
     │                         ├────────────────────────>│
     │                         │                         │
     │<────────────────────────┤ 7. 200 OK                │
```

### 클라이언트 상태 동기화

프론트엔드는 두 가지 방식 중 선택:

**A. 폴링 (simplest)**
- 결제 시작 후 `/api/payment/status/:paymentId` 를 2~3초 간격으로 조회 (최대 5분)
- status 가 `confirmed` → 크레딧 반영 + 성공 UI
- `expired` → 재시도 UI

**B. Supabase Realtime (권장)**
- `payments` 테이블 UPDATE 를 구독
- webhook 처리 완료 → 즉시 UI 업데이트 (지연 없음)

---

## 3. 데이터베이스 스키마

> Supabase/Postgres 기준. Prisma 또는 Drizzle ORM 사용 가능.

### 3.1 `users`
```sql
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text,
  image_url     text,
  nickname      text not null default '꿈꾸는이',
  credits       integer not null default 50,   -- 가입 보너스
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

### 3.2 `credit_packages`
```sql
create table credit_packages (
  id            text primary key,              -- 'basic' | 'popular' | 'large'
  label         text not null,                 -- '기본' | '인기' | '대용량'
  credits       integer not null,              -- 100 | 300 | 700
  price_krw     integer not null,              -- 1000 | 2500 | 5000
  price_usd_cents integer not null,            -- 크립토 결제용
  badge         text,                          -- 'BEST'
  active        boolean not null default true,
  sort_order    integer not null default 0
);
```

### 3.3 `payments`
```sql
create table payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id),
  package_id      text not null references credit_packages(id),
  method          text not null check (method in (
    'stripe', 'coinbase_commerce', 'bitpay', 'base_pay', 'binance_pay'
  )),
  amount_krw      integer,                     -- 원화 결제 시
  amount_usd_cents integer,                    -- 크립토/해외 결제 시
  status          text not null default 'pending' check (status in (
    'pending', 'confirmed', 'expired', 'failed', 'refunded'
  )),
  provider_ref    text,                        -- Stripe session id / Coinbase charge id / ...
  provider_tx_id  text unique,                 -- 최종 거래 ID (webhook 에서 채워짐)
  metadata        jsonb,                       -- provider 별 부가 정보
  idempotency_key text unique,                 -- 클라이언트 재시도 안전
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  expired_at      timestamptz
);

create index on payments (user_id, created_at desc);
create index on payments (status);
```

### 3.4 `credit_transactions`
```sql
create table credit_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id),
  type          text not null check (type in (
    'purchase', 'spend', 'bonus', 'refund'
  )),
  amount        integer not null,              -- + 충전/보너스, - 사용
  label         text not null,                 -- '기본 팩 구매 · Stripe' / '기본 해석 · 별빛 호수'
  payment_id    uuid references payments(id),  -- purchase 에만 연결
  dream_id      uuid,                          -- spend 시 연관 꿈
  created_at    timestamptz not null default now()
);

create index on credit_transactions (user_id, created_at desc);
```

### 3.5 `webhook_logs`
```sql
create table webhook_logs (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,                 -- 'stripe' | 'coinbase_commerce' | ...
  event_id      text,                          -- provider 의 unique event id
  event_type    text,                          -- 'checkout.session.completed' 등
  signature_ok  boolean not null,
  body          jsonb not null,
  processed     boolean not null default false,
  error         text,
  received_at   timestamptz not null default now(),
  unique (provider, event_id)
);
```

### 3.6 `dreams` (기존 클라이언트 데이터를 서버로 이동)
```sql
create table dreams (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id),
  dream_text      text not null,
  interpretation  text,
  moods           text[],                      -- 멀티셀렉트
  auspice         text check (auspice in ('auspicious','ominous','neutral')),
  type            text not null check (type in ('basic','premium')),
  weather         text,
  pages           jsonb,                       -- premium: DiaryPage[]
  interpretation_blocks jsonb,                 -- premium: InterpretationBlock[]
  lucky           jsonb,                       -- premium: LuckyToday
  shared          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index on dreams (user_id, created_at desc);
create index on dreams (shared, created_at desc) where shared = true;
```

### 3.7 `dream_comments`
```sql
create table dream_comments (
  id            uuid primary key default gen_random_uuid(),
  dream_id      uuid not null references dreams(id) on delete cascade,
  author_id     uuid not null references users(id),
  author_name   text not null,
  text          text not null,
  created_at    timestamptz not null default now()
);

create index on dream_comments (dream_id, created_at);
```

---

## 4. API 엔드포인트 설계

### 4.1 결제 시작
```
POST /api/payment/create
Authorization: next-auth session cookie
Body: { packageId: 'popular', method: 'stripe' }
Response: {
  paymentId: 'uuid',
  method: 'stripe',
  // method 별 분기
  checkout: {
    kind: 'redirect' | 'qrcode' | 'wallet_tx',
    url?: string,          // Stripe, Coinbase, BitPay
    qrCode?: string,       // Binance Pay
    tx?: {                 // Base Pay
      to: string,
      amount: string,      // USDC wei 단위
      token: '0xUSDCaddr',
      chainId: 8453
    }
  }
}
```

### 4.2 상태 조회 (폴링용)
```
GET /api/payment/status/:paymentId
Response: {
  status: 'pending' | 'confirmed' | 'expired' | 'failed',
  confirmedAt?: string,
  credits?: number        // 확정 시 증가된 크레딧
}
```

### 4.3 Webhook 엔드포인트
```
POST /api/webhooks/stripe
POST /api/webhooks/coinbase-commerce
POST /api/webhooks/bitpay
POST /api/webhooks/binance-pay
POST /api/payment/verify-onchain       # Base Pay (클라이언트가 tx hash 전달)
```

### 4.4 기존 크레딧 API (DB 이관 후)
```
GET  /api/credits                 → 내 크레딧
GET  /api/credits/history          → 거래 내역
POST /api/credits/spend           → 해석 요청 시 차감 (서버에서만)
```

---

## 5. 결제 수단별 연동 세부

### 5.1 Stripe (카드 결제, Priority 1)

**환경변수**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**생성 (서버)**
```ts
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'krw',
      product_data: { name: `${pkg.label} 팩 · ${pkg.credits} 크레딧` },
      unit_amount: pkg.price_krw,
    },
    quantity: 1,
  }],
  metadata: { paymentId, userId, packageId },
  success_url: `${origin}/payment/success?id=${paymentId}`,
  cancel_url: `${origin}/payment/cancel?id=${paymentId}`,
})
return { checkout: { kind: 'redirect', url: session.url } }
```

**Webhook (`checkout.session.completed`)**
```ts
const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
if (event.type === 'checkout.session.completed') {
  const session = event.data.object
  const { paymentId, userId } = session.metadata
  // 트랜잭션으로 payment confirm + credit grant
}
```

**수수료**: 국내 카드 2.9% + 30원 / 해외 3.6%

---

### 5.2 Coinbase Commerce (크립토 통합, Priority 2)

**환경변수**
```
COINBASE_COMMERCE_API_KEY=...
COINBASE_COMMERCE_WEBHOOK_SECRET=...
```

**생성**
```ts
const charge = await fetch('https://api.commerce.coinbase.com/charges', {
  method: 'POST',
  headers: {
    'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY,
    'X-CC-Version': '2018-03-22',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: `Dreamy ${pkg.label} 팩`,
    description: `${pkg.credits} 크레딧`,
    pricing_type: 'fixed_price',
    local_price: { amount: (pkg.price_usd_cents/100).toFixed(2), currency: 'USD' },
    metadata: { paymentId, userId, packageId },
  }),
}).then(r => r.json())
return { checkout: { kind: 'redirect', url: charge.data.hosted_url } }
```

**Webhook 검증**
```ts
const sig = req.headers['x-cc-webhook-signature']
const computed = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
if (sig !== computed) return res.status(400).end()
// event.type === 'charge:confirmed' → grant
```

**수수료**: 1%

---

### 5.3 BitPay (Bitcoin, Priority 3)

**환경변수**
```
BITPAY_TOKEN=merchantToken...
BITPAY_NOTIFICATION_URL=https://yoursite/api/webhooks/bitpay
```

**생성**
```ts
const invoice = await fetch('https://bitpay.com/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-accept-version': '2.0.0',
    'x-identity': publicIdentity,
    'x-signature': signature,       // 요청별 ECDSA 서명
  },
  body: JSON.stringify({
    token: BITPAY_TOKEN,
    price: pkg.price_usd_cents / 100,
    currency: 'USD',
    orderId: paymentId,
    notificationURL: BITPAY_NOTIFICATION_URL,
    redirectURL: `${origin}/payment/success?id=${paymentId}`,
  })
}).then(r => r.json())
return { checkout: { kind: 'redirect', url: invoice.data.url } }
```

**IPN webhook 검증**: BitPay 는 서명이 아니라 서버가 **BitPay API 에 재조회** 해서 확정 확인.

**주의**: 한국 법인 KYB 심사 통과 어려울 수 있음.

---

### 5.4 Base Pay (USDC 원탭, Priority 4)

**환경변수**
```
BASE_RPC_URL=https://mainnet.base.org
MERCHANT_WALLET_ADDRESS=0x...              # 수령 지갑
ALCHEMY_API_KEY=...                         # 트랜잭션 조회용
```

**생성 (tx request 반환, 실제 서명은 클라이언트 지갑)**
```ts
const usdAmount = pkg.price_usd_cents / 100
const usdcAmount = BigInt(Math.round(usdAmount * 1_000_000))  // USDC 6 decimals
return {
  checkout: {
    kind: 'wallet_tx',
    tx: {
      to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // USDC on Base
      data: encodeTransfer(MERCHANT_WALLET, usdcAmount),
      chainId: 8453,
      value: '0x0',
    },
    expectedAmount: usdcAmount.toString(),
    paymentId,
  }
}
```

**검증 (클라이언트가 tx hash 전송 후)**
```
POST /api/payment/verify-onchain
Body: { paymentId, txHash }

→ 서버가 Alchemy/Base RPC 로 tx 조회
→ to=MERCHANT_WALLET, amount 일치, confirmations >= 1 확인
→ grant
```

**수수료**: 가스비 수 센트

---

### 5.5 Binance Pay (아시아, Priority 5)

**환경변수**
```
BINANCE_PAY_API_KEY=...
BINANCE_PAY_API_SECRET=...
```

**생성**
```ts
const payload = {
  env: { terminalType: 'WEB' },
  merchantTradeNo: paymentId,
  orderAmount: (pkg.price_usd_cents / 100).toFixed(2),
  currency: 'USDT',
  goods: {
    goodsType: '01',
    goodsCategory: 'Z000',
    referenceGoodsId: pkg.id,
    goodsName: `Dreamy ${pkg.label} 팩`,
  },
  webhookUrl: `${origin}/api/webhooks/binance-pay`,
}
// HMAC-SHA512 서명 계산
const timestamp = Date.now()
const nonce = randomString(32)
const signPayload = `${timestamp}\n${nonce}\n${JSON.stringify(payload)}\n`
const signature = crypto.createHmac('sha512', API_SECRET).update(signPayload).digest('hex').toUpperCase()

const res = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order', {
  method: 'POST',
  headers: {
    'BinancePay-Timestamp': timestamp,
    'BinancePay-Nonce': nonce,
    'BinancePay-Certificate-SN': API_KEY,
    'BinancePay-Signature': signature,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
}).then(r => r.json())

return { checkout: { kind: 'qrcode', qrCode: res.data.qrcodeLink, deeplink: res.data.deeplink } }
```

**수수료**: 0% (프로모션) / 일반 낮음

---

## 6. 보안·컴플라이언스

### 6.1 필수 보안
- 모든 webhook 서명 검증 (각 provider 규약 준수)
- API 라우트 rate limit (Upstash Redis 권장)
- 결제 생성 시 CSRF 방지 (NextAuth 세션 쿠키 sameSite)
- 서버 지갑 private key → KMS (AWS Secrets / Vercel Env) 저장, 노출 금지

### 6.2 한국 법률
- **여신전문금융업법**: Stripe 는 국내 PG 대행 가능 (합법)
- **특정금융정보법 (특금법)**: 크립토 직접 수령 시 **VASP 신고 의무** 발생 가능
  - 회피 방법: Coinbase Commerce·BitPay 같은 **non-custodial PG** 사용 (그들이 US 법인)
  - 자체 Base Pay 운영은 법률 검토 권장
- **가상자산 과세**: 2027 년 시행 예정, 매출 신고 대비 필요

### 6.3 PCI-DSS
- Stripe Checkout 은 PCI Level 1 호스팅 → 카드 정보를 우리 서버가 절대 안 봄 → 컴플라이언스 책임 최소화
- 직접 카드 입력폼 만들면 PCI 부담 커짐 (비권장)

---

## 7. 마이그레이션 플랜 (현재 → 실서비스)

### 단계 1: DB 이관
- Supabase 프로젝트 생성
- 위 스키마 적용 + seed (credit_packages 3개)
- Prisma 또는 `@supabase/supabase-js` 연결
- NextAuth adapter → Supabase
- 현재 `dreamStore.ts` 의 로컬 상태 → API 경유 서버 상태로 이관

### 단계 2: Stripe 연동 (1주)
- Stripe 계정 + KYC
- `/api/payment/create` 구현 (method='stripe' 분기)
- `/api/webhooks/stripe` 구현 + 서명 검증
- `CreditModal` 의 `handlePay` → `/api/payment/create` 호출로 변경
- 테스트: Stripe test mode 카드번호 `4242 4242 4242 4242`

### 단계 3: Coinbase Commerce (3~4일)
- commerce.coinbase.com 가입
- `/api/payment/create` method='coinbase_commerce' 분기
- `/api/webhooks/coinbase-commerce` 구현
- 테스트: Coinbase test mode

### 단계 4: 나머지 3개 순차 연동
- BitPay → Binance Pay → Base Pay 순 (심사 난이도 순)

### 단계 5: 모니터링
- Sentry 에 webhook 에러 알림
- 매일 payment reconciliation 스크립트 (provider dashboard vs DB 일치 확인)

---

## 8. 테스트 시나리오

| 케이스 | 기대 결과 |
|--------|-----------|
| 정상 결제 | credits 증가 · payment confirmed · credit_tx 기록 |
| Webhook 중복 수신 | 2번째는 no-op, credits 증가 1회만 |
| Webhook 서명 오류 | 400 반환, DB 변경 없음 |
| 결제 타임아웃 | status=expired 후 자동 롤백 (차감한 거 없음) |
| 환불 (Stripe dashboard) | `charge.refunded` webhook → credit_tx type='refund' + credits 차감 |
| 잘못된 패키지 ID | 400, payment 생성 자체 불가 |
| 브라우저 닫힘 후 결제 완료 | webhook 만으로 credits 반영, 다음 접속 시 보임 |

---

## 9. 참고 링크

- [Stripe Checkout Docs](https://docs.stripe.com/checkout/quickstart)
- [Coinbase Commerce API](https://docs.cloud.coinbase.com/commerce/docs)
- [BitPay API Docs](https://developer.bitpay.com/reference/rest-api-overview)
- [Base Pay Docs](https://docs.base.org/identity/smart-wallet/quickstart/payment)
- [Binance Pay Merchant API](https://developers.binance.com/docs/binance-pay/introduction)
- [Supabase + Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
