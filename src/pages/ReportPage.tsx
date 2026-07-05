import { useEffect, useState } from 'react'
import { authBackground } from '../config/backgrounds'
import { getMyDiaries } from '../lib/diaries'
import { getMyGratitude } from '../lib/gratitude'
import { getMyTransactions } from '../lib/transactions'
import './home.css'

function won(n: number): string {
  return n.toLocaleString('ko-KR')
}

type Stats = {
  diaryCount: number
  gratitudeCount: number
  moodCounts: Record<string, number>
  income: number
  expense: number
}

export default function ReportPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([getMyDiaries(), getMyGratitude(), getMyTransactions()])
      .then(([diaries, grat, tx]) => {
        const moodCounts: Record<string, number> = {}
        diaries.forEach((d) => {
          if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1
        })
        const income = tx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0)
        const expense = tx
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0)
        setStats({
          diaryCount: diaries.length,
          gratitudeCount: grat.length,
          moodCounts,
          income,
          expense,
        })
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const moodEntries = stats
    ? Object.entries(stats.moodCounts).sort((a, b) => b[1] - a[1])
    : []
  const maxMood = moodEntries.length ? moodEntries[0][1] : 1

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="tab-header">
        <div className="write-title">리포트</div>
      </header>

      <main className="home-container">
        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : !stats ? (
          <div className="diary-empty">
            <p>리포트를 불러오지 못했어요.</p>
          </div>
        ) : (
          <>
            <h1 className="write-heading">나의 기록 요약 📊</h1>

            {/* 개수 요약 */}
            <div className="report-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.diaryCount}</div>
                <div className="stat-label">일기</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.gratitudeCount}</div>
                <div className="stat-label">감사</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {won(stats.income - stats.expense)}
                </div>
                <div className="stat-label">잔액(원)</div>
              </div>
            </div>

            {/* 기분 분포 */}
            <p className="report-section-title">기분 분포</p>
            {moodEntries.length === 0 ? (
              <div className="diary-empty">
                <p>아직 기분 기록이 없어요.</p>
              </div>
            ) : (
              <div className="money-card">
                {moodEntries.map(([emoji, count]) => (
                  <div className="mood-stat-row" key={emoji}>
                    <span className="mood-stat-emoji">{emoji}</span>
                    <span className="mood-stat-bar">
                      <span
                        className="mood-stat-fill"
                        style={{ width: `${(count / maxMood) * 100}%` }}
                      />
                    </span>
                    <span className="mood-stat-count">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 소비/수입 */}
            <p className="report-section-title">소비 · 수입</p>
            <div className="money-card">
              <div className="money-row">
                <span>수입</span>
                <span className="tx-amount-in">+{won(stats.income)}원</span>
              </div>
              <div className="money-row">
                <span>지출</span>
                <span className="tx-amount-out">-{won(stats.expense)}원</span>
              </div>
              <div className="money-row total">
                <span>잔액</span>
                <span>{won(stats.income - stats.expense)}원</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
