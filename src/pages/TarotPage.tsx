import { useState } from 'react'
import { drawSpread, readingText, threePositions } from '../lib/tarot'
import type { DrawnCard, SpreadKind } from '../lib/tarot'
import { suitInfo } from '../config/tarot'
import './home.css'
import './tarot.css'

// 화면이 거치는 단계
//  - intro : 스프레드(1장/3장)를 고르는 첫 화면
//  - shuffling : 카드를 섞는 짧은 연출
//  - result : 뽑힌 카드와 해석을 보여주는 화면
type Stage = 'intro' | 'shuffling' | 'result'

type Props = {
  onBack: () => void
}

// 카드 한 장을 보여주는 컴포넌트.
// 처음엔 뒷면으로 나왔다가, 누르면(또는 자동으로) 뒤집혀 앞면이 보입니다.
function TarotCardView({
  drawn,
  position,
  index,
  flipped,
  onFlip,
}: {
  drawn: DrawnCard
  position?: string // 3장 스프레드일 때 '과거/현재/미래'
  index: number
  flipped: boolean
  onFlip: () => void
}) {
  const { card, reversed } = drawn

  return (
    <div className="tarot-card-slot">
      {position && <p className="tarot-position">{position}</p>}
      <button
        className={`tarot-card ${flipped ? 'is-flipped' : ''}`}
        style={{ animationDelay: `${index * 0.12}s` }}
        onClick={onFlip}
        aria-label={flipped ? card.name : '카드 뒤집기'}
      >
        <div className="tarot-card-inner">
          {/* 뒷면 */}
          <div className="tarot-face tarot-back">
            <span className="tarot-back-mark">✦</span>
          </div>
          {/* 앞면 (역방향이면 상하 반전) */}
          <div className={`tarot-face tarot-front ${reversed ? 'is-reversed' : ''}`}>
            <span className="tarot-emoji">{card.emoji}</span>
            <span className="tarot-name">{card.name}</span>
            {card.suit && (
              <span className="tarot-suit">{suitInfo[card.suit].emoji}</span>
            )}
          </div>
        </div>
      </button>
    </div>
  )
}

export default function TarotPage({ onBack }: Props) {
  const [stage, setStage] = useState<Stage>('intro')
  const [spread, setSpread] = useState<SpreadKind>('one')
  const [cards, setCards] = useState<DrawnCard[]>([])
  // 각 카드가 뒤집혀 앞면을 보이는지 (index로 관리)
  const [flipped, setFlipped] = useState<boolean[]>([])

  // 스프레드를 고르고 "카드 뽑기"를 누르면: 섞는 연출 → 결과
  function startDraw(kind: SpreadKind) {
    setSpread(kind)
    setStage('shuffling')
    const drawn = drawSpread(kind)
    // 섞는 연출을 잠깐 보여준 뒤 결과로 넘어갑니다.
    setTimeout(() => {
      setCards(drawn)
      setFlipped(drawn.map(() => false))
      setStage('result')
    }, 1400)
  }

  // 한 장 뒤집기
  function flip(i: number) {
    setFlipped((prev) => {
      const next = [...prev]
      next[i] = true
      return next
    })
  }

  // 모두 뒤집기 (한 번에 결과 확인)
  function flipAll() {
    setFlipped(cards.map(() => true))
  }

  // 다시 뽑기 (처음 화면으로)
  function reset() {
    setStage('intro')
    setCards([])
    setFlipped([])
  }

  const allFlipped = flipped.length > 0 && flipped.every(Boolean)

  return (
    <div className="home-screen tarot-screen">
      <header className="home-header">
        <button className="icon-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="write-title">오늘의 타로</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container tarot-main">
        {/* ── 1) 스프레드 선택 ── */}
        {stage === 'intro' && (
          <div className="tarot-intro">
            <div className="tarot-hero">
              <span className="tarot-hero-mark">🔮</span>
              <h1 className="tarot-heading">마음이 향하는 카드를 골라요</h1>
              <p className="tarot-sub">
                조용히 숨을 고르고, 지금 궁금한 것을 마음속으로 떠올려 보세요.
              </p>
            </div>

            <div className="tarot-spread-choices">
              <button
                className="tarot-spread-btn"
                onClick={() => startDraw('one')}
              >
                <span className="tarot-spread-emoji">🃏</span>
                <span className="tarot-spread-name">오늘의 카드</span>
                <span className="tarot-spread-desc">
                  한 장으로 오늘의 메시지를 받아요
                </span>
              </button>
              <button
                className="tarot-spread-btn"
                onClick={() => startDraw('three')}
              >
                <span className="tarot-spread-emoji">🕰️</span>
                <span className="tarot-spread-name">과거·현재·미래</span>
                <span className="tarot-spread-desc">
                  세 장으로 흐름을 읽어요
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── 2) 섞는 연출 ── */}
        {stage === 'shuffling' && (
          <div className="tarot-shuffle">
            <div className="tarot-shuffle-cards">
              <span className="tarot-shuffle-card" />
              <span className="tarot-shuffle-card" />
              <span className="tarot-shuffle-card" />
            </div>
            <p className="tarot-shuffle-text">카드를 섞고 있어요…</p>
          </div>
        )}

        {/* ── 3) 결과 ── */}
        {stage === 'result' && (
          <div className="tarot-result">
            <p className="tarot-result-hint">
              {allFlipped
                ? '카드가 전하는 이야기예요.'
                : '카드를 눌러 뒤집어 보세요.'}
            </p>

            <div
              className={`tarot-cards ${
                spread === 'three' ? 'is-three' : 'is-one'
              }`}
            >
              {cards.map((drawn, i) => (
                <TarotCardView
                  key={drawn.card.id}
                  drawn={drawn}
                  position={spread === 'three' ? threePositions[i] : undefined}
                  index={i}
                  flipped={flipped[i]}
                  onFlip={() => flip(i)}
                />
              ))}
            </div>

            {!allFlipped && cards.length > 1 && (
              <button className="tarot-flipall-btn" onClick={flipAll}>
                한 번에 모두 펼치기
              </button>
            )}

            {/* 뒤집은 카드의 해석 */}
            {allFlipped && (
              <div className="tarot-readings">
                {cards.map((drawn, i) => (
                  <article key={drawn.card.id} className="tarot-reading-card">
                    <div className="tarot-reading-head">
                      {spread === 'three' && (
                        <span className="tarot-reading-pos">
                          {threePositions[i]}
                        </span>
                      )}
                      <span className="tarot-reading-emoji">
                        {drawn.card.emoji}
                      </span>
                      <div className="tarot-reading-titles">
                        <span className="tarot-reading-name">
                          {drawn.card.name}
                          <span className="tarot-reading-dir">
                            {drawn.reversed ? ' (역방향)' : ' (정방향)'}
                          </span>
                        </span>
                        <span className="tarot-reading-keywords">
                          {drawn.card.keywords.join(' · ')}
                        </span>
                      </div>
                    </div>
                    <p className="tarot-reading-text">{readingText(drawn)}</p>
                  </article>
                ))}
              </div>
            )}

            <div className="tarot-result-actions">
              <button className="tarot-again-btn" onClick={reset}>
                🔄 다시 뽑기
              </button>
            </div>

            <p className="tarot-disclaimer">
              타로는 마음을 들여다보는 놀이예요. 오늘 하루의 다정한 힌트로
              가볍게 즐겨 주세요 🌙
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
