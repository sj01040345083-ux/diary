import type { Session } from '@supabase/supabase-js'
import { useDailyCard } from '../hooks/useDailyCard'
import { getCardById } from '../lib/cards'
import CardFace from '../components/CardFace'
import PromptBlock from '../components/PromptBlock'
import '../../../pages/home.css'
import './dailyCard.css'

// 오늘의 '하루 한 장'
//  - 아직 안 뽑음 → 뒷면 카드 + "오늘의 카드 뽑기"
//  - 뽑는 중 → 뒤집기 애니메이션
//  - 뽑음 → 앞면 + 카드가 건네는 질문 + 일기 쓰기
type Props = {
  session: Session
  onBack: () => void
  onWrite: (prompt: string) => void // 이 질문으로 일기 작성 화면 열기
}

export default function DailyCardPage({ session, onBack, onWrite }: Props) {
  const { state, draw } = useDailyCard(session.user.id)
  const { loading, drawing, drawn, result, saveWarning } = state

  const card = result ? getCardById(result.cardId) : null
  const prompt =
    card && result ? card.prompts[result.promptIndex] ?? card.prompts[0] : ''

  // 카드가 앞면을 보이는 시점: 이미 뽑았거나(재방문) 뽑는 중(연출)
  const flipped = drawn || drawing

  return (
    <div className="home-screen dc-screen">
      <header className="home-header">
        <button className="icon-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="write-title">오늘의 한 장</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container dc-main">
        {loading ? (
          <p className="dc-loading">불러오는 중…</p>
        ) : (
          <>
            <p className="dc-lead">
              {drawn
                ? '오늘의 카드가 도착했어요'
                : '오늘의 카드가 당신을 기다려요'}
            </p>

            {/* 카드 (뒷면 ↔ 앞면 뒤집기) */}
            <button
              className={`dc-card ${flipped ? 'is-flipped' : ''}`}
              onClick={() => {
                if (!drawn && !drawing) draw()
              }}
              disabled={drawn || drawing}
              aria-label={drawn ? card?.nameKo : '오늘의 카드 뽑기'}
            >
              <div className="dc-card-inner">
                <div className="dc-face dc-back">
                  <span className="dc-back-pattern" aria-hidden />
                </div>
                <div
                  className={`dc-face dc-front ${
                    result?.isReversed ? 'is-reversed' : ''
                  }`}
                >
                  {card && result && (
                    <CardFace card={card} isReversed={result.isReversed} />
                  )}
                </div>
              </div>
            </button>

            {/* 뽑기 전 안내 / 뽑는 중 / 결과 */}
            {!drawn && !drawing && (
              <button className="dc-draw-btn" onClick={draw}>
                오늘의 카드 뽑기
              </button>
            )}
            {drawing && <p className="dc-drawing">카드를 넘기는 중…</p>}

            {drawn && card && result && (
              <>
                <PromptBlock
                  prompt={prompt}
                  reversedNote={result.isReversed ? card.reversedNote : null}
                  onWrite={() => onWrite(prompt)}
                />
                {saveWarning && (
                  <p className="dc-save-warning">
                    지금은 오프라인이거나 저장 설정이 필요해요. 카드는 오늘 하루
                    같은 카드로 유지돼요.
                  </p>
                )}
                <p className="dc-note">
                  카드는 하루에 한 장이에요. 오늘은 이 카드와 함께 지내요 🌫️
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
