import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { todayString } from '../lib/diaries'
import { formatEntryDate } from '../lib/today'
import {
  getMyMemos,
  addMemo,
  updateMemo,
  deleteMemo,
} from '../lib/memos'
import type { Memo } from '../lib/memos'
import './memos.css'

type Props = {
  session: Session
  onBack: () => void
}

// "YYYY-MM" → "2026년 8월"
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${y}년 ${m}월`
}

export default function MemosPage({ session, onBack }: Props) {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)

  // 화면 모드: 목록 보기 / 메모 편집
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [memoDate, setMemoDate] = useState(todayString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 삭제 확인 대상
  const [confirmTarget, setConfirmTarget] = useState<Memo | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getMyMemos(session.user.id)
      .then(setMemos)
      .catch(() => setMemos([]))
      .finally(() => setLoading(false))
  }, [session.user.id])

  // 새 메모 쓰기
  function openNew() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setMemoDate(todayString())
    setError('')
    setMode('edit')
  }

  // 기존 메모 열기(수정)
  function openEdit(m: Memo) {
    setEditingId(m.id)
    setTitle(m.title)
    setContent(m.content)
    setMemoDate(m.memo_date)
    setError('')
    setMode('edit')
  }

  // 저장 (새 메모 또는 수정)
  async function handleSave() {
    setError('')
    if (!title.trim() && !content.trim()) {
      setError('제목이나 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    const payload = {
      title: title.trim(),
      content: content.trim(),
      memo_date: memoDate || todayString(),
    }
    try {
      if (editingId) {
        await updateMemo(session.user.id, editingId, payload)
      } else {
        await addMemo(session.user.id, payload)
      }
      const fresh = await getMyMemos(session.user.id)
      setMemos(fresh)
      setMode('list')
    } catch {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await deleteMemo(session.user.id, confirmTarget.id)
      setMemos((prev) => prev.filter((m) => m.id !== confirmTarget.id))
      // 지금 편집 중인 메모를 지웠다면 목록으로
      if (editingId === confirmTarget.id) {
        setMode('list')
        setEditingId(null)
      }
      setConfirmTarget(null)
    } catch {
      // 유지
    } finally {
      setDeleting(false)
    }
  }

  // 월별로 묶기: [{ ym, label, items }]
  const groups: { ym: string; label: string; items: Memo[] }[] = []
  for (const m of memos) {
    const ym = m.memo_date.slice(0, 7)
    let g = groups.find((x) => x.ym === ym)
    if (!g) {
      g = { ym, label: monthLabel(ym), items: [] }
      groups.push(g)
    }
    g.items.push(m)
  }

  // ── 편집 화면 ─────────────────────────────
  if (mode === 'edit') {
    return (
      <div className="home-screen">
        <header className="home-header">
          <button
            className="icon-btn"
            onClick={() => setMode('list')}
            disabled={saving}
          >
            ← 뒤로
          </button>
          <div className="write-title">
            {editingId ? '메모 수정' : '새 메모'}
          </div>
          <span className="write-spacer" aria-hidden />
        </header>

        <main className="home-container">
          <div className="memo-edit">
            {/* 제목 (위) */}
            <input
              className="memo-title-input"
              type="text"
              placeholder="제목"
              value={title}
              maxLength={60}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* 날짜 */}
            <input
              className="tx-input memo-date-input"
              type="date"
              value={memoDate}
              onChange={(e) => setMemoDate(e.target.value)}
            />

            {/* 내용 (아래) */}
            <textarea
              className="memo-content-input"
              placeholder="내용을 자유롭게 적어보세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
            />

            {error && <p className="write-error">{error}</p>}

            <button
              className="home-cta write-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중…' : '저장하기'}
            </button>
            {editingId && (
              <button
                className="memo-delete-link"
                onClick={() => {
                  const m = memos.find((x) => x.id === editingId)
                  if (m) setConfirmTarget(m)
                }}
                disabled={saving}
              >
                이 메모 삭제
              </button>
            )}
          </div>
        </main>

        {confirmTarget && (
          <DeleteModal
            target={confirmTarget}
            deleting={deleting}
            onCancel={() => setConfirmTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    )
  }

  // ── 목록 화면 ─────────────────────────────
  return (
    <div className="home-screen">
      <header className="home-header">
        <button className="icon-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="write-title">메모장</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        <button className="home-cta memo-new-btn" onClick={openNew}>
          ✏️ 새 메모 쓰기
        </button>

        {loading ? (
          <div className="diary-empty">
            <p>불러오는 중…</p>
          </div>
        ) : memos.length === 0 ? (
          <div className="diary-empty">
            <p>아직 메모가 없어요.</p>
            <p>떠오르는 생각을 자유롭게 남겨보세요 🌿</p>
          </div>
        ) : (
          groups.map((g) => (
            <section className="memo-group" key={g.ym}>
              <h2 className="memo-group-title">{g.label}</h2>
              <div className="memo-list">
                {g.items.map((m) => (
                  <button
                    key={m.id}
                    className="memo-card"
                    onClick={() => openEdit(m)}
                  >
                    <span className="memo-card-date">
                      {formatEntryDate(m.memo_date)}
                    </span>
                    <span className="memo-card-title">
                      {m.title || '(제목 없음)'}
                    </span>
                    {m.content && (
                      <span className="memo-card-preview">{m.content}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {confirmTarget && (
        <DeleteModal
          target={confirmTarget}
          deleting={deleting}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

// 삭제 확인 모달 (목록/편집 양쪽에서 사용)
function DeleteModal({
  target,
  deleting,
  onCancel,
  onConfirm,
}: {
  target: Memo
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!deleting) onCancel()
      }}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">메모를 삭제할까요?</h3>
        <p className="modal-desc">삭제하면 되돌릴 수 없어요.</p>
        <p className="modal-preview">“{target.title || target.content}”</p>
        <div className="modal-actions">
          <button
            className="modal-btn-cancel"
            onClick={onCancel}
            disabled={deleting}
          >
            취소
          </button>
          <button
            className="modal-btn-delete"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? '삭제 중…' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
