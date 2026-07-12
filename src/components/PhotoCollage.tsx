// 사진 여러 장을 장수에 맞춰 콜라주로 보여줍니다. (읽기 전용)
// 1장: 큰 1장 / 2장: 2분할 / 3장: 큰 1 + 작은 2 / 4장: 2x2 / 5~6장: 3열

type Props = {
  urls: string[]
}

// 장수 → 콜라주 배치 클래스
export function collageClass(n: number): string {
  const count = Math.min(n, 6)
  return `collage collage-${count}`
}

export default function PhotoCollage({ urls }: Props) {
  if (!urls.length) return null
  const shown = urls.slice(0, 6)
  return (
    <div className={collageClass(shown.length)}>
      {shown.map((url, i) => (
        <div className="collage-cell" key={i}>
          <img src={url} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  )
}
