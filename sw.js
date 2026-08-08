const CACHE = 'presupuestos-v2'
const URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/db.js',
  './js/templates.js',
  './js/pdf.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // No fallar si algún recurso no carga
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => { if (k !== CACHE) return caches.delete(k) })))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Solo cachear peticiones http/https (no file://)
  if (!e.request.url.startsWith('http')) return
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return res
      }).catch(() => cached || new Response('Sin conexión', { status: 503 }))
    })
  )
})
