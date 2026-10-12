// Fills the brand slots of the page from THEME.brand (theme/theme.js):
//   [data-brand="logo"]     wordmark markup
//   [data-brand="name"]     the institution's name inside running text
//   [data-brand="claim"]    claim / tagline
//   [data-brand="contact"]  address block
// and sets the page title suffix, favicon and browser colour.
(function () {
  'use strict';
  var B = (window.THEME && window.THEME.brand) || {};
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  each('[data-brand="logo"]', function (el) {
    el.innerHTML = B.logoHtml || B.name || '';
    if (B.logoLabel && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', B.logoLabel);
  });
  each('[data-brand="name"]', function (el) { el.textContent = B.name || ''; });
  each('[data-brand="claim"]', function (el) { el.textContent = B.claim || ''; el.hidden = !B.claim; });
  each('[data-brand="contact"]', function (el) { el.innerHTML = B.contactHtml || ''; el.hidden = !B.contactHtml; });
  if (B.titleSuffix && document.title.indexOf(B.titleSuffix) < 0) document.title += B.titleSuffix;
  if (B.themeColor) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = B.themeColor;
  }
  if (B.favicon) {
    var l = document.createElement('link');
    l.rel = 'icon';
    l.href = 'data:image/svg+xml,' + encodeURIComponent(B.favicon);
    document.head.appendChild(l);
  }
})();
