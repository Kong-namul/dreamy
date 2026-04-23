/**
 * 크레딧 패키지 마스터 정의.
 * 결제 API 가 클라이언트 요청의 packageId 만 받고, 실제 금액/크레딧은
 * 반드시 이 서버 상수에서 다시 조회해야 안전함.
 */
export type CreditPackageId = 'basic' | 'popular' | 'large'

export interface CreditPackage {
  id: CreditPackageId
  label: string
  credits: number
  priceKrw: number
  priceUsdCents: number    // Base Pay / 해외 결제용
}

export const CREDIT_PACKAGES: Record<CreditPackageId, CreditPackage> = {
  basic:   { id: 'basic',   label: '기본',   credits: 100, priceKrw: 1000, priceUsdCents:  75 },
  popular: { id: 'popular', label: '인기',   credits: 300, priceKrw: 2500, priceUsdCents: 190 },
  large:   { id: 'large',   label: '대용량', credits: 700, priceKrw: 5000, priceUsdCents: 375 },
}

export function getCreditPackage(id: string): CreditPackage | null {
  return (CREDIT_PACKAGES as Record<string, CreditPackage | undefined>)[id] ?? null
}
