// Offline: after one visit over http, all four chapters load without a
// network (service worker sw.js). Needs Playwright and Python 3 for a
// throw-away static server.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { /* skipped below */ }

test('all chapters work offline after the first visit', { skip: chromium ? false : 'playwright not installed' }, async () => {
  const port = 8765 + Math.floor(Math.random() * 1000);
  const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  try {
    await new Promise((r) => setTimeout(r, 800));
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const base = 'http://127.0.0.1:' + port + '/';
    await p.goto(base + 'index.html');
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForTimeout(500);
    await ctx.setOffline(true);
    for (const page of ['index.html', 'lorenz.html', 'lorenz96.html', 'karte.html']) {
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(base + page);
      await p.waitForTimeout(300);
      assert.ok(await p.locator('#sim-primary').isVisible(), page + ' loaded offline');
      assert.deepEqual(errors, [], page);
    }
    // and it still computes
    await p.click('#sim-primary'); await p.waitForTimeout(1000);
    assert.ok(parseFloat((await p.locator('#ro-zeit').textContent()).replace(',', '.')) > 0);
    await browser.close();
  } finally {
    server.kill();
  }
});
