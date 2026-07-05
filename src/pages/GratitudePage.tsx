import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import {
  getMyGratitude,
  addGratitude,
  deleteGratitude,
} from '../lib/gratitude'
import type { Gratitude } from '../lib/gratitude'
import { formatDateTime } from '../lib/today'
import './home.css'

type Props = {
  session: Session
  onBack: () => void
}

export default function GratitudePage({ session, onBack }: Props) {
  const [items, setItems] = useState<Gratitude[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  // 삭제 확인창
  const [confirmTarget, setConfirmTarget] = useState<Gratitude | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getMyGratitude()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    setError('')
    if (!input.trim()) {
      setError('감사한 일을 한 줄 적어주세요 🌱')
      return
    }
    setAdding(true)
    try {
      await addGratitude(session.user.id, input.trim())
      const fresh = await getMyGratitude()
      setItems(fresh)
      setInput('')
    } catch {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await deleteGratitude(confirmTarget.id)
      setItems((prev) => prev.filter((g) => g.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch {
      // 실패하면 확인창을 유지 (사용자가 다시 시도)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="home-header">
        <button className="icon-btn" onClick={onBack} disabled={adding}>
          ← 뒤로
        </button>
        <div className="write-title">감사일기</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        <h1 className="write-heading">오늘 감사한 일 🙏</h1>

        {/* 감사 추가 입력 */}
        <textarea
          className="write-textarea gratitude-input"
          placeholder="오늘 감사한 일을 한 줄 적어보세요."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {error && <p className="write-error">{error}</p>}
        <button
          className="home-cta write-save"
          onClick={handleAdd}
          disabled={adding}
        >
          {adding ? '추가 중…' : '감사 추가'}
        </button>

        {/* 감사 기록 목록 */}
        <section className="diary-section">
          <h2 className="diary-heading">감사 기록</h2>

          {loading ? (
            <div className="diary-empty">
              <p>불러오는 중…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="diary-empty">
              <p>아직 감사 기록이 없어요.</p>
              <p>오늘의 감사를 하나 남겨보세요 🌿</p>
            </div>
          ) : (
            <div className="diary-list">
              {items.map((g) => (
                <article key={g.id} className="diary-item">
                  <div className="diary-item-main">
                    <p className="diary-item-date">🙏 {formatDateTime(g.created_at)}</p>
                    <p className="diary-item-content">{g.content}</p>
                  </div>
                  <button
                    className="diary-delete-btn"
                    onClick={() => setConfirmTarget(g)}
                    aria-label="감사 기록 삭제"
                  >
                    삭제
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
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
            <h3 className="modal-title">감사 기록을 삭제할까요?</h3>
            <p className="modal-desc">삭제하면 되돌릴 수 없어요.</p>
            <p className="modal-preview">“{confirmTarget.content}”</p>
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
