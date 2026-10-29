// Service worker: keeps all files of the app for offline use. Cache first,
// so a visitor without a network still gets the last version; a new
// VERSION (bump it with every release) replaces the old cache.
const VERSION = 'chaos-v1';
const FILES = [
  './', 'index.html', 'lorenz.html', 'lorenz96.html', 'karte.html',
  'theme/theme.css', 'theme/theme.js', 'css/kit.css', 'css/app.css',
  'content/texts.de.js', 'content/lorenz.de.js', 'content/lorenz96.de.js', 'content/karte.de.js',
  'js/view.js', 'js/texts.js', 'js/brand.js', 'js/kit.js', 'js/tasks-dialog.js', 'js/offline.js',
  'js/physics.js', 'js/app.js', 'js/lorenz.js', 'js/chaos-lab.js', 'js/lorenz96.js', 'js/karte.js',
  'js/models/fft.js', 'js/models/lorenz96.js', 'js/models/qg2layer.js', 'js/models/compare.js',
  'data/qg-start.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    // files not in the list (none today) are kept after their first load
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
    }
    return res;
  })));
});
