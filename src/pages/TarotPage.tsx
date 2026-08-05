import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  buildPool,
  neededCount,
  readingText,
  directionLabel,
  cardCategoryLabel,
  formatReadingForDiary,
  threePositions,
  tarotTopics,
  POOL_SIZE,
} from '../lib/tarot'
import type { DrawnCard, SpreadKind, TarotTopic } from '../lib/tarot'
import { suitInfo } from '../config/tarot'
import { getDiaryByDate, saveDiary, todayString } from '../lib/diaries'
import './home.css'
import './tarot.css'

// 화면이 거치는 단계
//  - intro : 주제 + 스프레드(1장/3장)를 고르는 첫 화면
//  - picking : 뒷면 카드들 중에서 직접 카드를 고르는 화면
//  - result : 고른 카드가 뒤집히고 해석을 보여주는 화면
type Stage = 'intro' | 'picking' | 'result'

type Props = {
  session: Session
  onBack: () => void
}

// 결과 화면에서 카드 한 장(앞면)을 보여주는 컴포넌트.
function ResultCard({
  drawn,
  position,
  index,
  flipped,
}: {
  drawn: DrawnCard
  position?: string // 3장 스프레드일 때 '과거/현재/미래'
  index: number
  flipped: boolean
}) {
  const { card, reversed } = drawn
  return (
    <div className="tarot-card-slot">
      {position && <p className="tarot-position">{position}</p>}
      <div
        className={`tarot-card ${flipped ? 'is-flipped' : ''}`}
        style={{ transitionDelay: `${index * 0.18}s` }}
      >
        <div className="tarot-card-inner">
          <div className="tarot-face tarot-back">
            <span className="tarot-back-mark">✦</span>
          </div>
          <div className={`tarot-face tarot-front ${reversed ? 'is-reversed' : ''}`}>
            <span className="tarot-emoji">{card.emoji}</span>
            <span className="tarot-name">{card.name}</span>
            {card.suit && (
              <span className="tarot-suit">{suitInfo[card.suit].emoji}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TarotPage({ session, onBack }: Props) {
  const [stage, setStage] = useState<Stage>('intro')
  const [topic, setTopic] = useState<TarotTopic>(tarotTopics[0])
  const [spread, setSpread] = useState<SpreadKind>('one')
  const [showGuide, setShowGuide] = useState(false) // '타로 카드가 궁금하다면?' 펼침 여부

  // 골라 뽑기: 뒷면 카드 묶음 + 사용자가 고른 순서(인덱스)
  const [pool, setPool] = useState<DrawnCard[]>([])
  const [picked, setPicked] = useState<number[]>([])

  // 결과: 고른 카드들 + 뒤집힘 여부
  const [cards, setCards] = useState<DrawnCard[]>([])
  const [revealed, setRevealed] = useState(false)

  // 저장 상태
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const need = neededCount(spread)

  // 스프레드를 고르면: 뒷면 카드 묶음을 만들고 '고르기' 단계로
  function startPicking(kind: SpreadKind) {
    setSpread(kind)
    setPool(buildPool())
    setPicked([])
    setCards([])
    setRevealed(false)
    setSaved(false)
    setSaveError('')
    setStage('picking')
  }

  // 뒷면 카드 하나를 고름
  function pick(i: number) {
    if (picked.includes(i)) return
    const nextPicked = [...picked, i]
    setPicked(nextPicked)
    // 필요한 만큼 다 골랐으면 → 결과로 넘어가 카드를 뒤집어 보여줌
    if (nextPicked.length === neededCount(spread)) {
      const chosen = nextPicked.map((idx) => pool[idx])
      setCards(chosen)
      setStage('result')
      // 살짝 뒤에 뒤집어서 '펼쳐지는' 느낌을 줍니다.
      setTimeout(() => setRevealed(true), 450)
    }
  }

  // 다시 뽑기 (처음 화면으로)
  function reset() {
    setStage('intro')
    setPool([])
    setPicked([])
    setCards([])
    setRevealed(false)
    setSaving(false)
    setSaved(false)
    setSaveError('')
  }

  // 결과를 오늘 날짜 일기에 저장합니다.
  // 이미 오늘 일기가 있으면 지우지 않고 아래에 이어서 붙입니다.
  async function saveToDiary() {
    if (saving || saved) return
    setSaving(true)
    setSaveError('')
    try {
      const date = todayString()
      const text = formatReadingForDiary(topic, spread, cards)
      const existing = await getDiaryByDate(date)
      const content = existing?.content
        ? `${existing.content}\n\n${text}`
        : text
      await saveDiary(session.user.id, date, content, existing?.mood ?? null)
      setSaved(true)
    } catch {
      setSaveError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="home-screen tarot-screen">
      <header className="home-header tarot-header">
        <button className="icon-btn" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="write-title">오늘의 타로</div>
        <span className="write-spacer" aria-hidden />
      </header>

      <main className="home-container tarot-main">
        {/* ── 1) 주제 + 스프레드 선택 ── */}
        {stage === 'intro' && (
          <div className="tarot-intro">
            <div className="tarot-hero">
              <span className="tarot-hero-mark">🔮</span>
              <h1 className="tarot-heading">무엇이 궁금하신가요?</h1>
              <p className="tarot-sub">
                궁금한 주제를 고르고, 조용히 마음속으로 떠올려 보세요.
              </p>
            </div>

            {/* 주제 고르기 */}
            <div className="tarot-topics">
              {tarotTopics.map((t) => (
                <button
                  key={t.key}
                  className={`tarot-topic ${
                    topic.key === t.key ? 'is-active' : ''
                  }`}
                  onClick={() => setTopic(t)}
                >
                  <span className="tarot-topic-emoji">{t.emoji}</span>
                  <span className="tarot-topic-label">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="tarot-topic-hint">“{topic.hint}”에 대해 물어봐요</p>

            {/* 스프레드(장수) 고르기 */}
            <div className="tarot-spread-choices">
              <button
                className="tarot-spread-btn"
                onClick={() => startPicking('one')}
              >
                <span className="tarot-spread-emoji">🃏</span>
                <span className="tarot-spread-name">카드 1장</span>
                <span className="tarot-spread-desc">
                  한 장으로 핵심 메시지를 받아요
                </span>
              </button>
              <button
                className="tarot-spread-btn"
                onClick={() => startPicking('three')}
              >
                <span className="tarot-spread-emoji">🕰️</span>
                <span className="tarot-spread-name">카드 3장 · 과거·현재·미래</span>
                <span className="tarot-spread-desc">
                  세 장으로 흐름을 읽어요
                </span>
              </button>
            </div>

            {/* 타로 카드가 궁금하다면? (펼쳐보기) */}
            <div className="tarot-guide">
              <button
                className="tarot-guide-toggle"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
              >
                🔎 타로 카드가 궁금하다면? {showGuide ? '▲' : '▼'}
              </button>
              {showGuide && (
                <div className="tarot-guide-body">
                  <p>
                    타로는 모두 <b>78장</b>이에요. 크게 두 종류로 나뉘어요.
                  </p>
                  <p>
                    <b>✨ 메이저 아르카나 (22장)</b>
                    <br />
                    태양·달·연인처럼 <b>인생의 큰 흐름</b>을 담은 카드예요.
                  </p>
                  <p>
                    <b>🃏 마이너 아르카나 (56장)</b>
                    <br />
                    <b>4가지 무늬</b>로 일상을 세밀하게 나타내요.
                  </p>
                  <ul className="tarot-guide-suits">
                    <li>🔥 <b>완드</b> — 열정 · 행동</li>
                    <li>💧 <b>컵</b> — 감정 · 관계</li>
                    <li>🗡️ <b>소드</b> — 생각 · 갈등</li>
                    <li>🪙 <b>펜타클</b> — 현실 · 재물</li>
                  </ul>
                  <p>
                    각 무늬는 <b>에이스~10</b> 숫자 카드와{' '}
                    <b>시종·기사·여왕·왕</b> 인물 카드로 이루어져요.
                  </p>
                  <p className="tarot-guide-ex">
                    예) <b>‘소드 5’</b> = 🗡️소드(생각·갈등) 무늬의 5번 카드
                    <br />
                    <b>‘소드 시종’</b> = 🗡️소드 무늬의 시종(인물) 카드
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 2) 직접 카드 고르기 ── */}
        {stage === 'picking' && (
          <div className="tarot-picking">
            <p className="tarot-pick-topic">
              {topic.emoji} {topic.label}
            </p>
            <h2 className="tarot-pick-heading">
              마음이 이끄는 카드를 골라주세요
            </h2>
            <p className="tarot-pick-count">
              {picked.length} / {need} 장 선택
            </p>

            <div className="tarot-pool">
              {pool.map((_, i) => (
                <button
                  key={i}
                  className={`tarot-pool-card ${
                    picked.includes(i) ? 'is-picked' : ''
                  }`}
                  style={{ ['--n' as string]: `${i - (POOL_SIZE - 1) / 2}` }}
                  onClick={() => pick(i)}
                  disabled={picked.includes(i)}
                  aria-label={`${i + 1}번째 카드 고르기`}
                >
                  <span className="tarot-pool-mark">✦</span>
                </button>
              ))}
            </div>

            <button className="tarot-text-btn" onClick={reset}>
              처음으로
            </button>
          </div>
        )}

        {/* ── 3) 결과 ── */}
        {stage === 'result' && (
          <div className="tarot-result">
            <p className="tarot-result-topic">
              {topic.emoji} {topic.label}
            </p>
            <p className="tarot-result-hint">
              {revealed
                ? '고른 카드가 전하는 이야기예요.'
                : '카드를 펼치는 중…'}
            </p>

            <div
              className={`tarot-cards ${
                spread === 'three' ? 'is-three' : 'is-one'
              }`}
            >
              {cards.map((drawn, i) => (
                <ResultCard
                  key={drawn.card.id}
                  drawn={drawn}
                  position={spread === 'three' ? threePositions[i] : undefined}
                  index={i}
                  flipped={revealed}
                />
              ))}
            </div>

            {/* 해석 */}
            {revealed && (
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
                            {` (${directionLabel(drawn)})`}
                          </span>
                        </span>
                        <span className="tarot-reading-keywords">
                          {drawn.card.keywords.join(' · ')}
                        </span>
                      </div>
                    </div>
                    <p className="tarot-reading-cat">
                      {cardCategoryLabel(drawn.card)}
                    </p>
                    <p className="tarot-reading-text">{readingText(drawn)}</p>
                  </article>
                ))}
              </div>
            )}

            {/* 저장 + 다시 뽑기 */}
            {revealed && (
              <div className="tarot-result-actions">
                {saved ? (
                  <p className="tarot-saved-msg">
                    ✅ 오늘 일기에 저장했어요. ‘기록’ 탭 달력에서 볼 수 있어요.
                  </p>
                ) : (
                  <button
                    className="tarot-save-btn"
                    onClick={saveToDiary}
                    disabled={saving}
                  >
                    {saving ? '저장 중…' : '💾 결과 저장하기 (일기 달력에)'}
                  </button>
                )}
                {saveError && <p className="tarot-save-error">{saveError}</p>}
                <button className="tarot-again-btn" onClick={reset}>
                  🔄 다시 뽑기
                </button>
              </div>
            )}

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
