// 아침 뉴스 브리핑 데이터 — 서버 함수(/api/news)에서 받아옵니다.
export type NewsItem = {
  title: string
  link: string
  pubDate: string
  source: string
}

export type NewsTopic = {
  key: string
  label: string
  items: NewsItem[]
}

export type NewsBriefing = {
  date: string
  topics: NewsTopic[]
}

export async function getNewsBriefing(): Promise<NewsBriefing> {
  const res = await fetch('/api/news', { cache: 'no-store' })
  if (!res.ok) throw new Error('news fetch failed')
  return (await res.json()) as NewsBriefing
}
