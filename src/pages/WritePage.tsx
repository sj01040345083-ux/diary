import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { formatEntryDate } from '../lib/today'
import { getDiaryByDate, saveDiary, todayString } from '../lib/diaries'
import { emotions } from '../config/emotions'
import './home.css'

// 일기 글에 넣는 꾸미기 이모티콘 (기분 지정과는 별개)
const stickerEmojis = [
  '🍀',
  '☘️',
  '🎵',
  '🎶',
  '🌳',
  '🌸',
  '🌵',
  '💚',
  '☔',
  '☁️',
  '⛄',
  '☕',
  '🍺',
  '🍦',
  '🍰',
  '🏊',
  '🛁',
  '♨️',
  ...emotions.map((e) => e.emoji),
]

type Props = {
  session: Session
  onDone: () => void // 저장 후 (홈/기록으로)
  onCancel: () => void // 뒤로 (저장 안 함)
  targetDate?: string // 수정할 날짜 (없으면 오늘)
}

export default function WritePage({
  session,
  onDone,
  onCancel,
  targetDate,
}: Props) {
  const workDate = targetDate ?? todayString() // 작성/수정 대상 날짜
  const isToday = workDate === todayString()

  const [content, setContent] = useState('')
  const [mood, setMood] = useState('') // '' = 기분 선택 안 함
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 선택한 기분의 이름 (없으면 undefined)
  const selectedEmotion = emotions.find((e) => e.emoji === mood)

  useEffect(() => {
    // 해당 날짜 일기가 이미 있으면 불러와 채워둡니다 (수정)
    getDiaryByDate(workDate)
      .then((diary) => {
        if (diary) {
          setContent(diary.content)
          setMood(diary.mood ?? '')
          setIsEditing(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInitial(false))
  }, [workDate])

  // 커서 위치에 이모티콘을 끼워 넣습니다.
  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) {
      setContent((c) => c + emoji)
      return
    }
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    const next = content.slice(0, start) + emoji + content.slice(end)
    setContent(next)
    // 방금 넣은 이모티콘 뒤로 커서를 옮깁니다.
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  async function handleSave() {
    setError('')
    if (!content.trim()) {
      setError('한 줄이라도 적어주세요 🌱')
      return
    }
    setSaving(true)
    try {
      await saveDiary(session.user.id, workDate, content.trim(), mood || null)
      onDone()
    } catch {
      setSaving(false)
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div
      className="home-screen"
    >
      <header className="home-header">
        <button className="icon-btn" onClick={onCancel} disabled={saving}>
          ← 뒤로
        </button>
        <div className="write-title">{isEditing ? '일기 수정' : '일기 쓰기'}</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        <p className="home-date">{formatEntryDate(workDate)}</p>
        <h1 className="write-heading">
          {isToday ? '오늘, 마음에 남은 한 줄 🌱' : '이 날의 한 줄 🌱'}
        </h1>

        {loadingInitial ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : (
          <>
            {/* 오늘의 기분 (그 날의 감정 지정) */}
            <p className="mood-label">오늘의 기분 (선택)</p>
            <div className={`mood-row ${mood ? 'has-selection' : ''}`}>
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
            {/* 선택한 감정 이름 */}
            <p className="mood-name">
              {selectedEmotion && <span className="mood-name-chip">{selectedEmotion.label}</span>}
            </p>

            <textarea
              ref={textareaRef}
              className="write-textarea"
              placeholder="오늘 하루, 마음에 남은 한 줄을 적어보세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />

            {/* 일기 글에 넣는 이모티콘 (글 꾸미기용, 기분 지정과 별개) */}
            <p className="sticker-label">이모티콘 넣기 (글 중간에)</p>
            <div className="sticker-row">
              {stickerEmojis.map((em, i) => (
                <button
                  key={`${em}-${i}`}
                  type="button"
                  className="sticker-btn"
                  onClick={() => insertEmoji(em)}
                  aria-label={`${em} 넣기`}
                >
                  {em}
                </button>
              ))}
            </div>

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
