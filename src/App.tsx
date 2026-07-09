import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { getAutoLogin, isSessionActive, markSessionActive } from './lib/autoLogin'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AppShell from './components/AppShell'

// 로그인 안 된 사용자가 볼 화면: 로그인 / 회원가입
type View = 'login' | 'signup'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true) // 처음에 로그인 상태를 확인하는 중
  const [view, setView] = useState<View>('login')
  const [recovering, setRecovering] = useState(false) // 비밀번호 재설정 중

  useEffect(() => {
    // 1) 앱을 열 때 이미 로그인돼 있는지 확인
    supabase.auth.getSession().then(async ({ data }) => {
      const existing = data.session
      // "자동 로그인"이 꺼져 있고, 이번이 '새로 연 브라우저 세션'이면 로그아웃합니다.
      // (같은 세션 내 새로고침은 isSessionActive 로 구분되어 로그인 유지)
      if (existing && !getAutoLogin() && !isSessionActive()) {
        await supabase.auth.signOut()
        setSession(null)
      } else {
        setSession(existing)
      }
      markSessionActive()
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
        // 이메일의 재설정 링크로 들어오면 '새 비밀번호' 화면을 띄웁니다.
        if (event === 'PASSWORD_RECOVERY') {
          setRecovering(true)
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

  // 비밀번호 재설정 링크로 들어온 경우: 새 비밀번호 설정 화면
  if (recovering) {
    return <ResetPasswordPage onDone={() => setRecovering(false)} />
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
