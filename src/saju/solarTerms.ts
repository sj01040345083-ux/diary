// 절기(節氣) 계산 모듈.
//
// 사주의 '월주(月柱)'는 달력의 월이 아니라 12개의 '절(節)'로 나눕니다.
// (입춘부터 인월 시작 … 각 절은 태양황경이 315°, 345°, 15° … 로 30°씩 증가)
//
// 여기서는 Meeus 의 저정밀 태양황경 공식을 사용해 절기 시각을 구합니다.
// 정밀도는 수 분 이내로, 사주 월 경계를 정하기에 충분합니다.
// (모든 계산은 UT 기준 율리우스일(JD)로 처리합니다.)

const RAD = Math.PI / 180

// 그레고리력 날짜/시각(UT) → 율리우스일(JD)
export function toJulianDay(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  let y = year
  let m = month
  if (m <= 2) {
    y -= 1
    m += 12
  }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  const dayFrac = day + (hour + minute / 60 + second / 3600) / 24
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    dayFrac +
    b -
    1524.5
  )
}

// 태양의 겉보기 황경(°, 0~360). JD(UT) 입력.
export function solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0
  // 평균 황경
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  // 평균 근점이각
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  const Mr = M * RAD
  // 중심차(방정식)
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr)
  const trueLong = L0 + C
  // 겉보기 황경 보정(장동·광행차)
  const omega = 125.04 - 1934.136 * T
  const apparent = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD)
  return ((apparent % 360) + 360) % 360
}

// 목표 황경(targetDeg)에 태양이 도달하는 JD 를, guessJd 부근에서 찾습니다.
// 황경은 1일에 약 0.9856° 이동하므로 뉴턴식 반복으로 빠르게 수렴합니다.
function solveSolarTerm(targetDeg: number, guessJd: number): number {
  let jd = guessJd
  for (let i = 0; i < 8; i++) {
    let diff = solarLongitude(jd) - targetDeg
    // -180~180 범위로 정규화 (0°/360° 경계 처리)
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    jd -= diff / 0.98565 // 하루당 약 0.9856° 이동
    if (Math.abs(diff) < 1e-6) break
  }
  return jd
}

// 12개 '절(節)'의 황경(입춘=315° 부터 30°씩)과 시작 지지 index.
// 입춘→인월(2), 경칩→묘월(3) … 순서.
export const MONTH_TERMS = [
  { deg: 315, branch: 2, name: '입춘' }, // 인월
  { deg: 345, branch: 3, name: '경칩' }, // 묘월
  { deg: 15, branch: 4, name: '청명' }, // 진월
  { deg: 45, branch: 5, name: '입하' }, // 사월
  { deg: 75, branch: 6, name: '망종' }, // 오월
  { deg: 105, branch: 7, name: '소서' }, // 미월
  { deg: 135, branch: 8, name: '입추' }, // 신월
  { deg: 165, branch: 9, name: '백로' }, // 유월
  { deg: 195, branch: 10, name: '한로' }, // 술월
  { deg: 225, branch: 11, name: '입동' }, // 해월
  { deg: 255, branch: 0, name: '대설' }, // 자월
  { deg: 285, branch: 1, name: '소한' }, // 축월
] as const

// 주어진 연도의 특정 절기 JD(UT) 를 구합니다.
// (해당 절기가 대략 위치하는 월을 초기 추정으로 사용)
export function solarTermJd(year: number, termIndex: number): number {
  // 입춘(2월)부터 소한(1월)까지 대략적인 월 추정
  const approxMonth = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1][termIndex]
  const guessYear = termIndex === 11 ? year : year // 소한도 같은 해 1월 취급
  const guess = toJulianDay(guessYear, approxMonth, 6, 12)
  return solveSolarTerm(MONTH_TERMS[termIndex].deg, guess)
}
