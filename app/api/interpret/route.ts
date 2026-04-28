import { NextResponse } from 'next/server'

// 구 엔드포인트. 인증/크레딧 차감/길이 제한 없이 Claude 를 호출해 비용 폭주 위험이 있어 폐기.
// 정식 흐름은 POST /api/interpret/run.
export async function POST() {
  return NextResponse.json(
    { error: 'gone', message: 'Use POST /api/interpret/run instead.' },
    { status: 410 },
  )
}
