const OFFLINE_CACHE = 'ielts-maintenance-fallback-v1';
const FALLBACK_URLS = ['/maintenance.html', '/server-maintenance.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(FALLBACK_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('ielts-maintenance-fallback-') && k !== OFFLINE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req || req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API, SSE stream, or audio endpoints
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') return;

  // Serve cached meme image offline if network fails
  if (url.pathname === '/server-maintenance.jpg') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/server-maintenance.jpg'))
    );
    return;
  }

  // Only intercept top-level HTML page navigations (Network-First -> maintenance.html on offline/5xx)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status >= 500) {
            return caches.match('/maintenance.html').then((cached) => cached || res);
          }
          return res;
        })
        .catch(() => caches.match('/maintenance.html'))
    );
  }
});
