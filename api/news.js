// 매일 아침 뉴스 브리핑 (Vercel 무료 서버리스 함수)
// 1) 구글 뉴스 RSS(무료)에서 관심 기업·연예·정책 기사(제목+링크)를 모으고
// 2) 구글 제미나이(무료 등급)로 종목별 2~3문장 요약 + 영향 + 대표 기사로 정리해 JSON으로 돌려줍니다.
// 링크는 AI가 지어내지 못하도록, AI가 고른 기사 id를 서버에서 실제 URL로 바꿔 붙입니다.
// GEMINI_API_KEY 가 없으면 요약 없이 헤드라인만 묶어 돌려줍니다(자동 대체).

export const config = { maxDuration: 30 }

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

// ── 제미나이 요약 ──
async function summarizeWithGemini(apiKey, companyNews, entNews, essNews) {
  // AI에게 줄 기사 목록 + id→링크 매핑표
  const linkById = {}
  const lines = ['[관심 기업별 최근 기사 제목]']
  for (const c of companyNews) {
    if (!c.articles.length) continue
    lines.push(`## ${c.name}`)
    c.articles.forEach((a, idx) => {
      const id = `${c.name}#${idx}`
      linkById[id] = a.link
      lines.push(`  - (${id}) ${a.title}`)
    })
  }
  lines.push('[연예 기사 제목]')
  entNews.forEach((a) => lines.push(`- ${a.title}`))
  lines.push('[정책·경제·생활 기사 제목]')
  essNews.forEach((a) => lines.push(`- ${a.title}`))

  const prompt = `너는 아침 주식·뉴스 브리핑 편집자야. 아래는 오늘의 한국 뉴스 기사 제목 모음이야. 이걸 바탕으로 스마트폰 한 화면 분량의 브리핑을 한국어로 만들어.

${lines.join('\n')}

[stocks 작성 규칙]
- 뉴스가 있는 관심 기업 중, 오늘 주가에 영향이 클 3~5개만 골라.
- 각 항목:
  - name: 종목명
  - body: 무슨 일이 있었는지 2~3문장으로 풀어서 요약. 기사 제목을 그대로 복사하지 말고 내용을 설명하듯 써.
  - impact: 주가 영향 방향. 반드시 "호재" / "악재" / "중립" 중 하나.
  - impactReason: 그렇게 본 이유 한 줄.
  - articleId: 위 목록에서 그 종목의 가장 중요한 기사 1개의 id(예: 삼성전자#0)를 그대로.
- 제목만 있고 본문은 없으니, 제목에서 확인되는 사실만 쓰고 구체 수치 등은 지어내지 마.

[entertainment 규칙] 가장 화제된 이슈 2~3개를 각각 한 줄로 요약(제목 복사 금지).
[essentials 규칙] 정책·경제지표·생활에 영향 주는 것 1~2개를 각각 한 줄로.`

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
                    name: { type: 'string' },
                    body: { type: 'string' },
                    impact: { type: 'string', enum: ['호재', '악재', '중립'] },
                    impactReason: { type: 'string' },
                    articleId: { type: 'string' },
                  },
                  required: ['name', 'body', 'impact', 'impactReason', 'articleId'],
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
  const parsed = JSON.parse(text)

  // articleId → 실제 링크로 변환 (AI가 지어낸 링크 방지)
  const stocks = (parsed.stocks || []).map((s) => {
    let link = linkById[s.articleId] || ''
    if (!link) {
      // id가 어긋나면 같은 종목의 첫 기사로 대체
      const c = companyNews.find((x) => x.name === s.name)
      link = c && c.articles[0] ? c.articles[0].link : ''
    }
    return {
      name: s.name,
      body: s.body,
      impact: s.impact,
      impactReason: s.impactReason,
      link,
    }
  })
  return {
    stocks,
    entertainment: parsed.entertainment || [],
    essentials: parsed.essentials || [],
  }
}

// AI가 없을 때: 헤드라인만 묶어 같은 형식으로 (영향/요약 없음)
function fallbackBriefing(companyNews, entNews, essNews) {
  const stocks = []
  for (const c of companyNews) {
    if (c.articles.length && stocks.length < 5) {
      stocks.push({
        name: c.name,
        body: c.articles[0].title,
        impact: '',
        impactReason: '',
        link: c.articles[0].link,
      })
    }
  }
  return {
    stocks,
    entertainment: entNews.slice(0, 3).map((a) => a.title),
    essentials: essNews.slice(0, 2).map((a) => a.title),
  }
}

export default async function handler(req, res) {
  const [companyNews, entNews, essNews] = await Promise.all([
    Promise.all(
      COMPANIES.map(async (name) => ({
        name,
        articles: await fetchArticles(name, 3),
      })),
    ),
    fetchArticles('연예', 6),
    fetchArticles('경제 정책 금리 물가 부동산', 5),
  ])

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
