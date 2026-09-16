// ============================================================
// PipNex AI — Service Worker
// Strategy:
//   - Static assets: cache-first (fast, offline-friendly)
//   - Navigation:   network-first, offline fallback
//   - API calls:    network-only (never serve stale user/payment data)
//   - POST/PUT/DELETE: skipped entirely
// ============================================================

const CACHE_VERSION = 'pipnex-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache partially failed:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') return;

  // 2. Skip cross-origin (Google Fonts, DeepSeek, TradingView, etc.)
  if (url.origin !== self.location.origin) return;

  // 3. Skip API routes — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // 4. Skip auth / payment / admin routes explicitly
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/payments') ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.startsWith('/api/wallet')
  ) return;

  // 5. Navigation requests → network-first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh index.html
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 6. Static assets → cache-first
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|webmanifest)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 7. Everything else → network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── MESSAGE HANDLER (for skipWaiting from the app) ────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
