import { useEffect, useMemo, useState } from 'react'
import { getMyTransactions } from '../lib/transactions'
import type { Transaction } from '../lib/transactions'
import { getMyDiaries } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
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

type Segment = { name: string; amount: number; color: string; percent: number }

// 선택한 달, 특정 종류(수입/지출)를 카테고리별로 합산
function buildSegments(
  txs: Transaction[],
  month: string,
  type: 'income' | 'expense',
): { segments: Segment[]; total: number } {
  const monthly = txs.filter(
    (t) => t.type === type && t.tx_date.startsWith(month),
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
}

// 도넛 그래프 (재사용)
function Donut({
  segments,
  total,
  label,
}: {
  segments: Segment[]
  total: number
  label: string
}) {
  const size = 190
  const stroke = 30
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  let cumulative = 0
  return (
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
        <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill="#fffdf8" />
      </svg>
      <div className="stat-donut-center">
        <span className="stat-donut-label">{label}</span>
        <span className="stat-donut-total">{won(total)}원</span>
      </div>
    </div>
  )
}

// 카테고리별 목록 (재사용)
function CategoryList({ segments }: { segments: Segment[] }) {
  return (
    <div className="stat-cat-list">
      {segments.map((seg) => (
        <div className="stat-cat-row" key={seg.name}>
          <span className="stat-cat-dot" style={{ background: seg.color }} />
          <span className="stat-cat-name">
            {categoryIcon(seg.name)} {seg.name}
          </span>
          <span className="stat-cat-pct">{Math.round(seg.percent)}%</span>
          <span className="stat-cat-amt">{won(seg.amount)}원</span>
        </div>
      ))}
    </div>
  )
}

export default function StatsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(thisMonth())
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([getMyTransactions(), getMyDiaries()])
      .then(([t, d]) => {
        setTxs(t)
        setDiaries(d)
      })
      .catch(() => {
        setTxs([])
        setDiaries([])
      })
      .finally(() => setLoading(false))
  }, [])

  const expense = useMemo(
    () => buildSegments(txs, month, 'expense'),
    [txs, month],
  )
  const income = useMemo(
    () => buildSegments(txs, month, 'income'),
    [txs, month],
  )
  const balance = income.total - expense.total
  const hasData = income.total > 0 || expense.total > 0

  // 내보내기 라이브러리는 버튼을 누를 때만 불러옵니다 (초기 로딩 가볍게)
  async function handleExcel() {
    setExporting(true)
    try {
      const { exportRecordsXlsx } = await import('../lib/exporters')
      exportRecordsXlsx({ month, diaries, transactions: txs })
    } finally {
      setExporting(false)
    }
  }

  async function handleWord() {
    setExporting(true)
    try {
      const { exportReportDocx } = await import('../lib/exporters')
      await exportReportDocx({ month, diaries, transactions: txs })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="home-screen">
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
        ) : !hasData ? (
          <div className="diary-empty">
            <p>이번 달 기록이 아직 없어요.</p>
            <p>소비·수입에서 기록을 남겨보세요 🌿</p>
          </div>
        ) : (
          <>
            {/* 월간 요약 */}
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">총 수입</span>
                <span className="summary-value income">
                  +{won(income.total)}원
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">총 지출</span>
                <span className="summary-value expense">
                  -{won(expense.total)}원
                </span>
              </div>
              <div className="summary-item summary-balance">
                <span className="summary-label">잔액</span>
                <span
                  className={`summary-value ${balance < 0 ? 'expense' : 'income'}`}
                >
                  {balance < 0 ? '-' : ''}
                  {won(Math.abs(balance))}원
                </span>
              </div>
            </div>

            {/* 지출 통계 */}
            {expense.total > 0 && (
              <section className="stat-block">
                <p className="report-section-title">지출 통계</p>
                <Donut
                  segments={expense.segments}
                  total={expense.total}
                  label="총 지출"
                />
                <CategoryList segments={expense.segments} />
              </section>
            )}

            {/* 수입 통계 */}
            {income.total > 0 && (
              <section className="stat-block">
                <p className="report-section-title">수입 통계</p>
                <Donut
                  segments={income.segments}
                  total={income.total}
                  label="총 수입"
                />
                <CategoryList segments={income.segments} />
              </section>
            )}
          </>
        )}

        {/* 내보내기 */}
        {!loading && (
          <>
            <p className="report-section-title">내보내기</p>
            <div className="export-row">
              <button
                className="export-btn"
                onClick={handleExcel}
                disabled={exporting}
              >
                {exporting ? '만드는 중…' : '📊 엑셀로 내보내기'}
              </button>
              <button
                className="export-btn"
                onClick={handleWord}
                disabled={exporting}
              >
                {exporting ? '만드는 중…' : '📄 워드로 내보내기'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
