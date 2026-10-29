// Two-layer quasi-geostrophic model (Phillips 1956) on a doubly periodic
// beta-plane with an imposed vertical shear -- the standard idealised model
// of mid-latitude weather systems. Formulation and default parameters as in
// the pyqg two-layer model (Abernathey et al.), written here from scratch:
//
//   q1 = ∇²ψ1 + F1 (ψ2 − ψ1),        q2 = ∇²ψ2 + F2 (ψ1 − ψ2)
//   ∂t q_m + J(ψ_m, q_m) + U_m ∂x q_m + Qy_m ∂x ψ_m = −δ_m2 r_ek ∇²ψ2
//   Qy1 = β + F1 (U1 − U2),          Qy2 = β − F2 (U1 − U2)
//
// ψ_m: streamfunction of layer m (≈ pressure / f0, the flow follows its
// isolines), q_m: potential vorticity. The temperature of the column is
// proportional to the thickness ψ1 − ψ2 (thermal wind). Pseudo-spectral in
// space with the 2/3 rule against aliasing, 3rd-order Adams-Bashforth in
// time, scale-selective hyperviscosity (∇⁸) and pyqg's exponential filter
// at the smallest scales. No DOM: window.QG2 in the browser, module.exports
// in Node.
(function (root, factory) {
  const fft = (typeof module === 'object' && module.exports) ? require('./fft.js') : root.FFT;
  const api = factory(fft);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QG2 = api;
})(typeof self !== 'undefined' ? self : this, function (FFT) {
  'use strict';

  const DAY = 86400;
  // Atmosphere-like mid-latitude channel (docs/modelle.md): 8000 km box on
  // a 32² grid (250 km cells), deformation radius 500 km, two equal layers,
  // 10 m/s shear between them, beta at about 45° N, friction at the ground
  // with a 1-day e-folding time. dt = 900 s keeps u·k_max·dt below AB3's
  // limit of 0.72 for winds up to ~90 m/s (docs/numerik.md).
  // `hyper`: e-folding time (s) of the ∇⁸ damping at the smallest kept scale.
  const DEFAULTS = {
    nx: 32, ny: 32, L: 8e6, W: 8e6,
    beta: 1.6e-11, rd: 5e5, delta: 1,
    U1: 10, U2: 0, rek: 1.2e-5,
    dt: 900, filterfac: 23.6, hyper: 3 * 3600
  };
  // The original pyqg defaults (ocean-like eddies, errors double only every
  // ~20 days) -- kept for the validation scripts.
  const PYQG = {
    nx: 64, ny: 64, L: 1e6, W: 1e6,
    beta: 1.5e-11, rd: 15000, delta: 0.25,
    U1: 0.025, U2: 0, rek: 5.787e-7,
    dt: 7200, filterfac: 23.6, hyper: 0
  };

  class Model {
    constructor(opts) {
      const p = this.p = Object.assign({}, DEFAULTS, opts);
      const nx = p.nx, ny = p.ny, n = nx * ny;
      this.nx = nx; this.ny = ny; this.n = n;
      this.dx = p.L / nx; this.dy = p.W / ny;
      this.F1 = 1 / (p.rd * p.rd * (1 + p.delta));
      this.F2 = p.delta * this.F1;
      this.Qy1 = p.beta + this.F1 * (p.U1 - p.U2);
      this.Qy2 = p.beta - this.F2 * (p.U1 - p.U2);

      // wavenumbers (Nyquist entries zeroed for derivatives) and filter
      this.kx = new Float64Array(n); this.ky = new Float64Array(n); this.kk = new Float64Array(n);
      this.filter = new Float64Array(n);
      this.dealias = new Float64Array(n);
      const wn = (i, m, len) => (i === m / 2 ? 0 : (i < m / 2 ? i : i - m)) * 2 * Math.PI / len;
      const wnFull = (i, m, len) => (i < m / 2 ? i : i - m) * 2 * Math.PI / len;
      const cphi = 0.65 * Math.PI;
      // largest wavenumber kept by the 2/3 rule; the hyperviscosity is
      // scaled to it so it bites where enstrophy would otherwise pile up
      const kcut = (2 / 3) * Math.PI / Math.max(this.dx, this.dy);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const k = j * nx + i;
          this.kx[k] = wn(i, nx, p.L); this.ky[k] = wn(j, ny, p.W);
          const fx = wnFull(i, nx, p.L), fy = wnFull(j, ny, p.W);
          this.kk[k] = fx * fx + fy * fy;
          const w = Math.sqrt((fx * this.dx) ** 2 + (fy * this.dy) ** 2);
          // pyqg's filter acts once per step; scaled to a 900 s step here so
          // that halving dt does not double the damping
          this.filter[k] = w <= cphi ? 1 : Math.exp(-p.filterfac * (w - cphi) ** 4 * p.dt / 900);
          // hyperviscosity, applied exactly over one step (integrating factor)
          if (p.hyper) this.filter[k] *= Math.exp(-p.dt / p.hyper * (this.kk[k] / (kcut * kcut)) ** 4);
          // 2/3 rule: the state keeps only wavenumbers below 2/3 of the
          // maximum, so products of two fields cannot alias back
          this.dealias[k] = (Math.abs(i < nx / 2 ? i : i - nx) < nx / 3 && Math.abs(j < ny / 2 ? j : j - ny) < ny / 3) ? 1 : 0;
          this.filter[k] *= this.dealias[k];
        }
      }
      const z = () => new Float64Array(n);
      // state: spectral PV of both layers
      this.q1r = z(); this.q1i = z(); this.q2r = z(); this.q2i = z();
      // tendencies of the last three steps (Adams-Bashforth)
      this.hist = [0, 1, 2].map(() => ({ a: z(), b: z(), c: z(), d: z() }));
      this.nsteps = 0;
      this.t = 0;
      // scratch
      this.p1r = z(); this.p1i = z(); this.p2r = z(); this.p2i = z();
      this.ar = z(); this.ai = z(); this.br = z(); this.bi = z(); this.cr = z(); this.ci = z();
    }

    // ---- state in and out (real space) ----
    setQ(q1, q2) {
      this.q1r.set(q1); this.q1i.fill(0); FFT.fft2(this.q1r, this.q1i, this.nx, this.ny, false);
      this.q2r.set(q2); this.q2i.fill(0); FFT.fft2(this.q2r, this.q2i, this.nx, this.ny, false);
      this.symmetrize();
      this.nsteps = 0;   // Adams-Bashforth starts afresh
      return this;
    }
    getQ() {
      return [this.toReal(this.q1r, this.q1i), this.toReal(this.q2r, this.q2i)];
    }
    copyFrom(o) {
      ['q1r', 'q1i', 'q2r', 'q2i'].forEach((k) => this[k].set(o[k]));
      for (let s = 0; s < 3; s++) ['a', 'b', 'c', 'd'].forEach((k) => this.hist[s][k].set(o.hist[s][k]));
      this.nsteps = o.nsteps; this.t = o.t;
      return this;
    }
    clone() { return new Model(this.p).copyFrom(this); }

    toReal(re, im) {
      this.ar.set(re); this.ai.set(im);
      FFT.fft2(this.ar, this.ai, this.nx, this.ny, true);
      return Float64Array.from(this.ar);
    }

    // ψ from q, per wavenumber a 2×2 solve; the mean mode stays zero.
    invert() {
      const { kk, F1, F2, n } = this;
      for (let k = 0; k < n; k++) {
        const det = kk[k] * kk[k] + kk[k] * (F1 + F2);
        if (det === 0) { this.p1r[k] = this.p1i[k] = this.p2r[k] = this.p2i[k] = 0; continue; }
        const a = -(kk[k] + F2) / det, b = -F1 / det, c = -F2 / det, d = -(kk[k] + F1) / det;
        this.p1r[k] = a * this.q1r[k] + b * this.q2r[k]; this.p1i[k] = a * this.q1i[k] + b * this.q2i[k];
        this.p2r[k] = c * this.q1r[k] + d * this.q2r[k]; this.p2i[k] = c * this.q1i[k] + d * this.q2i[k];
      }
    }
    psi(layer) { this.invert(); return layer === 1 ? this.toReal(this.p1r, this.p1i) : this.toReal(this.p2r, this.p2i); }
    // Thickness ψ1 − ψ2, proportional to the column's temperature anomaly.
    thickness() {
      this.invert();
      for (let k = 0; k < this.n; k++) { this.br[k] = this.p1r[k] - this.p2r[k]; this.bi[k] = this.p1i[k] - this.p2i[k]; }
      return this.toReal(this.br, this.bi);
    }

    // Tendencies of both layers into hist[0]. Five 2-D FFTs per step: two
    // real fields share one complex transform (Hermitian packing), three
    // inverse transforms for q, u, v of both layers and two forward ones for
    // the four fluxes.
    tendencies(h) {
      const { nx, ny, n, kx, ky, kk, p } = this;
      const { p1r, p1i, p2r, p2i, q1r, q1i, q2r, q2i } = this;
      const W = this.w || (this.w = [0, 1, 2, 3, 4, 5].map(() => new Float64Array(n)));
      const [ar, ai, br, bi, cr, ci] = W;
      // pack: (q1 + i q2), (u1 + i u2), (v1 + i v2);  û = −i l ψ̂,  v̂ = i k ψ̂
      for (let k = 0; k < n; k++) {
        ar[k] = q1r[k] - q2i[k]; ai[k] = q1i[k] + q2r[k];
        const u1r = ky[k] * p1i[k], u1i = -ky[k] * p1r[k], u2r = ky[k] * p2i[k], u2i = -ky[k] * p2r[k];
        br[k] = u1r - u2i; bi[k] = u1i + u2r;
        const v1r = -kx[k] * p1i[k], v1i = kx[k] * p1r[k], v2r = -kx[k] * p2i[k], v2i = kx[k] * p2r[k];
        cr[k] = v1r - v2i; ci[k] = v1i + v2r;
      }
      FFT.fft2(ar, ai, nx, ny, true);
      FFT.fft2(br, bi, nx, ny, true);
      FFT.fft2(cr, ci, nx, ny, true);
      // fluxes; the background flow U enters below as i k U q̂
      for (let k = 0; k < n; k++) {
        const q1 = ar[k], q2 = ai[k];
        br[k] = br[k] * q1; bi[k] = bi[k] * q2;     // (u1 q1) + i (u2 q2)
        cr[k] = cr[k] * q1; ci[k] = ci[k] * q2;     // (v1 q1) + i (v2 q2)
      }
      FFT.fft2(br, bi, nx, ny, false);
      FFT.fft2(cr, ci, nx, ny, false);
      const dl = this.dealias, Qy1 = this.Qy1, Qy2 = this.Qy2, U1 = p.U1, U2 = p.U2, rek = p.rek;
      for (let j = 0; j < ny; j++) {
        const jm = (ny - j) % ny;
        for (let i = 0; i < nx; i++) {
          const k = j * nx + i, km = jm * nx + (nx - i) % nx;
          // unpack Z = A + i B:  A_k = (Z_k + conj Z_-k)/2,  B_k = (Z_k − conj Z_-k)/(2i)
          const uq1r = 0.5 * (br[k] + br[km]), uq1i = 0.5 * (bi[k] - bi[km]);
          const uq2r = 0.5 * (bi[k] + bi[km]), uq2i = -0.5 * (br[k] - br[km]);
          const vq1r = 0.5 * (cr[k] + cr[km]), vq1i = 0.5 * (ci[k] - ci[km]);
          const vq2r = 0.5 * (ci[k] + ci[km]), vq2i = -0.5 * (cr[k] - cr[km]);
          const d = dl[k], a = kx[k], b = ky[k];
          // −(i k·uq + i l·vq) − i k U q̂ − i k Qy ψ̂   (+ r_ek k² ψ̂2 in the lower layer)
          h.a[k] = d * (a * uq1i + b * vq1i) + a * U1 * q1i[k] + a * Qy1 * p1i[k];
          h.b[k] = -d * (a * uq1r + b * vq1r) - a * U1 * q1r[k] - a * Qy1 * p1r[k];
          h.c[k] = d * (a * uq2i + b * vq2i) + a * U2 * q2i[k] + a * Qy2 * p2i[k] + rek * kk[k] * p2r[k];
          h.d[k] = -d * (a * uq2r + b * vq2r) - a * U2 * q2r[k] - a * Qy2 * p2r[k] + rek * kk[k] * p2i[k];
        }
      }
    }

    step() {
      const p = this.p, n = this.n, dt = p.dt, f = this.filter;
      // rotate the history: hist[0] is the newest tendency
      this.hist.unshift(this.hist.pop());
      const h = this.hist[0];
      this.invert();
      this.tendencies(h);
      const h1 = this.hist[1], h2 = this.hist[2];
      // forward Euler, then AB2, then AB3
      const c0 = this.nsteps === 0 ? 1 : this.nsteps === 1 ? 1.5 : 23 / 12;
      const c1 = this.nsteps === 0 ? 0 : this.nsteps === 1 ? -0.5 : -16 / 12;
      const c2 = this.nsteps <= 1 ? 0 : 5 / 12;
      for (let k = 0; k < n; k++) {
        this.q1r[k] = f[k] * (this.q1r[k] + dt * (c0 * h.a[k] + c1 * h1.a[k] + c2 * h2.a[k]));
        this.q1i[k] = f[k] * (this.q1i[k] + dt * (c0 * h.b[k] + c1 * h1.b[k] + c2 * h2.b[k]));
        this.q2r[k] = f[k] * (this.q2r[k] + dt * (c0 * h.c[k] + c1 * h1.c[k] + c2 * h2.c[k]));
        this.q2i[k] = f[k] * (this.q2i[k] + dt * (c0 * h.d[k] + c1 * h1.d[k] + c2 * h2.d[k]));
      }
      this.symmetrize();
      this.nsteps++;
      this.t += dt;
    }

    // The fields are real, so q̂(−k) must be the complex conjugate of q̂(k).
    // Rounding breaks that a little every step, and the packed transforms
    // above assume it -- left alone, the non-real part grows until the run
    // blows up (docs/numerik.md). Projecting back costs one pass.
    symmetrize() {
      const { nx, ny } = this;
      for (const [re, im] of [[this.q1r, this.q1i], [this.q2r, this.q2i]]) {
        for (let j = 0; j < ny; j++) {
          const jm = (ny - j) % ny;
          for (let i = 0; i < nx; i++) {
            const k = j * nx + i, km = jm * nx + (nx - i) % nx;
            if (km < k) continue;
            const r = 0.5 * (re[k] + re[km]), m = 0.5 * (im[k] - im[km]);
            re[k] = r; im[k] = m; re[km] = r; im[km] = -m;
          }
        }
      }
    }

    // A small, balanced warm (amp > 0) or cold bubble: Gaussian of `radius`
    // (m) centred at (x, y) (m), added to the thickness ψ1 − ψ2 with the
    // given amplitude (same units as ψ). Split evenly between the layers,
    // so the column's mean flow is untouched; q follows from ψ.
    perturbTemperature(x, y, radius, amp) {
      const { nx, ny, n, dx, dy, kk, F1, F2 } = this;
      const gr = new Float64Array(n), gi = new Float64Array(n);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          // nearest periodic image
          let ddx = i * dx - x, ddy = j * dy - y;
          ddx -= this.p.L * Math.round(ddx / this.p.L); ddy -= this.p.W * Math.round(ddy / this.p.W);
          gr[j * nx + i] = amp * Math.exp(-(ddx * ddx + ddy * ddy) / (radius * radius));
        }
      }
      FFT.fft2(gr, gi, nx, ny, false);
      for (let k = 0; k < n; k++) {
        // δψ1 = +g/2, δψ2 = −g/2  →  δq1 = −kk g/2 − F1 g,  δq2 = +kk g/2 + F2 g
        const a = -kk[k] / 2 - F1, b = kk[k] / 2 + F2;
        this.q1r[k] += a * gr[k]; this.q1i[k] += a * gi[k];
        this.q2r[k] += b * gr[k]; this.q2i[k] += b * gi[k];
      }
    }

    // For Lyapunov estimates: distance of the PV fields, and pulling this
    // run towards `ref` so that the difference shrinks by `s` (state and
    // Adams-Bashforth history alike, consistent for small differences).
    distance(ref) {
      let d = 0;
      for (const k of ['q1r', 'q1i', 'q2r', 'q2i']) { const x = this[k], y = ref[k]; for (let i = 0; i < this.n; i++) d += (x[i] - y[i]) ** 2; }
      return Math.sqrt(d);
    }
    scaleTowards(ref, s) {
      const mix = (x, y) => { for (let i = 0; i < x.length; i++) x[i] = y[i] + (x[i] - y[i]) * s; };
      for (const k of ['q1r', 'q1i', 'q2r', 'q2i']) mix(this[k], ref[k]);
      for (let h = 0; h < 3; h++) for (const k of ['a', 'b', 'c', 'd']) mix(this.hist[h][k], ref.hist[h][k]);
    }

    isFinite() {
      for (let k = 0; k < this.n; k++) if (!Number.isFinite(this.q1r[k]) || !Number.isFinite(this.q2r[k])) return false;
      return true;
    }
  }

  function rms(a) { let s = 0; for (let k = 0; k < a.length; k++) s += a[k] * a[k]; return Math.sqrt(s / a.length); }
  function rmsDiff(a, b) { let s = 0; for (let k = 0; k < a.length; k++) s += (a[k] - b[k]) ** 2; return Math.sqrt(s / a.length); }

  // RMS of the thickness ψ1 − ψ2 in equilibrium (scripts/validate-qg.js):
  // two unrelated states differ by sqrt(2) times this -- "100 %".
  const CLIM = 9.656e6;
  // Thickness → temperature of the mid troposphere (hypsometric relation
  // with f0 = 1e-4 1/s, T0 = 250 K, 5 km between the layer centres): about
  // 5·10⁻⁷ K per m²/s. A rough conversion for the display, see docs/modelle.md.
  const KELVIN = 250 * 1e-4 / (9.81 * 5000);

  return { Model, DEFAULTS, PYQG, DAY, CLIM, KELVIN, rms, rmsDiff };
});
