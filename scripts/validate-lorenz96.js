// Scientific checks of the Lorenz-96 configuration used in the app.
// Results go into docs/validierung.md.   Run:  node scripts/validate-lorenz96.js
const L96 = require('../js/models/lorenz96.js');
const Compare = require('../js/models/compare.js');

const { N, F, dt } = L96.DEFAULTS;
const log = (...a) => console.log(...a);
const fmt = (x, d = 3) => Number(x).toFixed(d);

// Largest Lyapunov exponent, Benettin method: a twin trajectory at distance
// d0 is renormalised every `tau` time units; the mean log stretching per
// unit time converges to λ1.
function lyapunov(seed, opts) {
  const o = Object.assign({ F, dt, N, T: 1000, tau: 0.1, d0: 1e-8 }, opts);
  const a = L96.initialState(seed, { N: o.N, F: o.F, dt: o.dt });
  const r = L96.rng(seed + 99);
  const b = Float64Array.from(a, (v) => v + o.d0 * (r() - 0.5));
  const scale = (d) => { const s = o.d0 / d; for (let i = 0; i < o.N; i++) b[i] = a[i] + (b[i] - a[i]) * s; };
  scale(Math.sqrt(N) * L96.rmsDiff(a, b));
  let sum = 0, t = 0;
  const per = Math.round(o.tau / o.dt);
  while (t < o.T) {
    for (let s = 0; s < per; s++) { L96.step(a, o.dt, o.F); L96.step(b, o.dt, o.F); }
    t += per * o.dt;
    const d = Math.sqrt(o.N) * L96.rmsDiff(a, b);
    sum += Math.log(d / o.d0);
    scale(d);
  }
  return sum / t;
}

log('## Lorenz-96 (N = ' + N + ', F = ' + F + ', RK4, dt = ' + dt + ')\n');

// 1. climatology
{
  const x = L96.initialState(1);
  let n = 0, s = 0, s2 = 0;
  for (let k = 0; k < 1e6; k++) {
    L96.step(x, dt, F);
    if (k % 10 === 0) for (let i = 0; i < N; i++) { n++; s += x[i]; s2 += x[i] * x[i]; }
  }
  const mean = s / n, std = Math.sqrt(s2 / n - mean * mean);
  log('Klimatologie über 10 000 Zeiteinheiten: Mittelwert ' + fmt(mean, 2) + ', Standardabweichung ' + fmt(std, 2) +
    ' (im Code: CLIM_STD = ' + L96.CLIM_STD + ')');
}

// 2. Lyapunov exponent: several starts, several step sizes
{
  const seeds = [1, 2, 3, 4, 5];
  const l = seeds.map((s) => lyapunov(s));
  const mean = l.reduce((a, b) => a + b) / l.length;
  const sd = Math.sqrt(l.reduce((a, b) => a + (b - mean) ** 2, 0) / (l.length - 1));
  log('Größter Lyapunov-Exponent (Benettin, 5 Starts × 1000 Zeiteinheiten, Renormierung alle 0,1): λ1 = ' + fmt(mean) + ' ± ' + fmt(sd) +
    ' pro Zeiteinheit → Verdopplungszeit ' + fmt(Math.LN2 / mean) + ' Zeiteinheiten ≈ ' + fmt(Math.LN2 / mean * L96.DAYS_PER_UNIT, 1) + ' „Modelltage“');
  for (const h of [0.005, 0.02, 0.05]) log('  gleiche Rechnung mit dt = ' + h + ': λ1 = ' + fmt(lyapunov(1, { dt: h })));
  for (const f of [2, 4, 5, 6, 10]) log('  F = ' + f + ': λ1 = ' + fmt(lyapunov(1, { F: f, T: 400 })));
}

// 3. convergence of the integrator (RK4 → 4th order)
{
  const x0 = L96.initialState(3);
  const run = (h) => { const x = Float64Array.from(x0); for (let k = 0, n = Math.round(1 / h); k < n; k++) L96.step(x, h, F); return x; };
  const ref = run(0.0005);
  const errs = [0.04, 0.02, 0.01].map((h) => [h, Math.sqrt(N) * L96.rmsDiff(run(h), ref)]);
  log('Konvergenz nach t = 1: ' + errs.map(([h, e]) => 'dt=' + h + ': Fehler ' + e.toExponential(2)).join(', ') +
    ' → Ordnung ' + fmt(Math.log2(errs[0][1] / errs[1][1]), 2) + ' / ' + fmt(Math.log2(errs[1][1] / errs[2][1]), 2));
}

// 4. growth of finite differences as in the app (one variable perturbed)
{
  log('\nWachstum kleiner Unterschiede wie in der App (Störung einer Variablen, 30 Starts, relativer Unterschied):');
  for (const d of [1e-1, 1e-3, 1e-5]) {
    const doublings = [], tHalf = [], early = [];
    for (let s = 0; s < 30; s++) {
      const a = L96.initialState(100 + s), b = L96.perturb(a, 20, d);
      const rec = new Compare.Record();
      rec.push(0, L96.relDiff(a, b));
      for (let k = 1; k <= 2000; k++) {
        L96.step(a, dt, F); L96.step(b, dt, F);
        if (k % 5 === 0) rec.push(k * dt, L96.relDiff(a, b));
      }
      const g = Compare.growth(rec);
      if (g) doublings.push(g.doubling);
      const th = Compare.timeTo(rec, 0.5);
      if (th !== null) tHalf.push(th);
      // e after 0.3 units relative to the start: the transient phase
      early.push(rec.e[6] / rec.e[0]);
    }
    const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    log('  Störung ' + d + ': Faktor nach 0,3 Zeiteinheiten (Median) ' + fmt(med(early), 2) +
      ', Verdopplungszeit im exponentiellen Bereich (Median) ' + fmt(med(doublings)) +
      ', Zeit bis 50 % Unterschied (Median) ' + fmt(med(tHalf), 2) + ' (' + tHalf.length + '/30 erreicht)');
  }
}

// 5. reproducibility and finiteness
{
  const a = L96.initialState(42), b = L96.initialState(42);
  for (let k = 0; k < 100000; k++) { L96.step(a, dt, F); L96.step(b, dt, F); }
  log('\nReproduzierbarkeit: gleicher Start, 1000 Zeiteinheiten → Unterschied ' + L96.rmsDiff(a, b) +
    ', endlich: ' + L96.isFiniteState(a));
}
