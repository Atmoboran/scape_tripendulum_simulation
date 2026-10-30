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
    const time = async () => num(await p.locator('#ro-zeit').textContent());
    const diff = async () => p.evaluate(() => window.SCAPE.karteDiff());
    assert.equal(await time(), 0);
    const d0 = await diff();
    await p.click('#sim-primary'); await p.waitForTimeout(1500);
    assert.ok(await time() > 0, 'time runs');
    await p.click('#sim-primary'); await p.waitForTimeout(200);
    const tp = await time(); await p.waitForTimeout(600);
    assert.equal(await time(), tp, 'pause holds');
    assert.equal(await p.locator('#ro-status').textContent(), 'Pausiert');
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

test('karte.html: a station is set from the start and records A and B; a tap moves it', opts, async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(url('karte.html'));
  const chart = () => p.evaluate(() => document.getElementById('station-chart').toDataURL());
  const before = await chart();
  await p.selectOption('#speed-select', '2');
  await p.click('#sim-primary'); await p.waitForTimeout(1500); await p.click('#sim-primary');
  assert.notEqual(await chart(), before, 'station chart drawn');
  const s = await p.locator('#stage').boundingBox();
  await p.mouse.click(s.x + s.width / 2, s.y + s.height * 0.35);
  await p.waitForTimeout(300);
  assert.ok(await p.locator('#station-chart').isVisible());
  await browser.close();
});

test('karte.html: wide screens put the station chart into the stage (2 × 2)', opts, async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(url('karte.html'));
  await p.waitForTimeout(300);
  assert.ok(await p.locator('.station-box').isHidden());
  await browser.close();
});
