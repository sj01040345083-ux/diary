import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authBackground } from '../config/backgrounds'
import {
  expenseCategories,
  incomeCategories,
  categoryIcon,
} from '../config/categories'
import { formatEntryDate } from '../lib/today'
import { todayString } from '../lib/diaries'
import {
  getMyTransactions,
  addTransaction,
  deleteTransaction,
} from '../lib/transactions'
import type { Transaction, TxType } from '../lib/transactions'
import {
  getMyCategories,
  addCategory,
  deleteCategory,
} from '../lib/categories'
import type { Category } from '../lib/categories'
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
  const [txDate, setTxDate] = useState(todayString()) // 기록 날짜 (달력 선택)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('식비')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [confirmTarget, setConfirmTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 내가 만든 카테고리
  const [customCats, setCustomCats] = useState<Category[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const [catError, setCatError] = useState('')
  const [catToDelete, setCatToDelete] = useState<Category | null>(null)
  const [deletingCat, setDeletingCat] = useState(false)

  const defaults = type === 'expense' ? expenseCategories : incomeCategories
  const customForType = customCats.filter((c) => c.type === type)

  useEffect(() => {
    getMyTransactions()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
    getMyCategories()
      .then(setCustomCats)
      .catch(() => setCustomCats([]))
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
        tx_date: txDate,
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

  // 새 카테고리 추가
  async function handleAddCategory() {
    const name = newCatName.trim()
    setCatError('')
    if (!name) {
      setCatError('카테고리 이름을 입력해주세요.')
      return
    }
    const exists = [...defaults, ...customForType.map((c) => c.name)].includes(
      name,
    )
    if (exists) {
      setCatError('이미 있는 카테고리예요.')
      return
    }
    setSavingCat(true)
    try {
      await addCategory(session.user.id, type, name)
      const fresh = await getMyCategories()
      setCustomCats(fresh)
      setCategory(name) // 방금 만든 것을 바로 선택
      setNewCatName('')
      setAddOpen(false)
    } catch {
      setCatError('추가에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSavingCat(false)
    }
  }

  // 카테고리 삭제
  async function handleDeleteCategory() {
    if (!catToDelete) return
    setDeletingCat(true)
    try {
      await deleteCategory(catToDelete.id)
      const fresh = await getMyCategories()
      setCustomCats(fresh)
      if (category === catToDelete.name) setCategory(defaults[0])
      setCatToDelete(null)
    } catch {
      // 유지
    } finally {
      setDeletingCat(false)
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

          <label className="tx-date-label">날짜</label>
          <input
            className="tx-input"
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />

          <input
            className="tx-input"
            type="text"
            inputMode="numeric"
            placeholder="금액 (숫자)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="tx-cat-row">
            {/* 기본 카테고리 */}
            {defaults.map((c) => (
              <button
                key={c}
                type="button"
                className={`tx-cat-btn ${category === c ? 'is-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
            {/* 내가 만든 카테고리 (× 삭제 가능) */}
            {customForType.map((c) => (
              <span
                key={c.id}
                className={`tx-cat-btn tx-cat-custom ${category === c.name ? 'is-active' : ''}`}
              >
                <button
                  type="button"
                  className="tx-cat-name"
                  onClick={() => setCategory(c.name)}
                >
                  {c.name}
                </button>
                <button
                  type="button"
                  className="tx-cat-del"
                  onClick={() => setCatToDelete(c)}
                  aria-label={`${c.name} 카테고리 삭제`}
                >
                  ×
                </button>
              </span>
            ))}
            {/* 새 카테고리 추가 */}
            <button
              type="button"
              className="tx-cat-add"
              onClick={() => {
                setNewCatName('')
                setCatError('')
                setAddOpen(true)
              }}
            >
              + 추가
            </button>
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
            {saving ? '저장 중…' : '기록 추가하기'}
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
                      {categoryIcon(t.category || '기타')} {t.category || '기타'}{' '}
                      · {formatEntryDate(t.tx_date)}
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

      {/* 기록 삭제 확인 */}
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

      {/* 새 카테고리 추가 */}
      {addOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!savingCat) setAddOpen(false)
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">새 카테고리</h3>
            <p className="modal-desc">
              {type === 'expense' ? '지출' : '수입'} 카테고리 이름을 입력하세요.
            </p>
            <input
              className="tx-input"
              type="text"
              placeholder="예: 커피, 반려동물, 저축"
              value={newCatName}
              maxLength={12}
              autoFocus
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory()
              }}
            />
            {catError && <p className="modal-error">{catError}</p>}
            <div className="modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setAddOpen(false)}
                disabled={savingCat}
              >
                취소
              </button>
              <button
                className="modal-btn-edit"
                onClick={handleAddCategory}
                disabled={savingCat}
              >
                {savingCat ? '추가 중…' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 삭제 확인 */}
      {catToDelete && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deletingCat) setCatToDelete(null)
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">카테고리를 삭제할까요?</h3>
            <p className="modal-desc">
              이 카테고리만 사라져요. (기존 기록은 그대로 남아요)
            </p>
            <p className="modal-preview">“{catToDelete.name}”</p>
            <div className="modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setCatToDelete(null)}
                disabled={deletingCat}
              >
                취소
              </button>
              <button
                className="modal-btn-delete"
                onClick={handleDeleteCategory}
                disabled={deletingCat}
              >
                {deletingCat ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
