// 매일 아침 뉴스 브리핑용 서버 함수 (Vercel 무료 서버리스 함수)
// - 구글 뉴스 RSS(무료)에서 경제·사회·연예 주제의 최신 헤드라인을 받아 JSON으로 돌려줍니다.
// - 브라우저에서 직접 RSS를 받으면 CORS로 막히므로, 이 서버 함수가 대신 받아 넘깁니다.

const TOPICS = [
  { key: 'economy', label: '경제', q: '경제' },
  { key: 'society', label: '사회', q: '사회' },
  { key: 'entertainment', label: '연예', q: '연예' },
]

// XML/HTML 엔티티와 CDATA를 사람이 읽는 글자로 되돌립니다.
function decodeText(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '') // 혹시 남은 태그 제거
    .trim()
}

// RSS 문자열에서 기사 항목을 최대 limit개 뽑아냅니다.
function parseItems(xml, limit) {
  const items = []
  const parts = xml.split('<item>').slice(1)
  for (const part of parts) {
    const block = part.split('</item>')[0]
    const pick = (re) => {
      const m = block.match(re)
      return m ? decodeText(m[1]) : ''
    }
    let title = pick(/<title>([\s\S]*?)<\/title>/)
    const link = pick(/<link>([\s\S]*?)<\/link>/)
    const pubDate = pick(/<pubDate>([\s\S]*?)<\/pubDate>/)
    const source = pick(/<source[^>]*>([\s\S]*?)<\/source>/)
    // 구글 뉴스 제목은 "기사제목 - 언론사" 형태 → 뒤의 언론사 부분을 떼어냅니다.
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim()
    }
    if (title) items.push({ title, link, pubDate, source })
    if (items.length >= limit) break
  }
  return items
}

async function fetchTopic(t) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      t.q,
    )}&hl=ko&gl=KR&ceid=KR:ko`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SosoDiary/1.0)' },
    })
    if (!r.ok) return { key: t.key, label: t.label, items: [] }
    const xml = await r.text()
    return { key: t.key, label: t.label, items: parseItems(xml, 5) }
  } catch {
    return { key: t.key, label: t.label, items: [] }
  }
}

export default async function handler(req, res) {
  const topics = await Promise.all(TOPICS.map(fetchTopic))
  // Vercel 엣지에서 30분간 캐시 → 여러 사람이 열어도 빠르고 요청도 아낍니다.
  res.setHeader(
    'Cache-Control',
    's-maxage=1800, stale-while-revalidate=3600',
  )
  res.status(200).json({ date: new Date().toISOString(), topics })
}
