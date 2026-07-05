import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { formatToday, getTodaysQuote } from '../lib/today'
import Header from '../components/Header'
import './home.css'

// 로그인한 사용자가 보는 진짜 Soso Diary 홈 화면입니다.
type Props = {
  session: Session
}

export default function HomePage({ session }: Props) {
  // 가입 때 저장한 이름이 있으면 이름을, 없으면 이메일을 사용합니다.
  const name =
    (session.user.user_metadata?.name as string | undefined) || session.user.email

  const today = formatToday() // 오늘 날짜
  const quote = getTodaysQuote() // 오늘의 명언
  const [notice, setNotice] = useState('')

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

        {/* 일기 쓰기 버튼 (지금은 자리만 — 다음 단계에서 연결) */}
        <button
          className="home-cta"
          onClick={() =>
            setNotice('일기 쓰기 기능은 다음 단계에서 만들어요 🌿')
          }
        >
          ✏️ 오늘 일기 쓰기
        </button>
        {notice && <p className="home-notice">{notice}</p>}

        {/* 일기 목록 (지금은 비어 있음) */}
        <section className="diary-section">
          <h2 className="diary-heading">내 일기</h2>
          <div className="diary-empty">
            <p>아직 작성한 일기가 없어요.</p>
            <p>첫 한 줄을 남겨보세요 🌿</p>
          </div>
        </section>
      </main>
    </div>
  )
}
