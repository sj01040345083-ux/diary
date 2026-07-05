import { useState } from 'react'
import { APP_NAME } from '../config/appConfig'
import { supabase } from '../lib/supabase'

// 홈 화면 맨 위 바: 왼쪽에 앱 이름, 오른쪽에 로그아웃 버튼
export default function Header() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    // 로그아웃하면 App 이 감지해서 로그인 화면으로 자동 이동합니다.
  }

  return (
    <header className="home-header">
      <div className="home-brand">
        <span aria-hidden>🌿</span> {APP_NAME}
      </div>
      <button className="logout-btn" onClick={handleLogout} disabled={loading}>
        {loading ? '로그아웃 중…' : '로그아웃'}
      </button>
    </header>
  )
}
