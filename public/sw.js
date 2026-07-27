/* ─────────────────────────────────────────────
   소소 다이어리 서비스 워커 (Service Worker)
   - 앱을 한 번 열어두면, 인터넷이 없어도 앱 화면이 열리도록 캐싱합니다.
   - 일기/가계부 '데이터'는 Supabase 서버에 있으므로 오프라인에서는
     화면만 열리고, 데이터 저장·불러오기는 인터넷이 있어야 동작합니다.
   ───────────────────────────────────────────── */

// 캐시 이름(버전). 캐싱 방식을 바꾸면 v2, v3... 으로 올리면 옛 캐시가 정리됩니다.
const CACHE = 'soso-diary-v1'

// 설치할 때 미리 저장해 둘 기본 파일들 (앱 '껍데기')
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/clover-icon.svg',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// 1) 설치: 기본 파일을 캐시에 담아둡니다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

// 2) 활성화: 예전 버전 캐시를 정리합니다.
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

// 3) 요청 가로채기
self.addEventListener('fetch', (event) => {
  const req = event.request

  // GET 요청만 다룹니다. (저장/삭제 같은 요청은 그대로 통과)
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 다른 사이트(구글 폰트, Supabase 서버 등)는 건드리지 않고 그대로 둡니다.
  if (url.origin !== self.location.origin) return

  // 페이지 이동(주소로 접속·새로고침): 인터넷 우선, 실패하면 저장해 둔 앱 껍데기
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('/index.html').then((r) => r || caches.match('/')),
      ),
    )
    return
  }

  // 그 외 같은 사이트의 파일(자바스크립트/CSS/이미지 등):
  // 저장된 게 있으면 먼저 보여주고(빠름), 뒤에서 새 버전을 받아 캐시를 갱신합니다.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
