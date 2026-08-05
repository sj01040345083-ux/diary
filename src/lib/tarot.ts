// ─────────────────────────────────────────────
// 타로 카드 뽑기 로직 (덱 섞기 · 카드 뽑기 · 주제 · 일기 저장용 글 만들기)
// 화면(pages/TarotPage.tsx)에서 이 함수들을 불러 씁니다.
// ─────────────────────────────────────────────

import { tarotDeck } from '../config/tarot'
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

// 골라 뽑기 화면에서 보여주는 뒷면 카드 장수 (이 중에서 골라요)
export const POOL_SIZE = 7

// 무엇을 물어보는 타로인지 — 주제
export type TarotTopic = {
  key: string
  label: string
  emoji: string
  hint: string
}

export const tarotTopics: TarotTopic[] = [
  { key: 'today', label: '오늘의 운세', emoji: '🌅', hint: '오늘 하루의 전반적인 흐름' },
  { key: 'love', label: '연애·관계', emoji: '💗', hint: '사랑과 사람 사이의 마음' },
  { key: 'work', label: '일·금전', emoji: '💼', hint: '일·공부·돈에 관한 흐름' },
  { key: 'mind', label: '마음·고민', emoji: '🌿', hint: '지금 마음속 고민' },
]

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

// 일기에 저장할 때 넣을 '타로 결과 글'을 예쁘게 만듭니다.
export function formatReadingForDiary(
  topic: TarotTopic,
  kind: SpreadKind,
  cards: DrawnCard[],
): string {
  const lines: string[] = [`🔮 오늘의 타로 — ${topic.label}`]
  cards.forEach((drawn, i) => {
    const pos = kind === 'three' ? `${threePositions[i]} · ` : ''
    lines.push(
      `· ${pos}${drawn.card.name} (${directionLabel(drawn)})`,
    )
    lines.push(`  ${readingText(drawn)}`)
  })
  return lines.join('\n')
}
