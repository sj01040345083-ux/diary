// 사주(四柱) 계산 엔진.
// 생년월일시(양력) → 년·월·일·시 4기둥(각 천간+지지), 오행 분포, 십신을 계산합니다.
//
// 표준 규칙:
//  - 일주(日柱): 율리우스일(JD)로 60갑자 순환. 2000-01-07 = 갑자일 로 검증됨.
//  - 년주(年柱): 입춘(立春)을 연 경계로 사용.
//  - 월주(月柱): 12절(節)의 절기 시각으로 월 경계를 나눔.
//  - 시주(時柱): 자시(23~01) 기준 2시간 단위. 일간으로 시간 천간을 정함(오자둔).

import {
  STEM_ELEMENT,
  STEM_YANG,
  BRANCH_ELEMENT,
  BRANCH_MAIN_STEM,
  produces,
  controls,
} from './data'
import { toJulianDay, solarTermJd } from './solarTerms'

export type Pillar = { stem: number; branch: number }

export type TenGodEntry = {
  position: string // 위치 (예: '월간', '일지')
  charStem: number // 대상 천간 index
  god: string // 십신 이름
}

export type SajuInput = {
  year: number
  month: number
  day: number
  hour?: number // 0~23, 생략 가능
  minute?: number
  tzOffset?: number // 표준시 오프셋(시간). 기본 +9(한국)
  gender?: 'male' | 'female'
}

export type SajuResult = {
  input: SajuInput
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar | null
  dayMaster: number // 일간(천간 index) — '나'를 상징
  sajuYear: number // 입춘 기준으로 보정된 연도
  elementCounts: number[] // 오행 분포 [목,화,토,금,수]
  tenGods: TenGodEntry[]
}

// 십신(十神) 판정: 일간(dayStem) 기준으로 대상 천간(otherStem)의 관계
export function tenGod(dayStem: number, otherStem: number): string {
  const dEl = STEM_ELEMENT[dayStem]
  const oEl = STEM_ELEMENT[otherStem]
  const same = STEM_YANG[dayStem] === STEM_YANG[otherStem]
  if (oEl === dEl) return same ? '비견' : '겁재'
  if (produces(dEl) === oEl) return same ? '식신' : '상관'
  if (controls(dEl) === oEl) return same ? '편재' : '정재'
  if (controls(oEl) === dEl) return same ? '편관' : '정관'
  return same ? '편인' : '정인' // produces(oEl) === dEl
}

// 60갑자 index → { stem, branch }
function fromSexagenary(index: number): Pillar {
  const i = ((index % 60) + 60) % 60
  return { stem: i % 10, branch: i % 12 }
}

// 생년월일시로부터 사주 4기둥과 부가 정보를 계산합니다.
export function computeSaju(input: SajuInput): SajuResult {
  const { year, month, day } = input
  const hour = input.hour
  const minute = input.minute ?? 0
  const tz = input.tzOffset ?? 9

  // 출생 순간을 UT 기준 JD 로 변환 (표준시 오프셋만큼 뺌)
  const birthUtJd = toJulianDay(year, month, day, hour ?? 12, minute) - tz / 24

  // ── 일주(日柱) ──────────────────────────────
  // 달력 날짜(자정 경계)로 60갑자 일진을 정함. (2000-01-07 = 갑자 검증)
  const dayJdn = Math.round(toJulianDay(year, month, day, 12))
  const dayIndex = ((dayJdn + 49) % 60 + 60) % 60
  const dayPillar = fromSexagenary(dayIndex)
  const dayMaster = dayPillar.stem

  // ── 년주(年柱) ──────────────────────────────
  // 입춘 이전 출생이면 전년도로 취급
  const ipchunJd = solarTermJd(year, 0)
  const sajuYear = birthUtJd >= ipchunJd ? year : year - 1
  const yearIndex = ((sajuYear - 4) % 60 + 60) % 60
  const yearPillar = fromSexagenary(yearIndex)

  // ── 월주(月柱) ──────────────────────────────
  const monthBranch = findMonthBranch(birthUtJd, year)
  // 오호둔(五虎遁): 인월(寅月) 천간 시작 = (년간%5)*2 + 2
  const yinMonthStemBase = ((yearPillar.stem % 5) * 2 + 2) % 10
  const monthsFromYin = (monthBranch - 2 + 12) % 12
  const monthStem = (yinMonthStemBase + monthsFromYin) % 10
  const monthPillar: Pillar = { stem: monthStem, branch: monthBranch }

  // ── 시주(時柱) ──────────────────────────────
  let hourPillar: Pillar | null = null
  if (hour !== undefined && hour !== null) {
    const hourBranch = Math.floor(((hour + 1) % 24) / 2)
    // 오자둔(五鼠遁): 자시(子時) 천간 시작 = (일간%5)*2
    const ziHourStemBase = (dayMaster % 5) * 2 % 10
    const hourStem = (ziHourStemBase + hourBranch) % 10
    hourPillar = { stem: hourStem, branch: hourBranch }
  }

  // ── 오행 분포 ──────────────────────────────
  const elementCounts = [0, 0, 0, 0, 0]
  const pillars: (Pillar | null)[] = [yearPillar, monthPillar, dayPillar, hourPillar]
  for (const p of pillars) {
    if (!p) continue
    elementCounts[STEM_ELEMENT[p.stem]] += 1
    elementCounts[BRANCH_ELEMENT[p.branch]] += 1
  }

  // ── 십신 ──────────────────────────────
  const tenGods: TenGodEntry[] = []
  const addGod = (position: string, stem: number) => {
    tenGods.push({ position, charStem: stem, god: tenGod(dayMaster, stem) })
  }
  addGod('년간', yearPillar.stem)
  addGod('년지', BRANCH_MAIN_STEM[yearPillar.branch])
  addGod('월간', monthPillar.stem)
  addGod('월지', BRANCH_MAIN_STEM[monthPillar.branch])
  // 일간(나 자신)은 십신 대상에서 제외, 일지는 포함
  addGod('일지', BRANCH_MAIN_STEM[dayPillar.branch])
  if (hourPillar) {
    addGod('시간', hourPillar.stem)
    addGod('시지', BRANCH_MAIN_STEM[hourPillar.branch])
  }

  return {
    input,
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster,
    sajuYear,
    elementCounts,
    tenGods,
  }
}

// 출생 순간(UT JD)이 속한 '절(節)'의 지지(월지)를 찾습니다.
function findMonthBranch(birthUtJd: number, birthYear: number): number {
  const cands: { jd: number; branch: number }[] = []
  for (const yy of [birthYear - 1, birthYear, birthYear + 1]) {
    for (let ti = 0; ti < 12; ti++) {
      cands.push({ jd: solarTermJd(yy, ti), branch: monthTermBranch(ti) })
    }
  }
  cands.sort((a, b) => a.jd - b.jd)
  let chosen = cands[0]
  for (const c of cands) {
    if (c.jd <= birthUtJd) chosen = c
    else break
  }
  return chosen.branch
}

// 절기 index → 시작 지지(월지). 입춘=인(2)부터 순서대로.
function monthTermBranch(termIndex: number): number {
  return [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1][termIndex]
}

// 특정 날짜의 일진(60갑자) 을 구합니다. (오늘의 운세 등에서 사용)
export function dayPillarOf(year: number, month: number, day: number): Pillar {
  const jdn = Math.round(toJulianDay(year, month, day, 12))
  return fromSexagenary(((jdn + 49) % 60 + 60) % 60)
}
