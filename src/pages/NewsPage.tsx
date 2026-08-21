import { useEffect, useState } from 'react'
import { formatToday } from '../lib/today'
import {
  getRawNews,
  summarizeBriefing,
  fallbackBriefing,
} from '../lib/news'
import type { Briefing } from '../lib/news'
import { getNewsKey } from '../lib/newsKey'
import './news.css'

type Props = {
  onBack: () => void
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
          // 열쇠가 있으면 요약, 실패하면 헤드라인 모드로 대체
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
    (data.stocks.length > 0 ||
      data.entertainment.length > 0 ||
      data.essentials.length > 0)

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
            {/* 주식·기업 현황 */}
            {data!.stocks.length > 0 && (
              <section className="news-block">
                <h2 className="news-block-title">📈 주식·기업 현황</h2>
                <ul className="news-stock-list">
                  {data!.stocks.map((s, i) => (
                    <li className="news-stock-item" key={i}>
                      <p className="news-stock-body">
                        <span className="news-stock-name">[{s.name}]</span>{' '}
                        {s.body}
                      </p>
                      {s.impact && (
                        <p className="news-stock-impact">
                          <span
                            className={`impact-badge impact-${
                              s.impact === '호재'
                                ? 'up'
                                : s.impact === '악재'
                                  ? 'down'
                                  : 'flat'
                            }`}
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

            {/* 연예계 핫이슈 */}
            {data!.entertainment.length > 0 && (
              <section className="news-block">
                <h2 className="news-block-title">🎬 연예계 핫이슈</h2>
                <ul className="news-brief-list">
                  {data!.entertainment.map((t, i) => (
                    <li className="news-brief-item" key={i}>
                      <p className="news-brief-summary">{t}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 오늘 꼭 알아야 할 것 */}
            {data!.essentials.length > 0 && (
              <section className="news-block">
                <h2 className="news-block-title">📌 오늘 꼭 알아야 할 것</h2>
                <ul className="news-brief-list">
                  {data!.essentials.map((t, i) => (
                    <li className="news-brief-item" key={i}>
                      <p className="news-brief-summary">{t}</p>
                    </li>
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
