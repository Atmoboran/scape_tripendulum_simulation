// Chapter 4: two weather maps from the two-layer model. Map A and map B
// start from the same equilibrated weather; B has a small warm bubble. The
// model is js/models/qg2layer.js, loop, buttons and chart js/chaos-lab.js.
(() => {
  'use strict';
  const QG = window.QG2;
  const FFT = window.FFT;
  const INK = window.THEME.pendulum.ink;
  const PURPLE = window.THEME.palette.purple;
  const FONT = window.THEME.font;
  const P = QG.DEFAULTS;
  const RADIUS = 5e5;                 // the warm bubble, metres
  const UP = 64;                      // display grid (spectral interpolation)

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  const deltaSelect = document.getElementById('delta-select');
  const viewBtns = [...document.querySelectorAll('.view-pick')];
  const tasks = SCAPE.taskDialog('karte-tasks');
  const $ = (id) => document.getElementById(id);

  // ============ START STATES ============
  // Three equilibrated snapshots (data/qg-start.js); a new start takes the
  // next one and shifts it around the periodic domain.
  const decode = (s) => {
    const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    return Float64Array.from(new Float32Array(bytes.buffer));
  };
  const SNAPS = window.QG_START.snapshots.map((s) => [decode(s.q1), decode(s.q2)]);
  function rolled(q, sx, sy) {
    const out = new Float64Array(q.length);
    for (let j = 0; j < P.ny; j++) for (let i = 0; i < P.nx; i++) out[((j + sy) % P.ny) * P.nx + (i + sx) % P.nx] = q[j * P.nx + i];
    return out;
  }
  let startNo = 0;
  function startState() {
    const [q1, q2] = SNAPS[startNo % SNAPS.length];
    const sx = (startNo * 11) % P.nx, sy = (startNo * 7) % P.ny;
    return [rolled(q1, sx, sy), rolled(q2, sx, sy)];
  }

  // ============ MODEL ADAPTER ============
  let A, B, delta = +deltaSelect.value;
  let bubble = { x: 0.5 * P.L, y: 0.45 * P.W };
  let cache = { t: -1, e: 0 };
  const model = {
    stepsPerDay: QG.DAY / P.dt,          // 96 steps of 15 minutes
    sampleEvery: 6,
    maxStepsPerFrame: 40,
    msBudget: 12,
    chartDays: 40,
    restart() {
      const [q1, q2] = startState();
      A = new QG.Model().setQ(q1, q2);
      B = A.clone();
      if (delta > 0) B.perturbTemperature(bubble.x, bubble.y, RADIUS, delta / QG.KELVIN);
      cache.t = -1;
      passed = false;
    },
    newStart() { startNo++; },
    step() { A.step(); B.step(); },
    day() { return A.t / QG.DAY; },
    diff() {
      if (cache.t !== A.t) { cache = { t: A.t, e: QG.rmsDiff(A.thickness(), B.thickness()) / (Math.SQRT2 * QG.CLIM) }; }
      return cache.e;
    },
    render,
    onSample: checkTasks
  };

  // ============ FIELDS FOR THE DISPLAY ============
  // 32² spectrum → 64² grid by zero padding: smooth maps and contours at the
  // cost of one transform, the model itself stays at 32².
  const upR = new Float64Array(UP * UP), upI = new Float64Array(UP * UP);
  function upsample(re, im) {
    upR.fill(0); upI.fill(0);
    const n = P.nx, h = n / 2, s = (UP * UP) / (n * n);
    for (let j = 0; j < n; j++) {
      if (j === h) continue;
      const jj = j < h ? j : UP - (n - j);
      for (let i = 0; i < n; i++) {
        if (i === h) continue;
        const ii = i < h ? i : UP - (n - i);
        upR[jj * UP + ii] = re[j * n + i] * s; upI[jj * UP + ii] = im[j * n + i] * s;
      }
    }
    FFT.fft2(upR, upI, UP, UP, true);
    return Float64Array.from(upR);
  }
  // temperature anomaly field (K) and upper-layer flow of one model, into
  // reused buffers (one set per map)
  const tr = new Float64Array(P.nx * P.ny), ti = new Float64Array(P.nx * P.ny);
  const bufs = [0, 1].map(() => ({ T: new Float64Array(UP * UP), S: new Float64Array(UP * UP) }));
  function fields(m, slot) {
    m.invert();
    for (let k = 0; k < m.n; k++) { tr[k] = m.p1r[k] - m.p2r[k]; ti[k] = m.p1i[k] - m.p2i[k]; }
    const { T, S } = bufs[slot];
    const th = upsample(tr, ti);
    for (let j = 0; j < UP; j++) {
      const y = (j + 0.5) / UP * P.W - P.W / 2;
      // thickness of the imposed shear is −(U1 − U2)·y: warm south, cold north
      for (let i = 0; i < UP; i++) { const k = j * UP + i; T[k] = QG.KELVIN * (th[k] - (P.U1 - P.U2) * y); }
    }
    const psi = upsample(m.p1r, m.p1i);
    for (let j = 0; j < UP; j++) {
      const y = (j + 0.5) / UP * P.W - P.W / 2;
      for (let i = 0; i < UP; i++) { const k = j * UP + i; S[k] = psi[k] - P.U1 * y; }
    }
    return bufs[slot];
  }

  // ============ DRAWING ============
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  function layout() {
    const r = stage.getBoundingClientRect();
    if (Math.abs(r.width - W) < 0.5 && Math.abs(r.height - H) < 0.5) return;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const off = document.createElement('canvas');
  off.width = UP; off.height = UP;
  const offCtx = off.getContext('2d');
  const img = offCtx.createImageData(UP, UP);
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const purple = hexRgb(PURPLE);
  // colour tables, 256 steps each: temperature −25 … +25 °C, difference
  // 0.001 … 10 °C on a log scale
  const LUT_T = new Uint8Array(256 * 3), LUT_D = new Uint8Array(256 * 3);
  for (let k = 0; k < 256; k++) {
    const c = window.THEME.tempColor(k / 255).match(/\d+/g).map(Number);
    LUT_T.set(c, 3 * k);
    const f = k / 255;
    LUT_D.set([0, 1, 2].map((m) => Math.round(255 + (purple[m] - 255) * f)), 3 * k);
  }
  const idxT = (v) => Math.max(0, Math.min(255, Math.round((v + 25) / 50 * 255)));
  const idxD = (d) => Math.max(0, Math.min(255, Math.round((Math.log10(Math.max(d, 1e-9)) + 3) / 4 * 255)));

  // Paint a 64² field into a square on the stage; row 0 (south) at the bottom.
  function paint(x0, y0, size, lut, index) {
    const d = img.data;
    for (let j = 0; j < UP; j++) {
      const row = (UP - 1 - j) * UP;
      for (let i = 0; i < UP; i++) {
        const c = 3 * index(j * UP + i), o = (row + i) * 4;
        d[o] = lut[c]; d[o + 1] = lut[c + 1]; d[o + 2] = lut[c + 2]; d[o + 3] = 255;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, x0, y0, size, size);
  }
  // Isolines of the flow (marching squares, periodic east-west), one path.
  function contours(x0, y0, size, S) {
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < S.length; k++) { if (S[k] < lo) lo = S[k]; if (S[k] > hi) hi = S[k]; }
    const step = P.U1 * P.W / 9, cell = size / UP;
    const X = (i) => x0 + (i + 0.5) * cell, Y = (j) => y0 + size - (j + 0.5) * cell;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, size, size); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    const first = Math.ceil(lo / step) * step;
    for (let j = 0; j < UP - 1; j++) for (let i = 0; i < UP; i++) {
      const i1 = (i + 1) % UP;
      const a = S[j * UP + i], b = S[j * UP + i1], c = S[(j + 1) * UP + i1], d = S[(j + 1) * UP + i];
      const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
      for (let level = Math.max(first, Math.ceil(mn / step) * step); level <= mx; level += step) {
        // crossings on the four edges, in order: bottom, right, top, left
        let n = 0, ax = 0, ay = 0;
        const edge = (p, q, px, py, qx, qy) => {
          if ((p < level) === (q < level)) return;
          const f = (level - p) / (q - p), ex = X(px + f * (qx - px)), ey = Y(py + f * (qy - py));
          if (n % 2 === 0) { ax = ex; ay = ey; } else { ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); }
          n++;
        };
        edge(a, b, i, j, i + 1, j); edge(b, c, i + 1, j, i + 1, j + 1);
        edge(c, d, i + 1, j + 1, i, j + 1); edge(d, a, i, j + 1, i, j);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawMap(x0, y0, size, kind, label, mode) {
    if (kind === 'diff') {
      const fa = fields(A, 0), fb = fields(B, 1);
      paint(x0, y0, size, LUT_D, (k) => idxD(Math.abs(fa.T[k] - fb.T[k])));
      contours(x0, y0, size, fa.S);
    } else {
      const f = fields(kind === 'a' ? A : B, kind === 'a' ? 0 : 1);
      paint(x0, y0, size, LUT_T, (k) => idxT(f.T[k]));
      contours(x0, y0, size, f.S);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, size, size);
    ctx.fillStyle = INK; ctx.font = '500 11px ' + FONT; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    ctx.fillText(label, x0, y0 - 4);
    // the bubble before the start (in B and the difference)
    if (mode === 'setup' && kind !== 'a' && delta > 0) {
      const bx = x0 + bubble.x / P.L * size, by = y0 + size - bubble.y / P.W * size, r = RADIUS / P.L * size;
      ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(t('karte.bubble', t('karte.delta.values')[String(delta)] || String(delta)), bx, by - r - 3);
    }
    maps.push({ x0, y0, size });
  }

  let view = null, maps = [];
  function render(mode) {
    layout();
    ctx.clearRect(0, 0, W, H);
    maps = [];
    // narrow stages put the colour scale in its own row under the buttons
    const narrow = W < 560;
    const top = narrow ? 104 : 64, side = 14, bottom = 34;
    const availW = W - 2 * side, availH = H - top - bottom;
    ctx.font = '500 10px ' + FONT;
    if (view === 'both') {
      if (availW >= availH) {
        const s = Math.min((availW - 16) / 2, availH);
        const x = (W - 2 * s - 16) / 2;
        drawMap(x, top, s, 'a', t('karte.mapA'), mode);
        drawMap(x + s + 16, top, s, 'b', t('karte.mapB'), mode);
      } else {
        const s = Math.min(availW, (availH - 20) / 2);
        const x = (W - s) / 2;
        drawMap(x, top, s, 'a', t('karte.mapA'), mode);
        drawMap(x, top + s + 20, s, 'b', t('karte.mapB'), mode);
      }
    } else {
      const s = Math.min(availW, availH), x = (W - s) / 2;
      drawMap(x, top, s, view, t(view === 'a' ? 'karte.mapA' : view === 'b' ? 'karte.mapB' : 'karte.mapDiff'), mode);
    }
    // north / south and scale under the last map
    const m = maps[maps.length - 1];
    ctx.fillStyle = INK; ctx.font = '500 10px ' + FONT; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(t('karte.north'), maps[0].x0 + maps[0].size, maps[0].y0 - 4);
    ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    ctx.fillText(t('karte.south'), m.x0 + m.size / 2, m.y0 + m.size + 4);
    const km = 1e6 / P.L * m.size;
    ctx.fillRect(m.x0, m.y0 + m.size + 8, km, 3);
    ctx.textAlign = 'left';
    ctx.fillText(t('karte.km'), m.x0 + km + 6, m.y0 + m.size + 4);
    legend(narrow);
  }
  function legend(narrow) {
    // colour scale, top right (narrow: under the view buttons)
    const diff = view === 'diff', w = Math.min(130, W * 0.36), x = W - w - 14, y = narrow ? 66 : 20;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    for (let k = 0; k <= 10; k++) {
      const f = k / 10;
      g.addColorStop(f, diff ? 'rgb(' + [0, 1, 2].map((c) => Math.round(255 + (purple[c] - 255) * f)).join(',') + ')' : window.THEME.tempColor(f * 0.8 + 0.1));
    }
    ctx.fillStyle = g; ctx.fillRect(x, y, w, 9);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, 9);
    ctx.fillStyle = INK; ctx.font = '500 10px ' + FONT; ctx.textBaseline = 'top';
    const ends = t(diff ? 'karte.legendDiffEnds' : 'karte.legendTempEnds');
    ctx.textAlign = 'left'; ctx.fillText(ends[0], x, y + 12);
    ctx.textAlign = 'right'; ctx.fillText(ends[1], x + w, y + 12);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(t(diff ? 'karte.legendDiff' : 'karte.legendTemp'), x + w / 2, y - 2);
  }

  // ============ INTERACTION ============
  let lab;
  function setView(v) {
    view = v;
    viewBtns.forEach((x) => { const on = x.dataset.view === v; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
    if (lab) lab.frame();
  }
  viewBtns.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  deltaSelect.addEventListener('change', () => { delta = +deltaSelect.value; lab.restart(); });
  // a tap on a map moves the bubble (only before the start)
  stage.addEventListener('pointerup', (e) => {
    if (lab.mode !== 'setup') return;
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const m = maps.find((mm) => x >= mm.x0 && x <= mm.x0 + mm.size && y >= mm.y0 && y <= mm.y0 + mm.size);
    if (!m) return;
    bubble = { x: (x - m.x0) / m.size * P.L, y: (1 - (y - m.y0) / m.size) * P.W };
    lab.restart();
  });

  // ============ TASKS ============
  // 1: the difference view is open while the maps start to differ.
  // 2: the difference passes 50 %. 3: a 100 times weaker bubble.
  const times = {};
  let passed = false;
  function checkTasks(l) {
    const e = l.rec.last;
    if (view === 'diff' && e >= 0.01) tasks.done('where');
    if (!passed && e >= 0.5) {
      passed = true;
      $('apart-feedback').textContent = t('karte.tasks.doneApart', l.fmtDays(model.day()));
      tasks.done('apart');
      times[delta] = model.day();
      const keys = Object.keys(times).map(Number).sort((x, y) => y - x);
      const label = (k) => t('karte.delta.values')[String(k)] || String(k);
      $('smaller-times').hidden = false;
      $('smaller-times').textContent = t('karte.tasks.times', keys.map((k) => t('karte.tasks.timeItem', label(k), l.fmtDays(times[k]))).join(' · '));
      if (keys.length >= 2 && !tasks.isDone('smaller')) {
        const small = Math.min(...keys), big = keys.find((k) => k > small);
        $('smaller-feedback').textContent = t('karte.tasks.doneSmaller', l.fmtDays(times[small]), l.fmtDays(times[big]));
        tasks.done('smaller');
      }
    }
  }

  // ============ INIT ============
  SCAPE.onIdle = () => { location.replace('index.html' + location.search); };
  layout();
  setView(W > 1.3 * H ? 'both' : 'b');
  lab = SCAPE.chaosLab(model);
  lab.restart();
  window.addEventListener('resize', () => { W = 0; lab.frame(); });
})();
