// 사용자 설정(배경 사진·글씨체·글씨크기)을 저장/불러오고, 화면에 적용합니다.
import { supabase } from './supabase'
import { backgroundUrl, defaultBackground } from '../config/backgrounds'

export type Settings = {
  nickname: string // 불러줄 이름 (비어 있으면 이메일 앞부분 사용)
  bg: string // 배경 사진 값 (bg1~bg6, 또는 'custom' = 내가 올린 사진)
  font: string
  font_size: string
}

// 사용자가 직접 올린 배경 사진을 나타내는 특별한 값
export const CUSTOM_BG = 'custom'
// 올린 배경 사진(Data URL)을 저장해 두는 localStorage 키 (기기별 저장)
const CUSTOM_BG_KEY = 'soso.customBg'

// 내가 올린 배경 사진(Data URL) 가져오기 (없으면 null)
export function getCustomBg(): string | null {
  try {
    return localStorage.getItem(CUSTOM_BG_KEY)
  } catch {
    return null
  }
}

// 내가 올린 배경 사진 저장. 용량 초과 등으로 실패하면 false 를 돌려줍니다.
export function setCustomBg(dataUrl: string): boolean {
  try {
    localStorage.setItem(CUSTOM_BG_KEY, dataUrl)
    return true
  } catch {
    return false
  }
}

// 내가 올린 배경 사진 지우기
export function clearCustomBg(): void {
  try {
    localStorage.removeItem(CUSTOM_BG_KEY)
  } catch {
    // 무시
  }
}

// 설정의 bg 값을 실제 배경 이미지 주소로 바꿉니다.
// - 'custom' 이면 내가 올린 사진(Data URL), 없으면 기본 배경으로 대체
// - 그 외에는 기존 프리셋(bg1~bg6) 주소
export function resolveBgUrl(bg: string): string {
  if (bg === CUSTOM_BG) {
    const custom = getCustomBg()
    if (custom) return custom
    return backgroundUrl(defaultBackground)
  }
  return backgroundUrl(bg)
}

export const defaultSettings: Settings = {
  nickname: '',
  bg: defaultBackground,
  font: 'gowun',
  font_size: 'normal',
}

// ── 로컬 캐시 ──────────────────────────────────
// 서버(Supabase) 응답을 기다리지 않고, 앱을 열자마자 지난번 배경·글씨체를
// 즉시 적용하기 위한 보조 저장소입니다. (최종 저장은 여전히 서버)
const LOCAL_KEY = 'soso.settings'

export function cacheSettingsLocal(s: Settings): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s))
  } catch {
    // 저장 실패는 조용히 무시 (시크릿 모드 등)
  }
}

export function getCachedSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...defaultSettings, ...parsed }
  } catch {
    return null
  }
}

// 내 설정 불러오기 (없으면 기본값)
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('nickname, bg, font, font_size')
    .maybeSingle()
  if (error) throw error
  const result: Settings = data
    ? {
        nickname: data.nickname ?? '',
        bg: data.bg,
        font: data.font,
        font_size: data.font_size,
      }
    : { ...defaultSettings }
  // 이 기기에서 마지막으로 '내 사진'을 배경으로 골랐다면, 서버 값으로 덮지 않고 유지합니다.
  // (내가 올린 배경은 기기별 localStorage 에만 저장되므로, 저장 버튼을 안 눌러도 유지되게)
  const cached = getCachedSettings()
  if (getCustomBg() && cached?.bg === CUSTOM_BG) {
    result.bg = CUSTOM_BG
  }
  cacheSettingsLocal(result) // 다음 접속 때 바로 적용되도록 캐시
  return result
}

// 설정 저장 (한 사용자당 한 줄, 있으면 수정)
export async function saveSettings(
  userId: string,
  s: Settings,
): Promise<void> {
  const { error } = await supabase.from('settings').upsert(
    {
      user_id: userId,
      nickname: s.nickname.trim(),
      bg: s.bg,
      font: s.font,
      font_size: s.font_size,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
  cacheSettingsLocal(s) // 로컬 캐시도 최신으로
}

// 닉네임만 저장합니다. (가입 시 이름을 설정에 저장하는 용도)
export async function saveNickname(
  userId: string,
  nickname: string,
): Promise<void> {
  const { error } = await supabase.from('settings').upsert(
    {
      user_id: userId,
      nickname: nickname.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

// 화면에 보여줄 이름을 정합니다.
// 1) 사용자가 정한 닉네임 → 2) 가입 때 이름 → 3) 이메일의 @ 앞부분
export function resolveDisplayName(
  nickname: string | null | undefined,
  metadataName: string | null | undefined,
  email: string | null | undefined,
): string {
  const n = (nickname ?? '').trim()
  if (n) return n
  const m = (metadataName ?? '').trim()
  if (m) return m
  const e = email ?? ''
  return e.includes('@') ? e.split('@')[0] : e || '사용자'
}

// 선택한 설정을 화면 전체에 즉시 적용합니다.
export function applySettings(s: Settings): void {
  const el = document.documentElement
  // 배경 사진을 CSS 변수로 지정 → 모든 화면(.home-screen/.auth-screen)이 이 값을 씀
  el.style.setProperty('--app-bg', `url("${resolveBgUrl(s.bg)}")`)
  el.setAttribute('data-font', s.font)
  el.setAttribute('data-size', s.font_size)
}
