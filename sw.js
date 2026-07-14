const C = 'liftlog-v2';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './icon-180.png'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// netwerk eerst (altijd vers als er verbinding is), cache als fallback voor de gym zonder bereik
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(e.request, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const cache = await caches.open(C);
        cache.put(e.request, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
