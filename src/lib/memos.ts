// 월별 메모 기록장 — 메모를 Supabase에 저장하고 불러옵니다.
// 서버(memos 표)가 아직 준비되지 않았어도 메모가 사라지지 않도록,
// 서버 저장이 안 되면 '이 기기(localStorage)'에 먼저 저장해 둡니다.
// 나중에 서버 표가 준비되면, 불러올 때 자동으로 서버로 옮겨줍니다.
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

const SELECT = 'id, title, content, memo_date, created_at'

// ── 이 기기 임시 저장(localStorage) 도우미 ──
const lsKey = (uid: string) => `soso-memos-${uid}`

function lsRead(uid: string): Memo[] {
  try {
    const raw = localStorage.getItem(lsKey(uid))
    return raw ? (JSON.parse(raw) as Memo[]) : []
  } catch {
    return []
  }
}

function lsWrite(uid: string, list: Memo[]): void {
  try {
    localStorage.setItem(lsKey(uid), JSON.stringify(list))
  } catch {
    // 저장 공간이 없으면 조용히 무시
  }
}

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `local-${Date.now()}-${Math.round(Math.random() * 1e6)}`
  }
}

function sortMemos(list: Memo[]): Memo[] {
  return [...list].sort(
    (a, b) =>
      b.memo_date.localeCompare(a.memo_date) ||
      b.created_at.localeCompare(a.created_at),
  )
}

async function fetchFromServer(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select(SELECT)
    .order('memo_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// 내 메모 전체 (최근 날짜가 위로)
export async function getMyMemos(userId: string): Promise<Memo[]> {
  try {
    const server = await fetchFromServer()
    // 서버 연결 성공 → 이 기기에 임시로 쌓여 있던 메모가 있으면 서버로 옮깁니다(1회).
    const local = lsRead(userId)
    if (local.length > 0) {
      try {
        for (const m of local) {
          await supabase.from('memos').insert({
            user_id: userId,
            title: m.title,
            content: m.content,
            memo_date: m.memo_date,
          })
        }
        lsWrite(userId, []) // 옮겼으니 이 기기 임시본은 비웁니다.
        return await fetchFromServer()
      } catch {
        // 옮기기에 실패하면 다음에 다시 시도 (지금은 서버+로컬을 합쳐 보여줌)
        return sortMemos([...server, ...local])
      }
    }
    return server
  } catch {
    // 서버(표)가 아직 없거나 오류 → 이 기기 저장분을 보여줍니다.
    return sortMemos(lsRead(userId))
  }
}

export async function addMemo(userId: string, m: NewMemo): Promise<void> {
  const memo_date = m.memo_date || todayString()
  try {
    const { error } = await supabase.from('memos').insert({
      user_id: userId,
      title: m.title,
      content: m.content,
      memo_date,
    })
    if (error) throw error
  } catch {
    // 서버 저장 실패 → 이 기기에 저장 (사라지지 않게)
    const list = lsRead(userId)
    list.push({
      id: newId(),
      title: m.title,
      content: m.content,
      memo_date,
      created_at: new Date().toISOString(),
    })
    lsWrite(userId, list)
  }
}

export async function updateMemo(
  userId: string,
  id: string,
  m: NewMemo,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('memos')
      .update({ title: m.title, content: m.content, memo_date: m.memo_date })
      .eq('id', id)
    if (error) throw error
  } catch {
    const list = lsRead(userId).map((x) =>
      x.id === id ? { ...x, ...m } : x,
    )
    lsWrite(userId, list)
  }
}

export async function deleteMemo(userId: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from('memos').delete().eq('id', id)
    if (error) throw error
  } catch {
    lsWrite(
      userId,
      lsRead(userId).filter((x) => x.id !== id),
    )
  }
}
