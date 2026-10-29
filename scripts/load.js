// Bytes and load time of each page over a local static server, once with
// an unthrottled connection and once with a slow mobile one (1.6 Mbit/s,
// 150 ms latency, CPU 4× slower). Needs Playwright and Python 3.
//   Run:  node scripts/load.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const port = 9100 + Math.floor(Math.random() * 500);
  const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch();
  const rows = [];
  for (const slow of [false, true]) {
    for (const page of ['index.html', 'lorenz.html', 'lorenz96.html', 'karte.html']) {
      const ctx = await browser.newContext({ serviceWorkers: 'block' });
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      if (slow) {
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      }
      let bytes = 0;
      cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
      const t0 = Date.now();
      await p.goto('http://127.0.0.1:' + port + '/' + page, { waitUntil: 'load' });
      const ms = Date.now() - t0;
      rows.push({ page, network: slow ? 'langsam (1,6 Mbit/s, 150 ms, CPU 4×)' : 'lokal', kB: (bytes / 1024).toFixed(0), load_ms: ms });
      await ctx.close();
    }
  }
  console.table(rows);
  await browser.close();
  server.kill();
})();
