import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { bgOptions, fontOptions, sizeOptions } from '../config/theme'
import {
  getSettings,
  saveSettings,
  applySettings,
  defaultSettings,
} from '../lib/settings'
import type { Settings } from '../lib/settings'
import { supabase } from '../lib/supabase'
import './home.css'

type Props = {
  session: Session
}

export default function SettingsPage({ session }: Props) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(s)
        applySettings(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 선택을 바꾸면 바로 화면에 미리 적용해서 눈으로 확인하게 합니다.
  function pick(key: keyof Settings, value: string) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    applySettings(next)
    setNotice('')
  }

  async function handleSave() {
    setSaving(true)
    setNotice('')
    try {
      await saveSettings(session.user.id, settings)
      setNotice('설정을 저장했어요 🌿')
    } catch {
      setNotice('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="tab-header">
        <div className="write-title">설정</div>
      </header>

      <main className="home-container">
        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : (
          <>
            <p className="report-section-title">배경색</p>
            <div className="opt-row">
              {bgOptions.map((o) => (
                <button
                  key={o.value}
                  className={`opt-btn ${settings.bg === o.value ? 'is-active' : ''}`}
                  onClick={() => pick('bg', o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <p className="report-section-title">글씨체</p>
            <div className="opt-row">
              {fontOptions.map((o) => (
                <button
                  key={o.value}
                  className={`opt-btn ${settings.font === o.value ? 'is-active' : ''}`}
                  onClick={() => pick('font', o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <p className="report-section-title">글씨 크기</p>
            <div className="opt-row">
              {sizeOptions.map((o) => (
                <button
                  key={o.value}
                  className={`opt-btn ${settings.font_size === o.value ? 'is-active' : ''}`}
                  onClick={() => pick('font_size', o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <button
              className="home-cta"
              onClick={handleSave}
              disabled={saving}
              style={{ marginTop: '1.75rem' }}
            >
              {saving ? '저장 중…' : '설정 저장'}
            </button>
            {notice && <p className="home-notice">{notice}</p>}

            <button className="settings-logout" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        )}
      </main>
    </div>
  )
}
