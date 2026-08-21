// 아침 뉴스 브리핑 데이터.
// 1) 서버 함수(/api/news)에서 원본 기사(제목+링크)를 받아오고,
// 2) 내 기기에 저장된 제미나이 열쇠가 있으면 브라우저에서 직접 요약합니다.

export type Article = { title: string; link: string }
export type CompanyNews = { name: string; articles: Article[] }

export type RawNews = {
  date: string
  companies: CompanyNews[]
  entertainment: Article[]
  essentials: Article[]
}

export type StockItem = {
  name: string
  body: string
  impact: '' | '호재' | '악재' | '중립'
  impactReason: string
  link: string
}

export type Briefing = {
  mode: 'ai' | 'simple'
  stocks: StockItem[]
  entertainment: string[]
  essentials: string[]
}

const COMPANY_NAMES = [
  '삼성전자',
  'SK하이닉스',
  '한미반도체',
  '네이버',
  '카카오',
  '삼성SDI',
  'OCI홀딩스',
  '현대차',
  '현대건설',
  '유한양행',
  '아모레퍼시픽',
]

const GEMINI_MODEL = 'gemini-2.0-flash'

export async function getRawNews(): Promise<RawNews> {
  const res = await fetch('/api/news', { cache: 'no-store' })
  if (!res.ok) throw new Error('news fetch failed')
  return (await res.json()) as RawNews
}

// 열쇠가 없거나 요약 실패 시: 헤드라인만 묶어 같은 형식으로 (영향·요약 없음)
export function fallbackBriefing(raw: RawNews): Briefing {
  const stocks: StockItem[] = []
  for (const c of raw.companies) {
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
    mode: 'simple',
    stocks,
    entertainment: raw.entertainment.slice(0, 3).map((a) => a.title),
    essentials: raw.essentials.slice(0, 2).map((a) => a.title),
  }
}

// 제미나이(무료)로 요약 — 브라우저에서 사용자 개인 열쇠로 직접 호출합니다.
export async function summarizeBriefing(
  raw: RawNews,
  apiKey: string,
): Promise<Briefing> {
  // AI에게 줄 기사 목록 + id→링크 매핑표
  const linkById: Record<string, string> = {}
  const lines: string[] = ['[관심 기업별 최근 기사 제목]']
  for (const c of raw.companies) {
    if (!c.articles.length) continue
    lines.push(`## ${c.name}`)
    c.articles.forEach((a, idx) => {
      const id = `${c.name}#${idx}`
      linkById[id] = a.link
      lines.push(`  - (${id}) ${a.title}`)
    })
  }
  lines.push('[연예 기사 제목]')
  raw.entertainment.forEach((a) => lines.push(`- ${a.title}`))
  lines.push('[정책·경제·생활 기사 제목]')
  raw.essentials.forEach((a) => lines.push(`- ${a.title}`))

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
                  required: [
                    'name',
                    'body',
                    'impact',
                    'impactReason',
                    'articleId',
                  ],
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
  const parsed = JSON.parse(text) as {
    stocks: {
      name: string
      body: string
      impact: '호재' | '악재' | '중립'
      impactReason: string
      articleId: string
    }[]
    entertainment: string[]
    essentials: string[]
  }

  const stocks: StockItem[] = (parsed.stocks || []).map((s) => {
    let link = linkById[s.articleId] || ''
    if (!link) {
      const c = raw.companies.find((x) => x.name === s.name)
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
    mode: 'ai',
    stocks,
    entertainment: parsed.entertainment || [],
    essentials: parsed.essentials || [],
  }
}

export const NEWS_COMPANIES = COMPANY_NAMES
