// Scientific checks of the two-layer model as used in the app.
// Results go into docs/validierung.md.   Run:  node scripts/validate-qg.js
// (takes a few minutes: two spin-ups and several ensembles)
global.window = global.window || {};
require('../data/qg-start.js');
const QG = require('../js/models/qg2layer.js');
const Compare = require('../js/models/compare.js');
const { rng } = require('../js/models/lorenz96.js');

const DAY = QG.DAY;
const log = (...a) => console.log(...a);
const fmt = (x, d = 2) => Number(x).toFixed(d);
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const dec = (s) => Float64Array.from(new Float32Array(Uint8Array.from(Buffer.from(s, 'base64')).buffer));
const fromSnap = (k, opts) => new QG.Model(opts).setQ(dec(window.QG_START.snapshots[k].q1), dec(window.QG_START.snapshots[k].q2));
const days = (m, d) => { const t = m.t + d * DAY - 1; while (m.t < t) m.step(); };

function umax(m) {
  let v = 0;
  for (const [layer, U] of [[1, m.p.U1], [2, m.p.U2]]) {
    const ps = m.psi(layer);
    for (let j = 0; j < m.ny; j++) for (let i = 0; i < m.nx; i++) {
      const k = j * m.nx + i;
      v = Math.max(v, Math.abs(U - (ps[((j + 1) % m.ny) * m.nx + i] - ps[k]) / m.dy), Math.abs((ps[j * m.nx + (i + 1) % m.nx] - ps[k]) / m.dx));
    }
  }
  return v;
}

// Benettin estimate of the largest Lyapunov exponent (per day).
function lyapunov(a, T, d0rel) {
  const b = a.clone();
  const r = rng(5);
  b.perturbTemperature(r() * a.p.L, r() * a.p.W, 5e5, 1);
  const d0 = d0rel * a.distance(new QG.Model(a.p));   // relative to the size of the state
  b.scaleTowards(a, d0 / b.distance(a));
  let sum = 0;
  for (let d = 0; d < T; d++) {
    const t = a.t + DAY - 1; while (a.t < t) { a.step(); b.step(); }
    const dist = b.distance(a);
    sum += Math.log(dist / d0);
    b.scaleTowards(a, d0 / dist);
  }
  return sum / T;
}

// Ensemble of app-like experiments: a warm bubble of `eps` times the
// typical temperature anomaly, 500 km wide, at random places.
function experiments(eps, runs, opts, clim) {
  const out = { doubling: [], half: [], ratio10: [] };
  const r = rng(77);
  for (let k = 0; k < runs; k++) {
    const a = fromSnap(k % 3, opts); days(a, 10 * k);
    const b = a.clone();
    b.perturbTemperature(r() * a.p.L, r() * a.p.W, 5e5, eps * clim);
    const rec = new Compare.Record();
    for (let d = 0; d <= 60; d += 0.25) {
      rec.push(d, QG.rmsDiff(a.thickness(), b.thickness()) / (Math.SQRT2 * clim));
      const t = a.t + DAY / 4 - 1; while (a.t < t) { a.step(); b.step(); }
    }
    const g = Compare.growth(rec); if (g) out.doubling.push(g.doubling);
    const h = Compare.timeTo(rec, 0.5); out.half.push(h === null ? Infinity : h);
    out.ratio10.push(rec.e[40] / rec.e[0]);
  }
  return out;
}

const p = QG.DEFAULTS;
log('## Zweischichtenmodell (' + p.nx + '×' + p.ny + ', L = ' + p.L / 1e3 + ' km, dt = ' + p.dt + ' s, U1−U2 = ' + (p.U1 - p.U2) + ' m/s, rd = ' + p.rd / 1e3 + ' km, r_ek = 1/' + fmt(1 / p.rek / DAY, 1) + ' Tage)\n');

// 1. equilibrium
let clim;
{
  const m = fromSnap(0);
  const win = [], us = [];
  let s2 = 0, n = 0;
  for (let w = 0; w < 12; w++) {
    let ws = 0, wn = 0;
    for (let d = 0; d < 50; d++) {
      days(m, 1);
      const th = m.thickness();
      for (let k = 0; k < th.length; k++) { ws += th[k] * th[k]; wn++; }
      if (d % 10 === 0) us.push(umax(m));
    }
    win.push(Math.sqrt(ws / wn)); s2 += ws; n += wn;
  }
  clim = Math.sqrt(s2 / n);
  const umx = Math.max(...us);
  const kmax = 2 / 3 * Math.PI / (p.L / p.nx);
  log('Gleichgewicht über 600 Tage: RMS der Dicke ψ1−ψ2 = ' + clim.toExponential(3) + ' m²/s (12 Fenster à 50 Tage: ' +
    fmt(Math.min(...win) / clim, 3) + ' … ' + fmt(Math.max(...win) / clim, 3) + ' des Mittels)');
  const K = 250 * 1e-4 / (9.81 * 5000);
  log('  als Temperatur (T0 = 250 K, f0 = 1e-4 1/s, ΔZ = 5 km): Abweichung RMS ≈ ' + fmt(clim * K, 1) + ' K; Hintergrundgefälle über das Gebiet ≈ ' + fmt((p.U1 - p.U2) * p.W * K, 0) + ' K');
  log('  größte Windgeschwindigkeit (inkl. Grundströmung) ' + fmt(umx, 0) + ' m/s → u·k_max·dt = ' + fmt(umx * kmax * p.dt) + ' (AB3-Grenze ≈ 0,72)');
  log('  im Code für die relative Abweichung: CLIM = ' + clim.toExponential(3));
}

// 2. Lyapunov exponent
{
  const l = [0, 1, 2].map((k) => lyapunov(fromSnap(k), 200, 1e-6));
  const lm = l.reduce((a, b) => a + b) / l.length;
  log('\nGrößter Lyapunov-Exponent (Benettin, 3 Starts × 200 Tage, Renormierung täglich): λ1 = ' + l.map((x) => fmt(x, 3)).join(', ') +
    ' pro Tag → Verdopplungszeit ≈ ' + fmt(Math.LN2 / lm, 1) + ' Tage');
  log('  mit halbem Zeitschritt (dt = ' + p.dt / 2 + ' s): λ1 = ' + fmt(lyapunov(fromSnap(0, { dt: p.dt / 2 }), 200, 1e-6), 3) + ' pro Tag');
}

// 3. experiments as in the app
{
  log('\nExperimente wie in der App (warme Blase, 500 km, zufälliger Ort, je 12 Läufe à 60 Tage):');
  for (const eps of [1e-2, 1e-4, 1e-6]) {
    const o = experiments(eps, 12, undefined, clim);
    log('  Störung ' + Number((eps * 100).toPrecision(3)) + ' % der typischen Abweichung: Verdopplungszeit (Median) ' + fmt(med(o.doubling), 2) +
      ' Tage, Zeit bis 50 % Unterschied (Median) ' + fmt(med(o.half), 1) + ' Tage, Faktor nach 10 Tagen ' + med(o.ratio10).toExponential(1));
  }
}

// 4. controls: tiny noise at weaker shear. Below the instability threshold
// the noise must not grow into eddies; above it, it must.
{
  for (const U1 of [3, 6, 10]) {
    const m = new QG.Model({ U1 });
    const r = rng(11);
    m.setQ(new Float64Array(m.n).map(() => 1e-9 * (r() - 0.5)), new Float64Array(m.n));
    const r0 = QG.rms(m.thickness());
    days(m, 600);
    log('\nKontrolle: Scherung ' + U1 + ' m/s, Start aus winzigem Rauschen → nach 600 Tagen RMS-Dicke ' + (QG.rms(m.thickness()) / clim).toExponential(1) +
      ' des Gleichgewichts (Start: ' + (r0 / clim).toExponential(1) + ')');
  }
}

// 5. resolution: 64×64, dt halved, own spin-up
{
  const o = { nx: 2 * p.nx, ny: 2 * p.ny, dt: p.dt / 2 };
  const m = new QG.Model(o);
  const r = rng(20261029);
  m.setQ(new Float64Array(m.n).map(() => 1e-9 * (r() - 0.5)), new Float64Array(m.n));
  days(m, 400);
  let s2 = 0, n = 0;
  for (let d = 0; d < 100; d++) { days(m, 1); const th = m.thickness(); for (let k = 0; k < th.length; k++) { s2 += th[k] * th[k]; n++; } }
  const l = lyapunov(m, 100, 1e-6);
  log('\nAuflösung ' + o.nx + '×' + o.ny + ' (dt = ' + o.dt + ' s, eigener Spin-up): RMS-Dicke ' + fmt(Math.sqrt(s2 / n) / clim, 2) + ' × Wert bei ' + p.nx + '×' + p.ny + ', λ1 = ' + fmt(l, 3) + ' pro Tag, Wind max ' + fmt(umax(m), 0) + ' m/s');
}

// 6. reproducibility
{
  const a = fromSnap(1), b = fromSnap(1);
  days(a, 100); days(b, 100);
  log('\nReproduzierbarkeit: gleicher Start, 100 Tage → Unterschied ' + QG.rmsDiff(a.thickness(), b.thickness()) + ', endlich: ' + a.isFinite());
}
