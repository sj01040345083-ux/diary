import { useMemo, useState } from 'react'
import type { Diary } from '../lib/diaries'

// 일기 기록을 달력으로 보여줍니다.
// 일기가 있는 날짜에는 그 날의 기분 이모지가 표시되고, 눌러서 그 날 일기를 조회합니다.

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

function thisMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type Props = {
  diaries: Diary[]
  selectedDate: string | null
  onSelect: (date: string | null) => void
}

export default function DiaryCalendar({
  diaries,
  selectedDate,
  onSelect,
}: Props) {
  // 일기가 있는 가장 최근 달을 기본으로 보여줍니다.
  const initialMonth = useMemo(() => {
    const months = diaries.map((d) => d.entry_date.slice(0, 7)).sort()
    return months.length ? months[months.length - 1] : thisMonth()
  }, [diaries])
  const [month, setMonth] = useState(initialMonth)

  // 날짜 → 일기 (그 날 기분 이모지 표시용)
  const byDate = useMemo(() => {
    const map = new Map<string, Diary>()
    diaries.forEach((d) => map.set(d.entry_date, d))
    return map
  }, [diaries])

  const [y, m] = month.split('-').map(Number)
  const firstWeekday = new Date(y, m - 1, 1).getDay()
  const daysInMonth = new Date(y, m, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal-card">
      <div className="cal-head">
        <button
          className="cal-arrow"
          onClick={() => setMonth((mo) => shiftMonth(mo, -1))}
          aria-label="이전 달"
        >
          ◀
        </button>
        <span className="cal-title">
          {y}년 {m}월
        </span>
        <button
          className="cal-arrow"
          onClick={() => setMonth((mo) => shiftMonth(mo, 1))}
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>

      <div className="cal-grid cal-weekrow">
        {WEEK.map((w) => (
          <span key={w} className="cal-wd">
            {w}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className="cal-cell cal-empty" />
          const date = `${month}-${String(d).padStart(2, '0')}`
          const diary = byDate.get(date)
          const has = !!diary
          const sel = selectedDate === date
          return (
            <button
              key={date}
              type="button"
              className={`cal-cell ${has ? 'has' : ''} ${sel ? 'sel' : ''}`}
              disabled={!has}
              onClick={() => onSelect(sel ? null : date)}
              aria-label={`${m}월 ${d}일${has ? ' 일기 있음' : ''}`}
            >
              <span className="cal-day">{d}</span>
              <span className="cal-mark">{has ? diary!.mood || '🍀' : ''}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
