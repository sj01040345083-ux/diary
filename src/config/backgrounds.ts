// 이 파일을 수정하면 앱에서 고를 수 있는 배경 사진 목록이 바뀝니다.
// 새 사진을 넣으려면 src/assets/backgrounds/ 에 파일을 넣고 아래처럼 추가하세요.

import bg1 from '../assets/backgrounds/1.jpg'
import bg2 from '../assets/backgrounds/2.jpg'
import bg3 from '../assets/backgrounds/3.jpg'
import bg4 from '../assets/backgrounds/4.png'
import bg5 from '../assets/backgrounds/5.jpg'
import bg6 from '../assets/backgrounds/6.jpg'

// 설정 화면 '배경 사진 선택'에 보여줄 목록 (value = 저장되는 값, label = 이름)
export const backgroundOptions = [
  { value: 'bg1', label: '숲', url: bg1 },
  { value: 'bg2', label: '하트나무', url: bg2 },
  { value: 'bg3', label: '겨울', url: bg3 },
  { value: 'bg4', label: '딸기', url: bg4 },
  { value: 'bg5', label: '별빛', url: bg5 },
  { value: 'bg6', label: '봄들판', url: bg6 },
]

// value → 이미지 주소
export const backgroundMap: Record<string, string> = {
  bg1,
  bg2,
  bg3,
  bg4,
  bg5,
  bg6,
}

// 기본 배경
export const defaultBackground = 'bg1'

export function backgroundUrl(value: string): string {
  return backgroundMap[value] ?? backgroundMap[defaultBackground]
}
