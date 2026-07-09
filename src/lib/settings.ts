// 사용자 설정(배경 사진·글씨체·글씨크기)을 저장/불러오고, 화면에 적용합니다.
import { supabase } from './supabase'
import { backgroundUrl, defaultBackground } from '../config/backgrounds'

export type Settings = {
  nickname: string // 불러줄 이름 (비어 있으면 이메일 앞부분 사용)
  bg: string // 배경 사진 값 (bg1~bg6)
  font: string
  font_size: string
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
  el.style.setProperty('--app-bg', `url("${backgroundUrl(s.bg)}")`)
  el.setAttribute('data-font', s.font)
  el.setAttribute('data-size', s.font_size)
}
