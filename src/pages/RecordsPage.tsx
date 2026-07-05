import { useEffect, useMemo, useState } from 'react'
import { authBackground } from '../config/backgrounds'
import { getMyDiaries } from '../lib/diaries'
import { getMyGratitude } from '../lib/gratitude'
import { formatEntryDate, formatDateTime } from '../lib/today'
import './home.css'

type Item = {
  id: string
  kind: 'diary' | 'gratitude'
  sortKey: string
  displayDate: string
  content: string
  mood: string | null
}

export default function RecordsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    Promise.all([getMyDiaries(), getMyGratitude()])
      .then(([diaries, grat]) => {
        const merged: Item[] = [
          ...diaries.map((d) => ({
            id: 'd_' + d.id,
            kind: 'diary' as const,
            sortKey: d.entry_date + 'T00:00',
            displayDate: formatEntryDate(d.entry_date),
            content: d.content,
            mood: d.mood,
          })),
          ...grat.map((g) => ({
            id: 'g_' + g.id,
            kind: 'gratitude' as const,
            sortKey: g.created_at,
            displayDate: formatDateTime(g.created_at),
            content: g.content,
            mood: null,
          })),
        ]
        merged.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1))
        setItems(merged)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => it.content.toLowerCase().includes(q))
  }, [items, query])

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
          placeholder="🔍 일기·감사 내용 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="diary-empty">
            {query ? (
              <p>“{query}”에 대한 기록이 없어요.</p>
            ) : (
              <>
                <p>아직 기록이 없어요.</p>
                <p>홈에서 일기나 감사를 남겨보세요 🌿</p>
              </>
            )}
          </div>
        ) : (
          <div className="diary-list">
            {filtered.map((it) => (
              <article key={it.id} className="diary-item">
                <div className="diary-item-main">
                  <p className="diary-item-date">
                    <span className="record-badge">
                      {it.kind === 'diary' ? '📔 일기' : '🙏 감사'}
                    </span>
                    {it.mood ? `${it.mood} ` : ''}
                    {it.displayDate}
                  </p>
                  <p className="diary-item-content">{it.content}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
