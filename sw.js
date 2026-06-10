/**
 * Data OS Portfolio — Service Worker
 * Strategy: network-first for API/Firebase, cache-first for static assets
 */

const CACHE = 'data-os-v3';
// Resolve against the SW's own location so the same file works at the domain
// root (Netlify) and under a subpath (GitHub Pages /data-os-portfolio/).
const BASE = new URL('./', self.location).pathname;
const OFFLINE_URL = BASE + 'offline.html';

const STATIC_ASSETS = [
  BASE,
  OFFLINE_URL,
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin (Firebase/Google APIs), and Chrome extensions
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) return;

  // Static assets (JS/CSS/fonts) — cache-first, background update
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // HTML navigation — network-first, offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL) || caches.match(BASE)
      )
    );
    return;
  }
});
