import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { formatToday, getTodaysQuote, formatEntryDate } from '../lib/today'
import { getMyDiaries } from '../lib/diaries'
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

  useEffect(() => {
    // 홈 화면이 열릴 때 내 일기 목록을 불러옵니다.
    getMyDiaries()
      .then(setDiaries)
      .catch(() => setDiaries([]))
      .finally(() => setLoadingDiaries(false))
  }, [])

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
                  <p className="diary-item-date">{formatEntryDate(d.entry_date)}</p>
                  <p className="diary-item-content">{d.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
