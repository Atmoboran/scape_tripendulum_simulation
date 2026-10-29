// Offline: after the first visit a service worker (sw.js) keeps every file
// of the app, so it starts without a network. Only over http(s) -- a page
// opened straight from disk (file://) needs no help and cannot register one.
(() => {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode is a bonus */ });
  });
})();
