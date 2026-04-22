import { DreamEntry } from '@/types'
import { buildPollinationsUrl } from '@/lib/pollinations'

const seed = (i: number) => 12000 + i

/**
 * 드림피드 시드 꿈들 (가상 사용자들이 작성한 것처럼 보이는 고품질 예시).
 * 신규 가입자의 "내 일기" 에는 들어가지 않고, 오직 드림피드에서 다른 사용자의 꿈으로만 노출된다.
 * - 꿈 본문: 장소·색·소리·감각·감정 등 구체 묘사
 * - 해석: (1) 풍경 공감 → (2) 상징 해석 → (3) 심리 의미 → (4) 현실 조언
 */

const SEED_PUBLIC_DREAMS: PublicDream[] = [
  // 꿈 1 — 태몽 (basic / fascinating)
  {
    id: 'seed-1',
    authorName: '복숭아내음',
    authorInitial: '복',
    dream: `새벽에 꾼 꿈이에요. 공기가 서늘하고 냇물 냄새가 났어요.

맑은 냇가에 혼자 서 있었는데, 물이 얕아서 발목까지 와도 차갑지 않고 미지근했어요. 건너편 둔덕에 제 키의 두 배쯤 되는 복숭아 나무 한 그루가 있어서 천천히 걸어갔어요. 물소리가 유난히 또렷했고, 햇살이 나뭇잎 사이로 반짝였어요.

나무 아래에 서서 올려다보니 잘 익은 복숭아 하나가 가지 끝에서 흔들리다가 저절로 똑 떨어졌는데, 손을 뻗지 않았는데도 제 품에 쏙 안겼어요. 따뜻했고, 무게가 느껴졌어요.

그때 발치에서 인기척이 나서 보니, 팔뚝만 한 구렁이 한 마리가 나무 뿌리 옆에 똬리를 틀고 있었어요. 무섭지 않았고, 오히려 저를 지켜주는 것 같은 느낌이 들었어요. 구렁이와 눈이 마주쳤는데, 고개를 한 번 끄덕이는 것처럼 보였어요.

깨고 나서 한참 동안 복숭아의 무게가 팔에 남아 있는 것 같았어요.`,
    interpretation: `복숭아와 구렁이가 함께 나타나는 장면은 한국 태몽의 대표 상징 두 가지가 한꺼번에 등장한 보기 드문 길몽이에요. 특히 복숭아가 저절로 품에 안기고 구렁이가 지켜봐 준 흐름이 가장 인상적인 지점이에요.

상징 해석
• 복숭아는 예부터 생명·건강·복을 상징하는 길몽의 대표 과일이에요. "저절로 떨어져 품에 안긴다"는 건 노력 없이 찾아오는 귀한 인연을 뜻해요.
• 구렁이는 용의 아래 단계인 영적 보호자예요. 무섭지 않고 지켜보듯 있었다면 태아나 새로운 시작을 감싸주는 큰 기운이 함께한다는 뜻이에요.
• 맑고 따뜻한 냇물은 재물·감정의 순환이 원활하다는 신호이고, 태몽 배경으로는 태아의 첫 환경이 안정적임을 의미해요.

심리적 의미
꿈 속에서 느낀 평화로움과 따뜻함은 지금 당신 내면이 "받아들일 준비"가 되어 있다는 신호예요. 실제 임신일 수도 있고, 새 프로젝트·관계·결심 같은 상징적 "수태"일 수도 있어요. Jung 심리학에서도 과일과 동물이 함께하는 꿈은 무의식이 의식에게 "이제 품어도 괜찮다"고 허락하는 장면으로 읽혀요.

오늘의 조언
가까운 가족에게 조심스레 안부를 묻거나, 당신 자신에게 해당한다면 몸을 따뜻하게 하고 무리한 일정을 줄여보세요. 복숭아의 무게가 팔에 남았다는 감각을 하루에 몇 번 떠올려보면 의미가 선명해질 거예요.`,
    moods: ['fascinating'],
    auspice: 'auspicious',
    type: 'basic',
    date: '2026-04-20T06:15:00.000Z',
    shared: true,
  },

  // 꿈 2 — 끝나지 않는 복도 (premium / scary)
  {
    id: 'seed-2',
    authorName: '긴복도',
    authorInitial: '긴',
    dream: `회사 건물 같은 곳이었어요. 오래된 형광등이 깜빡거리는 긴 복도를 혼자 걷고 있었어요. 바닥은 리놀륨인데 군데군데 타일이 깨져 있었고, 양쪽 벽에는 똑같이 생긴 문이 일정한 간격으로 늘어서 있었어요. 문 번호 같은 건 없었어요.

걷기 시작한 지 얼마 지나지 않아서 뒤에서 발소리가 들렸어요. 제 걸음에 맞춰서 따라오다가, 제가 멈추면 상대도 멈췄어요. 뒤를 돌아봤는데 아무도 없었고, 대신 문이 원래보다 하나 더 늘어나 있었어요.

오른쪽 벽에 큰 창문이 있어서 무심코 봤는데, 거기 비친 제 얼굴이 제가 아니었어요. 이목구비는 비슷한데 눈빛이 전혀 달랐어요. 그때 등 뒤에서 누군가 제 이름을 불렀어요. 다리가 움직이지 않아서 그 자리에 서 있었어요.

깼을 때 베개가 축축했어요. 무섭다기보다, 답답하고 서글펐어요.`,
    interpretation: '',
    moods: ['scary'],
    auspice: 'ominous',
    type: 'premium',
    weather: '🌫',
    // 그림일기 = 사용자의 꿈을 5장으로 쪼개 그림과 함께 재구성한 것
    pages: [
      {
        title: '깜빡이는 복도',
        text: '회사 건물 같은 곳. 오래된 형광등이 깜빡거리는 긴 복도를 혼자 걷고 있었어. 바닥 타일은 군데군데 깨져 있었고, 양쪽 벽에 똑같이 생긴 문이 끝도 없이 늘어서 있었지.',
        imagePrompt: 'long dim hallway with flickering fluorescent lights, cracked floor tiles, identical doors on both walls, empty and eerie',
        imageUrl: buildPollinationsUrl('long dim hallway with flickering fluorescent lights, cracked floor tiles, identical doors on both walls, empty and eerie', { seed: seed(1) }),
      },
      {
        title: '뒤따르는 발소리',
        text: '걷기 시작한 지 얼마 지나지 않아 뒤에서 발소리가 들렸어. 내 걸음에 맞춰 따라오다가, 내가 멈추면 상대도 똑같이 멈췄어. 돌아볼 용기가 쉽게 나지 않았어.',
        imagePrompt: 'dark corridor from behind, single silhouette walking alone, mysterious shadow trailing, unsettling atmosphere',
        imageUrl: buildPollinationsUrl('dark corridor from behind, single silhouette walking alone, mysterious shadow trailing, unsettling atmosphere', { seed: seed(2) }),
      },
      {
        title: '늘어나는 문',
        text: '결국 뒤를 돌아봤어. 아무도 없었는데, 대신 문이 원래보다 하나 더 늘어나 있었어. 돌아볼수록 문이 한 개씩 늘어났고, 복도 끝은 점점 더 멀어져 갔어.',
        imagePrompt: 'endless hallway with multiplying doors, surreal perspective, vanishing point receding infinitely',
        imageUrl: buildPollinationsUrl('endless hallway with multiplying doors, surreal perspective, vanishing point receding infinitely', { seed: seed(3) }),
      },
      {
        title: '창문 속 다른 나',
        text: '오른쪽 벽 큰 창문에 내 얼굴이 비쳤는데, 내가 아니었어. 이목구비는 비슷한데 눈빛이 전혀 달랐고, 입꼬리가 나와 반대로 올라가 있었어. 그 얼굴이 나를 따라 고개를 돌렸어.',
        imagePrompt: 'reflection in dusty window, distorted self portrait, uncanny doppelganger, muted tones',
        imageUrl: buildPollinationsUrl('reflection in dusty window, distorted self portrait, uncanny doppelganger, muted tones', { seed: seed(4) }),
      },
      {
        title: '불린 이름',
        text: '등 뒤에서 누군가 내 이름을 불렀어. 낮고 익숙한 목소리. 다리가 움직이지 않아 그 자리에 섰어. 깼을 때 베개가 축축했고, 무섭다기보다 서글펐어.',
        imagePrompt: 'lonely figure frozen in a corridor, faint glow from behind, melancholic atmosphere, soft watercolor',
        imageUrl: buildPollinationsUrl('lonely figure frozen in a corridor, faint glow from behind, melancholic atmosphere, soft watercolor', { seed: seed(5) }),
      },
    ],
    // 해석 = 디테일한 상세 해석 블록들 (의미/원인/현재 상태/행동 조언) + 이미지
    interpretationBlocks: [
      {
        heading: '꿈의 첫인상',
        body: '끝없이 이어지는 복도, 따라오는 발소리, 창문 속 낯선 얼굴 — 이 세 가지는 모두 "앞으로 나아가야 한다는 감각이 흐려진 상태"를 상징하는 대표 모티프예요. 무엇보다 꿈에서 **무섭다기보다 서글펐다**는 감정이 가장 중요한 단서입니다.',
        imagePrompt: 'surreal endless corridor with foggy vanishing point, muted melancholy mood, abstract composition',
        imageUrl: buildPollinationsUrl('surreal endless corridor with foggy vanishing point, muted melancholy mood, abstract composition', { seed: seed(11) }),
      },
      {
        heading: '한국 민속 해몽 — 긴 복도',
        body: '전통 해몽에서 **끝이 보이지 않는 통로**는 당면한 문제가 단기간에 해결되지 않을 것이라는 경고예요. 깨진 타일은 현재 기반이 다소 흔들리고 있다는 뜻이지만, 바닥이 완전히 무너지지 않았다는 점은 다행이에요. 전반적으로 "잠시 주춤하되 무너지지는 않는 시기"로 풀이돼요.',
        imagePrompt: 'broken floor tiles leading into dark tunnel, symbolic path forward, soft watercolor textures',
        imageUrl: buildPollinationsUrl('broken floor tiles leading into dark tunnel, symbolic path forward, soft watercolor textures', { seed: seed(12) }),
      },
      {
        heading: '늘어나는 문의 의미',
        body: '한국 민속에서 **문은 기회·선택의 상징**이에요. 문이 자꾸 늘어났다는 건 결정해야 할 일이 쌓이고 있다는 뜻이고, 하나를 고르려 할 때 또 다른 선택지가 생기는 **결정 피로** 상태예요. 현대 심리학에서도 선택지가 많을수록 오히려 결정력이 떨어지는 choice overload 현상으로 설명돼요.',
        imagePrompt: 'many floating doors in a dreamy void, decision paralysis symbolism, soft pastel palette',
        imageUrl: buildPollinationsUrl('many floating doors in a dreamy void, decision paralysis symbolism, soft pastel palette', { seed: seed(13) }),
      },
      {
        heading: '창문 속 낯선 얼굴 — Jung의 그림자',
        body: '창문·거울 속 "나와 닮았지만 내가 아닌 얼굴"은 융 심리학의 **그림자 자기(shadow self)** 의 대표 이미지예요. 당신이 인정하고 싶지 않은 욕구, 혹은 누군가의 기대 때문에 숨겨 둔 표정이에요. 두려워할 필요는 없어요. 그림자는 발견되는 순간 크기가 줄어들어요.',
        imagePrompt: 'dusty mirror showing two faint silhouettes overlapping, subtle uncanny reflection, soft brushstrokes',
        imageUrl: buildPollinationsUrl('dusty mirror showing two faint silhouettes overlapping, subtle uncanny reflection, soft brushstrokes', { seed: seed(14) }),
      },
      {
        heading: '깨고 난 후의 서글픔',
        body: '무서움 < 서글픔. 이 감정 비율이 중요해요. 공포 꿈은 보통 "나가야 하는 위협"을 알리지만, 서글픔이 더 크다면 **이미 지나간 무언가에 대한 애도**예요. 관계든, 기회든, 예전의 자기 자신이든 — 지금 당신은 떠나보낼 것과 마주하는 중일 가능성이 높아요.',
        imagePrompt: 'damp pillow at dawn with faint light through curtain, quiet melancholy still life',
        imageUrl: buildPollinationsUrl('damp pillow at dawn with faint light through curtain, quiet melancholy still life', { seed: seed(15) }),
      },
      {
        heading: '현재 당신의 상태 추정',
        body: '최근 1~2개월 사이 **커리어·관계 중 하나에서 "계속 가야 하나" 하는 의문**이 반복되고 있을 가능성이 커요. 주변엔 티내지 않았지만, 혼자 있을 때 가끔 멍하니 천장을 보는 시간이 늘었을 것 같아요. 이 꿈은 그런 내면의 피로가 시각화된 장면이에요.',
        imagePrompt: 'person lying quietly looking at ceiling, soft blue light, gentle weariness, intimate mood',
        imageUrl: buildPollinationsUrl('person lying quietly looking at ceiling, soft blue light, gentle weariness, intimate mood', { seed: seed(16) }),
      },
      {
        heading: '오늘 해볼 만한 것',
        body: '모든 문을 다 열어볼 필요는 없어요. 지금 눈앞의 **한 걸음**이면 충분해요.\n\n• 최근 한 달 동안 "미뤄 둔 대화 한 가지"만 떠올려 종이에 이름을 적어보세요.\n• 의사결정이 몰려 있다면 오늘은 "안 할 것" 하나를 먼저 고르세요.\n• 잠들기 30분 전에 따뜻한 물에 손과 발을 담가보세요.',
        imagePrompt: 'single warm candle on wooden table with open notebook, cozy calm evening, encouraging atmosphere',
        imageUrl: buildPollinationsUrl('single warm candle on wooden table with open notebook, cozy calm evening, encouraging atmosphere', { seed: seed(17) }),
      },
    ],
    lucky: {
      item: '작은 녹색 화분 또는 라벤더 향 사쉐',
      colorName: '세이지 그린',
      colorHex: '#8FA68E',
      advice: '차분하고 땅에 발을 딛는 감각을 회복시켜 주는 색이에요. 어두운 옷차림에 포인트로 한 조각만 더해보세요.',
      avoid: [
        '중요한 결정을 몰아서 하는 것 — 하나씩 나눠 처리하세요',
        '거울·창문을 오래 들여다보는 일 (무의식 자극)',
        '새벽 1~3시 SNS 스크롤',
        '카페인 과다 섭취',
      ],
      luckyDirection: '남동쪽',
      luckyNumber: 3,
    },
    date: '2026-04-18T04:20:00.000Z',
    shared: true,
  },

  // 꿈 3 — 앞니 빠지는 꿈 (basic / anxious)
  {
    id: 'seed-3',
    authorName: '이른별',
    authorInitial: '이',
    dream: `화장실 거울 앞이었어요. 제 모습이 평소보다 창백해 보였고, 입 안에서 뭔가 이상한 감각이 들어서 입을 벌려봤어요.

위쪽 앞니 하나가 잇몸에서 살짝 흔들리고 있었어요. 손가락으로 살짝 건드렸을 뿐인데 "툭" 하고 빠져서 손바닥 위에 떨어졌어요. 이상하게 피는 한 방울도 나지 않았고, 빠진 자리에 아주 작은 홈만 남아 있었어요. 아프지도 않았어요.

놀라서 거울을 다시 봤는데, 옆에 있던 앞니 하나가 또 천천히 기울기 시작했어요. 그리고 그 옆, 또 그 옆 — 도미노처럼 흔들림이 번지기 시작했어요. 제가 손으로 입을 막으려고 했는데 손이 자꾸 미끄러졌어요.

꿈 속에서 가장 또렷했던 건 소리였어요. 이가 손바닥으로 떨어질 때 사기 그릇 같은 맑은 소리가 났어요.

깨고 나서 한참 동안 혀로 앞니를 확인했어요.`,
    interpretation: `피 없이 연쇄로 흔들리는 앞니, 그리고 사기그릇 같은 맑은 소리 — 이 두 감각이 꿈 전체의 톤을 말해줘요. 이빨 꿈은 한국에서 가장 자주 해석을 묻는 흉몽 중 하나지만, "피 없음 + 통증 없음" 조합은 톤이 많이 누그러져요.

상징 해석
• 이빨은 한국 전통 해몽에서 나와 가까운 사람을 상징해요. **윗니는 부모·어른·직장 상사**처럼 "나보다 위에 있는 사람"으로 풀이돼요.
• **앞니는 그중에서도 가장 가까운 관계**예요. 자주 마주치고 신경 쓰는 사람이에요.
• 피가 나지 않았다는 건 실제 사고·중병보다 "관계의 균열, 오해, 감정적 거리"로 해석돼요. 연쇄로 흔들린 건 한 명이 아니라 그 사람을 중심으로 한 **관계망 전체**가 흔들리고 있다는 신호예요.

심리적 의미
서구 Jung 심리학에서 이빨 꿈은 성장·변환기 불안으로 봐요. 어린이가 유치를 잃고 영구치가 나듯, 오래된 자기 이미지를 벗고 새 단계로 넘어가는 전환의 상징이에요. 사기그릇 소리처럼 맑고 통증이 없었다는 점에서, 이 꿈은 무언가를 상실하는 두려움보다 "이제 놓아도 된다"는 무의식의 허락이 섞여 있어요.

오늘의 조언
부모님이나 가까운 어른에게 짧게라도 안부 전화 한 통 해보세요. 최근 데면데면했던 관계가 있다면 먼저 말을 걸 타이밍이 됐는지 점검해보세요. 이빨 꿈은 잇몸·턱 긴장에서 촉발되기도 하니 몸 상태도 함께 챙겨주세요.`,
    moods: ['anxious'],
    auspice: 'ominous',
    type: 'basic',
    date: '2026-04-16T05:40:00.000Z',
    shared: true,
  },
]

/**
 * 드림피드에 섞일 가상의 다른 사용자 공개 꿈들.
 * 실제 백엔드 없이 '남의 꿈' 영역을 시뮬레이션.
 */
export interface PublicDream extends DreamEntry {
  authorName: string
  authorInitial: string
}

export const PUBLIC_DREAMS: PublicDream[] = [
  ...SEED_PUBLIC_DREAMS,
  {
    id: 'public-1',
    authorName: '달빛여우',
    authorInitial: '달',
    dream: `휴가지 바다 같은 곳이었어요. 물은 에메랄드빛이었고, 수평선에 구름이 낮게 깔려 있었어요.

허리쯤 오는 깊이의 바다 한가운데 혼자 서 있었는데, 발밑이 갑자기 간지러웠어요. 아래를 봤더니 주황색에 금빛이 도는 잉어 수십 마리가 제 종아리 주변을 천천히 돌고 있었어요. 물살이 있는데도 저를 밀지 않고 오히려 감싸듯 돌았어요.

그 중 가장 큰 잉어 한 마리가 천천히 떠올라 제 왼쪽 손바닥 위에 가슴지느러미를 올렸어요. 미끄럽지 않고 따뜻했어요. 눈이 아주 또렷해서 저와 눈을 맞추는 것 같았어요.

그대로 한참을 있었어요. 잉어가 뭔가 말할 것 같았는데 안 했어요.`,
    interpretation: `바다 한가운데서 잉어 떼가 제 다리를 감싸고, 그중 가장 큰 한 마리가 손바닥에 올라왔다는 흐름이 가장 강한 포인트예요. 잉어가 사람에게 직접 접촉하는 꿈은 재물·기회와 관련된 전통 길몽의 핵심 모티프예요.

상징 해석
• 잉어는 **등용문(鯉躍龍門)** 고사에서 용이 되는 존재로, 성공·입신양명을 상징해요.
• 주황·금빛이 돈다는 디테일은 **재물 기운**이 특히 강하다는 뜻이에요.
• 손바닥에 직접 올라왔다는 건 기회가 남의 것이 아니라 당신 손에 이미 놓였다는 강한 신호예요.

심리적 의미
물 속에서 안정된 상태로 있었다는 건 지금의 감정 상태가 균형을 찾고 있다는 뜻이에요. 잉어가 "말할 것 같았는데 안 했다"는 장면은 당신이 자신의 직관을 아직 완전히 신뢰하지 못한다는 신호이기도 해요. 기회의 신호는 이미 와 있는데 듣는 귀가 잠시 조심스러운 상태예요.

오늘의 조언
최근 미뤄둔 제안·지원·연락이 있다면 오늘 움직여보세요. 큰 결심이 아니라 "메일 한 통, 답장 한 줄" 정도의 작은 신호면 충분해요.`,
    moods: ['fascinating'],
    type: 'basic',
    date: '2026-04-19T23:10:00.000Z',
    shared: true,
    comments: [
      { id: 'c-p1-1', authorName: '밤하늘도서관', authorInitial: '밤', text: '와 잉어 꿈 부러워요! 저도 어제 물고기 꿈 꿨는데 이런 거였을까요', date: '2026-04-19T23:45:00.000Z' },
      { id: 'c-p1-2', authorName: '소나기소녀', authorInitial: '소', text: '로또 사세요 진짜로 ㅋㅋㅋ', date: '2026-04-20T00:12:00.000Z' },
      { id: 'c-p1-3', authorName: '해몽러버', authorInitial: '해', text: '금빛 잉어는 특히 재물운 최고예요 👍', date: '2026-04-20T07:30:00.000Z' },
    ],
  },
  {
    id: 'public-2',
    authorName: '별헤는밤',
    authorInitial: '별',
    dream: `고등학교 때 쓰던 교실이었어요. 커튼이 노르스름하고 오래된 분필 냄새가 났어요.

책상 위에 시험지가 놓여 있었는데 이상하게 글씨가 뭉개져서 안 보였어요. 눈을 비비고 가까이 봐도 글자가 흐물흐물 움직여서 문제를 읽을 수가 없었어요. 교실 벽에 걸린 시계는 초침이 보통 속도의 세 배로 돌아가고 있었어요.

주변 친구들은 다들 침착하게 답을 쓰고 있었어요. 그 사각거리는 연필 소리가 점점 크게 들려서 귀를 막고 싶을 정도였어요. 선생님이 뒷짐을 지고 천천히 지나가는데 저는 아직 이름도 못 썼어요.

울고 싶은데 눈물이 안 나왔어요.`,
    interpretation: `시험 꿈은 전 세계 공통으로 가장 많이 꾸는 꿈 중 하나예요. 학교를 졸업한 지 오래된 사람도 반복해서 꾸는데, "평가받는 상황에 대한 보편 불안"이 원형(archetype)처럼 자리잡아 있기 때문이에요.

상징 해석
• **글자가 뭉개져서 안 보인다**는 건 "기준이 명확하지 않은 평가"를 받고 있다는 감각이에요.
• **시계 초침이 너무 빠름**은 현실의 마감·조급함이 과장되어 나타난 거예요.
• **친구들은 태연한데 나만 못 쓴다**는 장면은 "다들 잘 하는데 나만 뒤처졌다"는 비교 불안의 정직한 표현이에요.

심리적 의미
이 꿈은 현재 당신이 받고 있는 외부 평가보다, 스스로에게 요구하는 내면의 기준이 지나치게 높다는 신호예요. 눈물이 안 나왔다는 건 그 긴장을 밖으로 풀 통로가 부족하다는 뜻이에요.

오늘의 조언
오늘 하루, 꼭 지키지 않아도 되는 "내가 만든 규칙" 하나를 스스로에게 용서해 주세요. 완벽함보다 "꾸준함"이 필요한 시기예요.`,
    moods: ['anxious'],
    type: 'basic',
    date: '2026-04-19T11:30:00.000Z',
    shared: true,
    comments: [
      { id: 'c-p2-1', authorName: '카페라떼', authorInitial: '카', text: '저도 시험 꿈 자주 꿔요 ㅠㅠ 왜 졸업한 지 10년 지났는데 왜지', date: '2026-04-19T12:00:00.000Z' },
      { id: 'c-p2-2', authorName: '공감백배', authorInitial: '공', text: '스스로한테 좀 너그러워도 돼요. 잘 하고 있어요.', date: '2026-04-19T13:20:00.000Z' },
    ],
  },
  {
    id: 'public-3',
    authorName: '구름산책',
    authorInitial: '구',
    dream: `처음엔 높은 건물 옥상이었어요. 난간에 기대어 있었는데 발이 가벼워지더니, 어느새 공중에 떠 있었어요.

하늘을 천천히 걷듯 날고 있었어요. 팔은 뻗지 않고, 몸이 알아서 떠올랐어요. 아래로 구름이 말랑하게 펼쳐져 있어서 손을 뻗으면 잡힐 것 같았고, 바람이 따뜻하고 살짝 꿀 냄새가 났어요.

어디로 갈지 생각하지 않았는데도 몸이 알아서 방향을 바꿨어요. 조종한다기보다 "맡기면 되는" 느낌이었어요. 한 번도 무섭지 않았어요.

깼는데도 몸이 가벼웠어요. 오랜만에 그랬어요.`,
    interpretation: `나는 꿈은 Jung의 원형 중 "자유·초월"을 대표해요. 특히 **두려움 없이, 조종하지 않고 맡기며 날았다**는 점이 중요해요.

상징 해석
• 떠오름은 억눌림에서 벗어나고 싶은 마음이 자유로 전환되는 순간이에요.
• **맡기면 되는 느낌**은 최근 당신이 통제보다 "흐름에 따르는 감각"을 연습하고 있다는 신호예요.
• 따뜻한 바람과 꿀 냄새는 몸의 감각이 안정되어 있다는 증거예요.

심리적 의미
한동안 억눌린 채로 지내왔다면 이 꿈은 회복기에 접어들었다는 표시예요. 스스로에게 새로운 가능성을 허락한 시점에 찾아오는 꿈이에요.

오늘의 조언
오늘은 "계획에 없던 선택" 하나를 해보세요. 점심 메뉴를 평소와 다르게 고르는 정도의 작은 일탈이어도 충분해요.`,
    moods: ['peaceful'],
    type: 'basic',
    date: '2026-04-18T09:05:00.000Z',
    shared: true,
    comments: [
      { id: 'c-p3-1', authorName: '새벽산책', authorInitial: '새', text: '이 꿈 읽으니까 제 기분도 편해졌어요', date: '2026-04-18T10:00:00.000Z' },
    ],
  },
  // 무한 스크롤 확인용 추가 공개 꿈들
  {
    id: 'public-4',
    authorName: '밤하늘도서관',
    authorInitial: '밤',
    dream: '도서관 책장 사이를 걷고 있었어요. 천장이 보이지 않을 만큼 높았고, 책들이 스스로 빛나고 있었어요. 한 권을 꺼내 펼치니 페이지가 빈 종이였는데, 제 글씨로 "지금 여기"라는 문장이 나타났어요.',
    interpretation: `도서관이 한없이 높고, 책들이 스스로 빛났다는 디테일이 가장 특이한 포인트예요. 빛나는 책과 빈 페이지에 자기 글씨가 떠오르는 장면은 무의식의 창작·정리 욕구가 깨어나는 대표 모티프예요.

상징 해석
• 도서관은 집단 무의식·누적된 지혜를 상징해요. 천장이 보이지 않는 규모는 아직 펼쳐지지 않은 가능성이 많다는 뜻이에요.
• 스스로 빛나는 책은 **내가 이미 가진 자원**이 주목받고 싶어 한다는 신호예요.
• 빈 페이지에 자기 글씨로 "지금 여기"가 나타났다는 건 현재의 경험을 기록할 만한 가치가 있다는 내면의 허락이에요.

심리적 의미
창작·기록·공부에 대한 욕구가 오래 눌려 있다 깨어나는 시기에 자주 찾아오는 꿈이에요. Jung 심리학에서 책과 도서관은 자기(self) 원형의 접근 장소로도 해석돼요. 당신 내면이 "이제 풀어놓아도 된다"고 말하는 중이에요.

오늘의 조언
오늘은 메모장이든 폰이든 아무 데나 한 줄만 적어보세요. 완성된 문장일 필요 없어요. "지금 여기" 같은 짧은 단어 하나면 충분해요.`,
    moods: ['peaceful'],
    type: 'basic',
    date: '2026-04-17T21:40:00.000Z',
    shared: true,
    comments: [],
  },
  {
    id: 'public-5',
    authorName: '소나기소녀',
    authorInitial: '소',
    dream: '갑자기 장대비가 쏟아지는 골목에서 우산 없이 서 있었어요. 이상하게 춥지 않았고, 빗소리가 음악처럼 들렸어요. 바닥에 생긴 물웅덩이에 별이 비쳤어요.',
    interpretation: `갑자기 쏟아진 장대비를 우산 없이 맞고 있었는데 춥지 않고 음악처럼 들렸다는 감각이 가장 특이해요. 불편한 상황이 오히려 평온하게 느껴진 이 전환이 꿈의 핵심 메시지예요.

상징 해석
• 비는 전통적으로 **감정의 정화**와 해묵은 피로의 씻어냄을 상징해요.
• 우산 없이도 춥지 않았다는 건 당신이 감정을 피하지 않고 받아들일 만큼 단단해져 있다는 신호예요.
• 물웅덩이에 비친 별은 "어두운 시간 속의 작은 희망"이에요. 고인 빗물조차 별을 담을 수 있다는 암시예요.

심리적 의미
힘든 시기를 지나오면서 자기 감정에 익숙해진 사람에게 찾아오는 회복기 꿈이에요. 비가 음악처럼 들렸다는 점에서, 과거에 아팠던 기억이 이제는 거리를 두고 바라볼 수 있는 상태가 됐다는 신호예요.

오늘의 조언
오늘은 잠깐 창문을 열고 바깥 공기를 들이쉬어보세요. 크게 무언가 할 필요 없이, 감정이 숨 쉴 공간을 5분만 내주면 돼요.`,
    moods: ['nostalgic'],
    type: 'basic',
    date: '2026-04-17T06:25:00.000Z',
    shared: true,
    comments: [
      { id: 'c-p5-1', authorName: '해몽러버', authorInitial: '해', text: '묘사가 영화같아요...', date: '2026-04-17T07:00:00.000Z' },
    ],
  },
  {
    id: 'public-6',
    authorName: '해몽러버',
    authorInitial: '해',
    dream: '할머니가 하얀 한복을 입고 부엌에 서 계셨어요. 제가 아는 할머니는 아니었는데 아는 것 같은 느낌이었어요. 저에게 따뜻한 국 한 그릇을 건네주셨어요.',
    interpretation: `모르는데도 아는 느낌인 할머니, 하얀 한복, 따뜻한 국 — 이 조합은 한국 전통에서 조상의 현몽 혹은 Jung 심리학의 "지혜의 원형(Wise Old Woman)" 이미지와 겹쳐요.

상징 해석
• 하얀 한복의 노인은 한국 민속에서 **조상의 방문**이나 보살핌의 메시지를 전하는 대표 이미지예요.
• 부엌은 집의 중심이자 생명을 데우는 공간이라, "누군가가 당신을 챙기고 있다"는 상징이에요.
• 따뜻한 국을 건네받았다는 건 물질적인 도움이 아니라 **정서적 온기·회복**의 신호예요.

심리적 의미
최근 스스로를 돌보는 감각이 부족했거나, 누군가에게서 받은 보살핌을 충분히 감사하지 못한 시기에 이 꿈이 찾아와요. 무의식이 "당신은 혼자가 아니다"라는 메시지를 따뜻한 방식으로 전해주는 중이에요.

오늘의 조언
오늘은 최근 한 달 동안 당신에게 도움을 준 사람 한 명에게 짧은 연락을 해보세요. "잘 지내세요?" 한 줄이면 충분해요.`,
    moods: ['nostalgic'],
    type: 'basic',
    date: '2026-04-16T22:15:00.000Z',
    shared: true,
    comments: [],
  },
  {
    id: 'public-7',
    authorName: '카페라떼',
    authorInitial: '카',
    dream: '엘리베이터를 탔는데 숫자판이 제가 모르는 글자였어요. 아무 버튼이나 눌렀더니 엘리베이터가 옆으로 움직이기 시작했어요. 멀미가 났지만 재밌기도 했어요.',
    interpretation: `엘리베이터인데 위아래가 아니라 옆으로 움직이고, 숫자판이 모르는 글자로 바뀌어 있다는 설정이 가장 특이한 지점이에요. 익숙한 이동 도구가 낯선 방식으로 작동하는 꿈은 삶의 기준 자체가 바뀌는 시기에 자주 찾아와요.

상징 해석
• 엘리베이터는 **삶의 방향·속도**에 대한 상징이에요.
• 숫자판이 모르는 글자로 바뀐 건 "지금의 기준이 예전과 다르다"는 뜻이에요. 과거의 지표로는 현재를 잴 수 없어요.
• 옆으로 움직였다는 건 일반적인 상승·하강 경로가 아닌 **새 길**을 시도 중이라는 신호예요. 멀미는 그 전환의 불편함이에요.

심리적 의미
익숙한 성공 공식이 더 이상 통하지 않는다는 무의식의 감각이 드러난 꿈이에요. "재밌기도 했다"는 부분이 중요한데, 당신이 이 변화를 겁내면서도 호기심으로 받아들이고 있다는 긍정적 신호예요.

오늘의 조언
오늘은 평소 기준으로 판단하기 애매한 일 하나를 "해봐도 되는 실험"으로 재명명해보세요. 확신 없이도 한 걸음 나아가도 괜찮은 시기예요.`,
    moods: ['weird'],
    type: 'basic',
    date: '2026-04-15T19:00:00.000Z',
    shared: true,
    comments: [],
  },
  {
    id: 'public-8',
    authorName: '새벽산책',
    authorInitial: '새',
    dream: '모르는 개 한 마리가 저를 따라왔어요. 꼬리를 살랑거리면서 집 앞까지 왔는데, 문을 여니 사라졌어요. 대신 문 앞에 꽃 한 송이가 놓여 있었어요.',
    interpretation: `모르는 개가 집까지 따라와 사라지고 그 자리에 꽃 한 송이가 남았다는 흐름이 가장 인상적인 지점이에요. 동물이 선물을 남기고 떠나는 꿈은 한국과 서구 전통 모두에서 "선의의 신호가 도착한다"는 의미의 대표 길몽이에요.

상징 해석
• 개는 전통적으로 **충직·메시지·소식**을 상징해요. 특히 꼬리를 살랑거렸다면 우호적 기운이에요.
• 문을 열 때 사라졌다는 건 메시지는 이미 전달됐으니 기다리기보다 행동할 때가 됐다는 뜻이에요.
• 남겨진 꽃 한 송이는 짧은 만남이 남기는 귀한 호의의 증거예요. 꽃은 **피어날 가능성**의 상징이기도 해요.

심리적 의미
최근 일상에서 작은 호의나 안부를 무심코 지나쳤을 가능성이 커요. 이 꿈은 그 신호들이 사라지기 전에 알아채라는 무의식의 리마인더예요.

오늘의 조언
가까운 사이에서 온 연락 중 답장이 밀려 있는 것 하나를 오늘 처리해보세요. 반가운 소식은 대개 당신이 문을 한 번 더 열 때 안으로 들어와요.`,
    moods: ['happy'],
    type: 'basic',
    date: '2026-04-16T03:50:00.000Z',
    shared: true,
    comments: [
      { id: 'c-p8-1', authorName: '꿈꾸는이', authorInitial: '꿈', text: '너무 따뜻한 꿈이다...', date: '2026-04-15T20:00:00.000Z' },
    ],
  },
]
