// 일기 사진을 Supabase Storage(서버)에 저장합니다.
// → 폰·PC 어느 기기에서든 같은 사진을 볼 수 있습니다.
// 저장 위치(경로): "<사용자ID>/<날짜>/<파일명>.jpg"
//   (Storage 접근 규칙으로 본인 폴더만 읽고/쓰게 제한)
import { supabase } from './supabase'

const BUCKET = 'diary-photos'

export type StoredPhoto = {
  path: string // 서버 내 경로 (삭제에 사용)
  url: string // 화면 표시용 서명 URL
}

// 현재 로그인한 사용자 ID
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// 사진 한 장 업로드 (압축된 Blob)
export async function uploadPhoto(
  userId: string,
  date: string,
  blob: Blob,
): Promise<void> {
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `${userId}/${date}/${Date.now()}-${rand}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
}

// 특정 날짜의 사진 목록 (생성순) → 표시용 서명 URL 포함
export async function getPhotosByDate(date: string): Promise<StoredPhoto[]> {
  const userId = await currentUserId()
  if (!userId) return []
  const prefix = `${userId}/${date}`
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error || !data) return []
  // 폴더가 아닌 실제 파일만 (파일은 id 가 있음)
  const paths = data.filter((f) => f.id).map((f) => `${prefix}/${f.name}`)
  if (!paths.length) return []
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600) // 1시간짜리 표시용 URL
  if (!signed) return []
  return signed
    .filter((s) => s.signedUrl)
    .map((s) => ({ path: s.path ?? '', url: s.signedUrl as string }))
}

// 사진 한 장 삭제 (경로로)
export async function deletePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
