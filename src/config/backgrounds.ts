// 이 파일을 수정하면 앱에서 고를 수 있는 배경 사진 목록이 바뀝니다.
// 새 사진을 넣으려면 src/assets/backgrounds/ 에 파일을 넣고 아래처럼 추가하세요.

import forest1 from '../assets/backgrounds/forest1.jpg'
import forest2 from '../assets/backgrounds/forest2.jpg'
import forest3 from '../assets/backgrounds/forest3.jpg'
import forest4 from '../assets/backgrounds/forest4.jpg'
import forest5 from '../assets/backgrounds/forest5.jpg'

// 설정 화면 '배경 사진 선택'에 보여줄 목록 (value = 저장되는 값)
export const backgroundOptions = [
  { value: 'forest5', label: '초록 숲', url: forest5 },
  { value: 'forest1', label: '숲 1', url: forest1 },
  { value: 'forest2', label: '숲 2', url: forest2 },
  { value: 'forest3', label: '숲 3', url: forest3 },
  { value: 'forest4', label: '벚꽃', url: forest4 },
]

// value → 이미지 주소
export const backgroundMap: Record<string, string> = {
  forest1,
  forest2,
  forest3,
  forest4,
  forest5,
}

// 기본 배경
export const defaultBackground = 'forest5'

export function backgroundUrl(value: string): string {
  return backgroundMap[value] ?? backgroundMap[defaultBackground]
}
