// ─────────────────────────────────────────────
// 타로 카드 뽑기 로직 (덱 섞기 · 카드 뽑기 · 주제 · 일기 저장용 글 만들기)
// 화면(pages/TarotPage.tsx)에서 이 함수들을 불러 씁니다.
// ─────────────────────────────────────────────

import { tarotDeck, suitInfo } from '../config/tarot'
import type { TarotCard } from '../config/tarot'

// 뽑힌 카드 하나 — 어떤 카드인지 + 정방향/역방향 여부
export type DrawnCard = {
  card: TarotCard
  reversed: boolean // true면 거꾸로(역방향) 나온 것
}

// 스프레드(뽑기 방식) 종류
export type SpreadKind = 'one' | 'three'

// 3장 스프레드에서 각 자리가 뜻하는 것
export const threePositions = ['과거', '현재', '미래'] as const

// 골라 뽑기 화면(그리드)에서 펼쳐 보여주는 뒷면 카드 장수 (이 중에서 골라요)
export const POOL_SIZE = 21

// 무엇을 물어보는 타로인지 — 주제
export type TarotTopic = {
  key: string
  label: string
  emoji: string
  hint: string
}

export const tarotTopics: TarotTopic[] = [
  { key: 'today', label: '오늘의 운세', emoji: '🌅', hint: '오늘 하루의 전반적인 흐름' },
  { key: 'love', label: '연애·관계', emoji: '💗', hint: '사랑과 연인 사이의 마음' },
  { key: 'work', label: '일·금전', emoji: '💼', hint: '일·공부·돈에 관한 흐름' },
  { key: 'mind', label: '마음·고민', emoji: '🌿', hint: '지금 마음속 고민' },
  { key: 'relations', label: '인간관계', emoji: '👥', hint: '사람들과의 관계 흐름' },
]

// 주제에 맞춰 카드를 바라보는 '관점 한 줄' (질문형, 예언하지 않음).
// 카드의 대표 키워드를 그 주제 쪽으로 비춰 봅니다.
export function topicReflection(topicKey: string, drawn: DrawnCard): string {
  const k = drawn.card.keywords[0]
  switch (topicKey) {
    case 'today':
      return `오늘 하루, ‘${k}’의 기운이 어디에서 느껴지나요?`
    case 'love':
      return `연애·관계에서 ‘${k}’의 결이 어떻게 다가오나요?`
    case 'work':
      return `일·금전에서 ‘${k}’의 흐름을 어떻게 살리면 좋을까요?`
    case 'mind':
      return `지금 마음속 ‘${k}’의 자리는 무엇과 닿아 있나요?`
    case 'relations':
      return `사람들과의 사이에서 ‘${k}’의 기운이 어떻게 작용하나요?`
    case 'flow':
      return `‘${k}’의 기운이 과거에서 지금, 앞으로 어떻게 흘러가나요?`
    default:
      return `‘${k}’의 기운을 지금 어디에서 느끼나요?`
  }
}

// ─────────────────────────────────────────────
// 이야기처럼 길게 풀어주는 해석 엔진
// 카드의 실제 뜻 + 방향(정/역) + 주제를 엮어 여러 문단으로 만듭니다.
// (특정 사이트 문구를 베끼지 않은 100% 원본 구성)
// ─────────────────────────────────────────────

export type ReadingSection = { label: string; text: string }

// 카드 종류별 '무대' 설명
function cardTheme(card: TarotCard): string {
  if (card.arcana === 'major') return '인생의 큰 흐름을 비추는 메이저 아르카나'
  switch (card.suit) {
    case 'wands':
      return '열정과 행동을 다루는 완드'
    case 'cups':
      return '감정과 관계를 비추는 컵'
    case 'swords':
      return '생각과 판단을 다루는 소드'
    case 'pentacles':
      return '현실과 물질을 다루는 펜타클'
    default:
      return '타로'
  }
}

// 주제별 이야기 (lead 인사 + 정/역 본문). k = 대표 키워드
const topicStory: Record<
  string,
  { lead: string; up: (k: string) => string; rev: (k: string) => string }
> = {
  today: {
    lead: '오늘 하루의 전반적인 흐름을 물으셨죠.',
    up: (k) =>
      `전반적인 공기는 맑은 편이에요. ‘${k}’의 기운이 하루 곳곳에서 작은 신호로 나타나니, 서두르지 말고 그 결을 따라가 보세요.`,
    rev: (k) =>
      `다만 흐름이 조금 엉켜 있을 수 있어요. ‘${k}’에 억지로 매달리기보다, 한 박자 쉬어가며 나만의 페이스를 지키는 편이 좋겠습니다.`,
  },
  love: {
    lead: '연애와 사람 사이의 마음을 물으셨죠.',
    up: (k) =>
      `지금은 마음을 열고 한 걸음 다가가도 좋은 흐름이에요. ‘${k}’의 온기가 두 사람 사이에 다정함을 더해 줍니다.`,
    rev: (k) =>
      `지금은 서로의 속도를 살필 때예요. ‘${k}’의 결이 오해로 엉키지 않도록, 솔직하고 부드러운 표현이 필요합니다.`,
  },
  work: {
    lead: '일과 금전의 흐름을 물으셨죠.',
    up: (k) =>
      `노력이 결실로 이어질 바탕이 마련돼 있어요. ‘${k}’ 하나를 방향키 삼아 한곳에 집중하면 성과가 뒤따라옵니다.`,
    rev: (k) =>
      `지금은 무리한 확장보다 정리가 먼저예요. ‘${k}’의 기운이 새어 나가지 않도록 우선순위를 다시 세워 보세요.`,
  },
  mind: {
    lead: '지금 마음의 자리를 물으셨죠.',
    up: (k) =>
      `당신 안에는 이미 답의 실마리가 있어요. ‘${k}’의 자리를 가만히 바라보면, 흐릿하던 감정이 조금씩 또렷해질 거예요.`,
    rev: (k) =>
      `마음이 조금 무겁고 뒤엉켜 있을 수 있어요. ‘${k}’의 감정을 억누르기보다 이름 붙여 인정해 줄 때, 매듭이 풀리기 시작합니다.`,
  },
  relations: {
    lead: '사람들과의 관계 흐름을 물으셨죠.',
    up: (k) =>
      `곁을 나누고 함께 나아가기 좋은 때예요. ‘${k}’의 기운이 사람들 사이에 신뢰의 다리를 놓아 줍니다.`,
    rev: (k) =>
      `지금은 거리와 경계를 살필 때예요. ‘${k}’의 기운이 헛되이 소모되지 않도록, 맞지 않는 관계엔 부드럽게 선을 그어도 괜찮습니다.`,
  },
}

// 카드 종류별 조언 (정/역)
const adviceStory: Record<string, { up: string; rev: string }> = {
  major: {
    up: '큰 흐름이 당신 편이에요. 작은 두려움에 발을 멈추지 말고, 마음이 가리키는 방향으로 한 걸음 내디뎌 보세요.',
    rev: '큰 흐름이 잠시 안으로 굽어 있어요. 밖에서 답을 찾기보다, 스스로에게 솔직해지는 시간이 지금은 더 큰 힘이 됩니다.',
  },
  wands: {
    up: '망설임보다 행동이 답이에요. 지금 떠오른 그 열정을 오늘 작은 실천 하나로 옮겨 보세요.',
    rev: '불씨가 여기저기 흩어지기 쉬운 때예요. 여러 갈래로 힘을 쓰기보다, 정말 하고 싶은 하나에 에너지를 모아 보세요.',
  },
  cups: {
    up: '마음을 표현하는 일을 아끼지 마세요. 솔직한 감정 한 마디가 관계에 따뜻한 물길을 내어 줍니다.',
    rev: '감정이 고이면 무거워져요. 담아 둔 마음을 글이나 대화로 흘려보내면 한결 가벼워질 거예요.',
  },
  swords: {
    up: '생각이 맑아지는 때예요. 복잡할수록 사실과 감정을 나누어, 한 가지 기준으로 결정을 내려 보세요.',
    rev: '생각이 너무 많아 스스로를 찌르고 있진 않나요. 판단을 잠시 멈추고 머리를 비우는 휴식이 필요합니다.',
  },
  pentacles: {
    up: '차근차근 쌓는 것이 힘이 되는 때예요. 조급함을 내려놓고, 눈앞의 현실적인 한 걸음을 단단히 다져 보세요.',
    rev: '조바심이 실수를 부를 수 있어요. 돈과 시간을 어디에 쓰는지 점검하고, 기초를 다시 살펴보세요.',
  },
}

// 방향별 마무리 (카드마다 조금씩 다르게 고르도록 2개씩)
const closingStory: Record<'up' | 'rev', string[]> = {
  up: [
    '이 카드는 재촉이 아니라 다정한 응원이에요. 오늘의 힌트로 가볍게 품고 하루를 걸어 보세요. 🌙',
    '결국 방향을 정하는 건 당신이에요. 카드는 그저 등을 살며시 밀어 줄 뿐이랍니다. ✨',
  ],
  rev: [
    '역방향은 나쁜 뜻이 아니라 ‘잠깐 살펴보라’는 신호예요. 천천히 돌아보면 길은 다시 열립니다. 🌙',
    '지금의 머뭇거림도 흐름의 한 부분이에요. 스스로에게 조금 더 너그러워도 괜찮습니다. ✨',
  ],
}

function catKey(card: TarotCard): string {
  return card.arcana === 'major' ? 'major' : (card.suit ?? 'major')
}

// 카드 한 장을 여러 문단(섹션)으로 풀어 줍니다.
export function buildReading(
  drawn: DrawnCard,
  topic: TarotTopic,
  opts?: { position?: string; withLead?: boolean },
): ReadingSection[] {
  const { card, reversed } = drawn
  const dir = reversed ? 'rev' : 'up'
  const k = card.keywords[0]
  const theme = cardTheme(card)
  const withLead = opts?.withLead ?? true

  // 1) 이 카드는 (무대 + 키워드 + 방향)
  const dirFrame = reversed
    ? '지금은 이 기운이 살짝 뒤집혀 있어, 밖보다 안을 먼저 살피라는 신호예요.'
    : '지금 이 기운이 바로 서서 당신을 향하고 있어요.'
  const intro = `‘${card.name}’ 카드는 ${theme}예요. 키워드는 ${card.keywords.join(
    ' · ',
  )}. ${dirFrame}`

  // 2) 지금의 메시지 (카드 고유 해석)
  const message = reversed ? card.reversed : card.upright

  // 3) 주제 이야기
  const story = topicStory[topic.key] ?? topicStory.today
  const topicText = `${withLead ? story.lead + ' ' : ''}${
    reversed ? story.rev(k) : story.up(k)
  }`

  // 4) 조언
  const advice = (adviceStory[catKey(card)] ?? adviceStory.major)[dir]

  // 5) 마무리 (카드 id 길이로 문구를 번갈아 고름)
  const variants = closingStory[dir]
  const closing = variants[card.id.length % variants.length]

  return [
    { label: '🔮 이 카드는', text: intro },
    { label: '📖 지금의 메시지', text: message },
    { label: `${topic.emoji} ${topic.label} 이야기`, text: topicText },
    { label: '🧭 조언', text: advice },
    { label: '🌙 마무리', text: closing },
  ]
}

// 일기 저장용으로 섹션들을 문단 텍스트로 합칩니다.
export function readingSectionsToText(sections: ReadingSection[]): string {
  return sections.map((s) => s.text).join('\n')
}

// 배열을 무작위로 섞습니다. (피셔–예이츠 셔플)
function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 덱을 섞은 뒤 위에서 count장을 뽑습니다.
// 각 카드는 50% 확률로 역방향으로 나옵니다.
export function drawCards(count: number): DrawnCard[] {
  const shuffled = shuffle(tarotDeck)
  return shuffled.slice(0, count).map((card) => ({
    card,
    reversed: Math.random() < 0.5,
  }))
}

// ── 시간대(아침·점심·저녁·밤) ──
// 같은 날, 같은 시간대에는 같은 카드가 나오도록 하는 데 씁니다.
export type TimeSlot = { key: string; label: string; emoji: string }

export function currentTimeSlot(now = new Date()): TimeSlot {
  const h = now.getHours()
  if (h >= 5 && h < 11) return { key: 'morning', label: '아침', emoji: '🌅' }
  if (h >= 11 && h < 17) return { key: 'noon', label: '점심', emoji: '☀️' }
  if (h >= 17 && h < 22) return { key: 'evening', label: '저녁', emoji: '🌇' }
  return { key: 'night', label: '밤', emoji: '🌙' } // 22:00~04:59
}

// ── 씨앗(seed) 기반 난수 ──
// 같은 문자열(seed)을 넣으면 항상 같은 순서의 난수가 나옵니다.
// (사람+날짜+시간대+주제가 같으면 카드가 항상 똑같이 나오게 하는 원리)
function makeRng(seed: string): () => number {
  // 문자열 → 32bit 정수
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  // mulberry32
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 씨앗을 기준으로 '항상 같은' 카드들을 뽑습니다.
// 같은 seed면 몇 번을 다시 뽑아도 결과가 똑같습니다.
export function drawSeeded(seed: string, count: number): DrawnCard[] {
  const rand = makeRng(seed)
  const arr = [...tarotDeck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, count).map((card) => ({
    card,
    reversed: rand() < 0.5,
  }))
}

// 오늘·이 시간대에 이 사람이 이 주제로 뽑을 카드를 정하는 seed 문자열
export function readingSeed(params: {
  userId: string
  dateStr: string // "2026-08-05"
  slotKey: string // 'morning' | 'afternoon' | 'evening'
  topicKey: string
  spread: SpreadKind
}): string {
  return [
    params.userId,
    params.dateStr,
    params.slotKey,
    params.topicKey,
    params.spread,
  ].join('|')
}

// 골라 뽑기용 '뒷면 카드 묶음'을 만듭니다.
// 사용자는 이 중에서 원하는 만큼 직접 골라요. (각 카드의 앞면은 미리 정해져 있음)
export function buildPool(): DrawnCard[] {
  return drawCards(POOL_SIZE)
}

// 스프레드 종류에 맞는 '골라야 할 장수'
export function neededCount(kind: SpreadKind): number {
  return kind === 'one' ? 1 : 3
}

// 뽑힌 카드의 방향에 맞는 해석 문장을 돌려줍니다.
export function readingText(drawn: DrawnCard): string {
  return drawn.reversed ? drawn.card.reversed : drawn.card.upright
}

// 카드 방향을 한글로 ('정방향' / '역방향')
export function directionLabel(drawn: DrawnCard): string {
  return drawn.reversed ? '역방향' : '정방향'
}

// 카드가 어떤 종류인지 한 줄로 설명합니다.
// 예) 메이저 → "메이저 아르카나 · 인생의 큰 흐름"
//     소드 5 → "🗡️ 소드 · 공기 · 생각과 갈등"
export function cardCategoryLabel(card: TarotCard): string {
  if (card.arcana === 'major') {
    return '✨ 메이저 아르카나 · 인생의 큰 흐름'
  }
  const s = suitInfo[card.suit!]
  return `${s.emoji} ${s.name} · ${s.element}`
}

// 일기에 저장할 때 넣을 '타로 결과 글'을 예쁘게 만듭니다.
export function formatReadingForDiary(
  topic: TarotTopic,
  kind: SpreadKind,
  cards: DrawnCard[],
  slotLabel?: string,
): string {
  const head = slotLabel
    ? `🔮 오늘의 타로 — ${topic.label} (${slotLabel})`
    : `🔮 오늘의 타로 — ${topic.label}`
  const lines: string[] = [head]
  cards.forEach((drawn, i) => {
    const pos = kind === 'three' ? `${threePositions[i]} · ` : ''
    lines.push('')
    lines.push(`· ${pos}${drawn.card.name} (${directionLabel(drawn)})`)
    const sections = buildReading(drawn, topic, {
      position: kind === 'three' ? threePositions[i] : undefined,
      withLead: i === 0,
    })
    sections.forEach((s) => lines.push(`  ${s.text}`))
  })
  return lines.join('\n')
}
