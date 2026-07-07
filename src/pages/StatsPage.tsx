import { useEffect, useMemo, useState } from 'react'
import { authBackground } from '../config/backgrounds'
import { getMyTransactions } from '../lib/transactions'
import type { Transaction } from '../lib/transactions'
import { categoryIcon, pastelColor } from '../config/categories'
import './home.css'

function won(n: number): string {
  return n.toLocaleString('ko-KR')
}

// "2026-05" 형태의 달을 delta만큼 이동
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${y}년 ${m}월`
}

function thisMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function StatsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(thisMonth())

  useEffect(() => {
    getMyTransactions()
      .then(setTxs)
      .catch(() => setTxs([]))
      .finally(() => setLoading(false))
  }, [])

  // 선택한 달의 '지출'을 카테고리별로 합산
  const { segments, total } = useMemo(() => {
    const monthly = txs.filter(
      (t) => t.type === 'expense' && t.tx_date.startsWith(month),
    )
    const sums: Record<string, number> = {}
    monthly.forEach((t) => {
      const key = t.category || '기타'
      sums[key] = (sums[key] || 0) + Number(t.amount)
    })
    const total = Object.values(sums).reduce((s, v) => s + v, 0)
    const segments = Object.entries(sums)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .map((seg, i) => ({
        ...seg,
        color: pastelColor(i),
        percent: total ? (seg.amount / total) * 100 : 0,
      }))
    return { segments, total }
  }, [txs, month])

  // 도넛 그래프 계산
  const size = 190
  const stroke = 30
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  let cumulative = 0

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="tab-header">
        <div className="write-title">통계</div>
      </header>

      <main className="home-container">
        {/* 월 선택 */}
        <div className="stat-month">
          <button
            className="stat-month-arrow"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="이전 달"
          >
            ◀
          </button>
          <span className="stat-month-label">{monthLabel(month)}</span>
          <button
            className="stat-month-arrow"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>

        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : total === 0 ? (
          <div className="diary-empty">
            <p>이 달엔 지출 기록이 없어요.</p>
            <p>소비·수입에서 기록을 남겨보세요 🌿</p>
          </div>
        ) : (
          <>
            {/* 도넛 그래프 */}
            <div className="stat-donut-wrap">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth={stroke}
                  />
                  {segments.map((seg) => {
                    const len = (seg.percent / 100) * C
                    const offset = -(cumulative / 100) * C
                    cumulative += seg.percent
                    return (
                      <circle
                        key={seg.name}
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={stroke}
                        strokeDasharray={`${len} ${C - len}`}
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                      />
                    )
                  })}
                </g>
                {/* 가운데 크림색 원 (숫자가 잘 보이도록) */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r - stroke / 2}
                  fill="#fffdf8"
                />
              </svg>
              <div className="stat-donut-center">
                <span className="stat-donut-label">총 지출</span>
                <span className="stat-donut-total">{won(total)}원</span>
              </div>
            </div>

            {/* 카테고리별 목록 */}
            <div className="stat-cat-list">
              {segments.map((seg) => (
                <div className="stat-cat-row" key={seg.name}>
                  <span
                    className="stat-cat-dot"
                    style={{ background: seg.color }}
                  />
                  <span className="stat-cat-name">
                    {categoryIcon(seg.name)} {seg.name}
                  </span>
                  <span className="stat-cat-pct">
                    {Math.round(seg.percent)}%
                  </span>
                  <span className="stat-cat-amt">{won(seg.amount)}원</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
