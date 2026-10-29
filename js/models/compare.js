// Comparison logic shared by both experiments (and the validation
// scripts): how two runs drift apart, and how fast. Pure functions, no DOM:
// window.Compare in the browser, module.exports in Node.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Compare = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Records (time, relative difference) pairs of one run. "Relative" means:
  // RMS difference divided by the RMS difference of two unrelated states of
  // the model, so 1 (100 %) is "as different as two random days".
  class Record {
    constructor() { this.t = []; this.e = []; }
    push(t, e) { this.t.push(t); this.e.push(e); }
    clear() { this.t.length = 0; this.e.length = 0; }
    get last() { return this.e.length ? this.e[this.e.length - 1] : NaN; }
  }

  // Growth rate of a small difference: least-squares slope of ln(e) over
  // the samples with lo < e < hi. Small differences first have to line up
  // with the fastest-growing pattern (a transient that can even shrink) and
  // large ones saturate, so the window sits between both: by default from
  // 10 times the start difference up to 20 % (see docs/validierung.md). A
  // window spanning less than two doublings gives no estimate -- the start
  // difference was then too large to show exponential growth at all.
  // Returns { rate (1/time), doubling (time), n } or null.
  function growth(rec, lo, hi) {
    const e0 = rec.e[0];
    lo = lo === undefined ? 10 * e0 : lo;
    hi = hi === undefined ? 0.2 : hi;
    if (!(hi / lo >= 4)) return null;
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0, t0 = Infinity, t1 = -Infinity;
    for (let k = 0; k < rec.e.length; k++) {
      const e = rec.e[k];
      if (!(e > lo && e < hi)) continue;
      const x = rec.t[k], y = Math.log(e);
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
      t0 = Math.min(t0, x); t1 = Math.max(t1, x);
    }
    // at least a few samples spread over some time, else no estimate
    if (n < 5 || !(t1 > t0)) return null;
    const rate = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    if (!(rate > 0)) return { rate, doubling: Infinity, n };
    return { rate, doubling: Math.LN2 / rate, n };
  }

  // First time the difference passes `level` (e.g. 0.5: half as different
  // as two random states), or null.
  function timeTo(rec, level) {
    for (let k = 0; k < rec.e.length; k++) if (rec.e[k] >= level) return rec.t[k];
    return null;
  }

  return { Record, growth, timeTo };
});
