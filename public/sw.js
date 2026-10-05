// ============================================================
// PipNex AI — Service Worker (v2)
// Strategy:
//   - Navigation:  network-only, offline fallback (NO HTML caching)
//   - Static:      stale-while-revalidate (fast + auto-updates)
//   - API calls:   network-only (never serve stale user data)
//   - Auto-reload on update via controllerchange handler in index.html
// ============================================================

const CACHE_VERSION = 'pipnex-v2';        // ← bump this whenever deploy breaks SW behavior
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL   = '/offline.html';

// ⚠️ Never precache '/' or '/index.html' — that's what causes stale HTML → white screen
const PRECACHE_URLS = [
  OFFLINE_URL,
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
      .then(() =>
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' }));
        })
      )
  );
});

// ─── FETCH ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/sw.js') return;   // never intercept the SW itself

  // 1. NAVIGATION → network-only. No HTML caching ever.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 2. STATIC ASSETS → stale-while-revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|webmanifest)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // 3. EVERYTHING ELSE → network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── MESSAGE HANDLER ────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
