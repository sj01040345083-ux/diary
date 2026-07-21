// 사주(四柱) 계산에 쓰이는 기본 상수 모음입니다.
// - 천간(天干) 10개, 지지(地支) 12개, 오행(五行) 5개
// - 각 글자의 오행·음양, 지지의 본기(지장간 대표 천간) 등을 정의합니다.

// ── 오행(五行) ─────────────────────────────────────────────
// 상생 순서(목→화→토→금→수)로 index 를 매겨두면 계산이 편합니다.
export const ELEMENTS = ['목', '화', '토', '금', '수'] as const
export type ElementIndex = 0 | 1 | 2 | 3 | 4

// 오행별 한자·색·의미 (해석·UI 에서 사용)
export const ELEMENT_INFO = [
  { name: '목', hanja: '木', color: '#3FA535', keyword: '성장·인정·추진' },
  { name: '화', hanja: '火', color: '#E5533C', keyword: '열정·표현·확산' },
  { name: '토', hanja: '土', color: '#C99A3B', keyword: '안정·신뢰·중재' },
  { name: '금', hanja: '金', color: '#8A8F98', keyword: '결단·의리·규율' },
  { name: '수', hanja: '水', color: '#3B77C9', keyword: '지혜·유연·소통' },
] as const

// 상생: a 가 생(生)하는 오행 (목생화 → produces(0)=1)
export const produces = (a: number): number => (a + 1) % 5
// 상극: a 가 극(剋)하는 오행 (목극토 → controls(0)=2)
export const controls = (a: number): number => (a + 2) % 5

// ── 천간(天干) ─────────────────────────────────────────────
// 갑을(목) 병정(화) 무기(토) 경신(금) 임계(수)
export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
// 천간의 오행 index (목0 화1 토2 금3 수4)
export const STEM_ELEMENT: number[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]
// 천간의 음양 (양=true). 갑병무경임 = 양, 을정기신계 = 음
export const STEM_YANG: boolean[] = [true, false, true, false, true, false, true, false, true, false]

// ── 지지(地支) ─────────────────────────────────────────────
// 자축인묘진사오미신유술해
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
// 지지의 오행 index. 자=수, 축=토, 인=목, 묘=목, 진=토, 사=화, 오=화, 미=토, 신=금, 유=금, 술=토, 해=수
export const BRANCH_ELEMENT: number[] = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]
// 지지의 띠(동물)
export const BRANCH_ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const

// 지지의 본기(本氣) — 지장간 중 대표 천간의 index (십신 판정에 사용)
// 자=계, 축=기, 인=갑, 묘=을, 진=무, 사=병, 오=정, 미=기, 신=경, 유=신, 술=무, 해=임
export const BRANCH_MAIN_STEM: number[] = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]

// 시(時)의 지지 경계 시작 시각 표기 (자시 23~01 …)
export const HOUR_RANGES = [
  '23:00~01:00', '01:00~03:00', '03:00~05:00', '05:00~07:00',
  '07:00~09:00', '09:00~11:00', '11:00~13:00', '13:00~15:00',
  '15:00~17:00', '17:00~19:00', '19:00~21:00', '21:00~23:00',
] as const
