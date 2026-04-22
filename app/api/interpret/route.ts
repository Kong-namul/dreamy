import { NextRequest, NextResponse } from 'next/server'
import { interpretDream } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { dream, moods } = await req.json()
    if (!dream?.trim()) {
      return NextResponse.json({ error: '꿈 내용을 입력해주세요.' }, { status: 400 })
    }
    const result = await interpretDream(dream, Array.isArray(moods) ? moods : [])
    return NextResponse.json(result)
  } catch (e) {
    console.error('[interpret] error:', e)
    return NextResponse.json({
      error: 'AI 해석 중 오류가 발생했어요.',
      interpretation: '해석을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      auspice: 'neutral',
      moods: [],
    }, { status: 500 })
  }
}
