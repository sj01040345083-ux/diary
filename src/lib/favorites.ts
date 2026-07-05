// 명언 즐겨찾기를 Supabase에 저장하고 불러오는 도구입니다.
import { supabase } from './supabase'

export type FavoriteQuote = {
  id: string
  quote_id: number
  text: string
  author: string | null
  created_at: string
}

export async function getMyFavorites(): Promise<FavoriteQuote[]> {
  const { data, error } = await supabase
    .from('favorite_quotes')
    .select('id, quote_id, text, author, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// 특정 명언이 이미 즐겨찾기 되어 있는지 확인
export async function isFavorited(quoteId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorite_quotes')
    .select('id')
    .eq('quote_id', quoteId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

export async function addFavorite(
  userId: string,
  quote: { id: number; text: string; author: string },
): Promise<void> {
  const { error } = await supabase.from('favorite_quotes').insert({
    user_id: userId,
    quote_id: quote.id,
    text: quote.text,
    author: quote.author,
  })
  if (error) throw error
}

// 명언 id 로 즐겨찾기 해제 (오늘의 명언 카드의 하트용)
export async function removeFavoriteByQuoteId(quoteId: number): Promise<void> {
  const { error } = await supabase
    .from('favorite_quotes')
    .delete()
    .eq('quote_id', quoteId)
  if (error) throw error
}

// 즐겨찾기 행 id 로 삭제 (모음 화면용)
export async function removeFavorite(id: string): Promise<void> {
  const { error } = await supabase.from('favorite_quotes').delete().eq('id', id)
  if (error) throw error
}
