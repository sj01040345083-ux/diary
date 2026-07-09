// 소비/수입 기록을 Supabase에 저장하고 불러오는 도구입니다.
import { supabase } from './supabase'

export type TxType = 'income' | 'expense'

export type Transaction = {
  id: string
  type: TxType
  amount: number
  category: string | null
  memo: string | null
  tx_date: string
  created_at: string
}

export type NewTransaction = {
  type: TxType
  amount: number
  category: string | null
  memo: string | null
  tx_date: string
}

export async function getMyTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, amount, category, memo, tx_date, created_at')
    .order('tx_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addTransaction(
  userId: string,
  t: NewTransaction,
): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    type: t.type,
    amount: t.amount,
    category: t.category,
    memo: t.memo,
    tx_date: t.tx_date,
  })
  if (error) throw error
}

// 기존 기록을 수정합니다. (id 로 찾아 내용을 통째로 업데이트)
export async function updateTransaction(
  id: string,
  t: NewTransaction,
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      type: t.type,
      amount: t.amount,
      category: t.category,
      memo: t.memo,
      tx_date: t.tx_date,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
