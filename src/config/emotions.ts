// 이 파일을 수정하면 일기 작성 화면의 '오늘의 기분' 이모지·이름·색이 바뀝니다.
// (그 날의 감정을 지정하는 용도. color 는 달력 '한 달의 숲'의 색상 범례에 쓰입니다.)

export type Emotion = {
  key: string
  emoji: string
  label: string // 작성 화면에 보이는 이름
  short: string // 달력 범례용 짧은 이름
  color: string // 달력 색칠·범례 점 색
}

export const emotions: Emotion[] = [
  { key: 'happy', emoji: '😊', label: '행복해요', short: '행복', color: '#E6B94D' },
  { key: 'good', emoji: '😌', label: '좋아요', short: '좋음', color: '#86B27E' },
  { key: 'flutter', emoji: '🥰', label: '설레요', short: '설렘', color: '#E49AB0' },
  { key: 'soso', emoji: '😐', label: '보통이에요', short: '보통', color: '#AEB0A3' },
  { key: 'sad', emoji: '😢', label: '슬퍼요', short: '슬픔', color: '#7EA7CC' },
  { key: 'upset', emoji: '😟', label: '속상해요', short: '속상', color: '#C77E6C' },
  { key: 'hard', emoji: '😱', label: '힘들어요', short: '힘듦', color: '#9B86B4' },
  { key: 'tired', emoji: '😩', label: '지쳐요', short: '지침', color: '#B0A57E' },
]

// 기분 이모지 → 색 (달력에서 그 날 셀을 색칠할 때 사용)
export const moodColorByEmoji: Record<string, string> = Object.fromEntries(
  emotions.map((e) => [e.emoji, e.color]),
)
