import { useEffect, useState } from 'react'
import { getPhotosByDate } from '../lib/photos'
import PhotoCollage from './PhotoCollage'

// 특정 날짜의 일기 사진을 IndexedDB에서 불러와 콜라주로 보여줍니다.
// 사진이 없으면 아무것도 그리지 않습니다. (사진 없는 기존 일기도 정상)
export default function DiaryPhotos({ date }: { date: string }) {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    const created: string[] = []
    getPhotosByDate(date)
      .then((recs) => {
        if (!alive) return
        const next = recs.map((r) => {
          const u = URL.createObjectURL(r.blob)
          created.push(u)
          return u
        })
        setUrls(next)
      })
      .catch(() => {})
    return () => {
      alive = false
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [date])

  if (!urls.length) return null
  return <PhotoCollage urls={urls} />
}
