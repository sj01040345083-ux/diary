import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { backgroundOptions } from '../config/backgrounds'
import { fontOptions, sizeOptions } from '../config/theme'
import {
  getSettings,
  saveSettings,
  applySettings,
  defaultSettings,
} from '../lib/settings'
import type { Settings } from '../lib/settings'
import { supabase } from '../lib/supabase'
import { getMyDiaries } from '../lib/diaries'
import { getMyTransactions } from '../lib/transactions'
import './home.css'

// 이번 달 "YYYY-MM"
function thisMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type Props = {
  session: Session
}

export default function SettingsPage({ session }: Props) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [exporting, setExporting] = useState<'' | 'xlsx' | 'docx'>('')

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

  // 이번 달 기록을 엑셀/워드로 내보내기 (필요할 때 데이터를 불러옵니다)
  async function handleExport(kind: 'xlsx' | 'docx') {
    setExporting(kind)
    setNotice('')
    try {
      const [diaries, transactions] = await Promise.all([
        getMyDiaries(),
        getMyTransactions(),
      ])
      const data = { month: thisMonth(), diaries, transactions }
      const exporters = await import('../lib/exporters')
      if (kind === 'xlsx') exporters.exportStatsXlsx(data)
      else await exporters.exportDiaryDocx(data)
    } catch {
      setNotice('내보내기에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="home-screen">
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
            <p className="report-section-title">불러줄 이름</p>
            <input
              className="tx-input"
              type="text"
              placeholder="예: 서정 (비우면 이메일 앞부분으로 표시돼요)"
              value={settings.nickname}
              onChange={(e) => pick('nickname', e.target.value)}
              maxLength={20}
            />

            <p className="report-section-title">배경 사진 선택</p>
            <div className="bg-thumb-row">
              {backgroundOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`bg-thumb ${settings.bg === o.value ? 'is-active' : ''}`}
                  style={{ backgroundImage: `url(${o.url})` }}
                  onClick={() => pick('bg', o.value)}
                  aria-label={o.label}
                  title={o.label}
                >
                  {settings.bg === o.value && (
                    <span className="bg-thumb-check">✓</span>
                  )}
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

            <p className="report-section-title">데이터 내보내기</p>
            <p className="settings-hint">
              이번 달 일기·소비·수입 기록을 파일로 저장해요.
            </p>
            <div className="export-row">
              <button
                className="export-btn"
                onClick={() => handleExport('xlsx')}
                disabled={exporting !== ''}
              >
                {exporting === 'xlsx' ? '만드는 중…' : '📊 엑셀로 내보내기'}
              </button>
              <button
                className="export-btn"
                onClick={() => handleExport('docx')}
                disabled={exporting !== ''}
              >
                {exporting === 'docx' ? '만드는 중…' : '📄 워드로 내보내기'}
              </button>
            </div>

            <button className="settings-logout" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        )}
      </main>
    </div>
  )
}
