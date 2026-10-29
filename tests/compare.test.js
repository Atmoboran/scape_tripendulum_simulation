const test = require('node:test');
const assert = require('node:assert/strict');
const Compare = require('../js/models/compare.js');

test('growth() recovers the rate of a clean exponential and ignores the saturated part', () => {
  const rec = new Compare.Record();
  for (let t = 0; t <= 20; t += 0.1) rec.push(t, Math.min(1e-6 * Math.exp(0.8 * t), 1));
  const g = Compare.growth(rec);
  assert.ok(Math.abs(g.rate - 0.8) < 1e-6);
  assert.ok(Math.abs(g.doubling - Math.LN2 / 0.8) < 1e-6);
});

test('growth() gives no estimate when the start difference is already large', () => {
  const rec = new Compare.Record();
  for (let t = 0; t <= 10; t += 0.1) rec.push(t, Math.min(0.05 * Math.exp(t), 1));
  assert.equal(Compare.growth(rec), null);
});

test('timeTo() finds the first crossing', () => {
  const rec = new Compare.Record();
  [0.1, 0.3, 0.6, 0.4, 0.9].forEach((e, k) => rec.push(k, e));
  assert.equal(Compare.timeTo(rec, 0.5), 2);
  assert.equal(Compare.timeTo(rec, 2), null);
});
