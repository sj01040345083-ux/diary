import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { formatEntryDate } from '../lib/today'
import { getDiaryByDate, saveDiary, todayString } from '../lib/diaries'
import { emotions } from '../config/emotions'
import { compressImage } from '../lib/imageCompress'
import { addPhoto, getPhotosByDate, deletePhoto } from '../lib/photos'
import { collageClass } from '../components/PhotoCollage'
import './home.css'

const MAX_PHOTOS = 6

// 작성 화면에서 다루는 사진 (새로 고른 것 + 기존에 저장된 것)
type EditPhoto = {
  key: string
  url: string // 미리보기용 object URL
  blob: Blob // 압축된 이미지
  existingId?: string // IndexedDB에 이미 저장돼 있으면 그 ID
}

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

  // 사진 첨부
  const [photos, setPhotos] = useState<EditPhoto[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const removedIds = useRef<string[]>([]) // 저장 시 IndexedDB에서 지울 기존 사진 ID
  const pickedSigs = useRef<Set<string>>(new Set()) // 중복 선택 방지용 서명
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    // 이 날짜에 이미 저장된 사진을 불러와 미리보기로 채웁니다.
    let alive = true
    const created: string[] = []
    getPhotosByDate(workDate)
      .then((recs) => {
        if (!alive) return
        setPhotos(
          recs.map((r) => {
            const url = URL.createObjectURL(r.blob)
            created.push(url)
            return { key: r.id, url, blob: r.blob, existingId: r.id }
          }),
        )
      })
      .catch(() => {})
    return () => {
      alive = false
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [workDate])

  // 사진 파일 선택 → 압축해서 미리보기에 추가
  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setPhotoError('')
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setPhotoError(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`)
      return
    }
    const incoming = Array.from(fileList)
    const take: File[] = []
    for (const f of incoming) {
      if (take.length >= room) break
      if (!f.type.startsWith('image/')) continue
      const sig = `${f.name}-${f.size}-${f.lastModified}`
      if (pickedSigs.current.has(sig)) continue // 같은 사진 중복 방지
      pickedSigs.current.add(sig)
      take.push(f)
    }
    setPhotoBusy(true)
    const added: EditPhoto[] = []
    for (const f of take) {
      try {
        const blob = await compressImage(f)
        added.push({
          key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: URL.createObjectURL(blob),
          blob,
        })
      } catch {
        setPhotoError('사진을 불러오지 못했습니다. 다른 사진을 선택해 주세요.')
      }
    }
    setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS))
    if (incoming.length > room) {
      setPhotoError(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`)
    }
    setPhotoBusy(false)
    if (fileInputRef.current) fileInputRef.current.value = '' // 같은 파일 재선택 허용
  }

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key)
      if (target) {
        URL.revokeObjectURL(target.url)
        if (target.existingId) removedIds.current.push(target.existingId)
      }
      return prev.filter((p) => p.key !== key)
    })
  }

  function clearPhotos() {
    photos.forEach((p) => {
      URL.revokeObjectURL(p.url)
      if (p.existingId) removedIds.current.push(p.existingId)
    })
    setPhotos([])
  }

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
      // 사진 반영: 삭제된 기존 사진 제거 + 새로 고른 사진 IndexedDB 저장
      try {
        for (const id of removedIds.current) await deletePhoto(id)
        for (const p of photos) {
          if (!p.existingId) await addPhoto(workDate, p.blob)
        }
      } catch {
        // 사진 저장 실패는 일기 저장을 막지 않습니다.
      }
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
          {isToday ? '오늘, 마음에 남은 한 줄 🍀' : '이 날의 한 줄 🍀'}
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

            {/* 사진 첨부 */}
            <p className="photo-label">사진 첨부</p>
            <div className="photo-card">
              {photos.length === 0 ? (
                <p className="photo-hint">오늘의 사진을 함께 남겨보세요.</p>
              ) : (
                <div className={`${collageClass(photos.length)} collage-edit`}>
                  {photos.map((p) => (
                    <div className="collage-cell" key={p.key}>
                      <img src={p.url} alt="" />
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => removePhoto(p.key)}
                        aria-label="사진 삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photoBusy && (
                <p className="photo-busy">사진을 준비하고 있어요…</p>
              )}
              {photoError && <p className="photo-error">{photoError}</p>}

              <div className="photo-actions">
                <button
                  type="button"
                  className="photo-pick-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoBusy || photos.length >= MAX_PHOTOS}
                >
                  📷 사진 선택
                </button>
                {photos.length > 0 && (
                  <button
                    type="button"
                    className="photo-clear-btn"
                    onClick={clearPhotos}
                    disabled={photoBusy}
                  >
                    전체 삭제
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

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
              disabled={saving || photoBusy}
            >
              {saving ? '저장 중…' : isEditing ? '수정 저장하기' : '저장하기'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
