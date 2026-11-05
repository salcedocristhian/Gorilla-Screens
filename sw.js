/* Service worker: network first, cache as fallback, so the app opens with weak signal in the field. */
const CACHE = 'gss-v1';
const SHELL = ['./', './index.html', './css/app.css', './js/model.js', './js/storage.js', './js/scene3d.js', './js/plan.js', './js/quote.js', './js/app.js', './assets/gorilla-logo.png', './assets/icon-192.png', './manifest.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('openstreetmap.org') || u.hostname.includes('google')) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok && (u.origin === location.origin || SHELL.includes(e.request.url))) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
