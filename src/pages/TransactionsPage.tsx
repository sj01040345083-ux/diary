import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import { expenseCategories, incomeCategories } from '../config/categories'
import { formatDateTime } from '../lib/today'
import { todayString } from '../lib/diaries'
import {
  getMyTransactions,
  addTransaction,
  deleteTransaction,
} from '../lib/transactions'
import type { Transaction, TxType } from '../lib/transactions'
import './home.css'

type Props = {
  session: Session
  onBack: () => void
}

// 숫자에 천단위 콤마 (1000 -> 1,000)
function won(n: number): string {
  return n.toLocaleString('ko-KR')
}

export default function TransactionsPage({ session, onBack }: Props) {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('식비')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [confirmTarget, setConfirmTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categories = type === 'expense' ? expenseCategories : incomeCategories

  useEffect(() => {
    getMyTransactions()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  // 소비/수입 종류를 바꾸면 카테고리 기본값도 맞춰줍니다.
  function changeType(next: TxType) {
    setType(next)
    setCategory(next === 'expense' ? expenseCategories[0] : incomeCategories[0])
  }

  async function handleAdd() {
    setError('')
    const value = Number(amount.replace(/[^0-9]/g, ''))
    if (!value || value <= 0) {
      setError('금액을 숫자로 입력해주세요.')
      return
    }
    setSaving(true)
    try {
      await addTransaction(session.user.id, {
        type,
        amount: value,
        category,
        memo: memo.trim() || null,
        tx_date: todayString(),
      })
      const fresh = await getMyTransactions()
      setItems(fresh)
      setAmount('')
      setMemo('')
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
      await deleteTransaction(confirmTarget.id)
      setItems((prev) => prev.filter((t) => t.id !== confirmTarget.id))
      setConfirmTarget(null)
    } catch {
      // 유지
    } finally {
      setDeleting(false)
    }
  }

  // 합계 계산
  const incomeSum = items
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const expenseSum = items
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <header className="home-header">
        <button className="icon-btn" onClick={onBack} disabled={saving}>
          ← 뒤로
        </button>
        <div className="write-title">소비 · 수입</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        {/* 합계 요약 */}
        <div className="tx-summary">
          <div className="tx-sum-box income">
            <span className="tx-sum-label">수입</span>
            <span className="tx-sum-value">+{won(incomeSum)}원</span>
          </div>
          <div className="tx-sum-box expense">
            <span className="tx-sum-label">지출</span>
            <span className="tx-sum-value">-{won(expenseSum)}원</span>
          </div>
        </div>

        {/* 입력 */}
        <div className="tx-form">
          <div className="tx-type-row">
            <button
              className={`tx-type-btn ${type === 'expense' ? 'is-active' : ''}`}
              onClick={() => changeType('expense')}
            >
              지출
            </button>
            <button
              className={`tx-type-btn ${type === 'income' ? 'is-active income' : ''}`}
              onClick={() => changeType('income')}
            >
              수입
            </button>
          </div>

          <input
            className="tx-input"
            type="text"
            inputMode="numeric"
            placeholder="금액 (숫자)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="tx-cat-row">
            {categories.map((c) => (
              <button
                key={c}
                className={`tx-cat-btn ${category === c ? 'is-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <input
            className="tx-input"
            type="text"
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          {error && <p className="write-error">{error}</p>}
          <button
            className="home-cta write-save"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? '저장 중…' : '기록 추가'}
          </button>
        </div>

        {/* 목록 */}
        <section className="diary-section">
          <h2 className="diary-heading">기록 목록</h2>
          {loading ? (
            <div className="diary-empty">
              <p>불러오는 중…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="diary-empty">
              <p>아직 기록이 없어요.</p>
              <p>오늘의 소비·수입을 남겨보세요 🌿</p>
            </div>
          ) : (
            <div className="diary-list">
              {items.map((t) => (
                <article key={t.id} className="diary-item">
                  <div className="diary-item-main">
                    <p className="diary-item-date">
                      {t.category || '기타'} · {formatDateTime(t.created_at)}
                    </p>
                    <p className="diary-item-content">
                      <span
                        className={
                          t.type === 'income' ? 'tx-amount-in' : 'tx-amount-out'
                        }
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {won(Number(t.amount))}원
                      </span>
                      {t.memo ? ` · ${t.memo}` : ''}
                    </p>
                  </div>
                  <button
                    className="diary-delete-btn"
                    onClick={() => setConfirmTarget(t)}
                    aria-label="기록 삭제"
                  >
                    삭제
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {confirmTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deleting) setConfirmTarget(null)
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">기록을 삭제할까요?</h3>
            <p className="modal-desc">삭제하면 되돌릴 수 없어요.</p>
            <p className="modal-preview">
              {confirmTarget.type === 'income' ? '+' : '-'}
              {won(Number(confirmTarget.amount))}원 · {confirmTarget.category}
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setConfirmTarget(null)}
                disabled={deleting}
              >
                취소
              </button>
              <button
                className="modal-btn-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
