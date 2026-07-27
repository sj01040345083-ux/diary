import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'
import { setAutoLogin, getAutoLogin, markSessionActive } from '../lib/autoLogin'

// 이메일 형식이 맞는지 간단히 확인하는 규칙
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  onGoSignup: () => void // "회원가입" 버튼을 누르면 실행
}

export default function LoginPage({ onGoSignup }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false) // 비밀번호 보기/숨기기
  const [remember, setRemember] = useState(getAutoLogin()) // 자동 로그인
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  // 소셜 로그인(카카오 등)이 실패해 앱으로 되돌아오면, Supabase 는 주소 뒤에
  // #error=...&error_description=... 형태로 원인을 붙여서 보냅니다.
  // 그 내용을 읽어 화면에 보여주고(진단에 도움), 주소는 깔끔하게 정리합니다.
  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : ''
    const params = new URLSearchParams(hash || window.location.search)
    const errDesc = params.get('error_description') || params.get('error')
    if (errDesc) {
      const msg = decodeURIComponent(errDesc.replace(/\+/g, ' '))
      // eslint-disable-next-line no-console
      console.error('[OAuth 로그인 오류]', msg)
      setNotice(`로그인에 실패했어요: ${msg}`)
      // 주소에서 오류 흔적 제거 (새로고침 시 반복 표시 방지)
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
    // 자동 로그인 여부를 먼저 저장 (비밀번호는 저장하지 않습니다)
    setAutoLogin(remember)
    // 실제 로그인 시도 (Supabase)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setNotice(translateAuthError(error.message))
      return
    }
    // 이번 브라우저 세션을 활성으로 표시 (자동 로그인 OFF 시 새 창에서만 재로그인)
    markSessionActive()
    // 로그인 성공 시: App 이 로그인 상태를 감지해 홈 화면으로 자동 이동합니다.
  }

  // 비밀번호 재설정 메일 보내기 (위 이메일 칸에 적힌 주소로)
  async function handleForgot() {
    setNotice('')
    if (!email.trim() || !EMAIL_RULE.test(email)) {
      setNotice('비밀번호를 재설정할 이메일을 위 칸에 먼저 입력해주세요.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setNotice(translateAuthError(error.message))
      return
    }
    setNotice('비밀번호 재설정 메일을 보냈어요 🌿 메일의 링크를 눌러주세요.')
  }

  // 카카오 로그인 (Supabase OAuth)
  // Supabase 대시보드에서 Kakao 제공자를 켜고 키를 넣어야 실제로 동작합니다.
  // 설정 전이라면 오류가 나므로 친절한 안내로 처리합니다.
  async function handleKakao() {
    setNotice('')
    // 자동 로그인은 기본 유지(비번 미저장). 이번 세션 활성 표시.
    setAutoLogin(remember)
    markSessionActive()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    })
    // 성공 시 카카오 로그인 페이지로 이동합니다. (아래는 실패 시)
    if (error) {
      // 진단을 위해 실제 오류를 콘솔(F12)에 남깁니다.
      // 예: "Unsupported provider: provider is not enabled"
      //  → Supabase 대시보드에서 Kakao 제공자가 아직 켜지지 않은 경우
      // eslint-disable-next-line no-console
      console.error('[카카오 로그인 오류]', error.message)
      const notEnabled = /not enabled|unsupported provider/i.test(error.message)
      setNotice(
        notEnabled
          ? '카카오 로그인이 아직 설정되지 않았어요. (관리자: Supabase에서 Kakao 제공자를 켜주세요) 우선 이메일로 로그인해주세요 🌿'
          : `카카오 로그인에 실패했어요: ${error.message}`,
      )
    }
  }

  return (
    <AuthLayout>
      <p className="auth-welcome">소소한 하루를 기록해보세요 🌿</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">이메일</label>
          <input
            id="login-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'has-error' : ''}
            autoComplete="email"
          />
          <span className="field-error">{errors.email ?? ''}</span>
        </div>

        <div className="field">
          <label htmlFor="login-password">비밀번호</label>
          <div className={`field-password ${errors.password ? 'has-error' : ''}`}>
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          <span className="field-error">{errors.password ?? ''}</span>
        </div>

        {/* 자동 로그인 + 비밀번호 찾기 */}
        <div className="auth-options">
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            자동 로그인
          </label>
          <button type="button" className="link-btn" onClick={handleForgot}>
            비밀번호를 잊으셨나요?
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" />로그인 중…</> : '로그인'}
        </button>

        {notice && <p className="auth-notice">{notice}</p>}
      </form>

      {/* 소셜 로그인 (카카오 — UI) */}
      <div className="auth-or"><span>또는</span></div>
      <button type="button" className="btn-kakao" onClick={handleKakao}>
        <span className="btn-kakao-icon" aria-hidden>💬</span>
        카카오로 시작하기
      </button>

      {/* 회원가입 (크림 테두리 버튼) */}
      <button type="button" className="btn-outline" onClick={onGoSignup}>
        이메일로 회원가입
      </button>
    </AuthLayout>
  )
}
