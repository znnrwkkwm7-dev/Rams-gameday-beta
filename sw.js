// Rams GameDay v1.3.3 cache-reset service worker
// Replaces the older caching worker, clears its caches, and deliberately
// does not intercept fetches so the app always receives the current deploy.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
