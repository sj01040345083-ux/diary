import { useEffect, useMemo, useState } from 'react'
import { getMyTransactions } from '../lib/transactions'
import type { Transaction } from '../lib/transactions'
import { getMyDiaries } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
import { categoryIcon } from '../config/categories'
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

type Item = { name: string; amount: number }

// 선택한 달·종류(수입/지출)를 카테고리별로 합산 → 큰 금액순 목록 + 합계
function summarize(
  txs: Transaction[],
  month: string,
  type: 'income' | 'expense',
): { items: Item[]; total: number } {
  const monthly = txs.filter(
    (t) => t.type === type && t.tx_date.startsWith(month),
  )
  const sums: Record<string, number> = {}
  monthly.forEach((t) => {
    const key = t.category || '기타'
    sums[key] = (sums[key] || 0) + Number(t.amount)
  })
  const total = Object.values(sums).reduce((s, v) => s + v, 0)
  const items = Object.entries(sums)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
  return { items, total }
}

// 고정 수입·지출: 최대 3개까지만, 각 항목은 텍스트 + 작은 비율 막대
function FixedList({
  items,
  total,
  tone,
}: {
  items: Item[]
  total: number
  tone: 'income' | 'expense'
}) {
  const top = items.slice(0, 3)
  if (top.length === 0) {
    return <p className="fixed-empty">기록이 없어요.</p>
  }
  return (
    <div className="fixed-list">
      {top.map((it) => (
        <div className="fixed-row" key={it.name}>
          <span className="fixed-name">
            {categoryIcon(it.name)} {it.name}
          </span>
          <span className="fixed-bar-track">
            <span
              className={`fixed-bar-fill ${tone}`}
              style={{ width: `${total ? (it.amount / total) * 100 : 0}%` }}
            />
          </span>
          <span className={`fixed-amt ${tone}`}>{won(it.amount)}원</span>
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

  const expense = useMemo(() => summarize(txs, month, 'expense'), [txs, month])
  const income = useMemo(() => summarize(txs, month, 'income'), [txs, month])
  const balance = income.total - expense.total
  const sum = income.total + expense.total
  const hasData = sum > 0
  // 수입·지출 비교 비율 (합계 대비)
  const incomePct = sum ? Math.round((income.total / sum) * 100) : 0
  const expensePct = sum ? 100 - incomePct : 0

  // 엑셀 라이브러리는 버튼을 누를 때만 불러옵니다 (초기 로딩 가볍게)
  async function handleExcel() {
    setExporting(true)
    try {
      const { exportStatsXlsx } = await import('../lib/exporters')
      exportStatsXlsx({ month, diaries, transactions: txs })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="home-screen">
      <header className="tab-header">
        <div className="write-title">가계부 통계</div>
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
        ) : (
          <>
            {/* 이번 달 요약 */}
            <p className="report-section-title">이번 달 요약</p>
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">총 수입</span>
                <span className="summary-value income">
                  {won(income.total)}원
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">총 지출</span>
                <span className="summary-value expense">
                  {won(expense.total)}원
                </span>
              </div>
              <div className="summary-item summary-balance">
                <span className="summary-label">남은 금액</span>
                <span
                  className={`summary-value ${balance < 0 ? 'expense' : 'income'}`}
                >
                  {balance < 0 ? '-' : ''}
                  {won(Math.abs(balance))}원
                </span>
              </div>
            </div>

            {!hasData ? (
              <div className="diary-empty">
                <p>이번 달 기록이 아직 없어요.</p>
                <p>소비·수입에서 기록을 남겨보세요 🌿</p>
              </div>
            ) : (
              <>
                {/* 수입·지출 비교 (가로 비율 바) */}
                <p className="report-section-title">수입·지출 비교</p>
                <div className="compare-card">
                  <div className="compare-legend">
                    <span className="compare-tag income">
                      수입 {incomePct}%
                    </span>
                    <span className="compare-tag expense">
                      지출 {expensePct}%
                    </span>
                  </div>
                  <div className="compare-bar">
                    <span
                      className="compare-seg income"
                      style={{ width: `${incomePct}%` }}
                    />
                    <span
                      className="compare-seg expense"
                      style={{ width: `${expensePct}%` }}
                    />
                  </div>
                </div>

                {/* 수입·지출 내역 (큰 금액순 최대 3개) */}
                <p className="report-section-title">수입·지출 내역</p>
                <div className="fixed-card">
                  <p className="fixed-group-label income">수입</p>
                  <FixedList
                    items={income.items}
                    total={income.total}
                    tone="income"
                  />
                  <div className="fixed-divider" />
                  <p className="fixed-group-label expense">지출</p>
                  <FixedList
                    items={expense.items}
                    total={expense.total}
                    tone="expense"
                  />
                </div>
                <p className="fixed-hint">
                  더 자세한 내용은 엑셀 파일에서 확인할 수 있어요.
                </p>
              </>
            )}

            {/* 엑셀 내보내기 (하나만) */}
            <div className="export-row">
              <button
                className="export-btn"
                onClick={handleExcel}
                disabled={exporting}
              >
                {exporting ? '만드는 중…' : '📊 엑셀로 내보내기'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
