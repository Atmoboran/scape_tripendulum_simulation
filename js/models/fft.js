// Radix-2 fast Fourier transform, in place on separate real/imaginary
// arrays, plus a 2-D transform for an nx × ny grid stored row by row
// (index = j * nx + i). No DOM: runs in the browser (window.FFT) and in
// Node (module.exports) for the tests and validation scripts.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FFT = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Twiddle factors and bit-reversal table per length, built once.
  const plans = new Map();
  function plan(n) {
    let p = plans.get(n);
    if (p) return p;
    if (n & (n - 1)) throw new Error('FFT length must be a power of two: ' + n);
    const rev = new Uint32Array(n);
    const bits = Math.round(Math.log2(n));
    for (let i = 0; i < n; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      rev[i] = r;
    }
    const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
    for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
    p = { rev, cos, sin };
    plans.set(n, p);
    return p;
  }

  // 1-D transform of n values starting at `off` with spacing `stride`.
  // sign = -1: forward (e^{-ikx}), +1: inverse without the 1/n factor.
  const bufRe = new Map(), bufIm = new Map();
  function fft1(re, im, off, stride, n, sign) {
    const { rev, cos, sin } = plan(n);
    let xr = bufRe.get(n), xi = bufIm.get(n);
    if (!xr) { xr = new Float64Array(n); xi = new Float64Array(n); bufRe.set(n, xr); bufIm.set(n, xi); }
    for (let i = 0; i < n; i++) { const s = off + rev[i] * stride; xr[i] = re[s]; xi[i] = im[s]; }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let start = 0; start < n; start += size) {
        for (let k = 0; k < half; k++) {
          const wr = cos[k * step], wi = sign * sin[k * step];
          const a = start + k, b = a + half;
          const tr = xr[b] * wr - xi[b] * wi, ti = xr[b] * wi + xi[b] * wr;
          xr[b] = xr[a] - tr; xi[b] = xi[a] - ti;
          xr[a] += tr; xi[a] += ti;
        }
      }
    }
    for (let i = 0; i < n; i++) { const s = off + i * stride; re[s] = xr[i]; im[s] = xi[i]; }
  }

  // 2-D transform in place. Forward (inverse = false) is unnormalised; the
  // inverse divides by nx*ny, so inverse(forward(f)) = f. Rows are
  // transformed one by one in place; the columns all at once, with every
  // butterfly running along whole rows -- contiguous memory, no copies.
  function fft2(re, im, nx, ny, inverse) {
    const sign = inverse ? 1 : -1;
    // rows
    const px = plan(nx);
    for (let j = 0; j < ny; j++) {
      const o = j * nx;
      for (let i = 0; i < nx; i++) {
        const r = px.rev[i];
        if (r > i) {
          let t = re[o + i]; re[o + i] = re[o + r]; re[o + r] = t;
          t = im[o + i]; im[o + i] = im[o + r]; im[o + r] = t;
        }
      }
      for (let size = 2; size <= nx; size <<= 1) {
        const half = size >> 1, step = nx / size;
        for (let start = 0; start < nx; start += size) {
          for (let k = 0; k < half; k++) {
            const wr = px.cos[k * step], wi = sign * px.sin[k * step];
            const a = o + start + k, b = a + half;
            const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
            re[b] = re[a] - tr; im[b] = im[a] - ti;
            re[a] += tr; im[a] += ti;
          }
        }
      }
    }
    // columns: swap whole rows into bit-reversed order, then butterflies
    // between pairs of rows
    const py = plan(ny);
    for (let j = 0; j < ny; j++) {
      const r = py.rev[j];
      if (r <= j) continue;
      const a = j * nx, b = r * nx;
      for (let i = 0; i < nx; i++) {
        let t = re[a + i]; re[a + i] = re[b + i]; re[b + i] = t;
        t = im[a + i]; im[a + i] = im[b + i]; im[b + i] = t;
      }
    }
    for (let size = 2; size <= ny; size <<= 1) {
      const half = size >> 1, step = ny / size;
      for (let start = 0; start < ny; start += size) {
        for (let k = 0; k < half; k++) {
          const wr = py.cos[k * step], wi = sign * py.sin[k * step];
          const a = (start + k) * nx, b = a + half * nx;
          for (let i = 0; i < nx; i++) {
            const tr = re[b + i] * wr - im[b + i] * wi, ti = re[b + i] * wi + im[b + i] * wr;
            re[b + i] = re[a + i] - tr; im[b + i] = im[a + i] - ti;
            re[a + i] += tr; im[a + i] += ti;
          }
        }
      }
    }
    if (inverse) {
      const s = 1 / (nx * ny);
      for (let k = 0; k < re.length; k++) { re[k] *= s; im[k] *= s; }
    }
  }

  return { fft1, fft2 };
});
