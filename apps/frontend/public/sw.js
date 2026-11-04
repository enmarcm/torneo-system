/*
  Service worker mínimo: existe para que el sitio sea instalable y para que,
  sin conexión, se vea una pantalla de aviso en lugar del error del navegador.
  No guarda API, sockets ni archivos con hash: los marcadores en vivo deben
  venir siempre de la red.
*/
const CACHE = 'llf-shell-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo navegaciones: el resto va directo a la red, sin intermediarios.
  if (req.mode !== 'navigate') return;
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
});
