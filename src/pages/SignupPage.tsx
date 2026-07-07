import { useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'
import { saveNickname } from '../lib/settings'

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = {
  name?: string
  email?: string
  password?: string
  confirm?: string
  agree?: string
}

type Props = {
  onGoLogin: () => void // "로그인" 버튼을 누르면 실행
}

export default function SignupPage({ onGoLogin }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  function validate() {
    const next: Errors = {}
    if (!name.trim()) next.name = '이름 또는 닉네임을 입력해주세요.'
    if (!email.trim()) next.email = '이메일을 입력해주세요.'
    else if (!EMAIL_RULE.test(email)) next.email = '이메일 형식이 올바르지 않아요.'
    if (!password) next.password = '비밀번호를 입력해주세요.'
    else if (password.length < 8) next.password = '비밀번호는 최소 8자 이상이어야 해요.'
    if (!confirm) next.confirm = '비밀번호를 한 번 더 입력해주세요.'
    else if (password !== confirm) next.confirm = '비밀번호가 서로 달라요.'
    if (!agree) next.agree = '개인정보 처리 안내에 동의해주세요.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setNotice('')
    if (!validate()) return
    setLoading(true)
    // 실제 회원가입 시도 (Supabase). 이름/닉네임도 함께 저장합니다.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    setLoading(false)
    if (error) {
      setNotice(translateAuthError(error.message))
      return
    }
    // 이메일 인증이 켜져 있으면 session 이 없고, 인증 메일이 발송됩니다.
    if (!data.session) {
      setNotice('가입 확인 메일을 보냈어요 🌿 메일의 링크를 눌러 인증하면 로그인할 수 있어요.')
      return
    }
    // 입력한 이름(닉네임)을 설정에도 저장해 홈에서 바로 이름으로 표시되게 합니다.
    try {
      await saveNickname(data.session.user.id, name.trim())
    } catch {
      // 실패해도 가입은 완료 (가입 시 이름은 계정에 저장돼 있음)
    }
    // 인증이 꺼져 있으면 바로 로그인 상태가 되어 App 이 홈 화면으로 이동합니다.
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="signup-name">이름 또는 닉네임</label>
          <input
            id="signup-name"
            type="text"
            placeholder="어떻게 불러드릴까요?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'has-error' : ''}
            autoComplete="nickname"
          />
          <span className="field-error">{errors.name ?? ''}</span>
        </div>

        <div className="field">
          <label htmlFor="signup-email">이메일</label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password">비밀번호</label>
          <input
            id="signup-password"
            type="password"
            placeholder="8자 이상 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'has-error' : ''}
            autoComplete="new-password"
          />
          <span className="field-error">{errors.password ?? ''}</span>
        </div>

        <div className="field">
          <label htmlFor="signup-confirm">비밀번호 확인</label>
          <input
            id="signup-confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={errors.confirm ? 'has-error' : ''}
            autoComplete="new-password"
          />
          <span className="field-error">{errors.confirm ?? ''}</span>
        </div>

        <div className="field">
          <label className="field-check" htmlFor="signup-agree">
            <input
              id="signup-agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>개인정보 처리 안내를 확인했으며 이에 동의합니다.</span>
          </label>
          <span className="field-error">{errors.agree ?? ''}</span>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" />가입 중…</> : '회원가입'}
        </button>

        {notice && <p className="auth-notice">{notice}</p>}
      </form>

      <div className="auth-divider" />
      <p className="auth-foot">
        이미 계정이 있으신가요?{' '}
        <button type="button" className="link-btn" onClick={onGoLogin}>
          로그인
        </button>
      </p>
    </AuthLayout>
  )
}
