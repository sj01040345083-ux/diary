// 일기를 Supabase에 저장하고 불러오는 도구 모음입니다.
import { supabase } from './supabase'

export type Diary = {
  id: string
  user_id: string
  entry_date: string // "2026-07-05" 형식
  content: string
  mood: string | null // 그날의 기분 이모지 (없으면 null)
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

// 특정 날짜의 일기들을 가져옵니다. (같은 날 여러 개일 수 있음)
export async function getDiariesByDate(date: string): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('entry_date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// id로 일기 하나를 가져옵니다. (수정 화면에서 사용)
export async function getDiaryById(id: string): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

// 일기 하나를 삭제합니다. (보안 규칙 덕분에 내 일기만 지워집니다)
export async function deleteDiary(id: string): Promise<void> {
  const { error } = await supabase.from('diaries').delete().eq('id', id)
  if (error) throw error
}

// 새 일기를 추가합니다. (같은 날에도 별도 일기로 저장 → id를 돌려줍니다)
export async function createDiary(
  userId: string,
  entryDate: string,
  content: string,
  mood: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from('diaries')
    .insert({ user_id: userId, entry_date: entryDate, content, mood })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

// 기존 일기(id)를 수정합니다.
export async function updateDiaryById(
  id: string,
  content: string,
  mood: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('diaries')
    .update({ content, mood, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
