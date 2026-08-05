// Supabase가 돌려주는 영어 오류 메시지를 사용자에게 보여줄 한글 문구로 바꿔줍니다.
// 알 수 없는 오류는 부드러운 기본 문구로 안내합니다.

export function translateAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.'
  }
  if (m.includes('email not confirmed')) {
    return '이메일 인증이 필요해요. 받은 편지함에서 인증 메일을 확인해주세요.'
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return '이미 가입된 이메일이에요. 로그인해주세요.'
  }
  if (m.includes('password should be at least')) {
    return '비밀번호가 너무 짧아요. 8자 이상으로 입력해주세요.'
  }
  if (m.includes('unable to validate email') || m.includes('invalid email')) {
    return '이메일 형식이 올바르지 않아요.'
  }
  // "For security purposes, you can only request this after 55 seconds."
  // 보안상 일정 시간(초)마다 한 번만 요청할 수 있어 나오는 안내입니다.
  if (
    m.includes('for security purposes') ||
    m.includes('you can only request this after')
  ) {
    const sec = message.match(/after (\d+)\s*seconds?/i)?.[1]
    return sec
      ? `보안을 위해 ${sec}초 뒤에 다시 시도할 수 있어요. 잠시만 기다렸다가 눌러주세요 🌿`
      : '보안을 위해 잠시 후 다시 시도할 수 있어요. 잠시만 기다렸다가 눌러주세요 🌿'
  }
  if (
    m.includes('email rate limit exceeded') ||
    m.includes('over_email_send_rate_limit')
  ) {
    return '메일 발송 한도를 잠시 넘었어요. 1~2분 뒤에 다시 시도해주세요 🌿'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return '인터넷 연결을 확인해주세요. 서버에 연결하지 못했어요.'
  }

  // 위 목록에 없는 경우: 원문을 함께 보여주어 원인 파악을 돕습니다.
  return `문제가 생겼어요: ${message}`
}
