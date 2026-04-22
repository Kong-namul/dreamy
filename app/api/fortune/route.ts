import { NextRequest, NextResponse } from 'next/server'
import { interpretFortune } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { dream } = await req.json()
    if (!dream?.trim()) {
      return NextResponse.json({ error: '꿈 내용을 입력해주세요.' }, { status: 400 })
    }
    const fortune = await interpretFortune(dream)
    return NextResponse.json({ fortune })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '운세 해석 중 오류가 발생했어요.' }, { status: 500 })
  }
}
