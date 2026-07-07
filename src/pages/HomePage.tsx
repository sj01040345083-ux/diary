import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { formatToday, getRandomQuote, formatEntryDate } from '../lib/today'
import { getMyDiaries, deleteDiary } from '../lib/diaries'
import type { Diary } from '../lib/diaries'
import {
  isFavorited,
  addFavorite,
  removeFavoriteByQuoteId,
} from '../lib/favorites'
import { getSettings, resolveDisplayName } from '../lib/settings'
import Header from '../components/Header'
import './home.css'

// 로그인한 사용자가 보는 진짜 Soso Diary 홈 화면입니다.
type Props = {
  session: Session
  onWrite: () => void // "오늘 일기 쓰기" 버튼 → 작성 화면으로
  onTransactions: () => void // "소비·수입" 바로가기
  onFavorites: () => void // "명언 즐겨찾기 모음" 바로가기
}

export default function HomePage({
  session,
  onWrite,
  onTransactions,
  onFavorites,
}: Props) {
  // 설정에서 정한 닉네임을 불러옵니다. (이름 표시에 사용)
  const [nickname, setNickname] = useState<string | null>(null)
  // 보여줄 이름: 닉네임 → 가입 때 이름 → 이메일 앞부분 (이메일 전체는 안 보임)
  const name = resolveDisplayName(
    nickname,
    session.user.user_metadata?.name as string | undefined,
    session.user.email,
  )

  const today = formatToday() // 오늘 날짜
  // 명언은 홈에 들어올 때(이 화면이 처음 그려질 때) 한 번만 랜덤으로 뽑습니다.
  // useState 초기값으로 뽑아야 이후 다른 동작(즐겨찾기 등)에 다시 안 바뀝니다.
  const [quote] = useState(getRandomQuote)

  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loadingDiaries, setLoadingDiaries] = useState(true)

  // 오늘의 명언 즐겨찾기 상태
  const [isFav, setIsFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)

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
    // 닉네임(불러줄 이름)도 불러옵니다.
    getSettings()
      .then((s) => setNickname(s.nickname))
      .catch(() => {})
  }, [])

  useEffect(() => {
    // 오늘의 명언이 이미 즐겨찾기 되어 있는지 확인
    isFavorited(quote.id)
      .then(setIsFav)
      .catch(() => setIsFav(false))
  }, [quote.id])

  async function toggleFav() {
    if (favBusy) return
    setFavBusy(true)
    try {
      if (isFav) {
        await removeFavoriteByQuoteId(quote.id)
        setIsFav(false)
      } else {
        await addFavorite(session.user.id, quote)
        setIsFav(true)
      }
    } catch {
      // 무시 (다음에 다시 시도)
    } finally {
      setFavBusy(false)
    }
  }

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
          <button
            className={`quote-fav ${isFav ? 'is-fav' : ''}`}
            onClick={toggleFav}
            disabled={favBusy}
            aria-label="오늘의 명언 즐겨찾기"
          >
            {isFav ? '♥' : '♡'}
          </button>
          <p className="quote-label">오늘의 명언</p>
          <blockquote className="quote-text">“{quote.text}”</blockquote>
          <p className="quote-author">— {quote.author}</p>
          <button className="quote-fav-link" onClick={onFavorites}>
            ⭐ 즐겨찾은 명언 보기
          </button>
        </section>

        {/* 일기 쓰기 버튼 → 작성 화면으로 이동 */}
        <button className="home-cta" onClick={onWrite}>
          ✏️ 오늘 일기 쓰기
        </button>

        {/* 바로가기 */}
        <div className="home-shortcut-row">
          <button className="home-shortcut" onClick={onTransactions}>
            💰 소비·수입 기록
          </button>
        </div>

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
