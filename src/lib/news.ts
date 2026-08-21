// 아침 뉴스 브리핑 데이터 — 서버 함수(/api/news)에서 받아옵니다.
export type StockItem = {
  summary: string // 핵심 한 줄
  why: string // 왜 중요한지 한 줄 (없을 수 있음)
}

export type NewsBriefing = {
  date: string
  mode: 'ai' | 'simple' // ai = 제미나이 요약, simple = 헤드라인만
  stocks: StockItem[]
  entertainment: string[]
  essentials: string[]
}

export async function getNewsBriefing(): Promise<NewsBriefing> {
  const res = await fetch('/api/news', { cache: 'no-store' })
  if (!res.ok) throw new Error('news fetch failed')
  return (await res.json()) as NewsBriefing
}
