// 월별 메모 기록장 — 메모를 Supabase에 저장하고 불러옵니다.
// (일기·가계부와 같은 방식: 로그인한 내 것만 보이고, 내 것만 저장/수정/삭제됩니다)
import { supabase } from './supabase'
import { todayString } from './diaries'

export type Memo = {
  id: string
  title: string
  content: string
  memo_date: string // YYYY-MM-DD (메모를 남긴 날짜)
  created_at: string
}

export type NewMemo = {
  title: string
  content: string
  memo_date: string
}

// 내 메모 전체 (최근 날짜가 위로)
export async function getMyMemos(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('id, title, content, memo_date, created_at')
    .order('memo_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addMemo(userId: string, m: NewMemo): Promise<void> {
  const { error } = await supabase.from('memos').insert({
    user_id: userId,
    title: m.title,
    content: m.content,
    memo_date: m.memo_date || todayString(),
  })
  if (error) throw error
}

export async function updateMemo(id: string, m: NewMemo): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .update({
      title: m.title,
      content: m.content,
      memo_date: m.memo_date,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase.from('memos').delete().eq('id', id)
  if (error) throw error
}
