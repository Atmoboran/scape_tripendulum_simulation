// Lorenz-96 model (Lorenz 1996): N variables on a ring,
//   dX_i/dt = (X_{i+1} - X_{i-2}) X_{i-1} - X_i + F,   X_{i+N} = X_i,
// integrated with classical Runge-Kutta 4 at a fixed step. Pure functions
// on Float64Arrays, no DOM: window.Lorenz96 in the browser, module.exports
// in Node (tests, validation scripts).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Lorenz96 = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Standard configuration, checked in docs/validierung.md: 40 variables,
  // forcing 8 -- chaotic with a largest Lyapunov exponent of about 1.7 per
  // model time unit. DT = 0.01 is well inside RK4's stability range.
  const DEFAULTS = { N: 40, F: 8, dt: 0.01 };
  // Long-run standard deviation of one X_i for N = 40, F = 8 (measured over
  // 10 000 time units, see scripts/validate-lorenz96.js). Two unrelated
  // states differ by sqrt(2) times this in the RMS -- "100 %" difference.
  const CLIM_STD = 3.63;
  // Lorenz's own reading: one time unit is about five days of the real
  // atmosphere's error growth. A model analogy, not a calendar.
  const DAYS_PER_UNIT = 5;

  const mod = (i, n) => ((i % n) + n) % n;

  // Right-hand side into `out`.
  function rhs(x, F, out) {
    const n = x.length;
    for (let i = 0; i < n; i++) {
      out[i] = (x[mod(i + 1, n)] - x[mod(i - 2, n)]) * x[mod(i - 1, n)] - x[i] + F;
    }
    return out;
  }

  // Work arrays per length, so a step allocates nothing.
  const work = new Map();
  function buffers(n) {
    let w = work.get(n);
    if (!w) { w = [0, 1, 2, 3, 4].map(() => new Float64Array(n)); work.set(n, w); }
    return w;
  }

  // One RK4 step in place.
  function step(x, dt, F) {
    const n = x.length;
    const [k1, k2, k3, k4, y] = buffers(n);
    rhs(x, F, k1);
    for (let i = 0; i < n; i++) y[i] = x[i] + 0.5 * dt * k1[i];
    rhs(y, F, k2);
    for (let i = 0; i < n; i++) y[i] = x[i] + 0.5 * dt * k2[i];
    rhs(y, F, k3);
    for (let i = 0; i < n; i++) y[i] = x[i] + dt * k3[i];
    rhs(y, F, k4);
    for (let i = 0; i < n; i++) x[i] += dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return x;
  }

  // Small seeded generator (mulberry32): the same seed gives the same
  // start on every device.
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A start on the attractor: X = F plus a little seeded noise, then
  // `spin` time units of integration so the transient is gone.
  function initialState(seed, opts) {
    const o = Object.assign({}, DEFAULTS, opts);
    const r = rng(seed);
    const x = new Float64Array(o.N);
    for (let i = 0; i < o.N; i++) x[i] = o.F + 0.01 * (r() - 0.5);
    const spin = o.spin === undefined ? 20 : o.spin;
    for (let s = 0, n = Math.round(spin / o.dt); s < n; s++) step(x, o.dt, o.F);
    return x;
  }

  // Copy of x with `amount` added to variable `index`.
  function perturb(x, index, amount) {
    const y = Float64Array.from(x);
    y[mod(index, y.length)] += amount;
    return y;
  }

  function rmsDiff(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
    return Math.sqrt(s / a.length);
  }
  // RMS difference as a share of the difference between two unrelated
  // states (1 = "as different as two random days").
  function relDiff(a, b) { return rmsDiff(a, b) / (Math.SQRT2 * CLIM_STD); }

  function isFiniteState(x) {
    for (let i = 0; i < x.length; i++) if (!Number.isFinite(x[i])) return false;
    return true;
  }

  return { DEFAULTS, CLIM_STD, DAYS_PER_UNIT, rhs, step, rng, initialState, perturb, rmsDiff, relDiff, isFiniteState };
});
