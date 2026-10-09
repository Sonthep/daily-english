// Daily English Service Worker
const CACHE_NAME = 'daily-english-cache-v2';
const OFFLINE_READY_MARKER = '/__daily-english-offline-ready__';
const BUILD_MANIFEST_URL = '/asset-manifest.json';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/logo.svg',
];

async function getBuildAssetUrls() {
  const response = await fetch(BUILD_MANIFEST_URL, { cache: 'no-store' });
  if (!response.ok) return [];

  const manifest = await response.json();
  const urls = new Set();
  for (const entry of Object.values(manifest)) {
    if (entry && typeof entry === 'object') {
      if (typeof entry.file === 'string') urls.add(`/${entry.file}`);
      for (const file of entry.css || []) urls.add(`/${file}`);
      for (const file of entry.assets || []) urls.add(`/${file}`);
    }
  }
  return [...urls];
}

// Install: precache the shell and every generated route chunk in production.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const buildAssets = await getBuildAssetUrls();
        await cache.addAll([...STATIC_PRECACHE, ...buildAssets]);
        if (buildAssets.length > 0) {
          await cache.put(
            OFFLINE_READY_MARKER,
            new Response('ready', { headers: { 'Content-Type': 'text/plain' } })
          );
        }
      } catch (err) {
        console.warn('[SW] Precache partial error:', err);
      }
      await self.skipWaiting();
    })()
  );
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
      await self.clients.claim();
      const cache = await caches.open(CACHE_NAME);
      const isOfflineReady = Boolean(await cache.match(OFFLINE_READY_MARKER));
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.postMessage({ type: 'OFFLINE_READY', ready: isOfflineReady }));
    })
  );
});

// Fetch: smart caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Ignore non-http schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Always bypass AI API and YouTube streaming calls
  if (
    url.pathname.startsWith('/api/openrouter/') ||
    url.hostname.includes('openrouter.ai') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('ytimg.com')
  ) {
    return;
  }

  // 4. Google Fonts: Stale-While-Revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 5. Navigation requests (SPA HTML routing): Network-First, fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 6. Local static assets (/assets/*, images, etc.): Cache-First, then network fallback
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cache and update in background if asset
          fetch(request).then((freshResponse) => {
            if (freshResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, freshResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});
