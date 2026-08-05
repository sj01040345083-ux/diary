import type { TarotCard } from '../lib/cards'

// 카드 앞면: 번호 · 이름 · 키워드. (이미지 없이 타이포그래피)
type Props = {
  card: TarotCard
  isReversed: boolean
}

export default function CardFace({ card, isReversed }: Props) {
  return (
    <div className="dc-face-content">
      <span className="dc-num">{String(card.id).padStart(2, '0')}</span>
      <span className="dc-name">{card.nameKo}</span>
      <span className="dc-name-en">{card.nameEn}</span>
      <span className="dc-keywords">{card.keywords.join(' · ')}</span>
      {isReversed && <span className="dc-reversed-tag">역방향</span>}
    </div>
  )
}
