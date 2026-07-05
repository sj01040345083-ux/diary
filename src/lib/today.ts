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

// 날짜를 기준으로 '오늘의 명언'을 하나 고릅니다.
// 같은 날에는 항상 같은 명언이 나오고, 다음 날이 되면 자동으로 바뀝니다.
export function getTodaysQuote(date = new Date()): Quote {
  const dayNumber = Math.floor(date.getTime() / 86_400_000) // 1970년부터 며칠째인지
  const index = ((dayNumber % quotes.length) + quotes.length) % quotes.length
  return quotes[index]
}
