import { useEffect, useMemo, useState } from 'react'
import { getMyDiaries, deleteDiary } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
import { formatEntryDate } from '../lib/today'
import DiaryPhotos from '../components/DiaryPhotos'
import './home.css'

type Props = {
  onEditDiary: (date: string) => void
}

// 이번 달 "YYYY-MM"
function thisMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function RecordsPage({ onEditDiary }: Props) {
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState('all') // 'all' 또는 'YYYY-MM'
  const [exporting, setExporting] = useState(false)

  // 삭제 확인
  const [confirmTarget, setConfirmTarget] = useState<Diary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  async function handleDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteDiary(confirmTarget.id)
      setDiaries((prev) => prev.filter((d) => d.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch {
      setDeleteError('삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setDeleting(false)
    }
  }

  // 일기 워드 내보내기 — 선택한 달(‘전체’면 이번 달) 기준
  async function handleWord() {
    setExporting(true)
    try {
      const targetMonth = month === 'all' ? thisMonth() : month
      const { exportDiaryDocx } = await import('../lib/exporters')
      await exportDiaryDocx({
        month: targetMonth,
        diaries,
        transactions: [],
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="home-screen">
      <header className="tab-header">
        <div className="write-title">일기 기록</div>
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
              <article key={d.id} className="diary-item">
                <div className="diary-item-main">
                  <p className="diary-item-date">
                    {d.mood && <span className="diary-mood">{d.mood}</span>}
                    {formatEntryDate(d.entry_date)}
                  </p>
                  <p className="diary-item-content">{d.content}</p>
                  <DiaryPhotos date={d.entry_date} />
                </div>
                <div className="diary-item-actions">
                  <button
                    className="diary-edit-btn"
                    onClick={() => onEditDiary(d.entry_date)}
                    aria-label="일기 수정"
                  >
                    수정
                  </button>
                  <button
                    className="diary-delete-btn"
                    onClick={() => {
                      setDeleteError('')
                      setConfirmTarget(d)
                    }}
                    aria-label="일기 삭제"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 일기 워드 내보내기 */}
        {!loading && diaries.length > 0 && (
          <div className="export-row" style={{ marginTop: '1.5rem' }}>
            <button
              className="export-btn"
              onClick={handleWord}
              disabled={exporting}
            >
              {exporting ? '만드는 중…' : '📝 워드로 내보내기'}
            </button>
          </div>
        )}
      </main>

      {/* 삭제 확인창 */}
      {confirmTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deleting) setConfirmTarget(null)
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">일기를 삭제할까요?</h3>
            <p className="modal-desc">삭제한 일기는 되돌릴 수 없어요.</p>
            <p className="modal-preview">“{confirmTarget.content}”</p>
            {deleteError && <p className="modal-error">{deleteError}</p>}
            <div className="modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setConfirmTarget(null)}
                disabled={deleting}
              >
                취소
              </button>
              <button
                className="modal-btn-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
