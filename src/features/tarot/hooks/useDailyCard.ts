// ─────────────────────────────────────────────
// useDailyCard — 오늘의 '하루 한 장' 조회/추첨/기록 훅
//
// 동작 (명세 5.4):
//  1. KST 오늘 날짜 산출
//  2. daily_cards에서 오늘 레코드 조회
//  3. 있으면 → 이미 뽑음 상태로 렌더
//  4. 없으면 → 뒷면 노출, 뽑기 대기
//  5. 뽑기 시 → 결정론적 계산 후 insert
//  6. insert가 unique 위반(23505)이면 에러 아님. 재조회해서 기존 값 표시
// ─────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { drawDailyCard, getKstDateKey, clampPromptIndex } from '../lib/draw'
import type { DrawResult } from '../lib/draw'
import {
  fetchDailyCard,
  insertDailyCard,
  UNIQUE_VIOLATION,
} from '../lib/store'
import { getCardById } from '../lib/cards'

// 화면이 알아야 할 상태
export type DailyCardState = {
  loading: boolean // 처음 조회 중
  drawing: boolean // 뽑는 중(애니메이션 포함)
  drawn: boolean // 오늘 카드를 이미(또는 방금) 뽑았는가
  result: DrawResult | null // 오늘 카드 값
  dateKey: string // 오늘 날짜(KST)
  saveWarning: boolean // 카드는 보이지만 서버 저장이 안 된 경우(오프라인 등)
  error: string
}

type Err = { code?: string }

export function useDailyCard(userId: string) {
  const [dateKey, setDateKey] = useState(() => getKstDateKey())
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [saveWarning, setSaveWarning] = useState(false)
  const [error, setError] = useState('')

  // 서버 레코드를 오늘 상태로 반영 (prompt_index는 카드 질문 수에 맞춰 clamp)
  const applyRow = useCallback(
    (row: { card_id: number; is_reversed: boolean; prompt_index: number }) => {
      const count = getCardById(row.card_id).prompts.length
      setResult({
        cardId: row.card_id,
        isReversed: row.is_reversed,
        promptIndex: clampPromptIndex(row.prompt_index, count),
      })
      setDrawn(true)
    },
    [],
  )

  // 오늘 이미 뽑았는지 확인
  useEffect(() => {
    let alive = true
    // 자정을 넘겼을 수 있으니 날짜 키를 다시 계산
    const today = getKstDateKey()
    setDateKey(today)
    setLoading(true)
    setError('')
    fetchDailyCard(today)
      .then((row) => {
        if (!alive) return
        if (row) applyRow(row)
      })
      .catch(() => {
        // 조회 실패(네트워크 등)는 치명적이지 않음: 뽑기 화면을 보여줍니다.
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [userId, applyRow])

  // 오늘의 카드 뽑기
  const draw = useCallback(async () => {
    if (drawn || drawing) return
    setDrawing(true)
    setError('')
    setSaveWarning(false)

    const today = getKstDateKey()
    // 카드 값은 결정론적으로 '먼저' 정해집니다. (서버와 무관)
    const computed = drawDailyCard(userId, today)

    // 뒤집기 애니메이션을 위한 짧은 연출
    await new Promise((r) => setTimeout(r, 900))
    setResult(computed)
    setDrawn(true)

    // 서버에 '뽑았다는 사실' 기록 (best-effort)
    try {
      await insertDailyCard(userId, today, computed)
    } catch (e) {
      const code = (e as Err)?.code
      if (code === UNIQUE_VIOLATION) {
        // 이미 뽑은 날: 에러 아님. 서버 기존 값으로 맞춰줍니다.
        try {
          const row = await fetchDailyCard(today)
          if (row) applyRow(row)
        } catch {
          // 재조회 실패해도 계산된 카드(동일 값)를 그대로 보여줍니다.
        }
      } else {
        // 오프라인·테이블 미설정 등: 카드는 보이되 저장은 안 됨을 알립니다.
        setSaveWarning(true)
      }
    } finally {
      setDrawing(false)
    }
  }, [userId, drawn, drawing, applyRow])

  const state: DailyCardState = {
    loading,
    drawing,
    drawn,
    result,
    dateKey,
    saveWarning,
    error,
  }
  return { state, draw }
}
