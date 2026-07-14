import { useEffect, useState } from 'react'
import { getPhotosByDate } from '../lib/photos'
import PhotoCollage from './PhotoCollage'

// 특정 날짜의 일기 사진을 서버(Storage)에서 불러와 콜라주로 보여줍니다.
// 사진이 없으면 아무것도 그리지 않습니다. (사진 없는 기존 일기도 정상)
export default function DiaryPhotos({ date }: { date: string }) {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    getPhotosByDate(date)
      .then((recs) => {
        if (!alive) return
        setUrls(recs.map((r) => r.url))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [date])

  if (!urls.length) return null
  return <PhotoCollage urls={urls} />
}
