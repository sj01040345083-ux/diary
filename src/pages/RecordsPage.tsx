import { useEffect, useMemo, useState } from 'react'
import { authBackground } from '../config/backgrounds'
import { getMyDiaries } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
import { formatEntryDate } from '../lib/today'
import './home.css'

type Props = {
  onEditDiary: (date: string) => void
}

export default function RecordsPage({ onEditDiary }: Props) {
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState('all') // 'all' 또는 'YYYY-MM'
  const [detail, setDetail] = useState<Diary | null>(null)

  useEffect(() => {
    getMyDiaries()
      .then(setDiaries)
      .catch(() => setDiaries([]))
      .finally(() => setLoading(false))
  }, [])

  // 일기가 있는 '달' 목록 (최신순)
  const months = useMemo(() => {
    const set = new Set(diaries.map((d) => d.entry_date.slice(0, 7)))
    return Array.from(set).sort().reverse()
  }, [diaries])

  // 월 + 검색어로 걸러낸 목록
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return diaries.filter((d) => {
      if (month !== 'all' && !d.entry_date.startsWith(month)) return false
      if (q && !d.content.toLowerCase().includes(q)) return false
      return true
    })
  }, [diaries, query, month])

  function monthLabel(m: string) {
    const [y, mm] = m.split('-')
    return `${y}.${mm}`
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="tab-header">
        <div className="write-title">기록</div>
      </header>

      <main className="home-container">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 일기 내용 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* 월별 필터 */}
        {months.length > 0 && (
          <div className="month-row">
            <button
              className={`month-btn ${month === 'all' ? 'is-active' : ''}`}
              onClick={() => setMonth('all')}
            >
              전체
            </button>
            {months.map((m) => (
              <button
                key={m}
                className={`month-btn ${month === m ? 'is-active' : ''}`}
                onClick={() => setMonth(m)}
              >
                {monthLabel(m)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="diary-empty">
            {query || month !== 'all' ? (
              <p>해당하는 일기가 없어요.</p>
            ) : (
              <>
                <p>아직 기록이 없어요.</p>
                <p>홈에서 일기를 남겨보세요 🌿</p>
              </>
            )}
          </div>
        ) : (
          <div className="diary-list">
            {filtered.map((d) => (
              <article
                key={d.id}
                className="diary-item diary-item-click"
                onClick={() => setDetail(d)}
              >
                <div className="diary-item-main">
                  <p className="diary-item-date">
                    {d.mood && <span className="diary-mood">{d.mood}</span>}
                    {formatEntryDate(d.entry_date)}
                  </p>
                  <p className="diary-item-content">{d.content}</p>
                </div>
                <span className="diary-chevron" aria-hidden>
                  ›
                </span>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* 일기 상세 보기 */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div
            className="modal-card detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="detail-date">
              {detail.mood ? `${detail.mood} ` : ''}
              {formatEntryDate(detail.entry_date)}
            </p>
            <p className="detail-content">{detail.content}</p>
            <div className="modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setDetail(null)}
              >
                닫기
              </button>
              <button
                className="modal-btn-edit"
                onClick={() => {
                  const date = detail.entry_date
                  setDetail(null)
                  onEditDiary(date)
                }}
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
