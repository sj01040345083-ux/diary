// 이 파일을 수정하면 일기 작성 화면의 '오늘의 기분' 이모지 목록이 바뀝니다.
// 이모지를 추가/수정/삭제하려면 아래 배열을 편집하세요.

export type Emotion = {
  key: string
  emoji: string
  label: string
}

export const emotions: Emotion[] = [
  { key: 'happy', emoji: '😊', label: '기쁨' },
  { key: 'calm', emoji: '😌', label: '평온' },
  { key: 'grateful', emoji: '🥰', label: '감사' },
  { key: 'soso', emoji: '😐', label: '그저 그럼' },
  { key: 'tired', emoji: '😪', label: '지침' },
  { key: 'sad', emoji: '😢', label: '슬픔' },
  { key: 'anxious', emoji: '😰', label: '불안' },
  { key: 'angry', emoji: '😤', label: '화남' },
]
