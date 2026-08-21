import { useEffect, useState } from 'react'
import { formatToday } from '../lib/today'
import {
  getRawNews,
  summarizeBriefing,
  fallbackBriefing,
} from '../lib/news'
import type { Briefing, Impact, NewsItem } from '../lib/news'
import { getNewsKey } from '../lib/newsKey'
import './news.css'

type Props = {
  onBack: () => void
}

function impactClass(impact: Impact): string {
  if (impact === '호재') return 'impact-up'
  if (impact === '악재') return 'impact-down'
  return 'impact-flat'
}

// 링크 있는 한 줄 뉴스 (주요 뉴스·문화연예 공용)
function NewsLine({ item }: { item: NewsItem }) {
  return (
    <li className="news-brief-item">
      <p className="news-brief-summary">{item.body}</p>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="news-stock-link"
        >
          관련 기사 보기 →
        </a>
      )}
    </li>
  )
}

export default function NewsPage({ onBack }: Props) {
  const [data, setData] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function load() {
    setLoading(true)
    setError(false)
    getRawNews()
      .then(async (raw) => {
        const key = getNewsKey()
        if (key) {
          try {
            return await summarizeBriefing(raw, key)
          } catch {
            return fallbackBriefing(raw)
          }
        }
        return fallbackBriefing(raw)
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const today = formatToday()

  const hasAny =
    !!data &&
    (data.sectors.length > 0 ||
      data.mainNews.length > 0 ||
      data.culture.length > 0)

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
          <p className="news-greeting">오늘의 핵심만 모았어요 📰</p>
        </div>

        {loading ? (
          <div className="diary-empty">
            <p>뉴스를 요약하는 중…</p>
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
          <>
            {/* 1. 업종별 이슈 */}
            {data!.sectors.length > 0 && (
              <section className="news-block">
                <h2 className="news-block-title">📊 업종별 이슈</h2>
                <ul className="news-stock-list">
                  {data!.sectors.map((s, i) => (
                    <li className="news-stock-item" key={i}>
                      <p className="news-stock-body">
                        <span className="news-stock-name">[{s.name}]</span>{' '}
                        {s.body}
                      </p>
                      {s.impact && (
                        <p className="news-stock-impact">
                          <span
                            className={`impact-badge ${impactClass(s.impact)}`}
                          >
                            {s.impact}
                          </span>
                          {s.impactReason && (
                            <span className="news-stock-reason">
                              {s.impactReason}
                            </span>
                          )}
                        </p>
                      )}
                      {s.link && (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="news-stock-link"
                        >
                          관련 기사 보기 →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 2. 오늘의 주요 뉴스 */}
            {data!.mainNews.length > 0 && (
              <section className="news-block">
                <h2 className="news-block-title">📌 오늘의 주요 뉴스</h2>
                <ul className="news-brief-list">
                  {data!.mainNews.map((m, i) => (
                    <NewsLine item={m} key={i} />
                  ))}
                </ul>
              </section>
            )}

            {/* 3. 문화·연예 */}
            {data!.culture.length > 0 && (
              <section className="news-block">
                <h2 className="news-block-title">🎬 문화·연예</h2>
                <ul className="news-brief-list">
                  {data!.culture.map((c, i) => (
                    <NewsLine item={c} key={i} />
                  ))}
                </ul>
              </section>
            )}

            {data!.mode === 'simple' && (
              <p className="news-foot">
                지금은 기사 제목만 보여주고 있어요. <b>설정 → 뉴스 AI 열쇠</b>에
                무료 열쇠를 넣으면 ‘요약 + 호재/악재’까지 나와요.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
