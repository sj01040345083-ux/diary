import { useState } from 'react'
import { todayString } from '../lib/diaries'

// 일기를 쓸 '날짜'를 고르는 달력입니다.
// 오늘까지의 날짜를 자유롭게 고를 수 있어(미래 날짜는 못 고름) 지난날 일기도 쓸 수 있습니다.

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type Props = {
  value: string // 지금 고른 날짜 (YYYY-MM-DD)
  onChange: (date: string) => void // 날짜를 고르면 호출
}

export default function DatePickerCalendar({ value, onChange }: Props) {
  const today = todayString()
  // 처음엔 지금 고른 날짜가 속한 달을 보여줍니다.
  const [month, setMonth] = useState(value.slice(0, 7))

  const [y, m] = month.split('-').map(Number)
  const firstWeekday = new Date(y, m - 1, 1).getDay()
  const daysInMonth = new Date(y, m, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal-card write-cal">
      <div className="cal-head">
        <button
          className="cal-arrow"
          type="button"
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
          type="button"
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
          const future = date > today // 미래 날짜는 고를 수 없음
          const sel = value === date
          const isToday = date === today
          return (
            <button
              key={date}
              type="button"
              className={`cal-cell ${future ? '' : 'pick'} ${sel ? 'sel' : ''} ${
                isToday ? 'today' : ''
              }`}
              disabled={future}
              onClick={() => onChange(date)}
              aria-label={`${m}월 ${d}일`}
            >
              <span className="cal-day">{d}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
