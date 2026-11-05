// FitID web — offline cache. sync-lib.js bumps VERSION whenever the libraries change.
const VERSION = 'fitid-202611051017';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css', 'lib/shared.css',
  'js/storage-shim.js', 'js/app.js', 'js/converter-view.js', 'js/paste.js', 'js/check-view.js',
  'lib/units.js', 'lib/standards.js', 'lib/engine.js', 'lib/profile.js', 'lib/table.js',
  'lib/summary-view.js', 'lib/converter.js', 'lib/brands.js',
  'icons/icon.svg', 'icons/icon32.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first (so updates show up), cache as the offline fallback.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
