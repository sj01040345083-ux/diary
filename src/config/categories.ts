// 이 파일을 수정하면 소비/수입 기록의 카테고리 목록·아이콘·색이 바뀝니다.

export const expenseCategories = [
  '식비',
  '교통',
  '생활',
  '쇼핑',
  '문화',
  '건강',
  '기타',
]

// 수입 카테고리 (요청에 따라 '기타' 제외 — 이미 저장된 '기타' 수입 기록은 그대로 표시됩니다)
export const incomeCategories = ['월급', '용돈', '부수입']

// 카테고리별 아이콘 (없는 카테고리는 기본 아이콘)
export const categoryIcons: Record<string, string> = {
  식비: '🍚',
  교통: '🚌',
  생활: '🏠',
  쇼핑: '🛍️',
  문화: '🎬',
  건강: '💊',
  월급: '💰',
  용돈: '🎁',
  부수입: '💸',
  기타: '📦',
}

export function categoryIcon(name: string): string {
  return categoryIcons[name] ?? '🏷️'
}

// 통계 그래프용 파스텔 색 팔레트 (카테고리 순서대로 배정)
export const pastelColors = [
  '#9DD6B5',
  '#F6C79A',
  '#F2A9BC',
  '#A6C4EC',
  '#CDB4E8',
  '#F3DE96',
  '#A9E0D2',
  '#EFA9A9',
  '#C4DE9E',
  '#F0BBD8',
]

export function pastelColor(index: number): string {
  return pastelColors[index % pastelColors.length]
}
