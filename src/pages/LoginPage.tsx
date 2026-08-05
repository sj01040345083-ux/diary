import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'
import { setAutoLogin, markSessionActive } from '../lib/autoLogin'

// 이메일 형식이 맞는지 간단히 확인하는 규칙
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  onGoSignup: () => void // "회원가입" 링크를 누르면 실행
}

export default function LoginPage({ onGoSignup }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [notice, setNotice] = useState('')

  // 소셜 로그인 등에서 실패해 앱으로 되돌아오면, 주소 뒤에 붙는
  // #error=...&error_description=... 를 읽어 안내로 보여주고 주소를 정리합니다.
  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : ''
    const params = new URLSearchParams(hash || window.location.search)
    const errDesc = params.get('error_description') || params.get('error')
    if (errDesc) {
      const msg = decodeURIComponent(errDesc.replace(/\+/g, ' '))
      setNotice(`로그인에 실패했어요: ${msg}`)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // 입력값 검사 — 문제가 없으면 true 를 돌려줍니다.
  function validate() {
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = '이메일을 입력해주세요.'
    else if (!EMAIL_RULE.test(email)) next.email = '이메일 형식이 올바르지 않아요.'
    if (!password) next.password = '비밀번호를 입력해주세요.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setNotice('')
    if (!validate()) return
    setLoading(true)
    // 로그인 상태를 유지합니다. (비밀번호는 저장하지 않습니다)
    setAutoLogin(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setNotice(translateAuthError(error.message))
      return
    }
    // 이번 브라우저 세션을 활성으로 표시. 로그인 성공 시 App 이 홈으로 이동시킵니다.
    markSessionActive()
  }

  // 비밀번호 재설정 메일 보내기 (위 이메일 칸에 적힌 주소로)
  async function handleForgot() {
    if (forgotLoading) return
    setNotice('')
    if (!email.trim() || !EMAIL_RULE.test(email)) {
      setNotice('비밀번호를 재설정할 이메일을 위 칸에 먼저 입력해주세요.')
      return
    }
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    setForgotLoading(false)
    if (error) {
      setNotice(translateAuthError(error.message))
      return
    }
    setNotice('비밀번호 재설정 메일을 보냈어요 🌿 메일의 링크를 눌러주세요.')
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">이메일</label>
          <input
            id="login-email"
            type="email"
            placeholder="soso@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'has-error' : ''}
            autoComplete="email"
          />
          <span className="field-error">{errors.email ?? ''}</span>
        </div>

        <div className="field">
          <label htmlFor="login-password">비밀번호</label>
          <input
            id="login-password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'has-error' : ''}
            autoComplete="current-password"
          />
          <span className="field-error">{errors.password ?? ''}</span>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />
              로그인 중…
            </>
          ) : (
            '로그인'
          )}
        </button>

        {notice && <p className="auth-notice">{notice}</p>}
      </form>

      {/* 아래 링크 줄: 회원가입 · 비밀번호 찾기 */}
      <div className="auth-footrow">
        <button type="button" className="auth-footlink" onClick={onGoSignup}>
          처음이신가요? <b>회원가입</b>
        </button>
        <button
          type="button"
          className="auth-footlink"
          onClick={handleForgot}
          disabled={forgotLoading}
        >
          {forgotLoading ? '메일 보내는 중…' : '비밀번호를 잊었어요'}
        </button>
      </div>
    </AuthLayout>
  )
}
