export type Mood = 'happy' | 'excited' | 'peaceful' | 'nostalgic' | 'scary' | 'anxious' | 'weird' | 'confused' | 'sad' | 'fascinating'

export interface DreamComment {
  id: string
  authorName: string
  authorInitial: string
  text: string
  date: string
}

export interface LuckyToday {
  item: string        // 오늘의 행운 아이템 (가지고 다닐 것)
  colorName: string   // 색상 이름 (예: 세이지 그린)
  colorHex: string    // #RRGGBB
  advice: string      // 왜 오늘 이게 필요한가 (한 문장)
  avoid: string[]     // 오늘 피해야 할 것 (2~4개)
  luckyDirection?: string  // 행운의 방향 (동/서/남/북/남동 등)
  luckyNumber?: number     // 행운의 숫자
}

export interface InterpretationBlock {
  emoji?: string          // deprecated
  heading?: string        // 소제목
  body: string            // 본문 (마크다운 볼드 지원)
  imagePrompt?: string    // 영문 이미지 프롬프트
  imageUrl?: string       // Pollinations URL (서버에서 주입)
}

export type Auspice = 'auspicious' | 'ominous' | 'neutral'  // 길몽 · 흉몽 · 중립

export interface DreamEntry {
  id: string
  dream: string                           // 사용자가 입력한 원문
  interpretation: string                  // basic 또는 fallback 텍스트 해석
  moods: Mood[]                           // 복수 선택 가능
  auspice?: Auspice                       // 길몽/흉몽/중립 분류
  type: 'basic' | 'premium'
  weather?: string
  pages?: Array<{ title: string; text: string; illustration?: string; imagePrompt?: string; imageUrl?: string }>
  interpretationBlocks?: InterpretationBlock[]
  lucky?: LuckyToday
  date: string
  shared: boolean
  comments?: DreamComment[]
}

export interface CreditPackage {
  id: string
  label: string
  credits: number
  price: number
  badge?: string
}

export type TabId = 'new' | 'feed' | 'log' | 'mydiary' | 'history' | 'settings' | 'trash'

export interface CreditTransaction {
  id: string
  type: 'purchase' | 'spend' | 'bonus'
  amount: number        // + 충전/보너스, - 사용
  label: string         // "기본 팩 구매", "기본 해석", "그림일기" 등
  priceWon?: number     // 결제 금액 (purchase 만)
  date: string
}
