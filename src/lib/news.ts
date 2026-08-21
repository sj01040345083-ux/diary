// 아침 뉴스 브리핑 데이터 — 서버 함수(/api/news)에서 받아옵니다.
export type StockItem = {
  name: string // 종목명
  body: string // 무슨 일이 있었는지 2~3문장 요약
  impact: '' | '호재' | '악재' | '중립' // 주가 영향 (AI 모드에서만)
  impactReason: string // 그렇게 본 이유 한 줄
  link: string // 대표 기사 링크 1개
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
