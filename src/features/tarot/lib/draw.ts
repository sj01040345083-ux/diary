// ─────────────────────────────────────────────
// 타로 '하루 한 장' 추첨 로직 (결정론적)
//
// Math.random() 을 쓰지 않는다. user_id + 날짜를 시드로 계산한다.
//  → 앱을 껐다 켜도 같은 카드, 서버 왕복 없이 계산, 네트워크 실패 시에도 표시 가능.
//  → DB 레코드는 '뽑았다는 사실'의 기록일 뿐, 카드 값의 출처가 아니다.
// ─────────────────────────────────────────────

import { tarotCards, getCardById } from './cards'

/** FNV-1a 32bit 해시 */
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 PRNG */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface DrawResult {
  cardId: number // 0~21
  isReversed: boolean
  promptIndex: number
}

// user_id + 날짜로 오늘의 카드를 계산합니다.
// rng 호출 순서(카드 → 역방향 → 질문)는 절대 바꾸지 말 것.
// (순서가 바뀌면 과거 날짜의 카드가 달라집니다.)
export function drawDailyCard(userId: string, dateKey: string): DrawResult {
  const rng = mulberry32(hashSeed(`${userId}:${dateKey}`))
  const cardId = Math.floor(rng() * tarotCards.length) // 0~21
  const isReversed = rng() < 0.35
  const promptCount = getCardById(cardId).prompts.length
  const promptIndex = promptCount > 0 ? Math.floor(rng() * promptCount) : 0
  return { cardId, isReversed, promptIndex }
}

// KST(한국 시간) 기준 날짜 키 'YYYY-MM-DD'.
// toLocaleDateString()은 기기 타임존에 의존하므로 쓰지 않는다.
// 해외 체류 중에도 한국 날짜 기준으로 동작해야 캘린더와 어긋나지 않는다.
export function getKstDateKey(d: Date = new Date()): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

// prompts 배열 길이가 바뀌어도 과거 prompt_index 가 범위를 벗어나지 않도록 clamp.
export function clampPromptIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(Math.max(index, 0), count - 1)
}
