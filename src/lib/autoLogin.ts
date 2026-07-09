// 자동 로그인(로그인 유지) 설정을 다룹니다.
// 보안을 위해 비밀번호는 절대 저장하지 않습니다.
// - localStorage: "자동 로그인" 체크 여부만 저장 ('1' 또는 '0')
// - sessionStorage: 지금 브라우저 세션이 살아있는지 표시 (탭/브라우저를 닫으면 사라짐)
//
// 동작:
//   · 자동 로그인 ON  → 브라우저를 닫았다 다시 열어도 로그인 유지
//   · 자동 로그인 OFF → 새 창(새 세션)으로 열면 다시 로그인 필요 (새로고침은 유지)

const AUTO_KEY = 'soso.autoLogin'
const ACTIVE_KEY = 'soso.sessionActive'

// "자동 로그인" 체크 여부 저장
export function setAutoLogin(on: boolean): void {
  try {
    localStorage.setItem(AUTO_KEY, on ? '1' : '0')
  } catch {
    // 무시
  }
}

// "자동 로그인" 값 읽기 (기본값: 켜짐)
export function getAutoLogin(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== '0'
  } catch {
    return true
  }
}

// 이번 브라우저 세션이 이미 활성 상태로 표시됐는지 (새로고침 구분용)
export function isSessionActive(): boolean {
  try {
    return sessionStorage.getItem(ACTIVE_KEY) === '1'
  } catch {
    return false
  }
}

// 현재 세션을 활성으로 표시 (탭/브라우저를 닫으면 자동으로 지워짐)
export function markSessionActive(): void {
  try {
    sessionStorage.setItem(ACTIVE_KEY, '1')
  } catch {
    // 무시
  }
}
