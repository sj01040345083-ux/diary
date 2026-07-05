import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { formatToday } from '../lib/today'
import { getTodayDiary, saveTodayDiary } from '../lib/diaries'
import { emotions } from '../config/emotions'
import './home.css'

type Props = {
  session: Session
  onDone: () => void // 저장 후 홈으로
  onCancel: () => void // 뒤로 (저장 안 하고 홈으로)
}

export default function WritePage({ session, onDone, onCancel }: Props) {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('') // '' = 기분 선택 안 함
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isEditing, setIsEditing] = useState(false) // 오늘 일기가 이미 있으면 '수정'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 오늘 이미 쓴 일기가 있으면 불러와서 채워둡니다 (같은 날 = 수정)
    getTodayDiary()
      .then((diary) => {
        if (diary) {
          setContent(diary.content)
          setMood(diary.mood ?? '')
          setIsEditing(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInitial(false))
  }, [])

  async function handleSave() {
    setError('')
    if (!content.trim()) {
      setError('한 줄이라도 적어주세요 🌱')
      return
    }
    setSaving(true)
    try {
      await saveTodayDiary(session.user.id, content.trim(), mood || null)
      onDone()
    } catch {
      setSaving(false)
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="home-header">
        <button className="icon-btn" onClick={onCancel} disabled={saving}>
          ← 뒤로
        </button>
        <div className="write-title">
          {isEditing ? '오늘 일기 수정' : '오늘 일기 쓰기'}
        </div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        <p className="home-date">{formatToday()}</p>
        <h1 className="write-heading">오늘, 마음에 남은 한 줄 🌱</h1>

        {loadingInitial ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : (
          <>
            {/* 오늘의 기분 (선택) */}
            <p className="mood-label">오늘의 기분 (선택)</p>
            <div className="mood-row">
              {emotions.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className={`mood-btn ${mood === e.emoji ? 'is-selected' : ''}`}
                  onClick={() => setMood(mood === e.emoji ? '' : e.emoji)}
                  title={e.label}
                  aria-label={e.label}
                >
                  {e.emoji}
                </button>
              ))}
            </div>

            <textarea
              className="write-textarea"
              placeholder="오늘 하루, 마음에 남은 한 줄을 적어보세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            {error && <p className="write-error">{error}</p>}
            <button
              className="home-cta write-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중…' : isEditing ? '수정 저장하기' : '저장하기'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
