import { authBackground } from '../config/backgrounds'
import './home.css'

// 아직 만들지 않은 화면에 잠깐 쓰는 임시 페이지입니다.
// 각 기능을 만들 때 진짜 화면으로 하나씩 교체할 거예요.
type Props = {
  title: string
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div
      className="home-screen"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <div className="home-container placeholder-container">
        <h1 className="page-title">{title}</h1>
        <div className="diary-empty">
          <p>이 화면은 곧 만들어요 🌿</p>
        </div>
      </div>
    </div>
  )
}
