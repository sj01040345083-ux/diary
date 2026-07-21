// 규칙 기반 사주 해석 모듈.
// 계산된 사주(SajuResult)를 바탕으로 일간 성격, 오행 균형, 십신,
// 오늘의 운세 등을 사람이 읽을 수 있는 문장으로 풀어냅니다.
//
// ⚠️ 재미와 자기 성찰을 위한 참고용입니다. 절대적 예언이 아닙니다.

import { ELEMENTS, ELEMENT_INFO, STEMS, STEM_ELEMENT } from './data'
import type { SajuResult } from './engine'
import { tenGod, dayPillarOf } from './engine'

// ── 일간(日干) 10종 성격 프로필 ─────────────────────────────
// 일간은 사주에서 '나 자신'을 상징하는 가장 중요한 글자입니다.
export const DAY_MASTER_PROFILE: Record<
  string,
  { title: string; nature: string; strength: string; caution: string }
> = {
  갑: {
    title: '갑목(甲木) · 큰 나무',
    nature: '곧고 우직하며 리더십이 강합니다. 목표를 향해 위로 뻗어 나가려는 기상이 있어 개척과 시작에 능합니다.',
    strength: '추진력, 책임감, 정직함',
    caution: '융통성이 부족해 한번 정한 방향을 잘 굽히지 않습니다. 때로는 유연함이 필요합니다.',
  },
  을: {
    title: '을목(乙木) · 화초·덩굴',
    nature: '부드럽고 섬세하며 적응력이 뛰어납니다. 환경에 맞춰 유연하게 자라나며 끈기가 강합니다.',
    strength: '유연함, 친화력, 생활력',
    caution: '의존적이거나 우유부단해질 수 있습니다. 자기 중심을 지키는 연습이 도움이 됩니다.',
  },
  병: {
    title: '병화(丙火) · 태양',
    nature: '밝고 열정적이며 표현력이 풍부합니다. 주변을 환하게 밝히는 존재감으로 사람을 끌어당깁니다.',
    strength: '열정, 낙천성, 리더십',
    caution: '감정 기복이 크고 성급할 수 있습니다. 꾸준함과 뒷심을 기르면 좋습니다.',
  },
  정: {
    title: '정화(丁火) · 촛불·별빛',
    nature: '따뜻하고 섬세하며 헌신적입니다. 은은하게 오래 타는 불처럼 깊은 정과 집중력을 지녔습니다.',
    strength: '배려심, 집중력, 예술성',
    caution: '예민하고 속으로 담아두는 편입니다. 감정을 솔직히 표현하는 것이 건강에 이롭습니다.',
  },
  무: {
    title: '무토(戊土) · 큰 산·대지',
    nature: '듬직하고 포용력이 큽니다. 쉽게 흔들리지 않는 안정감으로 주변의 신뢰를 얻습니다.',
    strength: '신뢰감, 포용력, 인내',
    caution: '고집이 세고 변화를 꺼릴 수 있습니다. 새로운 시도에 마음을 열어보세요.',
  },
  기: {
    title: '기토(己土) · 밭·정원의 흙',
    nature: '온화하고 현실적이며 세심합니다. 무엇이든 잘 길러내는 어머니 같은 포용과 실속을 갖췄습니다.',
    strength: '성실함, 배려, 실용성',
    caution: '걱정이 많고 자기 표현이 약할 수 있습니다. 스스로를 더 믿어도 좋습니다.',
  },
  경: {
    title: '경금(庚金) · 무쇠·원석',
    nature: '결단력 있고 의리가 강합니다. 불의를 참지 못하는 강직함과 강한 추진력을 지녔습니다.',
    strength: '결단력, 의리, 추진력',
    caution: '거칠고 직설적일 수 있습니다. 부드러운 표현을 더하면 관계가 매끄러워집니다.',
  },
  신: {
    title: '신금(辛金) · 보석·정제된 금속',
    nature: '깔끔하고 예리하며 자존심이 높습니다. 세련된 감각과 완성도에 대한 집념이 돋보입니다.',
    strength: '섬세함, 미적 감각, 자기관리',
    caution: '예민하고 상처를 잘 받습니다. 완벽주의를 조금 내려놓으면 편안해집니다.',
  },
  임: {
    title: '임수(壬水) · 강·바다',
    nature: '넓고 자유로우며 지혜롭습니다. 어디로든 흐르는 큰 물처럼 포용력과 기획력이 뛰어납니다.',
    strength: '지혜, 포용력, 융통성',
    caution: '변덕스럽거나 산만해질 수 있습니다. 한 곳에 집중하는 힘을 기르면 좋습니다.',
  },
  계: {
    title: '계수(癸水) · 이슬·시냇물',
    nature: '맑고 총명하며 감수성이 풍부합니다. 조용히 스며드는 물처럼 세심한 통찰과 상상력을 지녔습니다.',
    strength: '총명함, 직관, 섬세함',
    caution: '생각이 많고 소극적일 수 있습니다. 실행으로 옮기는 용기를 더해보세요.',
  },
}

// ── 십신(十神) 짧은 설명 ──────────────────────────────────
export const TEN_GOD_INFO: Record<string, string> = {
  비견: '나와 같은 기운 · 독립심과 자존심, 동료·형제',
  겁재: '나와 같은 기운(경쟁) · 승부욕과 추진, 재물 다툼 주의',
  식신: '내가 낳는 기운 · 표현·먹을복·여유, 꾸준한 재능',
  상관: '내가 낳는 기운(발산) · 재주·언변, 자유로움과 반항',
  편재: '내가 다스리는 재물 · 사업·큰돈·활동성, 스케일',
  정재: '내가 다스리는 재물 · 성실한 재물·안정, 알뜰함',
  편관: '나를 다스리는 기운 · 카리스마·도전·권력, 압박감',
  정관: '나를 다스리는 기운 · 명예·책임·규율, 반듯함',
  편인: '나를 낳는 기운 · 직관·특수 재능, 눈치·의심',
  정인: '나를 낳는 기운 · 학문·인덕·보살핌, 안정된 사고',
}

export type Interpretation = {
  dayMasterTitle: string
  paragraphs: { heading: string; body: string }[]
  elementAdvice: { lacking: string[]; strong: string[]; color: string }
}

// 사주 결과 → 해석 텍스트 생성
export function interpret(result: SajuResult): Interpretation {
  const dm = STEMS[result.dayMaster]
  const profile = DAY_MASTER_PROFILE[dm]
  const paragraphs: { heading: string; body: string }[] = []

  // 1) 일간(나 자신)
  paragraphs.push({
    heading: `일간 · ${profile.title}`,
    body: `${profile.nature}\n\n· 강점: ${profile.strength}\n· 주의: ${profile.caution}`,
  })

  // 2) 오행 균형 (index 기준으로 다뤄 타입 안전하게 처리)
  const counts = result.elementCounts
  const max = Math.max(...counts)
  const min = Math.min(...counts)
  const strongIdx = counts.map((c, i) => ({ c, i })).filter((x) => x.c === max && x.c > 0).map((x) => x.i)
  const lackingIdx = counts.map((c, i) => ({ c, i })).filter((x) => x.c === 0).map((x) => x.i)
  const weakIdx = counts.map((c, i) => ({ c, i })).filter((x) => x.c === min).map((x) => x.i)
  const nameOf = (i: number) => ELEMENTS[i]

  let balanceBody = `여덟 글자를 오행으로 나누면 ` +
    ELEMENTS.map((e, i) => `${e} ${counts[i]}`).join(' · ') + ` 입니다.\n\n`
  if (max - min <= 1) {
    balanceBody += '오행이 비교적 고르게 분포해 균형 잡힌 사주입니다. 특정 기운에 치우치지 않아 상황 적응력이 좋습니다.'
  } else {
    balanceBody += `${strongIdx.map(nameOf).join('·')} 기운이 강합니다. ${ELEMENT_INFO[strongIdx[0]].keyword}의 성향이 두드러집니다. `
    if (lackingIdx.length) {
      balanceBody += `반대로 ${lackingIdx.map(nameOf).join('·')} 기운이 없어, 그 부분을 생활 속에서 보완하면 좋습니다.`
    } else {
      balanceBody += `상대적으로 ${nameOf(weakIdx[0])} 기운이 약한 편입니다.`
    }
  }
  paragraphs.push({ heading: '오행 균형', body: balanceBody })

  // 3) 십신 분포
  const godCount: Record<string, number> = {}
  for (const g of result.tenGods) godCount[g.god] = (godCount[g.god] ?? 0) + 1
  const sortedGods = Object.entries(godCount).sort((a, b) => b[1] - a[1])
  if (sortedGods.length) {
    const [topGod] = sortedGods[0]
    let godBody = `사주에 가장 두드러진 기운은 '${topGod}'입니다.\n${TEN_GOD_INFO[topGod]}\n\n`
    godBody += '십신 분포: ' + sortedGods.map(([g, n]) => `${g}(${n})`).join(' · ')
    paragraphs.push({ heading: '십신 · 삶의 무늬', body: godBody })
  }

  // 4) 보완 색·방향 조언 (부족한 오행 기준, 없으면 약한 오행)
  const adviceElement = lackingIdx.length ? lackingIdx[0] : weakIdx[0]
  const info = ELEMENT_INFO[adviceElement]
  paragraphs.push({
    heading: '보완 조언',
    body:
      `${info.name}(${info.hanja}) 기운을 채우면 삶의 균형에 도움이 됩니다.\n` +
      `· 색: ${elementColorName(adviceElement)}\n` +
      `· 키워드: ${info.keyword}\n` +
      `일상에서 이 기운과 관련된 활동·환경을 가까이해보세요.`,
  })

  return {
    dayMasterTitle: profile.title,
    paragraphs,
    elementAdvice: {
      lacking: lackingIdx.map(nameOf),
      strong: strongIdx.map(nameOf),
      color: info.color,
    },
  }
}

// 오늘의 운세: 오늘 일진(日辰)의 천간이 내 일간에 대해 갖는 십신 관계로 풀이
export function todayFortune(
  dayMaster: number,
  today: { year: number; month: number; day: number },
): { pillarLabel: string; god: string; message: string } {
  const p = dayPillarOf(today.year, today.month, today.day)
  const god = tenGod(dayMaster, p.stem)
  const messages: Record<string, string> = {
    비견: '내 편이 되어주는 하루입니다. 협력과 소신 있는 행동이 힘을 얻습니다. 다만 고집은 잠시 내려놓으세요.',
    겁재: '경쟁과 변화의 기운이 감돕니다. 승부수는 신중하게, 금전 거래는 특히 조심하세요.',
    식신: '여유롭고 즐거운 하루. 표현하고 나누는 일에 복이 따릅니다. 맛있는 음식과 좋은 대화가 어울립니다.',
    상관: '재능과 아이디어가 빛나는 날. 말과 표현에 힘이 실리지만, 지나친 직설은 아껴두세요.',
    편재: '활동적으로 움직일수록 기회가 열립니다. 새로운 시도와 사람과의 만남에 좋은 흐름입니다.',
    정재: '성실함이 결실로 이어지는 하루. 꼼꼼한 관리와 알뜰한 선택이 이득을 부릅니다.',
    편관: '도전과 책임이 커지는 날. 압박이 느껴져도 정면으로 마주하면 성장의 계기가 됩니다.',
    정관: '반듯함과 신뢰가 인정받는 하루. 규칙을 지키고 맡은 일에 충실하면 좋은 평가를 얻습니다.',
    편인: '직관과 통찰이 예리해집니다. 배움·연구·기획에 어울리지만, 혼자 골몰하기보다 나눠보세요.',
    정인: '마음이 안정되고 귀인의 도움이 있는 날. 공부와 정리, 어른께 조언 구하기에 좋습니다.',
  }
  return {
    pillarLabel: `${STEMS[p.stem]}${['자','축','인','묘','진','사','오','미','신','유','술','해'][p.branch]}일`,
    god,
    message: messages[god],
  }
}

function elementColorName(idx: number): string {
  return ['청록·초록색', '빨강·분홍색', '노랑·황토색', '흰색·회색', '검정·파랑색'][idx]
}

// UI 에서 쓰기 편하도록 오행 index 헬퍼 재노출
export function stemElementIndex(stem: number): number {
  return STEM_ELEMENT[stem]
}
