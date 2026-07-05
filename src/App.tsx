import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AppShell from './components/AppShell'

// 로그인 안 된 사용자가 볼 화면: 로그인 / 회원가입
type View = 'login' | 'signup'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true) // 처음에 로그인 상태를 확인하는 중
  const [view, setView] = useState<View>('login')

  useEffect(() => {
    // 1) 앱을 열 때 이미 로그인돼 있는지 확인 (새로고침해도 로그인 유지)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    // 2) 로그인·로그아웃 등 상태 변화를 실시간으로 감지
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        // 로그아웃하면 로그인 화면으로 되돌립니다.
        if (event === 'SIGNED_OUT') {
          setView('login')
        }
      },
    )

    // 화면이 사라질 때 감지를 정리
    return () => listener.subscription.unsubscribe()
  }, [])

  // 로그인 상태를 확인하는 아주 짧은 순간
  if (checking) {
    return <div className="app-loading">불러오는 중…</div>
  }

  // 로그인된 사용자만 앱 내부(보호된 화면)에 접근할 수 있습니다.
  if (session) {
    return <AppShell session={session} />
  }

  // 로그인하지 않은 사용자 → 로그인 / 회원가입 화면
  return view === 'login' ? (
    <LoginPage onGoSignup={() => setView('signup')} />
  ) : (
    <SignupPage onGoLogin={() => setView('login')} />
  )
}
