import { NextRequest, NextResponse } from 'next/server'
import { interpretDiary } from '@/lib/claude'
import { attachImageUrls } from '@/lib/pollinations'

export async function POST(req: NextRequest) {
  try {
    const { dream, moods } = await req.json()
    if (!dream?.trim()) {
      return NextResponse.json({ error: '꿈 내용을 입력해주세요.' }, { status: 400 })
    }
    const data = await interpretDiary(dream, Array.isArray(moods) ? moods : [])
    // Pollinations.ai 이미지는 그림일기 pages 에만 주입. interpretationBlocks 는 텍스트 유지.
    const pagesWithImages = attachImageUrls(data.pages ?? [])
    return NextResponse.json({ ...data, pages: pagesWithImages })
  } catch (e) {
    console.error('[diary] error:', e)
    return NextResponse.json({ error: 'AI 해석 중 오류가 발생했어요.' }, { status: 500 })
  }
}
