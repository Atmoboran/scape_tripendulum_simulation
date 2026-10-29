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

test('online, a changed file reaches a returning visitor without any version bump', { skip: chromium ? false : 'playwright not installed' }, async () => {
  const fs = require('fs');
  const os = require('os');
  // a throw-away copy of the app, so the test can change a text
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chaos-sw-'));
  const root = path.join(__dirname, '..');
  for (const f of ['index.html', 'lorenz.html', 'lorenz96.html', 'karte.html', 'sw.js']) fs.copyFileSync(path.join(root, f), path.join(dir, f));
  for (const d of ['theme', 'css', 'content', 'js', 'data']) fs.cpSync(path.join(root, d), path.join(dir, d), { recursive: true });
  const port = 9700 + Math.floor(Math.random() * 200);
  const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: dir, stdio: 'ignore' });
  try {
    await new Promise((r) => setTimeout(r, 800));
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const page = 'http://127.0.0.1:' + port + '/index.html';
    await p.goto(page);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();                       // now served through the worker
    const headline = () => p.locator('.headline').textContent();
    assert.equal(await headline(), 'Wetter ist Chaos');
    const texts = path.join(dir, 'content', 'texts.de.js');
    fs.writeFileSync(texts, fs.readFileSync(texts, 'utf8').replace("headline: 'Wetter ist Chaos'", "headline: 'Neu'"));
    await p.reload();
    assert.equal(await headline(), 'Neu');
    // and offline the newest stored copy is used
    await ctx.setOffline(true);
    await p.reload();
    assert.equal(await headline(), 'Neu');
    await browser.close();
  } finally {
    server.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
