// 감사일기를 Supabase에 저장하고 불러오는 도구입니다.
import { supabase } from './supabase'

export type Gratitude = {
  id: string
  content: string
  created_at: string
}

// 내 감사 기록을 최신순으로 가져옵니다. (보안 규칙 덕분에 내 것만 옵니다)
export async function getMyGratitude(): Promise<Gratitude[]> {
  const { data, error } = await supabase
    .from('gratitude')
    .select('id, content, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// 감사 기록 하나를 추가합니다. (감사일기는 하루에 여러 개 쌓을 수 있어요)
export async function addGratitude(userId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('gratitude')
    .insert({ user_id: userId, content })
  if (error) throw error
}

// 감사 기록 하나를 삭제합니다.
export async function deleteGratitude(id: string): Promise<void> {
  const { error } = await supabase.from('gratitude').delete().eq('id', id)
  if (error) throw error
}
