/**
 * Coinbase Commerce Payments Protocol — Base mainnet & Sepolia 컨트랙트 주소.
 *
 * 출처: https://github.com/base/commerce-payments
 * v1.0.0 (2025-05-07 release). mainnet & sepolia 동일 주소.
 *
 * Operator 가 직접 호출하는 컨트랙트:
 *  - AuthCaptureEscrow: authorize / capture / void / charge / refund / reclaim
 *  - ERC3009PaymentCollector: USDC v2 ERC-3009 서명을 받아 escrow 로 자금 이동
 *  - Permit2PaymentCollector: Permit2 사용 시 (USDC 외 토큰)
 *
 * USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (mainnet, native USDC, not bridged)
 */
import 'server-only'

export const COINBASE_L2_CONTRACTS = {
  authCaptureEscrow: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
  erc3009PaymentCollector: '0x0E3dF9510de65469C4518D7843919c0b8C7A7757',
  permit2PaymentCollector: '0x992476B9Ee81d52a5BdA0622C333938D0Af0aB26',
  preApprovalPaymentCollector: '0x1b77ABd71FCD21fbe2398AE821Aa27D1E6B94bC6',
  spendPermissionPaymentCollector: '0x8d9F34934dc9619e5DC3Df27D0A40b4A744E7eAa',
  operatorRefundCollector: '0x934907bffd0901b6A21e398B9C53A4A38F02fa5d',
} as const

/** USDC native on Base mainnet (USDC v2, ERC-3009 호환). */
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const

/** Base Sepolia 테스트넷 USDC (Circle 가 배포). */
export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

/** Authorization 기본 유효기간 (초). 7일. */
export const DEFAULT_AUTHORIZATION_EXPIRY_SECONDS = 7 * 24 * 60 * 60

/** Authorization 최소 유효기간 (초). 1시간. */
export const MIN_AUTHORIZATION_EXPIRY_SECONDS = 60 * 60

/** Authorization 최대 유효기간 (초). 30일. */
export const MAX_AUTHORIZATION_EXPIRY_SECONDS = 30 * 24 * 60 * 60
