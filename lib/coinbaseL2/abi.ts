/**
 * AuthCaptureEscrow + ERC3009PaymentCollector ABI (필요 함수만 발췌).
 *
 * 전체 ABI 는 https://github.com/base/commerce-payments 에서 verify 가능.
 * 우리는 dreamy 에서 operator 로 사용할 함수들만 정의 — bloat 줄이고
 * 명시적으로 어떤 함수를 호출하는지 추적성 ↑.
 *
 * 구조:
 *  - PaymentInfo: 결제 1건의 모든 메타데이터 (operator, payer, receiver, token, amount, expiry, salt 등)
 *  - 각 함수는 PaymentInfo + collector-specific data 받음
 */
import 'server-only'

/**
 * AuthCaptureEscrow 컨트랙트의 핵심 함수 — operator 가 직접 호출.
 *
 * authorize: ERC3009Collector 가 손님 USDC 를 escrow 로 이동 + 권한 기록
 * capture:   escrow → receiver (= 머천트 지갑) 로 자금 이동, 부분 가능
 * void:      escrow → payer (= 손님 지갑) 로 자금 반환, 권한 무효화
 * charge:    authorize + capture 한 번에 (즉시 정산용, 우리 안 씀)
 * refund:    이미 capture 된 자금을 손님한테 다시 송금 (사후 환불)
 * reclaim:   손님이 직접 호출, expiry 지난 권한에서 자금 회수
 */
export const AUTH_CAPTURE_ESCROW_ABI = [
  // ── PaymentInfo struct (각 함수의 첫 인자) ─────────────────────
  // struct PaymentInfo {
  //   address operator;        // = dreamy operator EOA
  //   address payer;           // = 손님 지갑
  //   address receiver;        // = 머천트 지갑 (= 대표 메마)
  //   address token;           // = USDC on Base
  //   uint256 maxAmount;       // 권한된 최대 금액 (raw, 6 decimals for USDC)
  //   uint48  authorizeBy;     // unix timestamp — 이때까지 authorize 안 되면 expire
  //   uint48  authorizationExpiry;  // unix timestamp — 이때까지 capture 안 되면 reclaim 가능
  //   uint16  feeBps;          // operator fee in basis points
  //   address feeReceiver;     // operator fee 받는 주소
  //   bytes32 salt;            // 고유 식별자
  // }
  // ──────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'authorize',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'paymentInfo',
        type: 'tuple',
        components: [
          { name: 'operator', type: 'address' },
          { name: 'payer', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'maxAmount', type: 'uint256' },
          { name: 'authorizeBy', type: 'uint48' },
          { name: 'authorizationExpiry', type: 'uint48' },
          { name: 'feeBps', type: 'uint16' },
          { name: 'feeReceiver', type: 'address' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
      { name: 'amount', type: 'uint256' },
      { name: 'tokenCollector', type: 'address' },
      { name: 'collectorData', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'capture',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'paymentInfo',
        type: 'tuple',
        components: [
          { name: 'operator', type: 'address' },
          { name: 'payer', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'maxAmount', type: 'uint256' },
          { name: 'authorizeBy', type: 'uint48' },
          { name: 'authorizationExpiry', type: 'uint48' },
          { name: 'feeBps', type: 'uint16' },
          { name: 'feeReceiver', type: 'address' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'void',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'paymentInfo',
        type: 'tuple',
        components: [
          { name: 'operator', type: 'address' },
          { name: 'payer', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'maxAmount', type: 'uint256' },
          { name: 'authorizeBy', type: 'uint48' },
          { name: 'authorizationExpiry', type: 'uint48' },
          { name: 'feeBps', type: 'uint16' },
          { name: 'feeReceiver', type: 'address' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'refund',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'paymentInfo',
        type: 'tuple',
        components: [
          { name: 'operator', type: 'address' },
          { name: 'payer', type: 'address' },
          { name: 'receiver', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'maxAmount', type: 'uint256' },
          { name: 'authorizeBy', type: 'uint48' },
          { name: 'authorizationExpiry', type: 'uint48' },
          { name: 'feeBps', type: 'uint16' },
          { name: 'feeReceiver', type: 'address' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
      { name: 'amount', type: 'uint256' },
      { name: 'tokenCollector', type: 'address' },
      { name: 'collectorData', type: 'bytes' },
    ],
    outputs: [],
  },
  // ── Events ────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'PaymentAuthorized',
    inputs: [
      { name: 'paymentInfoHash', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PaymentCaptured',
    inputs: [
      { name: 'paymentInfoHash', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PaymentVoided',
    inputs: [
      { name: 'paymentInfoHash', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

/**
 * USDC v2 (ERC-3009) — receiveWithAuthorization 핵심 함수만.
 *
 * 손님이 dreamy 한테 ERC-3009 서명 줄 때, 그 서명을 검증할 때 필요.
 * 실제 transferWithAuthorization 호출은 ERC3009PaymentCollector 가 하지만,
 * 미리 nonce 검증 등에 활용 가능.
 */
export const ERC3009_ABI = [
  {
    type: 'function',
    name: 'authorizationState',
    stateMutability: 'view',
    inputs: [
      { name: 'authorizer', type: 'address' },
      { name: 'nonce', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
