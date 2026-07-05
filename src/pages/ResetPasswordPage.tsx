import { useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/authErrors'

// 이메일의 재설정 링크로 들어오면 보이는 '새 비밀번호 설정' 화면입니다.
type Props = {
  onDone: () => void
}

export default function ResetPasswordPage({ onDone }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  )
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  function validate() {
    const next: { password?: string; confirm?: string } = {}
    if (!password) next.password = '새 비밀번호를 입력해주세요.'
    else if (password.length < 8)
      next.password = '비밀번호는 최소 8자 이상이어야 해요.'
    if (password !== confirm) next.confirm = '비밀번호가 서로 달라요.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setNotice('')
    if (!validate()) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setNotice(translateAuthError(error.message))
      return
    }
    setNotice('비밀번호가 변경됐어요! 🌿 잠시 후 이동합니다.')
    setTimeout(onDone, 1300)
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="new-password">새 비밀번호</label>
          <input
            id="new-password"
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
          <label htmlFor="new-confirm">새 비밀번호 확인</label>
          <input
            id="new-confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={errors.confirm ? 'has-error' : ''}
            autoComplete="new-password"
          />
          <span className="field-error">{errors.confirm ?? ''}</span>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" />
              변경 중…
            </>
          ) : (
            '비밀번호 변경'
          )}
        </button>

        {notice && <p className="auth-notice">{notice}</p>}
      </form>
    </AuthLayout>
  )
}
