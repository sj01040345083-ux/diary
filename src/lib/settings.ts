// 사용자 설정(배경 사진·글씨체·글씨크기)을 저장/불러오고, 화면에 적용합니다.
import { supabase } from './supabase'
import { backgroundUrl, defaultBackground, PLAIN_VALUE } from '../config/backgrounds'

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

// 설정의 bg 값을 '배경 사진 주소'로 바꿉니다. (사진이 없으면 빈 문자열 → 밝은 단색)
// - 'plain' 이면 사진 없음(빈 문자열)
// - 'custom' 이면 내가 올린 사진(Data URL), 없으면 빈 문자열
// - 그 외에는 기존 프리셋(bg1~bg6) 사진 주소
export function resolveBgPhoto(bg: string): string {
  if (bg === PLAIN_VALUE) return ''
  if (bg === CUSTOM_BG) return getCustomBg() ?? ''
  return backgroundUrl(bg)
}

// 예전 기본값(숲 사진 'bg1' 또는 잠깐 쓰였던 'olive')을 새 기본(밝은 단색)으로
// '한 번만' 옮겨줍니다. (직접 다른 사진을 고른 사용자는 그대로 둡니다)
const BG_MIGRATED_KEY = 'soso.bgPlainMigrated'
function migrateLegacyBg(s: Settings): Settings {
  try {
    if (!localStorage.getItem(BG_MIGRATED_KEY)) {
      localStorage.setItem(BG_MIGRATED_KEY, '1')
      if (s.bg === 'bg1' || s.bg === 'olive') return { ...s, bg: PLAIN_VALUE }
    }
  } catch {
    // 무시
  }
  return s
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
    return migrateLegacyBg({ ...defaultSettings, ...parsed })
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
  const migrated = migrateLegacyBg(result)
  cacheSettingsLocal(migrated) // 다음 접속 때 바로 적용되도록 캐시
  return migrated
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
  // 배경 사진이 있으면 그 사진을, 없으면 'none'(→ 올리브 단색이 보임)을 지정합니다.
  const photo = resolveBgPhoto(s.bg)
  el.style.setProperty('--app-bg-photo', photo ? `url("${photo}")` : 'none')
  el.setAttribute('data-font', s.font)
  el.setAttribute('data-size', s.font_size)
}
