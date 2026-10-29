// Service worker: keeps all files of the app for offline use.
// Network first: with a connection every file comes fresh from the server
// (and the stored copy is updated), so changes reach visitors without any
// version bump. Without a connection -- or if the server takes longer than
// a few seconds -- the stored copy is used. All files are stored on the
// first visit, so every chapter works offline afterwards, not only the
// ones already opened.
const CACHE = 'chaos';
const TIMEOUT_MS = 4000;
const FILES = [
  './', 'index.html', 'lorenz.html', 'karte.html',
  'theme/theme.css', 'theme/theme.js', 'css/kit.css', 'css/app.css',
  'content/texts.de.js', 'content/lorenz.de.js', 'content/karte.de.js',
  'js/view.js', 'js/texts.js', 'js/brand.js', 'js/kit.js', 'js/tasks-dialog.js', 'js/offline.js',
  'js/physics.js', 'js/app.js', 'js/lorenz.js', 'js/chaos-lab.js', 'js/karte.js',
  'js/models/fft.js', 'js/models/qg2layer.js', 'js/models/compare.js',
  'data/qg-start.js'
];

self.addEventListener('install', (e) => {
  // `reload` skips the browser's own HTTP cache, so the stored copy is current
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  // caches of earlier versions of this file (e.g. 'chaos-v1') are not needed any more
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const fresh = fetch(req, { cache: 'no-cache' }).then(async (res) => {
    if (res.ok) await (await caches.open(CACHE)).put(req, res.clone());
    return res;
  });
  // keep the worker alive until the fresh copy is stored, even if the page
  // was already answered from the store
  e.waitUntil(fresh.catch(() => {}));
  e.respondWith((async () => {
    const stored = () => caches.match(req, { ignoreSearch: true });
    // a slow network falls back to the stored copy after TIMEOUT_MS
    const timeout = new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS, null));
    try {
      const res = await Promise.race([fresh, timeout]);
      if (res) return res;
      return (await stored()) || (await fresh);
    } catch (err) {
      const hit = await stored();
      if (hit) return hit;
      throw err;
    }
  })());
});
