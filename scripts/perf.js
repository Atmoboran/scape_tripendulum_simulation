// Browser performance of chapters 3 and 4 in headless Chromium, with the
// CPU slowed down 1×, 4× and 8× (Chrome DevTools throttling) as a stand-in
// for slower phones. Measures frames per second, model days per real second
// (against the chosen speed), time spent computing per frame and memory.
// Needs Playwright.   Run:  node scripts/perf.js
const { chromium } = require('playwright');
const path = require('path');
const url = (p) => 'file://' + path.join(__dirname, '..', p);

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  for (const [page, speeds] of [['karte.html', ['0.5', '2']]]) {
    for (const rate of [1, 4, 8]) {
      for (const speed of speeds) {
        const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
        const cdp = await p.context().newCDPSession(p);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate });
        await p.goto(url(page));
        await p.selectOption('#speed-select', speed);
        // count frames and their length inside the page
        await p.evaluate(() => {
          window.__f = []; let last = performance.now();
          const tick = (now) => { window.__f.push(now - last); last = now; requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        });
        const day0 = await p.evaluate(() => 0);
        await p.click('#sim-primary');
        const t0 = Date.now();
        await p.evaluate(() => { window.__f.length = 0; });
        await p.waitForTimeout(8000);
        const days = parseFloat((await p.locator('#ro-zeit').textContent()).replace(',', '.'));
        const secs = (Date.now() - t0) / 1000;
        const f = await p.evaluate(() => window.__f.slice());
        const heap = await p.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : NaN));
        f.sort((a, b) => a - b);
        rows.push({ page, cpu: rate + '×', speed: speed + ' d/s', fps: (1000 / (f.reduce((a, b) => a + b, 0) / f.length)).toFixed(0),
          p95frame: f[Math.floor(f.length * 0.95)].toFixed(0) + ' ms', reached: (days / secs).toFixed(2) + ' d/s', heap: heap.toFixed(1) + ' MB' });
        void day0;
        await p.close();
      }
    }
  }
  console.table(rows);
  // long run: 3 minutes on the map at the fastest speed, memory before/after
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(url('karte.html'));
  await p.selectOption('#speed-select', '2');
  const heap = () => p.evaluate(() => performance.memory.usedJSHeapSize / 1048576);
  await p.click('#sim-primary');
  await p.waitForTimeout(10000);
  const h0 = await heap();
  for (let k = 0; k < 6; k++) {   // restart now and then, as visitors do
    await p.waitForTimeout(25000);
    await p.click('#sim-reset'); await p.click('#sim-primary');
  }
  const h1 = await heap();
  const fin = await p.evaluate(() => document.getElementById('ro-diff').textContent);
  console.log('Langlauf Karte 160 s, 6 Neustarts: Speicher ' + h0.toFixed(1) + ' → ' + h1.toFixed(1) + ' MB, Anzeige zuletzt ' + fin);
  await browser.close();
})();
