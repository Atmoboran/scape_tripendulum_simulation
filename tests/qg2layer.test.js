// Tests of the two-layer model core: transforms, inversion, conservation,
// stability, reproducibility, controlled perturbation.
const test = require('node:test');
const assert = require('node:assert/strict');
const FFT = require('../js/models/fft.js');
const QG = require('../js/models/qg2layer.js');
global.window = global.window || {};
require('../data/qg-start.js');
const dec = (s) => Float64Array.from(new Float32Array(Uint8Array.from(Buffer.from(s, 'base64')).buffer));
const start = (opts) => new QG.Model(opts).setQ(dec(window.QG_START.snapshots[0].q1), dec(window.QG_START.snapshots[0].q2));

test('2-D FFT: inverse of forward is the identity, and it matches a direct DFT', () => {
  const nx = 8, ny = 4, re = new Float64Array(nx * ny).map((_, k) => Math.sin(k * 1.3) + k % 3), im = new Float64Array(nx * ny);
  const r0 = Float64Array.from(re);
  FFT.fft2(re, im, nx, ny, false);
  // one coefficient against the definition
  const kx = 3, ky = 1;
  let sr = 0, si = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = -2 * Math.PI * (kx * i / nx + ky * j / ny);
    sr += r0[j * nx + i] * Math.cos(a); si += r0[j * nx + i] * Math.sin(a);
  }
  assert.ok(Math.abs(re[ky * nx + kx] - sr) < 1e-12 && Math.abs(im[ky * nx + kx] - si) < 1e-12);
  FFT.fft2(re, im, nx, ny, true);
  for (let k = 0; k < r0.length; k++) assert.ok(Math.abs(re[k] - r0[k]) < 1e-12 && Math.abs(im[k]) < 1e-12);
});

test('PV inversion: q from a known ψ is recovered', () => {
  const m = new QG.Model();
  const { nx, ny, dx, dy, F1, F2 } = m;
  const L = m.p.L;
  // ψ1 = cos(2πx/L), ψ2 = 0.5 sin(4πy/L): q1 = −k²ψ1 + F1(ψ2 − ψ1), q2 = −l²ψ2 + F2(ψ1 − ψ2)
  const p1 = new Float64Array(m.n), p2 = new Float64Array(m.n), q1 = new Float64Array(m.n), q2 = new Float64Array(m.n);
  const k = 2 * Math.PI / L, l = 4 * Math.PI / L;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const n = j * nx + i;
    p1[n] = Math.cos(k * i * dx); p2[n] = 0.5 * Math.sin(l * j * dy);
    q1[n] = -k * k * p1[n] + F1 * (p2[n] - p1[n]);
    q2[n] = -l * l * p2[n] + F2 * (p1[n] - p2[n]);
  }
  m.setQ(q1, q2);
  const r1 = m.psi(1), r2 = m.psi(2);
  for (let n = 0; n < m.n; n++) { assert.ok(Math.abs(r1[n] - p1[n]) < 1e-9); assert.ok(Math.abs(r2[n] - p2[n]) < 1e-9); }
});

test('a pure zonal flow without eddies stays steady (no spurious tendencies)', () => {
  const m = new QG.Model();
  m.setQ(new Float64Array(m.n), new Float64Array(m.n));
  for (let s = 0; s < 200; s++) m.step();
  assert.equal(QG.rms(m.thickness()), 0);
});

test('without forcing, friction and dissipation the advection conserves energy over a short time', () => {
  // inviscid, unforced: U = 0, no drag, no filter, no hyperviscosity, tiny step
  const m = new QG.Model({ U1: 0, U2: 0, rek: 0, hyper: 0, filterfac: 0, dt: 60 });
  const s = start();
  m.q1r.set(s.q1r); m.q1i.set(s.q1i); m.q2r.set(s.q2r); m.q2i.set(s.q2i);
  // keep only the dealiased part so the test does not see the truncation
  for (let k = 0; k < m.n; k++) if (!m.dealias[k]) { m.q1r[k] = m.q1i[k] = m.q2r[k] = m.q2i[k] = 0; }
  const energy = () => {
    m.invert();
    let e = 0;
    for (let k = 0; k < m.n; k++) {
      const a1 = m.p1r[k] ** 2 + m.p1i[k] ** 2, a2 = m.p2r[k] ** 2 + m.p2i[k] ** 2;
      const d = (m.p1r[k] - m.p2r[k]) ** 2 + (m.p1i[k] - m.p2i[k]) ** 2;
      e += m.kk[k] * (a1 + a2) + m.F1 * d;     // kinetic + available potential (equal layers)
    }
    return e;
  };
  const e0 = energy();
  for (let n = 0; n < 1440; n++) m.step();     // one day
  const rel = Math.abs(energy() - e0) / e0;
  assert.ok(rel < 1e-3, 'energy change ' + rel);
});

test('fields stay real: the spectrum keeps its Hermitian symmetry', () => {
  const m = start();
  for (let s = 0; s < 500; s++) m.step();
  const { nx, ny } = m;
  let worst = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, km = ((ny - j) % ny) * nx + (nx - i) % nx;
    worst = Math.max(worst, Math.abs(m.q1r[k] - m.q1r[km]), Math.abs(m.q1i[k] + m.q1i[km]));
  }
  assert.ok(worst < 1e-20, 'asymmetry ' + worst);
});

test('same start, same result -- bit for bit; clone() continues identically', () => {
  const a = start(), b = start();
  for (let s = 0; s < 300; s++) { a.step(); b.step(); }
  const c = a.clone();
  for (let s = 0; s < 300; s++) { a.step(); c.step(); }
  assert.equal(QG.rmsDiff(a.thickness(), c.thickness()), 0);
  for (let s = 0; s < 300; s++) b.step();
  assert.equal(QG.rmsDiff(a.thickness(), b.thickness()), 0);
});

test('the warm bubble adds exactly the requested thickness and leaves the mean flow alone', () => {
  const a = start(), b = a.clone();
  const amp = 1e4;
  b.perturbTemperature(a.p.L / 2, a.p.W / 2, 5e5, amp);
  const ta = a.thickness(), tb = b.thickness();
  let peak = 0, sum = 0;
  for (let k = 0; k < ta.length; k++) { peak = Math.max(peak, tb[k] - ta[k]); sum += (b.psi(1)[k] + b.psi(2)[k]) - (a.psi(1)[k] + a.psi(2)[k]); }
  // the grid misses the exact centre only slightly; the spectral truncation smooths a little
  assert.ok(peak > 0.8 * amp && peak < 1.05 * amp, 'peak ' + peak);
  assert.ok(Math.abs(sum) / ta.length < 1e-6 * amp, 'barotropic change ' + sum);
});

test('a long run stays finite and within the stability limit', () => {
  const m = start();
  let umax = 0;
  for (let d = 0; d < 100; d++) {
    for (let s = 0; s < 96; s++) m.step();
    const p = m.psi(1);
    for (let j = 0; j < m.ny; j++) for (let i = 0; i < m.nx; i++) {
      const k = j * m.nx + i;
      umax = Math.max(umax, Math.abs(m.p.U1 - (p[((j + 1) % m.ny) * m.nx + i] - p[k]) / m.dy));
    }
  }
  assert.ok(m.isFinite());
  const kcut = (2 / 3) * Math.PI / m.dx;
  assert.ok(umax * kcut * m.p.dt < 0.72, 'u k dt = ' + umax * kcut * m.p.dt);
});

test('NaN is detected', () => {
  const m = start();
  assert.ok(m.isFinite());
  m.q1r[5] = NaN;
  assert.ok(!m.isFinite());
});

test('a small perturbation grows (positive growth rate) and a zero one does not', () => {
  const Compare = require('../js/models/compare.js');
  const a = start(), b = a.clone(), c = a.clone();
  b.perturbTemperature(4e6, 3e6, 5e5, 1e-4 * QG.CLIM);
  const rec = new Compare.Record();
  for (let d = 0; d <= 30; d += 0.5) {
    rec.push(d, QG.rmsDiff(a.thickness(), b.thickness()) / (Math.SQRT2 * QG.CLIM));
    for (let s = 0; s < 48; s++) { a.step(); b.step(); c.step(); }
  }
  const g = Compare.growth(rec);
  assert.ok(g && g.doubling > 1.5 && g.doubling < 7, 'doubling ' + (g && g.doubling));
  assert.equal(QG.rmsDiff(a.thickness(), c.thickness()), 0);
});

test('against a reference with a finer time step: errors shrink with at least second order', () => {
  // AB3 is third order, but its start (one Euler, one AB2 step) leaves a
  // second-order error that dominates a one-day run. The scale-selective
  // damping is applied by operator splitting and is left out here.
  const run = (dt) => { const m = start({ dt, filterfac: 0, hyper: 0 }); for (let n = 0, N = Math.round(QG.DAY / dt); n < N; n++) m.step(); return m.thickness(); };
  const ref = run(56.25);
  const e1 = QG.rmsDiff(run(900), ref), e2 = QG.rmsDiff(run(450), ref);
  const order = Math.log2(e1 / e2);
  assert.ok(order > 1.8 && order < 4.5, 'order ' + order);
});
