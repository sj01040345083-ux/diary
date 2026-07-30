import type { ReactNode } from 'react'
import { APP_NAME, APP_SUBTITLE } from '../config/appConfig'
import '../pages/auth.css'

// 로그인·회원가입 화면이 공통으로 쓰는 겉틀입니다.
// 맨 위: 잎사귀 아이콘 + 앱 이름(한 줄) + 짧은 부제
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brandline">
            <span className="auth-leaf" aria-hidden>
              🌿
            </span>
            <h1 className="auth-title">{APP_NAME}</h1>
          </div>
          <p className="auth-subtitle">{APP_SUBTITLE}</p>
        </div>

        {children}
      </div>
    </div>
  )
}
