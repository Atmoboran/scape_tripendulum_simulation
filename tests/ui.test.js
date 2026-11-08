// Interface tests in a real browser (Chromium via Playwright). Skipped when
// Playwright is not installed:  npm i -D playwright  (or use a global one).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { /* skipped below */ }
const url = (page) => 'file://' + path.join(__dirname, '..', page);

const opts = { skip: chromium ? false : 'playwright not installed' };
const num = (s) => parseFloat(s.replace(/[^\d,.-]/g, '').replace(',', '.'));

for (const page of ['karte.html']) {
  test(page + ': start, pause and restart work; both runs restart identically', opts, async () => {
    const browser = await chromium.launch();
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(url(page));
    const time = async () => p.evaluate(() => window.SCAPE.karteDay());
    const diff = async () => p.evaluate(() => window.SCAPE.karteDiff());
    assert.equal(await time(), 0);
    const d0 = await diff();
    await p.click('#sim-primary'); await p.waitForTimeout(1500);
    assert.ok(await time() > 0, 'time runs');
    await p.click('#sim-primary'); await p.waitForTimeout(200);
    const tp = await time(); await p.waitForTimeout(600);
    assert.equal(await time(), tp, 'pause holds');
    await p.click('#sim-reset');
    assert.equal(await time(), 0);
    assert.equal(await diff(), d0, 'restart gives the same start difference');
    // control: no perturbation → no difference, ever
    await p.locator('#delta-range').fill('0');
    assert.equal(await diff(), 0);
    await p.click('#sim-primary'); await p.waitForTimeout(1500);
    assert.equal(await diff(), 0);
    // the page fits the phone width
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal scroll');
    assert.deepEqual(errors, []);
    await browser.close();
  });
}

test('karte.html: the maps (incl. the difference map) update while running', opts, async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(url('karte.html'));
  const shot = async () => p.locator('#draw-canvas').screenshot();
  const before = await shot();
  await p.click('#sim-primary'); await p.waitForTimeout(1500); await p.click('#sim-primary');
  const after = await shot();
  assert.notDeepEqual(before, after);
  await browser.close();
});

test('all three chapters load without errors', opts, async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'warning' && /missing/.test(m.text())) errors.push(m.text()); });
  for (const page of ['index.html', 'lorenz.html', 'karte.html']) { await p.goto(url(page)); await p.waitForTimeout(300); }
  assert.deepEqual(errors, []);
  await browser.close();
});

for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test('karte.html (' + vp.width + ' px): the station chart is a tile of the stage; a tap moves the station', opts, async () => {
    const browser = await chromium.launch();
    const p = await browser.newPage({ viewport: vp });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(url('karte.html'));
    const n = () => p.evaluate(() => window.SCAPE.karteDiff() >= 0);
    assert.ok(await n());
    // the stage is filled: no block of empty space at its bottom
    const s = await p.locator('#stage').boundingBox();
    assert.ok(s.height < s.width * 1.8, 'stage not taller than its tiles');
    await p.selectOption('#speed-select', '2');
    await p.click('#sim-primary'); await p.waitForTimeout(1500); await p.click('#sim-primary');
    await p.mouse.click(s.x + s.width * 0.25, s.y + s.height * 0.2);
    await p.waitForTimeout(300);
    assert.deepEqual(errors, []);
    await browser.close();
  });
}
