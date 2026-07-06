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

// 명언을 무작위로 하나 고릅니다. (홈에 들어올 때마다 다른 명언이 나오게)
export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * quotes.length)
  return quotes[index]
}
