// ─────────────────────────────────────────────
// 타로 카드 뽑기 로직 (덱 섞기 · 카드 뽑기)
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

// 스프레드 종류에 맞는 장수를 뽑습니다.
export function drawSpread(kind: SpreadKind): DrawnCard[] {
  return drawCards(kind === 'one' ? 1 : 3)
}

// 뽑힌 카드의 방향에 맞는 해석 문장을 돌려줍니다.
export function readingText(drawn: DrawnCard): string {
  return drawn.reversed ? drawn.card.reversed : drawn.card.upright
}
