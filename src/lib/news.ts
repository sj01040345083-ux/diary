// 아침 뉴스 브리핑 데이터.
// 서버 함수(/api/news)가 뉴스 수집 + (열쇠가 있으면) 요약까지 해서 돌려줍니다.
// 열쇠는 내 기기에 저장된 값을 요청 헤더로만 잠깐 전달합니다(서버에 저장 안 함).

export type Impact = '' | '호재' | '악재' | '중립'
export type SectorItem = {
  name: string
  body: string
  impact: Impact
  impactReason: string
  link: string
}
export type NewsItem = { body: string; link: string }

export type Briefing = {
  date: string
  mode: 'ai' | 'simple'
  sectors: SectorItem[]
  mainNews: NewsItem[]
  culture: NewsItem[]
  aiError?: string // 열쇠가 있는데 요약이 실패했을 때 이유
}

export async function getBriefing(apiKey: string): Promise<Briefing> {
  const res = await fetch('/api/news', {
    cache: 'no-store',
    headers: apiKey ? { 'x-gemini-key': apiKey } : {},
  })
  if (!res.ok) throw new Error('news fetch failed')
  return (await res.json()) as Briefing
}
