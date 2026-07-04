import type { ReactNode } from 'react'
import { authBackground } from '../config/backgrounds'
import { APP_NAME, APP_SUBTITLE, APP_SLOGAN } from '../config/appConfig'
import '../pages/auth.css'

// 로그인·회원가입 화면이 공통으로 쓰는 겉틀입니다.
// 맨 위: 로고 + 앱 이름 + 짧은 부제
// 맨 아래: 잔잔한 슬로건
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="auth-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo" aria-hidden>🌿</div>
          <h1 className="auth-title">{APP_NAME}</h1>
          <p className="auth-subtitle">{APP_SUBTITLE}</p>
        </div>

        {children}

        <p className="auth-slogan">{APP_SLOGAN}</p>
      </div>
    </div>
  )
}
