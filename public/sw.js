/* ─────────────────────────────────────────────
   소소 다이어리 서비스 워커 (Service Worker)
   - 인터넷이 있으면 '항상 최신' 화면을 보여주고(network-first),
     인터넷이 없을 때만 저장해 둔 화면을 보여줍니다(오프라인 대비).
   - 일기/가계부 '데이터'는 Supabase 서버에 있으므로 오프라인에서는
     화면만 열리고, 데이터 저장·불러오기는 인터넷이 있어야 동작합니다.
   ───────────────────────────────────────────── */

// 캐시 이름(버전). 방식을 바꾸면 v3, v4... 로 올리면 옛 캐시가 자동 정리됩니다.
const CACHE = 'soso-diary-v2'

// 설치할 때 미리 저장해 둘 기본 파일들 (오프라인 대비용 앱 '껍데기')
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/clover-icon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// 1) 설치: 기본 파일을 담아두고, 새 버전을 곧바로 활성화합니다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

// 2) 활성화: 예전 버전 캐시를 모두 지우고, 바로 제어권을 가져옵니다.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// 3) 요청 가로채기 — '인터넷 우선', 실패하면 캐시(오프라인)
self.addEventListener('fetch', (event) => {
  const req = event.request

  // GET 요청만 다룹니다. (저장/삭제 같은 요청은 그대로 통과)
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 다른 사이트(구글 폰트, Supabase 서버 등)는 건드리지 않고 그대로 둡니다.
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 성공하면 최신 응답을 캐시에 저장(오프라인 대비)하고 그대로 보여줍니다.
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        // 인터넷이 안 되면: 저장해 둔 것 → (페이지 이동이면) 앱 껍데기
        const cached = await caches.match(req)
        if (cached) return cached
        if (req.mode === 'navigate') {
          return (
            (await caches.match('/index.html')) || (await caches.match('/'))
          )
        }
        return Response.error()
      }),
  )
})
