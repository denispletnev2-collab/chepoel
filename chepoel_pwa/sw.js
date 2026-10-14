const CACHE_NAME = 'chepoel-pwa-v3.8.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css?v=3.7.0',
  './css/layout.css?v=3.7.0',
  './css/components.css?v=3.7.0',
  './js/store.js?v=3.7.0',
  './js/ai.js?v=3.7.0',
  './js/profile.js?v=3.7.0',
  './js/ui.js?v=3.7.0',
  './js/app.js?v=3.7.0',
  './assets/data/ru-products.json',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-First strategy so redeployments on Cloudflare take effect immediately
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
