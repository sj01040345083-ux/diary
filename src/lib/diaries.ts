// 일기를 Supabase에 저장하고 불러오는 도구 모음입니다.
import { supabase } from './supabase'

export type Diary = {
  id: string
  user_id: string
  entry_date: string // "2026-07-05" 형식
  content: string
  mood: string | null // 오늘의 기분 이모지 (없으면 null)
  created_at: string
  updated_at: string
}

// 로컬(사용자 기기) 기준 오늘 날짜를 "2026-07-05" 형식으로 만듭니다.
export function todayString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 내 일기 전체를 최신 날짜순으로 가져옵니다. (보안 규칙 덕분에 내 것만 옵니다)
export async function getMyDiaries(): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('entry_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

// 오늘 이미 쓴 일기가 있으면 가져옵니다. (없으면 null)
export async function getTodayDiary(): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('entry_date', todayString())
    .maybeSingle()
  if (error) throw error
  return data
}

// 일기 하나를 삭제합니다. (보안 규칙 덕분에 내 일기만 지워집니다)
export async function deleteDiary(id: string): Promise<void> {
  const { error } = await supabase.from('diaries').delete().eq('id', id)
  if (error) throw error
}

// 오늘 일기를 저장합니다. (기분도 함께)
// 같은 날짜 일기가 이미 있으면 새로 쌓지 않고 기존 것을 수정합니다. (upsert)
export async function saveTodayDiary(
  userId: string,
  content: string,
  mood: string | null,
): Promise<void> {
  const { error } = await supabase.from('diaries').upsert(
    {
      user_id: userId,
      entry_date: todayString(),
      content,
      mood,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' },
  )
  if (error) throw error
}
