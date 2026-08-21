// 매일 아침 뉴스 브리핑 - 수집 + 요약 서버 함수 (Vercel 무료 서버리스 함수)
// 1) 구글 뉴스 RSS(무료)에서 업종 전반+보유종목 / 주요뉴스 / 문화연예 기사(제목+링크)를 모으고
// 2) 요청 헤더로 받은 제미나이 열쇠가 있으면 서버에서 요약해 돌려줍니다.
//    (열쇠는 앱 설정에서 사용자가 넣은 값을 그때그때 헤더로 전달 — 서버에 저장하지 않음)
//    브라우저에서 구글 AI를 직접 부를 때 생기는 CORS 문제를 피하려고 서버가 대신 호출합니다.

export const config = { maxDuration: 30 }

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

const GEMINI_MODEL = 'gemini-2.0-flash'

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

function fallbackBriefing(sectors, mainNews, culture) {
  const outSectors = []
  for (const s of sectors) {
    if (s.articles.length) {
      outSectors.push({
        name: s.name,
        body: s.articles[0].title,
        impact: '',
        impactReason: '',
        link: s.articles[0].link,
      })
    }
  }
  return {
    sectors: outSectors,
    mainNews: mainNews.slice(0, 4).map((a) => ({ body: a.title, link: a.link })),
    culture: culture.slice(0, 3).map((a) => ({ body: a.title, link: a.link })),
  }
}

async function summarize(apiKey, sectors, mainNews, culture) {
  const linkById = {}
  const lines = ['[업종별 최근 기사 제목]']
  sectors.forEach((s, si) => {
    if (!s.articles.length) return
    lines.push(`## ${s.name} (보유: ${s.holdings.join(', ')})`)
    s.articles.forEach((a, j) => {
      const id = `S${si}#${j}`
      linkById[id] = a.link
      lines.push(`  - (${id}) ${a.title}`)
    })
  })
  lines.push('[오늘의 주요 뉴스 후보]')
  mainNews.forEach((a, j) => {
    const id = `M#${j}`
    linkById[id] = a.link
    lines.push(`- (${id}) ${a.title}`)
  })
  lines.push('[문화·연예 후보]')
  culture.forEach((a, j) => {
    const id = `C#${j}`
    linkById[id] = a.link
    lines.push(`- (${id}) ${a.title}`)
  })

  const prompt = `너는 아침 뉴스 브리핑 편집자야. 아래는 오늘의 한국 뉴스 기사 제목 모음이야. 이걸 바탕으로 스마트폰 한 화면 분량의 브리핑을 한국어로 만들어.

${lines.join('\n')}

[1. sectors — 업종별 이슈]
- 5개 업종(반도체 / IT·플랫폼 / 2차전지·에너지 / 자동차·건설 / 바이오·뷰티) 중, 오늘 '시장에 영향을 주는 이슈'가 있는 업종만 골라(없으면 빼). 업종당 1~2개.
- 업종 전반 뉴스(수출 규제, 업황, 정책, 유가, 환율 등)를 우선하고, 보유종목이 관련되면 함께 언급해.
- 개별 기업의 사소한 뉴스(전시회, 행사, 개인전 등)는 제외.
- 각 항목: name(업종명), body(무슨 일인지 2~3문장으로 풀어서 요약, 기사 제목 복사 금지), impact("호재"/"악재"/"중립"), impactReason(이유 한 줄), articleId(근거 기사 id 예: S0#2).

[2. mainNews — 오늘의 주요 뉴스 3~4개]
- 시사·경제(금리·환율·정책)·사회에서 오늘 꼭 알아야 할 것. 추측성·미확인 소문 제외, 사실만.
- 각 항목: body(2~3문장 요약), articleId(예: M#1).

[3. culture — 문화·연예 2~3개]
- 영화·연예계 화제. 각 항목: body(한두 줄), articleId(예: C#0).

전체 규칙: 이슈 없으면 억지로 채우지 마. 제목만 있고 본문은 없으니 제목에서 확인되는 사실만 쓰고 지어내지 마.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`,
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
              sectors: {
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
              mainNews: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    body: { type: 'string' },
                    articleId: { type: 'string' },
                  },
                  required: ['body', 'articleId'],
                },
              },
              culture: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    body: { type: 'string' },
                    articleId: { type: 'string' },
                  },
                  required: ['body', 'articleId'],
                },
              },
            },
            required: ['sectors', 'mainNews', 'culture'],
          },
        },
      }),
    },
  )
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`제미나이 오류 ${res.status}${t ? ' · ' + t.slice(0, 120) : ''}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('제미나이가 빈 응답을 보냈어요')
  const parsed = JSON.parse(text)

  const resolveSector = (s) => {
    let link = linkById[s.articleId] || ''
    if (!link) {
      const rs = sectors.find((x) => x.name === s.name)
      link = rs && rs.articles[0] ? rs.articles[0].link : ''
    }
    return {
      name: s.name,
      body: s.body,
      impact: s.impact,
      impactReason: s.impactReason,
      link,
    }
  }
  return {
    sectors: (parsed.sectors || []).map(resolveSector),
    mainNews: (parsed.mainNews || []).map((m) => ({
      body: m.body,
      link: linkById[m.articleId] || '',
    })),
    culture: (parsed.culture || []).map((c) => ({
      body: c.body,
      link: linkById[c.articleId] || '',
    })),
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
  const mainNews = [...mainEcon, ...mainSociety]
  const date = new Date().toISOString()

  // 개인 열쇠가 담겨 오므로 캐시하지 않습니다.
  res.setHeader('Cache-Control', 'no-store')

  const apiKey = req.headers['x-gemini-key']
  if (apiKey) {
    try {
      const b = await summarize(apiKey, sectors, mainNews, culture)
      return res.status(200).json({ date, mode: 'ai', ...b })
    } catch (e) {
      return res.status(200).json({
        date,
        mode: 'simple',
        ...fallbackBriefing(sectors, mainNews, culture),
        aiError: String((e && e.message) || e),
      })
    }
  }
  res
    .status(200)
    .json({ date, mode: 'simple', ...fallbackBriefing(sectors, mainNews, culture) })
}
