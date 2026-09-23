/* BITXO service worker: red primero, caché de respaldo.
   Las actualizaciones siempre llegan (los ?v= cambian de URL) y sin
   conexión el prado sigue abierto con lo último que se descargó. */
const CACHE = 'bitxo-cache-20260923-1943';
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
  /* version.json jamás se sirve de caché: es el detector de novedades */
  if(new URL(e.request.url).pathname.endsWith('version.json')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'})
        .catch(() => new Response('{}', {headers:{'Content-Type':'application/json'}}))
    );
    return;
  }
  /* la página y todo lo nuestro se revalida siempre con el servidor:
     nada de HTML viejo de la caché HTTP (GitHub Pages cachea 10 min) */
  const same = new URL(e.request.url).origin === location.origin;
  const req = !same ? e.request
    : (e.request.mode==='navigate' ? new Request(e.request.url, {cache:'no-cache', credentials:'same-origin'})
                                   : new Request(e.request, {cache:'no-cache'}));
  e.respondWith(
    fetch(req).then(r => {
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
