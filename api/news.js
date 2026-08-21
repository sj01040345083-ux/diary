// 매일 아침 뉴스 브리핑 (Vercel 무료 서버리스 함수)
// 1) 구글 뉴스 RSS(무료)에서 관심 기업·연예·정책 헤드라인을 모으고
// 2) 구글 제미나이(무료 등급 API)로 '요약 브리핑' 형식으로 정리해 JSON으로 돌려줍니다.
// GEMINI_API_KEY 환경변수가 없으면, 요약 없이 헤드라인만 묶어 돌려줍니다(자동 대체).

export const config = { maxDuration: 30 }

// 관심 종목 (주식·기업 현황에서 최우선으로 다룰 기업)
const WATCH_GROUPS = [
  { group: '반도체', names: ['삼성전자', 'SK하이닉스', '한미반도체'] },
  { group: 'IT·플랫폼', names: ['네이버', '카카오'] },
  { group: '2차전지·에너지', names: ['삼성SDI', 'OCI홀딩스'] },
  { group: '자동차·건설', names: ['현대차', '현대건설'] },
  { group: '바이오·뷰티', names: ['유한양행', '아모레퍼시픽'] },
]
const COMPANIES = WATCH_GROUPS.flatMap((g) => g.names)

const GEMINI_MODEL = 'gemini-2.0-flash'

// ── RSS 파싱 ──
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

function parseTitles(xml, limit) {
  const out = []
  const parts = xml.split('<item>').slice(1)
  for (const part of parts) {
    const block = part.split('</item>')[0]
    const tm = block.match(/<title>([\s\S]*?)<\/title>/)
    const sm = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)
    if (!tm) continue
    let title = decodeText(tm[1])
    const source = sm ? decodeText(sm[1]) : ''
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim()
    }
    if (title) out.push(title)
    if (out.length >= limit) break
  }
  return out
}

async function fetchHeadlines(query, limit) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query,
    )}&hl=ko&gl=KR&ceid=KR:ko`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SosoDiary/1.0)' },
      signal: AbortSignal.timeout(7000),
    })
    if (!r.ok) return []
    return parseTitles(await r.text(), limit)
  } catch {
    return []
  }
}

// ── 제미나이 요약 ──
async function summarizeWithGemini(apiKey, companyNews, entNews, essNews) {
  const lines = ['[관심 기업 뉴스]']
  for (const c of companyNews) {
    if (c.titles.length) lines.push(`- ${c.name}: ${c.titles.join(' / ')}`)
  }
  lines.push('[연예]')
  entNews.forEach((t) => lines.push(`- ${t}`))
  lines.push('[정책·경제·생활]')
  essNews.forEach((t) => lines.push(`- ${t}`))

  const prompt = `너는 아침 뉴스 브리핑 편집자야. 아래 오늘의 한국 뉴스 헤드라인을 바탕으로 스마트폰 한 화면에 들어오는 짧은 브리핑을 한국어로 만들어.

${lines.join('\n')}

규칙:
- stocks: 오늘 주가에 영향을 줄 만한 기업 뉴스 3~5개. 관심 기업(${COMPANIES.join(', ')}) 관련을 최우선으로. 각 항목은 summary(핵심 한 줄), why(왜 중요한지 한 줄).
- entertainment: 가장 화제된 이슈 2~3개, 각각 한 줄.
- essentials: 정책·경제지표·생활에 영향 주는 것 1~2개, 각각 한 줄.
- 기사 제목을 그대로 나열하지 말고 핵심만 간결하게. 각 문장은 한 줄로 짧게.
- 출처나 링크는 쓰지 마.
- 헤드라인에 근거가 없는 내용은 지어내지 마. 근거가 부족하면 항목 수를 줄여도 돼.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              stocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    summary: { type: 'string' },
                    why: { type: 'string' },
                  },
                  required: ['summary', 'why'],
                },
              },
              entertainment: { type: 'array', items: { type: 'string' } },
              essentials: { type: 'array', items: { type: 'string' } },
            },
            required: ['stocks', 'entertainment', 'essentials'],
          },
        },
      }),
    },
  )
  if (!res.ok) throw new Error(`gemini ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('gemini empty')
  return JSON.parse(text)
}

// AI가 없을 때: 헤드라인만 묶어 같은 형식으로 (why는 비움)
function fallbackBriefing(companyNews, entNews, essNews) {
  const stocks = []
  for (const c of companyNews) {
    if (c.titles.length && stocks.length < 5) {
      stocks.push({ summary: `${c.name}: ${c.titles[0]}`, why: '' })
    }
  }
  return {
    stocks,
    entertainment: entNews.slice(0, 3),
    essentials: essNews.slice(0, 2),
  }
}

export default async function handler(req, res) {
  // 1) 헤드라인 수집 (관심 기업 + 연예 + 정책/경제)
  const [companyNews, entNews, essNews] = await Promise.all([
    Promise.all(
      COMPANIES.map(async (name) => ({
        name,
        titles: await fetchHeadlines(name, 2),
      })),
    ),
    fetchHeadlines('연예', 6),
    fetchHeadlines('경제 정책 금리 물가 부동산', 5),
  ])

  // 2) 요약 (키 있으면 제미나이, 없으면 헤드라인 묶음)
  const apiKey = process.env.GEMINI_API_KEY
  let briefing
  let mode = 'simple'
  if (apiKey) {
    try {
      briefing = await summarizeWithGemini(apiKey, companyNews, entNews, essNews)
      mode = 'ai'
    } catch {
      briefing = fallbackBriefing(companyNews, entNews, essNews)
    }
  } else {
    briefing = fallbackBriefing(companyNews, entNews, essNews)
  }

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
  res.status(200).json({ date: new Date().toISOString(), mode, ...briefing })
}
