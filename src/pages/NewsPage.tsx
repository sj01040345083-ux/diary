import { useEffect, useState } from 'react'
import { formatToday } from '../lib/today'
import { getNewsBriefing } from '../lib/news'
import type { NewsBriefing } from '../lib/news'
import './news.css'

type Props = {
  onBack: () => void
}

// 주제별 아이콘
const TOPIC_ICON: Record<string, string> = {
  economy: '💹',
  society: '🏙️',
  entertainment: '🎬',
}

export default function NewsPage({ onBack }: Props) {
  const [data, setData] = useState<NewsBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function load() {
    setLoading(true)
    setError(false)
    getNewsBriefing()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const today = formatToday()

  // 받아온 주제 중 기사가 하나라도 있는지
  const hasAny =
    data?.topics.some((t) => t.items.length > 0) ?? false

  return (
    <div className="home-screen">
      <header className="home-header">
        <button className="icon-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="write-title">아침 뉴스 브리핑</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        <div className="news-hello">
          <p className="news-date">{today}</p>
          <p className="news-greeting">오늘의 소식을 모아왔어요 📰</p>
        </div>

        {loading ? (
          <div className="diary-empty">
            <p>뉴스를 불러오는 중…</p>
          </div>
        ) : error || !hasAny ? (
          <div className="diary-empty">
            <p>뉴스를 불러오지 못했어요.</p>
            <p>잠시 후 다시 시도해주세요 🌿</p>
            <button className="news-retry" onClick={load}>
              다시 불러오기
            </button>
          </div>
        ) : (
          data!.topics.map((topic) => (
            <section className="news-topic" key={topic.key}>
              <h2 className="news-topic-title">
                <span aria-hidden>{TOPIC_ICON[topic.key] ?? '📰'}</span>{' '}
                {topic.label}
              </h2>
              {topic.items.length === 0 ? (
                <p className="news-empty">불러온 소식이 없어요.</p>
              ) : (
                <ol className="news-list">
                  {topic.items.map((item, i) => (
                    <li className="news-item" key={i}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link"
                      >
                        <span className="news-item-title">{item.title}</span>
                        {item.source && (
                          <span className="news-item-source">
                            {item.source}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))
        )}

        <p className="news-foot">뉴스 제공 · 구글 뉴스</p>
      </main>
    </div>
  )
}
