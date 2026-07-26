import { quotes } from '../config/quotes'
import type { Quote } from '../config/quotes'

// 오늘 날짜를 "2026년 7월 5일 토요일" 형식으로 바꿔줍니다.
export function formatToday(date = new Date()): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

// 저장 시각(예: created_at)을 "2026년 7월 5일"로 표시합니다.
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
}

// 일기 목록에 쓰는 날짜 표시: "2026-07-05" -> "2026년 7월 5일 (일)"
export function formatEntryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

// 홈에 들어올 때마다 다른 명언이 나오게 무작위로 하나 고릅니다.
// 바로 직전에 보여준 명언은 건너뛰어, "같은 명언이 연속으로" 나오는 일을 막습니다.
const LAST_QUOTE_KEY = 'soso-last-quote-id'

export function getRandomQuote(): Quote {
  if (quotes.length === 0) {
    return { id: 0, text: '', author: '' }
  }

  // 직전에 보여준 명언 id를 기억해 둡니다. (없으면 -1)
  let lastId = -1
  try {
    lastId = Number(localStorage.getItem(LAST_QUOTE_KEY))
  } catch {
    lastId = -1
  }

  let pick = quotes[Math.floor(Math.random() * quotes.length)]
  // 명언이 2개 이상일 때만, 직전과 다른 명언이 나올 때까지 다시 뽑습니다.
  if (quotes.length > 1) {
    let guard = 0
    while (pick.id === lastId && guard < 20) {
      pick = quotes[Math.floor(Math.random() * quotes.length)]
      guard++
    }
  }

  try {
    localStorage.setItem(LAST_QUOTE_KEY, String(pick.id))
  } catch {
    // 저장 실패는 무시 (명언 표시에는 영향 없음)
  }
  return pick
}
