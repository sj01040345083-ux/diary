// 배경 사진 목록을 폴더에서 '자동으로' 불러옵니다.
// src/assets/backgrounds/ 에 jpg·jpeg·png·webp 파일을 넣기만 하면
// 코드를 고치지 않아도 설정 화면 목록에 자동으로 나타납니다.

// Vite의 import.meta.glob 으로 폴더 안 이미지를 한 번에 가져옵니다.
const modules = import.meta.glob(
  '../assets/backgrounds/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

// 파일 이름(확장자 제외)에 붙일 예쁜 라벨. 없으면 파일명을 그대로 씁니다.
const LABELS: Record<string, string> = {
  '1': '숲',
  '2': '하트나무',
  '3': '겨울',
  '4': '딸기',
  '5': '별빛',
  '6': '봄들판',
}

export type BgOption = { value: string; label: string; url: string }

// 기본 배경 = 다크 올리브 그린 단색 (사진 없음). 목록 맨 앞에 둡니다.
export const OLIVE_VALUE = 'olive'

// 경로에서 파일 이름(확장자 제외)만 뽑아냅니다.
function baseName(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.[^.]+$/, '')
}

// 사진 프리셋 목록 — value 는 'bg' + 파일이름.
// (기존 사용자 설정이 'bg1'~'bg6' 이므로, 숫자 파일명은 그대로 호환됩니다.)
const photoOptions: BgOption[] = Object.entries(modules)
  .map(([path, url]) => {
    const base = baseName(path)
    // 알려진 이름은 예쁜 라벨, 나머지는 파일명의 _/- 를 공백으로 바꿔 표시
    const label = LABELS[base] ?? base.replace(/[_-]+/g, ' ')
    return { value: `bg${base}`, label, url }
  })
  .sort((a, b) =>
    a.value.localeCompare(b.value, undefined, { numeric: true }),
  )

// 최종 목록 — 맨 앞에 '올리브(기본)' 단색, 이어서 사진들.
// (url 이 빈 문자열이면 사진이 아니라 단색 배경을 뜻합니다.)
export const backgroundOptions: BgOption[] = [
  { value: OLIVE_VALUE, label: '올리브(기본)', url: '' },
  ...photoOptions,
]

// value → 이미지 주소
export const backgroundMap: Record<string, string> = Object.fromEntries(
  backgroundOptions.map((o) => [o.value, o.url]),
)

// 기본 배경 = 올리브 단색
export const defaultBackground = OLIVE_VALUE

export function backgroundUrl(value: string): string {
  return (
    backgroundMap[value] ?? backgroundMap[defaultBackground] ?? ''
  )
}
