import { useEffect, useState } from 'react'
import { getPhotosByDiary, getPhotosByDate } from '../lib/photos'
import PhotoCollage from './PhotoCollage'

// 일기 사진을 서버(Storage)에서 불러와 콜라주로 보여줍니다.
// - diaryId: 그 일기 폴더의 사진 (일기별로 따로 저장)
// - legacyDate: 예전(날짜 폴더) 사진. 같은 날 '첫 일기'에만 넘겨서 함께 보여줍니다.
//   (예전엔 사진을 날짜로 저장해서, 기존 사진이 사라지지 않도록 호환 처리)
export default function DiaryPhotos({
  diaryId,
  legacyDate,
}: {
  diaryId: string
  legacyDate?: string
}) {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    Promise.all([
      getPhotosByDiary(diaryId),
      legacyDate ? getPhotosByDate(legacyDate) : Promise.resolve([]),
    ])
      .then(([own, legacy]) => {
        if (!alive) return
        // 예전 사진(legacy) 먼저, 그다음 이 일기의 사진
        setUrls([...legacy.map((r) => r.url), ...own.map((r) => r.url)])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [diaryId, legacyDate])

  if (!urls.length) return null
  return <PhotoCollage urls={urls} />
}
