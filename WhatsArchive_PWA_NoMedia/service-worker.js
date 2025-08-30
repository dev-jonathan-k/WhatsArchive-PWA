
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('whatsarchive-v1').then((cache) => {
      return cache.addAll([
        '/index.html',
        '/style.css',
        '/script.js',
        '/manifest.json',
        '/assets/icon-192x192.png',
        '/assets/icon-512x512.png',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
