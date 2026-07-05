import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { formatToday, getTodaysQuote, formatEntryDate } from '../lib/today'
import { getMyDiaries, deleteDiary } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
import Header from '../components/Header'
import './home.css'

// 로그인한 사용자가 보는 진짜 Soso Diary 홈 화면입니다.
type Props = {
  session: Session
  onWrite: () => void // "오늘 일기 쓰기" 버튼 → 작성 화면으로
}

export default function HomePage({ session, onWrite }: Props) {
  // 가입 때 저장한 이름이 있으면 이름을, 없으면 이메일을 사용합니다.
  const name =
    (session.user.user_metadata?.name as string | undefined) || session.user.email

  const today = formatToday() // 오늘 날짜
  const quote = getTodaysQuote() // 오늘의 명언

  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loadingDiaries, setLoadingDiaries] = useState(true)

  // 삭제 확인창 상태
  const [confirmTarget, setConfirmTarget] = useState<Diary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    // 홈 화면이 열릴 때 내 일기 목록을 불러옵니다.
    getMyDiaries()
      .then(setDiaries)
      .catch(() => setDiaries([]))
      .finally(() => setLoadingDiaries(false))
  }, [])

  async function handleDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteDiary(confirmTarget.id)
      // 화면 목록에서도 제거
      setDiaries((prev) => prev.filter((d) => d.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch {
      setDeleteError('삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <Header />

      <main className="home-container">
        {/* 날짜 + 인사말 */}
        <p className="home-date">{today}</p>
        <h1 className="home-greeting">
          {name}님,
          <br />
          오늘의 한 줄을 남겨보세요 🌱
        </h1>

        {/* 오늘의 명언 */}
        <section className="quote-card">
          <p className="quote-label">오늘의 명언</p>
          <blockquote className="quote-text">“{quote.text}”</blockquote>
          <p className="quote-author">— {quote.author}</p>
        </section>

        {/* 일기 쓰기 버튼 → 작성 화면으로 이동 */}
        <button className="home-cta" onClick={onWrite}>
          ✏️ 오늘 일기 쓰기
        </button>

        {/* 내 일기 목록 */}
        <section className="diary-section">
          <h2 className="diary-heading">내 일기</h2>

          {loadingDiaries ? (
            <div className="diary-empty">
              <p>불러오는 중…</p>
            </div>
          ) : diaries.length === 0 ? (
            <div className="diary-empty">
              <p>아직 작성한 일기가 없어요.</p>
              <p>첫 한 줄을 남겨보세요 🌿</p>
            </div>
          ) : (
            <div className="diary-list">
              {diaries.map((d) => (
                <article key={d.id} className="diary-item">
                  <div className="diary-item-main">
                    <p className="diary-item-date">
                      {d.mood && <span className="diary-mood">{d.mood}</span>}
                      {formatEntryDate(d.entry_date)}
                    </p>
                    <p className="diary-item-content">{d.content}</p>
                  </div>
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
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 삭제 확인창 (모달) */}
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
