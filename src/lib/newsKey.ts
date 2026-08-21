// 뉴스 AI(구글 제미나이) 열쇠를 이 기기(localStorage)에 저장합니다.
// 개인 열쇠라서 서버에 올리지 않고 내 브라우저에만 보관합니다.
const KEY = 'soso-news-gemini-key'

export function getNewsKey(): string {
  try {
    return localStorage.getItem(KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function setNewsKey(value: string): void {
  try {
    const v = value.trim()
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
  } catch {
    // 저장 불가 시 무시
  }
}

export function clearNewsKey(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
