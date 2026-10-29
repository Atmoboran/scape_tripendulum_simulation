// Mathematical, numerical and reproducibility tests of the Lorenz-96 core.
// Run all tests:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const L96 = require('../js/models/lorenz96.js');

test('right-hand side matches the equation, including the periodic ends', () => {
  const x = Float64Array.from({ length: 6 }, (_, i) => i + 1);   // 1..6
  const out = L96.rhs(x, 8, new Float64Array(6));
  for (let i = 0; i < 6; i++) {
    const m = (k) => x[((k % 6) + 6) % 6];
    assert.equal(out[i], (m(i + 1) - m(i - 2)) * m(i - 1) - x[i] + 8);
  }
  // site 0 uses sites 1, 4 (= −2) and 5 (= −1)
  assert.equal(out[0], (2 - 5) * 6 - 1 + 8);
});

test('X = F everywhere is a fixed point', () => {
  const x = new Float64Array(40).fill(8);
  assert.deepEqual(Array.from(L96.rhs(x, 8, new Float64Array(40))), new Array(40).fill(0));
  const y = Float64Array.from(x);
  for (let k = 0; k < 100; k++) L96.step(y, 0.01, 8);
  assert.ok(L96.rmsDiff(x, y) < 1e-12);
});

test('RK4 converges with fourth order', () => {
  const x0 = L96.initialState(3);
  const run = (h) => { const x = Float64Array.from(x0); for (let k = 0, n = Math.round(0.5 / h); k < n; k++) L96.step(x, h, 8); return x; };
  const ref = run(0.000625);
  const e1 = L96.rmsDiff(run(0.02), ref), e2 = L96.rmsDiff(run(0.01), ref);
  const order = Math.log2(e1 / e2);
  assert.ok(order > 3.6 && order < 4.4, 'order ' + order);
});

test('same start, same result -- bit for bit', () => {
  const a = L96.initialState(42), b = L96.initialState(42);
  for (let k = 0; k < 5000; k++) { L96.step(a, 0.01, 8); L96.step(b, 0.01, 8); }
  assert.equal(L96.rmsDiff(a, b), 0);
});

test('a controlled perturbation changes exactly one site by exactly the amount', () => {
  const a = L96.initialState(7), b = L96.perturb(a, 41, 1e-3);   // 41 wraps to 1
  for (let i = 0; i < a.length; i++) assert.equal(b[i] - a[i], i === 1 ? b[1] - a[1] : 0);
  assert.ok(Math.abs(b[1] - a[1] - 1e-3) < 1e-15);
});

test('long runs stay finite and on the attractor (climatology)', () => {
  const x = L96.initialState(5);
  let s = 0, s2 = 0, n = 0;
  for (let k = 0; k < 50000; k++) {
    L96.step(x, 0.01, 8);
    if (k % 10 === 0) for (const v of x) { s += v; s2 += v * v; n++; }
  }
  assert.ok(L96.isFiniteState(x));
  const mean = s / n, std = Math.sqrt(s2 / n - mean * mean);
  assert.ok(mean > 2 && mean < 2.7, 'mean ' + mean);
  assert.ok(Math.abs(std - L96.CLIM_STD) < 0.3, 'std ' + std);
});

test('NaN and infinity are detected', () => {
  const x = L96.initialState(1);
  assert.ok(L96.isFiniteState(x));
  x[3] = NaN;
  assert.ok(!L96.isFiniteState(x));
  x[3] = Infinity;
  assert.ok(!L96.isFiniteState(x));
});

test('small differences grow with a doubling time near 0.41 time units (chaos), F = 4 does not', () => {
  const Compare = require('../js/models/compare.js');
  const doubling = (F) => {
    const a = L96.initialState(9, { F }), b = L96.perturb(a, 20, 1e-6);
    const rec = new Compare.Record();
    rec.push(0, L96.relDiff(a, b));
    for (let k = 1; k <= 1500; k++) { L96.step(a, 0.01, F); L96.step(b, 0.01, F); if (k % 5 === 0) rec.push(k * 0.01, L96.relDiff(a, b)); }
    return { g: Compare.growth(rec), last: rec.last };
  };
  const chaotic = doubling(8);
  assert.ok(chaotic.g && chaotic.g.doubling > 0.3 && chaotic.g.doubling < 0.55, 'doubling ' + (chaotic.g && chaotic.g.doubling));
  const calm = doubling(4);
  assert.ok(calm.last < 1e-4, 'F = 4 difference after 15 units: ' + calm.last);
});
