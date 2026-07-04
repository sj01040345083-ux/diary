import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { APP_NAME } from '../config/appConfig'
import { supabase } from '../lib/supabase'
import './auth.css'

// 로그인에 성공하면 보이는 임시 홈 화면입니다.
// (진짜 일기 홈 화면은 다음 단계에서 만들어요. 지금은 로그인 확인용)
type Props = {
  session: Session
}

export default function HomePage({ session }: Props) {
  const [loading, setLoading] = useState(false)

  // 가입할 때 저장한 이름이 있으면 이름을, 없으면 이메일을 보여줍니다.
  const name =
    (session.user.user_metadata?.name as string | undefined) || session.user.email

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    // 로그아웃하면 App 이 상태 변화를 감지해 로그인 화면으로 자동 이동합니다.
  }

  return (
    <div
      className="auth-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden>🌿</div>
          <h1 className="auth-title">환영합니다</h1>
          <p className="auth-subtitle">{name}님, 로그인에 성공했어요</p>
        </div>

        <p className="home-desc">
          여기는 로그인에 성공하면 보이는 임시 홈 화면이에요.
          <br />
          진짜 {APP_NAME} 홈 화면은 다음 단계에서 만들어요.
        </p>

        <button className="btn-primary" onClick={handleLogout} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />
              로그아웃 중…
            </>
          ) : (
            '로그아웃'
          )}
        </button>
      </div>
    </div>
  )
}
