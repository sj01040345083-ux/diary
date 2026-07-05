import { useEffect, useState } from 'react'
import { authBackground } from '../config/backgrounds'
import { getMyFavorites, removeFavorite } from '../lib/favorites'
import type { FavoriteQuote } from '../lib/favorites'
import './home.css'

type Props = {
  onBack: () => void
}

export default function FavoritesPage({ onBack }: Props) {
  const [items, setItems] = useState<FavoriteQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    getMyFavorites()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(id: string) {
    setRemovingId(id)
    try {
      await removeFavorite(id)
      setItems((prev) => prev.filter((q) => q.id !== id))
    } catch {
      // 유지
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="home-header">
        <button className="icon-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="write-title">명언 즐겨찾기</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        <h1 className="write-heading">마음에 담은 명언 ⭐</h1>

        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="diary-empty">
            <p>아직 즐겨찾은 명언이 없어요.</p>
            <p>홈의 오늘의 명언에서 ♡ 를 눌러보세요 🌿</p>
          </div>
        ) : (
          <div className="diary-list">
            {items.map((q) => (
              <article key={q.id} className="quote-card fav-item">
                <blockquote className="quote-text">“{q.text}”</blockquote>
                <p className="quote-author">— {q.author}</p>
                <button
                  className="fav-remove"
                  onClick={() => handleRemove(q.id)}
                  disabled={removingId === q.id}
                  aria-label="즐겨찾기 해제"
                >
                  {removingId === q.id ? '해제 중…' : '♥ 즐겨찾기 해제'}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
