import { useEffect, useMemo, useState } from 'react'
import { getMyDiaries, deleteDiary } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
import { formatEntryDate } from '../lib/today'
import DiaryPhotos from '../components/DiaryPhotos'
import DiaryCalendar from '../components/DiaryCalendar'
import './home.css'

type Props = {
  onEditDiary: (date: string) => void
}

export default function RecordsPage({ onEditDiary }: Props) {
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // 달력에서 고른 날짜
  // 워드 내보내기 진행 상태: 개별 일기 id, 또는 'all'(전체), 또는 null
  const [exportingId, setExportingId] = useState<string | null>(null)

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

  // 목록 거르기: 날짜를 골랐으면 그 날짜만, 아니면 전체
  const filtered = useMemo(() => {
    if (selectedDate)
      return diaries.filter((d) => d.entry_date === selectedDate)
    return diaries
  }, [diaries, selectedDate])

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

  // 일기 한 편을 워드로 내보내기 (제목/날짜 + 본문 + 사진)
  async function exportOne(d: Diary) {
    setExportingId(String(d.id))
    try {
      const { exportSingleDiaryDocx } = await import('../lib/exporters')
      await exportSingleDiaryDocx(d)
    } finally {
      setExportingId(null)
    }
  }

  // 지금 보이는 일기들을 하나의 워드로 내보내기
  // (달력에서 날짜를 골랐으면 그 날짜만, 아니면 전체)
  async function exportAll() {
    setExportingId('all')
    try {
      const { exportDiariesDocx } = await import('../lib/exporters')
      await exportDiariesDocx(filtered)
    } finally {
      setExportingId(null)
    }
  }

  return (
    <div className="home-screen">
      <header className="tab-header">
        <div className="write-title">일기 기록</div>
      </header>

      <main className="home-container">
        {/* 달력 */}
        {!loading && diaries.length > 0 && (
          <DiaryCalendar
            diaries={diaries}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        )}

        {/* 고른 날짜 안내 + 전체 보기 */}
        {selectedDate && (
          <div className="cal-selected">
            <span className="cal-selected-label">
              📅 {formatEntryDate(selectedDate)}
            </span>
            <button
              className="cal-clear-btn"
              onClick={() => setSelectedDate(null)}
            >
              전체 보기
            </button>
          </div>
        )}

        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="diary-empty">
            {selectedDate ? (
              <p>이 날에는 일기가 없어요.</p>
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
                    className="diary-word-btn"
                    onClick={() => exportOne(d)}
                    disabled={exportingId !== null}
                    aria-label="이 일기 워드로 다운로드"
                  >
                    {exportingId === String(d.id) ? '만드는 중…' : '📝 워드'}
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

        {/* 일기 워드 내보내기 (한 파일로 모아서) */}
        {!loading && filtered.length > 0 && (
          <div className="export-row" style={{ marginTop: '1.5rem' }}>
            <button
              className="export-btn"
              onClick={exportAll}
              disabled={exportingId !== null}
            >
              {exportingId === 'all'
                ? '만드는 중…'
                : selectedDate
                  ? '📝 이 날짜 워드로 내보내기'
                  : `📝 전체 일기 워드로 내보내기 (${filtered.length}편)`}
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
