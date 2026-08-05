// ─────────────────────────────────────────────
// 타로 '하루 한 장' 카드 데이터 (메이저 아르카나 22장)
//
// 설계 원칙 (반드시 지킬 것):
//  - 예언하지 않는다. 카드는 항상 '질문'으로 끝난다. (prompts 는 모두 물음표)
//  - "~하게 될 것입니다" 같은 미래 단정 표현 금지.
//  - 역방향(reversedNote)은 '나쁜 의미'가 아니라 같은 질문을 안쪽으로 돌리는 장치.
// ─────────────────────────────────────────────

export interface TarotCard {
  id: number // 0~21
  nameKo: string
  nameEn: string
  keywords: string[] // 2~3개, 명사형
  prompts: string[] // 일기 질문 variant (2~3개), 모두 물음표로 끝남
  reversedNote: string // 역방향일 때 질문에 덧붙는 한 줄 (물음표)
}

export const tarotCards: TarotCard[] = [
  {
    id: 0,
    nameKo: '바보',
    nameEn: 'The Fool',
    keywords: ['시작', '무모함', '가능성'],
    prompts: [
      '오늘, 결과를 모른 채 발을 뗀 일이 있었나요?',
      '잘 몰라서 오히려 편했던 순간이 있었나요?',
      '지금 시작해도 괜찮을 것 같은 게 하나 있다면 뭘까요?',
    ],
    reversedNote: '아직 못 뗀 발이 있다면 뭐가 걸리고 있나요?',
  },
  {
    id: 1,
    nameKo: '마법사',
    nameEn: 'The Magician',
    keywords: ['의지', '자원', '실행'],
    prompts: [
      '오늘 내가 가진 것 중 실제로 써먹은 건 뭐였나요?',
      '하려고 마음먹은 걸 실제로 한 순간이 있었나요?',
      '지금 당장 손에 쥐고 있는 재료는 뭐가 있을까요?',
    ],
    reversedNote: '가진 걸 알면서도 못 꺼내 쓰고 있는 게 있나요?',
  },
  {
    id: 2,
    nameKo: '여사제',
    nameEn: 'The High Priestess',
    keywords: ['직관', '침묵', '내면'],
    prompts: [
      '오늘 말하지 않고 넘어간 게 있었나요?',
      '설명은 못 하겠는데 그냥 그럴 것 같았던 순간이 있었나요?',
      '조용히 있고 싶었던 시간이 오늘 있었나요?',
    ],
    reversedNote: '속으로 이미 알고 있는데 모른 척한 게 있나요?',
  },
  {
    id: 3,
    nameKo: '여황제',
    nameEn: 'The Empress',
    keywords: ['풍요', '돌봄', '감각'],
    prompts: [
      '오늘 나를 돌본 방식이 하나 있다면 뭐였나요?',
      '감각으로 기억되는 순간이 오늘 있었나요? 맛, 냄새, 온도 같은 것들요.',
      '누군가를 챙기느라 쓴 마음이 있었나요?',
    ],
    reversedNote: '나를 돌보는 걸 자꾸 뒤로 미루고 있진 않나요?',
  },
  {
    id: 4,
    nameKo: '황제',
    nameEn: 'The Emperor',
    keywords: ['질서', '책임', '경계'],
    prompts: [
      '오늘 내가 지킨 규칙이나 선이 있었나요?',
      '책임지고 있는 일 중에 오늘 가장 무거웠던 건 뭔가요?',
      '내 영역이라고 느껴지는 게 오늘 있었나요?',
    ],
    reversedNote: '지키려는 선이 나를 답답하게 하고 있진 않나요?',
  },
  {
    id: 5,
    nameKo: '교황',
    nameEn: 'The Hierophant',
    keywords: ['규범', '배움', '소속'],
    prompts: [
      '오늘 따랐던 방식은 원래부터 내 것이었나요?',
      '누군가에게 배운 대로 한 일이 오늘 있었나요?',
      '속해 있는 곳에서 오늘 어떤 기분이었나요?',
    ],
    reversedNote: '남의 방식이 나와 맞지 않는다고 느낀 건 아닌가요?',
  },
  {
    id: 6,
    nameKo: '연인',
    nameEn: 'The Lovers',
    keywords: ['선택', '관계', '끌림'],
    prompts: [
      '오늘 고른 것과 고르지 않은 것은 뭐였나요?',
      '마음이 기울었던 쪽이 있었나요?',
      '누군가와의 사이에서 오늘 움직인 게 있었나요?',
    ],
    reversedNote: '고르지 못하고 미뤄둔 마음이 있나요?',
  },
  {
    id: 7,
    nameKo: '전차',
    nameEn: 'The Chariot',
    keywords: ['추진', '통제', '방향'],
    prompts: [
      '오늘 밀고 나간 일이 있었나요?',
      '방향은 맞는데 속도가 안 맞는 것 같은 게 있나요?',
      '내가 쥐고 있는 고삐는 지금 어디로 향해 있나요?',
    ],
    reversedNote: '방향을 정하지 못한 채 힘만 쓰고 있진 않나요?',
  },
  {
    id: 8,
    nameKo: '힘',
    nameEn: 'Strength',
    keywords: ['인내', '부드러움', '용기'],
    prompts: [
      '오늘 참아낸 게 있다면 뭐였나요?',
      '세게 하지 않고 넘긴 순간이 있었나요?',
      '버티는 중인 게 있다면, 언제부터였나요?',
    ],
    reversedNote: '참는 게 버거워진 순간이 오늘 있었나요?',
  },
  {
    id: 9,
    nameKo: '은둔자',
    nameEn: 'The Hermit',
    keywords: ['고독', '성찰', '거리'],
    prompts: [
      '오늘 혼자 있고 싶었던 순간이 있었나요?',
      '한 발 떨어져서 보니 다르게 보인 게 있었나요?',
      '지금 나에게 필요한 거리는 어느 정도일까요?',
    ],
    reversedNote: '혼자 있고 싶은데 그럴 수 없었던 건 아닌가요?',
  },
  {
    id: 10,
    nameKo: '운명의 수레바퀴',
    nameEn: 'Wheel of Fortune',
    keywords: ['전환', '우연', '흐름'],
    prompts: [
      '오늘 내 뜻과 상관없이 일어난 일이 있었나요?',
      '요즘 흐름이 어느 쪽으로 가고 있는 것 같나요?',
      '우연이라고 넘긴 일 중에 마음에 남는 게 있나요?',
    ],
    reversedNote: '흐름에 맞서느라 지친 건 아닌가요?',
  },
  {
    id: 11,
    nameKo: '정의',
    nameEn: 'Justice',
    keywords: ['균형', '판단', '대가'],
    prompts: [
      '오늘 공평하지 않다고 느낀 순간이 있었나요?',
      '내가 내린 판단 중에 다시 생각해보고 싶은 게 있나요?',
      '지금 치르고 있는 대가가 있다면 뭘까요?',
    ],
    reversedNote: '스스로에게 너무 엄격했던 건 아닌가요?',
  },
  {
    id: 12,
    nameKo: '매달린 사람',
    nameEn: 'The Hanged Man',
    keywords: ['멈춤', '전환된 시선', '기다림'],
    prompts: [
      '오늘 멈춰 있어야 했던 일이 있었나요?',
      '기다리는 중인 게 있다면, 어떤 기분인가요?',
      '뒤집어 보면 달라 보이는 게 요즘 있나요?',
    ],
    reversedNote: '놓아야 하는데 계속 매달려 있는 게 있나요?',
  },
  {
    id: 13,
    nameKo: '죽음',
    nameEn: 'Death',
    keywords: ['끝', '정리', '이행'],
    prompts: [
      '오늘 끝난 게 있었나요? 작은 것이라도요.',
      '이제는 안 해도 될 것 같은 게 있나요?',
      '정리하고 싶은데 아직 못 놓은 게 있다면 뭘까요?',
    ],
    reversedNote: '끝난 걸 아직 끝났다고 인정하지 못한 게 있나요?',
  },
  {
    id: 14,
    nameKo: '절제',
    nameEn: 'Temperance',
    keywords: ['조율', '중간', '섞임'],
    prompts: [
      '오늘 조절이 필요했던 게 있었나요?',
      '양쪽 사이에서 균형을 잡느라 애쓴 일이 있나요?',
      '적당하다는 건 나한테 어느 정도일까요?',
    ],
    reversedNote: '어느 한쪽으로 기울어 균형을 잃은 게 있나요?',
  },
  {
    id: 15,
    nameKo: '악마',
    nameEn: 'The Devil',
    keywords: ['집착', '습관', '얽매임'],
    prompts: [
      '오늘 또 반복한 게 있었나요?',
      '알면서도 계속하게 되는 게 있나요?',
      '나를 붙잡고 있는 게 있다면, 그건 언제부터였나요?',
    ],
    reversedNote: '벗어나고 싶은데 아직 못 놓은 게 있나요?',
  },
  {
    id: 16,
    nameKo: '탑',
    nameEn: 'The Tower',
    keywords: ['붕괴', '균열', '드러남'],
    prompts: [
      '오늘 예상 밖으로 무너진 게 있었나요?',
      '갑자기 드러난 사실이 있었나요?',
      '흔들렸을 때 가장 먼저 든 생각은 뭐였나요?',
    ],
    reversedNote: '무너지지 않으려고 붙잡고 있는 게 있나요?',
  },
  {
    id: 17,
    nameKo: '별',
    nameEn: 'The Star',
    keywords: ['회복', '희망', '여백'],
    prompts: [
      '오늘 조금이라도 나아졌다고 느낀 게 있나요?',
      '기대를 걸고 있는 게 있다면 뭘까요?',
      '오늘 숨 돌린 순간이 있었나요?',
    ],
    reversedNote: '기대를 걸기가 조심스러운 이유가 있나요?',
  },
  {
    id: 18,
    nameKo: '달',
    nameEn: 'The Moon',
    keywords: ['불안', '모호함', '무의식'],
    prompts: [
      '오늘 불안했던 순간이 있었나요?',
      '확실하지 않은데 계속 신경 쓰이는 게 있나요?',
      '꿈이나 잠에 대해 남은 감각이 있나요?',
    ],
    reversedNote: '불안의 정체를 아직 못 들여다본 건 아닌가요?',
  },
  {
    id: 19,
    nameKo: '태양',
    nameEn: 'The Sun',
    keywords: ['명료', '활기', '드러냄'],
    prompts: [
      '오늘 분명하게 좋았던 순간이 있었나요?',
      '숨기지 않고 드러낸 게 있었나요?',
      '오늘 나를 웃게 한 건 뭐였나요?',
    ],
    reversedNote: '드러내기가 망설여지는 게 있나요?',
  },
  {
    id: 20,
    nameKo: '심판',
    nameEn: 'Judgement',
    keywords: ['부름', '결산', '각성'],
    prompts: [
      '오늘 지난 일이 떠오른 순간이 있었나요?',
      '이제 답을 해야 할 것 같은 게 있나요?',
      '돌아보니 달라진 게 있다면 뭘까요?',
    ],
    reversedNote: '스스로를 아직 용서하지 못한 게 있나요?',
  },
  {
    id: 21,
    nameKo: '세계',
    nameEn: 'The World',
    keywords: ['완결', '통합', '매듭'],
    prompts: [
      '오늘 마무리한 게 있었나요?',
      '한 바퀴 돌아 제자리로 온 것 같은 일이 있나요?',
      '지금 이 시기에 이름을 붙인다면 뭐라고 할까요?',
    ],
    reversedNote: '끝맺지 못해 마음에 걸리는 게 있나요?',
  },
]

// id로 카드를 찾습니다. (없으면 안전하게 0번)
export function getCardById(id: number): TarotCard {
  return tarotCards[id] ?? tarotCards[0]
}
