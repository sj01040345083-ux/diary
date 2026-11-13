import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { payMethods } from '../config/categories'
import { formatEntryDate } from '../lib/today'
import { todayString } from '../lib/diaries'
import {
  getMyTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../lib/transactions'
import type { Transaction } from '../lib/transactions'
import './home.css'

type Props = {
  session: Session
  onBack: () => void
}

// 숫자에 천단위 콤마 (1000 -> 1,000)
function won(n: number): string {
  return n.toLocaleString('ko-KR')
}

function thisMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 할부 표시 (0 = 일시불)
function installmentLabel(n: number): string {
  return n > 0 ? `${n}개월 할부` : '일시불'
}

export default function TransactionsPage({ session, onBack }: Props) {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(thisMonth())

  // 입력 폼 (지출 전용)
  const [txDate, setTxDate] = useState(todayString())
  const [memo, setMemo] = useState('') // 지출 목록
  const [amount, setAmount] = useState('')
  const [payMethod, setPayMethod] = useState(payMethods[0]) // 결제수단
  const [installment, setInstallment] = useState('') // 할부 개월수 (빈칸=일시불)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [confirmTarget, setConfirmTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getMyTransactions()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setEditingId(null)
    setMemo('')
    setAmount('')
    setPayMethod(payMethods[0])
    setInstallment('')
    setError('')
    setTxDate(todayString())
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id)
    setTxDate(t.tx_date)
    setMemo(t.memo ?? '')
    setAmount(String(t.amount))
    setPayMethod(t.category && payMethods.includes(t.category) ? t.category : payMethods[0])
    setInstallment(t.installment > 0 ? String(t.installment) : '')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setError('')
    const value = Number(amount.replace(/[^0-9]/g, ''))
    if (!value || value <= 0) {
      setError('금액을 숫자로 입력해주세요.')
      return
    }
    const months = Number(installment.replace(/[^0-9]/g, '')) || 0
    setSaving(true)
    const payload = {
      type: 'expense' as const,
      amount: value,
      category: payMethod, // 결제수단
      memo: memo.trim() || null, // 지출 목록
      installment: months,
      tx_date: txDate,
    }
    try {
      if (editingId) {
        await updateTransaction(editingId, payload)
      } else {
        await addTransaction(session.user.id, payload)
      }
      setItems(await getMyTransactions())
      resetForm()
    } catch (e) {
      // installment 칸이 아직 없으면 안내
      if ((e as { message?: string })?.message?.includes('installment')) {
        setError(
          '가계부 설정이 필요해요. 받은 안내(SQL)를 Supabase에서 한 번 실행해주세요.',
        )
      } else {
        setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
      }
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
      if (editingId === confirmTarget.id) resetForm()
      setConfirmTarget(null)
    } catch {
      // 유지
    } finally {
      setDeleting(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const { exportGakebuXlsx } = await import('../lib/exporters')
      exportGakebuXlsx(month, items)
    } finally {
      setExporting(false)
    }
  }

  // 이 달 지출만 (최신 날짜가 위로)
  const monthItems = items
    .filter((t) => t.type === 'expense' && t.tx_date.startsWith(month))
    .sort((a, b) => b.tx_date.localeCompare(a.tx_date))

  const expenseSum = monthItems.reduce((s, t) => s + Number(t.amount), 0)

  const [my, mm] = month.split('-').map(Number)
  const isCurrentMonth = month === thisMonth()

  return (
    <div className="home-screen">
      <header className="home-header">
        <button className="icon-btn" onClick={onBack} disabled={saving}>
          ← 뒤로
        </button>
        <div className="write-title">가계부</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container">
        {/* 달 이동 */}
        <div className="stat-month">
          <button
            className="stat-month-arrow"
            onClick={() => setMonth((mo) => shiftMonth(mo, -1))}
            aria-label="이전 달"
          >
            ◀
          </button>
          <span className="stat-month-label">
            {my}년 {mm}월 {isCurrentMonth ? '· 이번 달' : '· 마감'}
          </span>
          <button
            className="stat-month-arrow"
            onClick={() => setMonth((mo) => shiftMonth(mo, 1))}
            disabled={isCurrentMonth}
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>

        {/* 이 달 총 지출 */}
        <div className="tx-balance">
          <span className="tx-balance-label">이 달 총 지출</span>
          <span className="tx-balance-value minus">-{won(expenseSum)}원</span>
        </div>

        {/* 엑셀 내려받기 */}
        <div className="export-row" style={{ marginBottom: '1rem' }}>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting || monthItems.length === 0}
          >
            {exporting ? '만드는 중…' : `📊 ${mm}월 가계부 엑셀로 내려받기`}
          </button>
        </div>

        {/* 입력 */}
        <div className="tx-form">
          <label className="tx-date-label">날짜</label>
          <input
            className="tx-input"
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />

          <label className="tx-date-label">지출 목록</label>
          <input
            className="tx-input"
            type="text"
            placeholder="예: 점심 식사, 마트 장보기"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          <label className="tx-date-label">금액</label>
          <input
            className="tx-input"
            type="text"
            inputMode="numeric"
            placeholder="예: 12000 (숫자만)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <label className="tx-date-label">결제수단 (현금 / 카드)</label>
          <div className="tx-cat-row">
            {payMethods.map((p) => (
              <button
                key={p}
                type="button"
                className={`tx-cat-btn ${payMethod === p ? 'is-active' : ''}`}
                onClick={() => setPayMethod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <label className="tx-date-label">할부 (개월, 일시불이면 비워두세요)</label>
          <input
            className="tx-input"
            type="text"
            inputMode="numeric"
            placeholder="예: 3 (비우면 일시불)"
            value={installment}
            onChange={(e) => setInstallment(e.target.value)}
          />

          {error && <p className="write-error">{error}</p>}
          <button
            className="home-cta write-save"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '저장 중…' : editingId ? '수정 저장하기' : '기록 추가하기'}
          </button>
          {editingId && (
            <button
              className="tx-edit-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              수정 취소
            </button>
          )}
        </div>

        {/* 이 달 내역 */}
        <section className="diary-section">
          <h2 className="diary-heading">{mm}월 지출 내역</h2>
          {loading ? (
            <div className="diary-empty">
              <p>불러오는 중…</p>
            </div>
          ) : monthItems.length === 0 ? (
            <div className="diary-empty">
              {isCurrentMonth ? (
                <>
                  <p>이번 달은 아직 기록이 없어요.</p>
                  <p>오늘의 지출을 남겨보세요 🌿</p>
                </>
              ) : (
                <p>이 달에는 기록이 없어요.</p>
              )}
            </div>
          ) : (
            <div className="diary-list">
              {monthItems.map((t) => (
                <article
                  key={t.id}
                  className={`diary-item ${editingId === t.id ? 'is-editing' : ''}`}
                >
                  <div className="diary-item-main">
                    <p className="diary-item-date">
                      💳 {t.category || '현금'}
                      {t.installment > 0 ? ` · ${installmentLabel(t.installment)}` : ''}
                      {' · '}
                      {formatEntryDate(t.tx_date)}
                    </p>
                    <p className="diary-item-content">
                      <span className="tx-amount-out">
                        -{won(Number(t.amount))}원
                      </span>
                      {t.memo ? ` · ${t.memo}` : ''}
                    </p>
                  </div>
                  <div className="diary-item-actions">
                    <button
                      className="diary-edit-btn"
                      onClick={() => startEdit(t)}
                      aria-label="기록 수정"
                    >
                      수정
                    </button>
                    <button
                      className="diary-delete-btn"
                      onClick={() => setConfirmTarget(t)}
                      aria-label="기록 삭제"
                    >
                      삭제
                    </button>
                  </div>
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
              -{won(Number(confirmTarget.amount))}원 · {confirmTarget.category}
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
