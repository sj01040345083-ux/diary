// 아침 뉴스 브리핑 데이터.
// 1) 서버 함수(/api/news)에서 원본 기사(제목+링크)를 받아오고,
// 2) 내 기기에 저장된 제미나이 열쇠가 있으면 브라우저에서 직접 요약합니다.

export type Article = { title: string; link: string }
export type RawSector = { name: string; holdings: string[]; articles: Article[] }

export type RawNews = {
  date: string
  sectors: RawSector[]
  mainNews: Article[]
  culture: Article[]
}

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
  mode: 'ai' | 'simple'
  sectors: SectorItem[]
  mainNews: NewsItem[]
  culture: NewsItem[]
}

const GEMINI_MODEL = 'gemini-2.0-flash'

export async function getRawNews(): Promise<RawNews> {
  const res = await fetch('/api/news', { cache: 'no-store' })
  if (!res.ok) throw new Error('news fetch failed')
  return (await res.json()) as RawNews
}

// 열쇠가 없거나 요약 실패 시: 헤드라인만 묶어 같은 형식으로 (영향·요약 없음)
export function fallbackBriefing(raw: RawNews): Briefing {
  const sectors: SectorItem[] = []
  for (const s of raw.sectors) {
    if (s.articles.length) {
      sectors.push({
        name: s.name,
        body: s.articles[0].title,
        impact: '',
        impactReason: '',
        link: s.articles[0].link,
      })
    }
  }
  return {
    mode: 'simple',
    sectors,
    mainNews: raw.mainNews.slice(0, 4).map((a) => ({
      body: a.title,
      link: a.link,
    })),
    culture: raw.culture.slice(0, 3).map((a) => ({
      body: a.title,
      link: a.link,
    })),
  }
}

// 제미나이(무료)로 요약 — 브라우저에서 사용자 개인 열쇠로 직접 호출합니다.
export async function summarizeBriefing(
  raw: RawNews,
  apiKey: string,
): Promise<Briefing> {
  // AI에게 줄 기사 목록 + id→링크 매핑표
  const linkById: Record<string, string> = {}
  const lines: string[] = ['[업종별 최근 기사 제목]']
  raw.sectors.forEach((s, si) => {
    if (!s.articles.length) return
    lines.push(`## ${s.name} (보유: ${s.holdings.join(', ')})`)
    s.articles.forEach((a, j) => {
      const id = `S${si}#${j}`
      linkById[id] = a.link
      lines.push(`  - (${id}) ${a.title}`)
    })
  })
  lines.push('[오늘의 주요 뉴스 후보]')
  raw.mainNews.forEach((a, j) => {
    const id = `M#${j}`
    linkById[id] = a.link
    lines.push(`- (${id}) ${a.title}`)
  })
  lines.push('[문화·연예 후보]')
  raw.culture.forEach((a, j) => {
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
- 각 항목:
  - name: 업종명
  - body: 무슨 일인지 2~3문장으로 풀어서 요약(기사 제목 복사 금지).
  - impact: 시장 영향. 반드시 "호재" / "악재" / "중립" 중 하나.
  - impactReason: 그렇게 본 이유 한 줄.
  - articleId: 근거가 된 대표 기사 1개의 id(예: S0#2).

[2. mainNews — 오늘의 주요 뉴스 3~4개]
- 시사·경제(금리·환율·정책)·사회에서 오늘 꼭 알아야 할 것. 추측성·미확인 소문은 제외, 사실 확인된 것만.
- 각 항목: body(2~3문장 요약), articleId(대표 기사 id, 예: M#1).

[3. culture — 문화·연예 2~3개]
- 영화·연예계 화제 소식. 각 항목: body(한두 줄), articleId(예: C#0).

전체 규칙: 이슈 없으면 억지로 채우지 마. 제목만 있고 본문은 없으니 제목에서 확인되는 사실만 쓰고 지어내지 마.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
                  required: [
                    'name',
                    'body',
                    'impact',
                    'impactReason',
                    'articleId',
                  ],
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
  if (!res.ok) throw new Error(`gemini ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('gemini empty')
  const parsed = JSON.parse(text) as {
    sectors: {
      name: string
      body: string
      impact: '호재' | '악재' | '중립'
      impactReason: string
      articleId: string
    }[]
    mainNews: { body: string; articleId: string }[]
    culture: { body: string; articleId: string }[]
  }

  const sectors: SectorItem[] = (parsed.sectors || []).map((s) => {
    let link = linkById[s.articleId] || ''
    if (!link) {
      const rs = raw.sectors.find((x) => x.name === s.name)
      link = rs && rs.articles[0] ? rs.articles[0].link : ''
    }
    return {
      name: s.name,
      body: s.body,
      impact: s.impact,
      impactReason: s.impactReason,
      link,
    }
  })
  const mainNews: NewsItem[] = (parsed.mainNews || []).map((m) => ({
    body: m.body,
    link: linkById[m.articleId] || '',
  }))
  const culture: NewsItem[] = (parsed.culture || []).map((c) => ({
    body: c.body,
    link: linkById[c.articleId] || '',
  }))

  return { mode: 'ai', sectors, mainNews, culture }
}
