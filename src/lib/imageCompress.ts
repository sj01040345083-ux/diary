// 사진 파일을 저장하기 좋은 크기로 줄여 Blob 으로 돌려줍니다.
// - 긴 변 최대 1600px
// - JPEG 로 압축 (화질 0.82)
// - 이미지 방향(EXIF) 보정: createImageBitmap 의 imageOrientation 사용

const MAX_EDGE = 1600
const QUALITY = 0.82

function loadImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('not an image')
  }

  // 원본 크기와 그릴 소스 준비 (방향 보정 포함)
  let srcW = 0
  let srcH = 0
  let source: CanvasImageSource
  let bitmap: ImageBitmap | null = null
  let fallbackUrl = ''

  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    srcW = bitmap.width
    srcH = bitmap.height
    source = bitmap
  } catch {
    // 구형 브라우저 대비: HTMLImageElement 로 폴백
    fallbackUrl = URL.createObjectURL(file)
    const img = await loadImageEl(fallbackUrl)
    srcW = img.naturalWidth
    srcH = img.naturalHeight
    source = img
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH))
    const w = Math.max(1, Math.round(srcW * scale))
    const h = Math.max(1, Math.round(srcH * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas context')
    ctx.drawImage(source, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    )
    if (!blob) throw new Error('compress failed')
    return blob
  } finally {
    if (bitmap) bitmap.close()
    if (fallbackUrl) URL.revokeObjectURL(fallbackUrl)
  }
}

// Blob 을 base64 Data URL 문자열로 바꿉니다. (localStorage 에 그대로 저장하기 위함)
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

// 배경으로 쓸 이미지 파일을 압축한 뒤 Data URL 로 돌려줍니다.
// (배경은 화면을 꽉 채우므로 사진 첨부와 같은 1600px 기준으로 줄입니다.)
export async function fileToBackgroundDataUrl(file: File): Promise<string> {
  const blob = await compressImage(file)
  return blobToDataUrl(blob)
}
