/* BITXO service worker: red primero, caché de respaldo.
   Las actualizaciones siempre llegan (los ?v= cambian de URL) y sin
   conexión el prado sigue abierto con lo último que se descargó. */
const CACHE = 'bitxo-cache-20260704-0937';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if(r.ok && new URL(e.request.url).origin === location.origin){
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() =>
      caches.match(e.request, {ignoreSearch:true})
        .then(m => m || caches.match('index.html', {ignoreSearch:true}))
    )
  );
});
