// 이 파일을 수정하면 일기 작성 화면의 '오늘의 기분' 이모지·이름이 바뀝니다.
// (그 날의 감정을 지정하는 용도)

export type Emotion = {
  key: string
  emoji: string
  label: string
}

export const emotions: Emotion[] = [
  { key: 'happy', emoji: '😊', label: '행복해요' },
  { key: 'good', emoji: '😌', label: '좋아요' },
  { key: 'flutter', emoji: '🥰', label: '설레요' },
  { key: 'soso', emoji: '😐', label: '보통이에요' },
  { key: 'sad', emoji: '😢', label: '슬퍼요' },
  { key: 'upset', emoji: '😟', label: '속상해요' },
  { key: 'hard', emoji: '😱', label: '힘들어요' },
  { key: 'tired', emoji: '😩', label: '지쳐요' },
]
