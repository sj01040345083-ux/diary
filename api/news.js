// 매일 아침 뉴스 브리핑 - 뉴스 수집 서버 함수 (Vercel 무료 서버리스 함수)
// 구글 뉴스 RSS(무료)에서 '업종 전반 + 보유종목' / 주요 뉴스 / 문화·연예 기사(제목+링크)를 모아 JSON으로 돌려줍니다.
// 요약(제미나이)은 브라우저에서 사용자 개인 열쇠로 직접 처리하므로, 이 함수에는 열쇠가 필요 없습니다.

export const config = { maxDuration: 30 }

// 업종별 검색어 (업종 전반 + 보유종목을 함께 검색)
const SECTORS = [
  {
    name: '반도체',
    holdings: ['삼성전자', 'SK하이닉스', '한미반도체'],
    query: '반도체 OR 삼성전자 OR SK하이닉스 OR 한미반도체',
  },
  {
    name: 'IT·플랫폼',
    holdings: ['네이버', '카카오'],
    query: '플랫폼 OR 네이버 OR 카카오',
  },
  {
    name: '2차전지·에너지',
    holdings: ['삼성SDI', 'OCI홀딩스'],
    query: '2차전지 OR 배터리 OR 삼성SDI OR OCI홀딩스',
  },
  {
    name: '자동차·건설',
    holdings: ['현대차', '현대건설'],
    query: '자동차 OR 건설 OR 현대차 OR 현대건설',
  },
  {
    name: '바이오·뷰티',
    holdings: ['유한양행', '아모레퍼시픽'],
    query: '바이오 OR 화장품 OR 유한양행 OR 아모레퍼시픽',
  },
]

function decodeText(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function parseItems(xml, limit) {
  const out = []
  const parts = xml.split('<item>').slice(1)
  for (const part of parts) {
    const block = part.split('</item>')[0]
    const tm = block.match(/<title>([\s\S]*?)<\/title>/)
    const lm = block.match(/<link>([\s\S]*?)<\/link>/)
    const sm = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)
    if (!tm) continue
    let title = decodeText(tm[1])
    const source = sm ? decodeText(sm[1]) : ''
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim()
    }
    const link = lm ? decodeText(lm[1]) : ''
    if (title) out.push({ title, link })
    if (out.length >= limit) break
  }
  return out
}

async function fetchArticles(query, limit) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query,
    )}&hl=ko&gl=KR&ceid=KR:ko`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SosoDiary/1.0)' },
      signal: AbortSignal.timeout(7000),
    })
    if (!r.ok) return []
    return parseItems(await r.text(), limit)
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  const [sectors, mainEcon, mainSociety, culture] = await Promise.all([
    Promise.all(
      SECTORS.map(async (s) => ({
        name: s.name,
        holdings: s.holdings,
        articles: await fetchArticles(s.query, 6),
      })),
    ),
    fetchArticles('경제 금리 환율 정책', 6),
    fetchArticles('사회 사건 정치', 5),
    fetchArticles('연예 OR 영화 OR 문화', 6),
  ])

  // 주요 뉴스는 경제/정책 + 사회/정치를 합쳐서 전달
  const mainNews = [...mainEcon, ...mainSociety]

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
  res
    .status(200)
    .json({ date: new Date().toISOString(), sectors, mainNews, culture })
}
