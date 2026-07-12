// 일기 사진을 브라우저의 IndexedDB에 저장합니다.
// (용량이 큰 이미지를 Supabase/ localStorage 대신 IndexedDB에 Blob 으로 보관)
// 사진은 일기 날짜(date, "YYYY-MM-DD")로 연결합니다 → Supabase 표 구조 변경 불필요.

const DB_NAME = 'soso-photos'
const STORE = 'photos'
const VERSION = 1

export type PhotoRecord = {
  id: string
  date: string // 일기 날짜 "YYYY-MM-DD"
  blob: Blob // 압축된 이미지
  createdAt: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' })
        os.createIndex('date', 'date', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// 사진 한 장 추가 → 생성된 사진 ID 반환
export async function addPhoto(date: string, blob: Blob): Promise<string> {
  const db = await openDB()
  const id = `photo-${date}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({
      id,
      date,
      blob,
      createdAt: new Date().toISOString(),
    } as PhotoRecord)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
  return id
}

// 특정 날짜의 사진들을 생성순으로 가져오기
export async function getPhotosByDate(date: string): Promise<PhotoRecord[]> {
  const db = await openDB()
  const recs = await new Promise<PhotoRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const idx = tx.objectStore(STORE).index('date')
    const req = idx.getAll(date)
    req.onsuccess = () => resolve((req.result as PhotoRecord[]) ?? [])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return recs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

// 사진 한 장 삭제
export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
