// ─────────────────────────────────────────────
// daily_cards 테이블 읽기/쓰기 (Supabase)
// ─────────────────────────────────────────────

import { supabase } from '../../../lib/supabase'
import type { DrawResult } from './draw'

// daily_cards 한 줄
export type DailyCardRow = {
  id: string
  user_id: string
  date: string // 'YYYY-MM-DD'
  card_id: number
  is_reversed: boolean
  prompt_index: number
  drawn_at: string
}

// unique 위반(같은 날 이미 뽑음) 에러 코드
export const UNIQUE_VIOLATION = '23505'

// 특정 날짜에 이미 뽑은 카드가 있는지 조회합니다. (없으면 null)
export async function fetchDailyCard(
  dateKey: string,
): Promise<DailyCardRow | null> {
  const { data, error } = await supabase
    .from('daily_cards')
    .select('*')
    .eq('date', dateKey)
    .maybeSingle()
  if (error) throw error
  return data
}

// 오늘 카드를 기록합니다.
// 이미 뽑은 날이면 DB의 unique 제약이 막아 줍니다(23505). → 호출부에서 재조회 처리.
export async function insertDailyCard(
  userId: string,
  dateKey: string,
  draw: DrawResult,
): Promise<DailyCardRow> {
  const { data, error } = await supabase
    .from('daily_cards')
    .insert({
      user_id: userId,
      date: dateKey,
      card_id: draw.cardId,
      is_reversed: draw.isReversed,
      prompt_index: draw.promptIndex,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}
