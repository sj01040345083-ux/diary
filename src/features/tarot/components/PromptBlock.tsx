// 카드가 건네는 '질문' + 일기 쓰기로 이어지는 부분.
// 카드는 답을 주지 않는다. 해석의 주체는 사용자다. 그래서 질문으로 끝난다.
type Props = {
  prompt: string
  reversedNote?: string | null
  onWrite: () => void
}

export default function PromptBlock({ prompt, reversedNote, onWrite }: Props) {
  return (
    <div className="dc-prompt">
      <p className="dc-prompt-label">이 카드가 건네는 물음</p>
      <blockquote className="dc-prompt-text">{prompt}</blockquote>
      {reversedNote && <p className="dc-prompt-reversed">{reversedNote}</p>}
      <button className="dc-write-btn" onClick={onWrite}>
        ✏️ 이 물음으로 일기 쓰기
      </button>
    </div>
  )
}
