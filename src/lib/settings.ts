// 사용자 설정(배경색·글씨체·글씨크기)을 저장/불러오고, 화면에 적용합니다.
import { supabase } from './supabase'

export type Settings = {
  nickname: string // 불러줄 이름 (비어 있으면 이메일 앞부분 사용)
  bg: string
  font: string
  font_size: string
}

export const defaultSettings: Settings = {
  nickname: '',
  bg: 'ivory',
  font: 'gowun',
  font_size: 'normal',
}

// 내 설정 불러오기 (없으면 기본값)
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('nickname, bg, font, font_size')
    .maybeSingle()
  if (error) throw error
  return data
    ? {
        nickname: data.nickname ?? '',
        bg: data.bg,
        font: data.font,
        font_size: data.font_size,
      }
    : { ...defaultSettings }
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
  el.setAttribute('data-bg', s.bg)
  el.setAttribute('data-font', s.font)
  el.setAttribute('data-size', s.font_size)
}
