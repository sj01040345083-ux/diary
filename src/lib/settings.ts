// 사용자 설정(배경색·글씨체·글씨크기)을 저장/불러오고, 화면에 적용합니다.
import { supabase } from './supabase'

export type Settings = {
  bg: string
  font: string
  font_size: string
}

export const defaultSettings: Settings = {
  bg: 'ivory',
  font: 'gowun',
  font_size: 'normal',
}

// 내 설정 불러오기 (없으면 기본값)
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('bg, font, font_size')
    .maybeSingle()
  if (error) throw error
  return data
    ? { bg: data.bg, font: data.font, font_size: data.font_size }
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
      bg: s.bg,
      font: s.font,
      font_size: s.font_size,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

// 선택한 설정을 화면 전체에 즉시 적용합니다.
export function applySettings(s: Settings): void {
  const el = document.documentElement
  el.setAttribute('data-bg', s.bg)
  el.setAttribute('data-font', s.font)
  el.setAttribute('data-size', s.font_size)
}
