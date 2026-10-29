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
    const diff = async () => num(await p.locator('#ro-diff').textContent());
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
    await p.selectOption('#delta-select', '0');
    assert.equal(await p.locator('#ro-diff').textContent(), '0 %');
    await p.click('#sim-primary'); await p.waitForTimeout(1500);
    assert.equal(await p.locator('#ro-diff').textContent(), '0 %');
    // the page fits the phone width
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal scroll');
    assert.deepEqual(errors, []);
    await browser.close();
  });
}

test('karte.html: the difference view updates while running', opts, async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(url('karte.html'));
  await p.click('.view-pick[data-view="diff"]');
  const shot = async () => p.locator('#draw-canvas').screenshot();
  const before = await shot();
  await p.click('#sim-primary'); await p.waitForTimeout(1500); await p.click('#sim-primary');
  const after = await shot();
  assert.notDeepEqual(before, after);
  assert.equal(await p.locator('.view-pick[data-view="diff"]').getAttribute('aria-pressed'), 'true');
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

test('karte.html: all three maps are the start view; a tap sets a station that records A and B', opts, async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(url('karte.html'));
  assert.equal(await p.locator('.view-pick[data-view="all"]').getAttribute('aria-pressed'), 'true');
  assert.ok(await p.locator('#station-empty').isVisible());
  const s = await p.locator('#stage').boundingBox();
  await p.mouse.click(s.x + s.width / 2, s.y + s.height * 0.35);
  assert.ok(await p.locator('#station-empty').isHidden(), 'station set');
  await p.selectOption('#speed-select', '2');
  await p.click('#sim-primary'); await p.waitForTimeout(1500);
  const n = await p.evaluate(() => document.getElementById('station-chart').toDataURL().length);
  assert.ok(n > 2000, 'station chart drawn');
  await browser.close();
});
