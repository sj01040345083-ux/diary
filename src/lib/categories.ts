// 사용자가 직접 만든 소비/수입 카테고리를 Supabase에 저장하고 불러옵니다.
import { supabase } from './supabase'

export type Category = {
  id: string
  type: 'income' | 'expense'
  name: string
}

// 내가 만든 카테고리 전체 (지출·수입 모두)
export async function getMyCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, type, name')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addCategory(
  userId: string,
  type: 'income' | 'expense',
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .insert({ user_id: userId, type, name })
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
