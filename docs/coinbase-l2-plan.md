# Coinbase Layer 2 (Commerce Payments Protocol) 통합 계획

**상태**: 진행 중 (2026-05-11 시작)
**현재 단계**: Phase 1 — 백엔드 Operator 스켈레톤

---

## 왜 도입하나

기존 **Coinbase Business Checkouts API (Layer 1)** 는 즉시 정산 모델이라
머천트가 결제 후 자금 흐름을 통제할 수 없음. **Layer 2 (Commerce
Payments Protocol)** 는 온체인 에스크로 기반 authorize/capture/void
모델로, 머천트가 진짜 정산 시점을 결정할 수 있음.

dreamy 가 도입하면:
- 결제 후 admin 이 "Capture (승인)" 누를 때까지 자금이 에스크로 컨트랙트에 보관
- 부적절한 결제 발견 시 "Void (취소)" 로 즉시 손님한테 반환 (가스만 비용)
- 실제 머천트 잔액으로의 정산은 admin 결정 후

## 두 시스템 병행 운영 (이 프로젝트의 핵심 원칙)

- **기존 Layer 1 (`coinbase_commerce` method)** — 그대로 둠. 라이브 검증 완료.
- **신규 Layer 2 (`coinbase_l2` method)** — 새 결제 옵션으로 추가
- 검증 끝나면 dreamy 디폴트를 Layer 2 로 전환
- 그 후에도 Layer 1 코드는 fallback 으로 유지

## 컨트랙트 주소 (Base mainnet & Sepolia 동일)

```
AuthCaptureEscrow           0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff
ERC3009PaymentCollector      0x0E3dF9510de65469C4518D7843919c0b8C7A7757
Permit2PaymentCollector      0x992476B9Ee81d52a5BdA0622C333938D0Af0aB26
PreApprovalPaymentCollector  0x1b77ABd71FCD21fbe2398AE821Aa27D1E6B94bC6
SpendPermissionPaymentCollector  0x8d9F34934dc9619e5DC3Df27D0A40b4A744E7eAa
OperatorRefundCollector      0x934907bffd0901b6A21e398B9C53A4A38F02fa5d
```

ERC-3009 방식이 USDC 와 가장 호환 좋음 (USDC v2 가 ERC-3009 표준 구현).

## 흐름

```
[손님 측 — 브라우저]
1. 크레딧 모달 → 패키지 선택
2. "Coinbase L2 결제" 클릭
3. 지갑 연결 (wagmi/RainbowKit)
4. ERC-3009 payment intent 서명 (receiveWithAuthorization)
   → 가스 X (단순 EIP-712 서명)
5. 서명 데이터를 dreamy 서버로 전송

[dreamy 서버 — Operator 역할]
6. 받은 서명 검증
7. AuthCaptureEscrow.authorize(...) 호출
   - ERC3009PaymentCollector 가 손님 USDC → 에스크로 컨트랙트
   - 가스: Operator (= dreamy) 부담
8. payments row insert (status='authorized')

[손님 측 — 결과 표시]
9. "결제 승인됨. 검토 후 크레딧 지급됩니다" 안내
10. dreamy 메인 페이지로 복귀

[관리자 측 — admin/page]
11. authorized 상태 결제 목록 표시
12. "Capture" 클릭 → AuthCaptureEscrow.capture(paymentId, amount)
    - 자금: 에스크로 → 머천트 지갑
    - 가스: Operator 부담
    - 동시에 dreamy 크레딧 충전 (RPC 호출)
13. 또는 "Void" 클릭 → AuthCaptureEscrow.void(paymentId)
    - 자금: 에스크로 → 손님 원지갑
    - 크레딧 충전 안 함

[자동 만료]
14. authorize 시점에 expiry timestamp 설정 (예: 7일)
15. 그 전에 capture 안 누르면 → 손님이 reclaim() 호출해서 회수 가능
16. dreamy 도 자동 expiry 알림 (옵션)
```

## 단계별 작업

### Phase 1 — 백엔드 Operator 스켈레톤 ⏳ (지금)
- [ ] viem 설치
- [ ] AuthCaptureEscrow ABI 추가
- [ ] ERC3009PaymentCollector ABI 추가
- [ ] Operator wallet env 정의 (`OPERATOR_PRIVATE_KEY`)
- [ ] `lib/coinbaseL2/` 모듈 구조 (operator client, contract interfaces)
- [ ] 백엔드 라우트 골격 (`/api/payment/coinbase-l2/authorize`, `/capture`, `/void`)

### Phase 2 — DB & 결제 row lifecycle
- [ ] 마이그레이션: `payments.method` enum 에 `coinbase_l2` 추가
- [ ] `payments` 에 authorization-specific 필드 추가
  - `authorized_at`
  - `auth_expires_at`
  - `captured_at`
  - `voided_at`
  - `escrow_payment_id` (컨트랙트의 PaymentId 식별자)
- [ ] 새 RPC: `record_l2_authorization`, `record_l2_capture`, `record_l2_void`

### Phase 3 — 프론트엔드 지갑 통합
- [ ] wagmi + RainbowKit (또는 ConnectKit) 설치
- [ ] 새 결제 컴포넌트 (`CoinbaseL2Pay.tsx`)
- [ ] ERC-3009 서명 UI
- [ ] CreditModal 에 새 옵션 추가 (별도 타일)

### Phase 4 — Admin UI 확장
- [ ] authorized 상태 payments 표시
- [ ] Capture 버튼
- [ ] Void 버튼
- [ ] Authorization expiry 카운트다운

### Phase 5 — 자동화 & 모니터링
- [ ] 만료 전 알림 (cron 또는 on-load 체크)
- [ ] 가스 소진 알림 (Operator 지갑 잔액 모니터링)
- [ ] 컨트랙트 이벤트 indexer (선택, 더 정확한 상태 추적)

### Phase 6 — 테스트 & 출시
- [ ] Base Sepolia 테스트넷 end-to-end
- [ ] Base mainnet 소액 테스트
- [ ] Layer 1 → Layer 2 디폴트 전환

## 운영상 새로 필요한 것

| 항목 | 누가 | 비고 |
|---|---|---|
| Operator 지갑 (EOA) | 대표 | private key 생성 (메마 등). Vercel env `OPERATOR_PRIVATE_KEY` |
| Operator 지갑 가스 충전 | 대표 | Base ETH 정기 충전 ($5~20 정도) |
| Vercel env: `COINBASE_L2_OPERATOR_ADDRESS` | 대표 | Operator 지갑 주소 (공개됨, 비밀 아님) |
| Vercel env: `OPERATOR_PRIVATE_KEY` | 대표 | private key. **Sensitive 체크** |
| Operator 지갑 보안 검토 | 대표 + 클로디아 | hot wallet 형태라 노출 위험. Multisig 으로 업그레이드 고려 |

## 위험 & 완화

| 위험 | 완화 |
|---|---|
| Operator private key 유출 | Vercel Sensitive env. 가스 잔액 항상 적게 유지 ($20 미만). 정기 rotation |
| 가스 spike (Base 혼잡 시) | maxFeePerGas 상한 설정. 가스 부족 시 회신 메시지 |
| 컨트랙트 버그 (Spearbit 감사 완료지만 새 코드) | 처음엔 Base Sepolia 만, 그 후 mainnet 소액 단계적 |
| 손님 지갑 호환성 (ERC-3009 미지원 지갑) | Permit2 또는 PreApproval 폴백. UI 에서 안내 |
| 손님이 reclaim 안 함 + 우리 capture 안 함 | dreamy 가 expiry 도래 전 자동 알림. 만료 시 손님 reclaim 안내 |

## 외부 의존성

- [viem](https://viem.sh) — 컨트랙트 호출. Node + 브라우저 양쪽 가능
- [wagmi](https://wagmi.sh) — React hooks for 지갑 연결
- [RainbowKit](https://www.rainbowkit.com) 또는 [ConnectKit](https://family.co/connectkit) — 지갑 선택 UI
- USDC on Base contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Operator 지갑 (Base mainnet ETH 잔액)

## 참고

- [Base Commerce Payments GitHub](https://github.com/base/commerce-payments)
- [Coinbase Commerce Onchain Payment Protocol GitHub](https://github.com/coinbase/commerce-onchain-payment-protocol)
- [Shopify Engineering 글](https://shopify.engineering/commerce-payments-protocol)
- [Fintech Wrapup 심층분석](https://www.fintechwrapup.com/p/deep-dive-coinbases-commerce-payments)

---

**다음 commit**: Phase 1 - viem 설치 + ABI 추가 + Operator client 스켈레톤.
