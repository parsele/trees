const CACHE_NAME = 'amboseli-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/admin.html',
  '/admin-login.html',
  '/styles.css',
  '/app.js',
  '/admin.js',
  '/ui.js',
  '/logo.svg',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Simple network-first for API, cache-first for navigation/static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // handle API requests - network first
  if (url.pathname.startsWith('/api/')){
    event.respondWith(
      fetch(event.request).then(res => {
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // for navigation and static assets, try cache then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        // optionally cache fetched assets
        if(event.request.method === 'GET' && res && res.status === 200 && res.type !== 'opaque'){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => {
        // fallback to offline page for navigation requests
        if (event.request.mode === 'navigate') return caches.match('/offline.html');
      });
    })
  );
});
