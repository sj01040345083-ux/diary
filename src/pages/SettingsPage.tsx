import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { backgroundOptions } from '../config/backgrounds'
import { sizeOptions } from '../config/theme'
import {
  getSettings,
  saveSettings,
  applySettings,
  cacheSettingsLocal,
  defaultSettings,
  CUSTOM_BG,
  getCustomBg,
  setCustomBg,
  clearCustomBg,
} from '../lib/settings'
import type { Settings } from '../lib/settings'
import { fileToBackgroundDataUrl } from '../lib/imageCompress'
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
  // 내가 올린 배경 사진(Data URL). 미리보기·선택에 사용합니다.
  const [customBg, setCustomBgState] = useState<string | null>(null)
  const [bgBusy, setBgBusy] = useState(false)
  const [bgError, setBgError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCustomBgState(getCustomBg())
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

  // 배경만 바꿀 때: 즉시 적용 + localStorage 캐시에도 저장(새로고침·재접속에도 유지)
  function pickBackground(value: string) {
    const next = { ...settings, bg: value }
    setSettings(next)
    applySettings(next)
    cacheSettingsLocal(next)
    setNotice('')
    setBgError('')
  }

  // 파일 선택 → 압축 → Data URL 저장 → 배경으로 즉시 적용
  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 동작하도록 초기화
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setBgError('이미지 파일(jpg, png 등)만 올릴 수 있어요.')
      return
    }

    setBgBusy(true)
    setBgError('')
    setNotice('')
    try {
      // 큰 사진도 알아서 긴 변 1600px, JPEG 로 줄여 Data URL 로 바꿉니다.
      const dataUrl = await fileToBackgroundDataUrl(file)
      // localStorage 저장 (용량이 너무 크면 실패할 수 있음)
      const ok = setCustomBg(dataUrl)
      if (!ok) {
        setBgError(
          '사진 용량이 너무 커서 저장하지 못했어요. 더 작은 사진으로 올려주세요.',
        )
        return
      }
      setCustomBgState(dataUrl)
      pickBackground(CUSTOM_BG) // 올린 사진을 배경으로 즉시 적용 + 저장
    } catch {
      setBgError('사진을 불러오지 못했어요. 다른 사진으로 다시 시도해주세요.')
    } finally {
      setBgBusy(false)
    }
  }

  // 기본 배경으로 되돌리기 (올린 사진 삭제)
  function resetBackground() {
    clearCustomBg()
    setCustomBgState(null)
    pickBackground(defaultSettings.bg)
    setNotice('기본 배경으로 되돌렸어요 🌿')
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
                  style={
                    o.url
                      ? { backgroundImage: `url(${o.url})` }
                      : {
                          // 사진이 아닌 밝은 단색 배경 미리보기
                          background:
                            'linear-gradient(180deg, #eef1ea 0%, #e5e9e0 100%)',
                        }
                  }
                  onClick={() => pickBackground(o.value)}
                  aria-label={o.label}
                  title={o.label}
                >
                  {settings.bg === o.value && (
                    <span className="bg-thumb-check">✓</span>
                  )}
                </button>
              ))}

              {/* 내가 올린 사진 미리보기 (있을 때만) */}
              {customBg && (
                <button
                  type="button"
                  className={`bg-thumb ${settings.bg === CUSTOM_BG ? 'is-active' : ''}`}
                  style={{ backgroundImage: `url(${customBg})` }}
                  onClick={() => pickBackground(CUSTOM_BG)}
                  aria-label="내 사진"
                  title="내 사진"
                >
                  {settings.bg === CUSTOM_BG && (
                    <span className="bg-thumb-check">✓</span>
                  )}
                </button>
              )}

              {/* 내 사진 업로드 버튼 */}
              <button
                type="button"
                className="bg-thumb bg-thumb-upload"
                onClick={() => fileRef.current?.click()}
                disabled={bgBusy}
                aria-label="내 사진 업로드"
                title="내 사진 업로드"
              >
                <span className="bg-thumb-upload-plus">＋</span>
                <span className="bg-thumb-upload-text">
                  {bgBusy ? '준비 중…' : '내 사진'}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFilePick}
                style={{ display: 'none' }}
              />
            </div>

            {bgError && <p className="photo-error">{bgError}</p>}

            {(settings.bg === CUSTOM_BG || customBg) && (
              <button
                type="button"
                className="bg-reset-btn"
                onClick={resetBackground}
                disabled={bgBusy}
              >
                ↩ 기본 배경으로 되돌리기
              </button>
            )}

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
