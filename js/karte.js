// Chapter 3: two weather maps from the two-layer model. Map A and map B
// start from the same equilibrated weather; B has a small warm bubble. By
// default all three maps show at once: A, B and where they differ. A tap
// sets a weather station that records the temperature at that spot in A and
// B. The model is js/models/qg2layer.js, loop, buttons and the difference
// chart js/chaos-lab.js.
(() => {
  'use strict';
  const QG = window.QG2;
  const FFT = window.FFT;
  const INK = window.THEME.pendulum.ink;
  const PURPLE = window.THEME.palette.purple;
  const ACCENT = window.THEME.palette.orange;
  const FONT = window.THEME.font;
  const P = QG.DEFAULTS;
  const NX = P.nx, NY = P.ny, ASPECT = P.L / P.W;   // maps are twice as wide as high
  const DX = P.L / NX, DY = P.W / NY;
  const RADIUS = 5e5;                 // the warm bubble, metres

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  const deltaRange = document.getElementById('delta-range');
  const deltaOut = document.getElementById('delta-out');
  const signBtns = [...document.querySelectorAll('.sign-pick .pick')];
  const viewBtns = [...document.querySelectorAll('.view-pick')];
  const stationCanvas = document.getElementById('station-chart');
  const stationCtx = stationCanvas.getContext('2d');
  const stationEmpty = document.getElementById('station-empty');
  const tasks = SCAPE.taskDialog('karte-tasks');
  const hint = SCAPE.badge(document.getElementById('stage-frame'));
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
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) out[((j + sy) % NY) * NX + (i + sx) % NX] = q[j * NX + i];
    return out;
  }
  let startNo = 0;
  function startState() {
    const [q1, q2] = SNAPS[startNo % SNAPS.length];
    const sx = (startNo * 23) % NX, sy = (startNo * 7) % NY;
    return [rolled(q1, sx, sy), rolled(q2, sx, sy)];
  }

  // ============ MODEL ADAPTER ============
  // strength of the bubble: off, then steps of ten up to 5 °C. Up to that
  // the model stays well inside its stability limit (checked to 40 °C);
  // above a few degrees it would no longer be a "tiny" difference.
  const LEVELS = [0, 1e-5, 1e-4, 1e-3, 1e-2, 0.1, 1, 5];
  let sign = 1;
  const strength = () => LEVELS[+deltaRange.value];
  const fmtDelta = (v) => (v === 0 ? t('karte.delta.none') : t('karte.delta.value', Math.sign(v), Math.abs(v).toLocaleString('de-DE', { maximumFractionDigits: 5 })));
  let A, B, delta = sign * strength();
  let bubble = { x: 0.5 * P.L, y: 0.45 * P.W };
  let station = null;                 // { x, y } in metres
  let rec = { t: [], a: [], b: [] };  // station recording
  let cache = { t: -1, e: 0 };
  const model = {
    stepsPerDay: QG.DAY / P.dt,       // 96 steps of 15 minutes
    sampleEvery: 6,
    maxStepsPerFrame: 40,
    msBudget: 12,
    chartDays: 40,
    restart() {
      const [q1, q2] = startState();
      A = new QG.Model().setQ(q1, q2);
      B = A.clone();
      if (delta !== 0) B.perturbTemperature(bubble.x, bubble.y, RADIUS, delta / QG.KELVIN);
      cache.t = -1;
      passed = false; stationPassed = false;
      rec = { t: [], a: [], b: [] };
      recordStation();
    },
    newStart() { startNo++; },
    step() { A.step(); B.step(); },
    day() { return A.t / QG.DAY; },
    diff() {
      if (cache.t !== A.t) { cache = { t: A.t, e: QG.rmsDiff(A.thickness(), B.thickness()) / (Math.SQRT2 * QG.CLIM) }; }
      return cache.e;
    },
    render,
    onSample(l) { recordStation(); checkTasks(l); },
    drawCharts: drawStationChart
  };

  // ============ TEMPERATURE AT ONE PLACE ============
  // Exact value of the model field at (x, y): the Fourier series summed at
  // that point (no grid interpolation). Temperature = thickness anomaly plus
  // the imposed south-north gradient, converted to °C (docs/modelle.md).
  let phase = null;
  function setPhase() {
    phase = { c: new Float64Array(NX * NY), s: new Float64Array(NX * NY) };
    for (let j = 0; j < NY; j++) {
      const l = (j < NY / 2 ? j : j - NY) * 2 * Math.PI / P.W;
      for (let i = 0; i < NX; i++) {
        const k = (i < NX / 2 ? i : i - NX) * 2 * Math.PI / P.L;
        const a = k * station.x + l * station.y;
        phase.c[j * NX + i] = Math.cos(a); phase.s[j * NX + i] = Math.sin(a);
      }
    }
  }
  function temperatureAt(m) {
    m.invert();
    let v = 0;
    for (let k = 0; k < m.n; k++) v += (m.p1r[k] - m.p2r[k]) * phase.c[k] - (m.p1i[k] - m.p2i[k]) * phase.s[k];
    v /= m.n;
    return QG.KELVIN * (v - (P.U1 - P.U2) * (station.y - P.W / 2));
  }
  function recordStation() {
    if (!station) return;
    rec.t.push(model.day()); rec.a.push(temperatureAt(A)); rec.b.push(temperatureAt(B));
  }

  // ============ FIELDS FOR THE DISPLAY ============
  // Temperature (°C) and upper-level flow of one run on the model grid,
  // cached per model time: the three maps share them.
  const tr = new Float64Array(NX * NY), ti = new Float64Array(NX * NY);
  const bufs = [0, 1].map(() => ({ t: -1, T: new Float64Array(NX * NY), S: new Float64Array(NX * NY) }));
  function fields(m, slot) {
    const f = bufs[slot];
    if (f.t === m.t && f.m === m) return f;
    m.invert();
    for (let k = 0; k < m.n; k++) { tr[k] = m.p1r[k] - m.p2r[k]; ti[k] = m.p1i[k] - m.p2i[k]; }
    FFT.fft2(tr, ti, NX, NY, true);
    for (let j = 0; j < NY; j++) {
      const y = j * DY - P.W / 2;
      // thickness of the imposed shear is −(U1 − U2)·y: warm south, cold north
      for (let i = 0; i < NX; i++) f.T[j * NX + i] = QG.KELVIN * (tr[j * NX + i] - (P.U1 - P.U2) * y);
    }
    tr.set(m.p1r); ti.set(m.p1i);
    FFT.fft2(tr, ti, NX, NY, true);
    for (let j = 0; j < NY; j++) {
      const y = j * DY - P.W / 2;
      for (let i = 0; i < NX; i++) f.S[j * NX + i] = tr[j * NX + i] - P.U1 * y;
    }
    f.seg = segments(f.S);
    f.t = m.t; f.m = m;
    return f;
  }

  // ============ DRAWING ============
  // soft colour fields: 1.5 device pixels per CSS pixel are plenty and save
  // a lot of rasterising on phones with 3× screens
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let W = 0, H = 0;
  function layout() {
    const r = stage.getBoundingClientRect();
    if (Math.abs(r.width - W) < 0.5 && Math.abs(r.height - H) < 0.5) return;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const off = document.createElement('canvas');
  off.width = NX; off.height = NY;
  const offCtx = off.getContext('2d');
  const img = offCtx.createImageData(NX, NY);
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const purple = hexRgb(PURPLE);
  // colour tables, 256 steps each: temperature −25 … +25 °C, difference
  // 0.001 … 10 °C on a log scale
  const LUT_T = new Uint8Array(256 * 3), LUT_D = new Uint8Array(256 * 3);
  for (let k = 0; k < 256; k++) {
    LUT_T.set(window.THEME.tempColor(k / 255).match(/\d+/g).map(Number), 3 * k);
    LUT_D.set([0, 1, 2].map((m) => Math.round(255 + (purple[m] - 255) * k / 255)), 3 * k);
  }
  const idxT = (v) => Math.max(0, Math.min(255, Math.round((v + 25) / 50 * 255)));
  const idxD = (d) => Math.max(0, Math.min(255, Math.round((Math.log10(Math.max(d, 1e-9)) + 3) / 4 * 255)));

  // A map is a rectangle w × h on the stage. Grid point (i, j) sits at the
  // centre of its cell; north is up.
  const toScreen = (m, x, y) => [m.x0 + (x / DX + 0.5) * m.w / NX, m.y0 + m.h - (y / DY + 0.5) * m.h / NY];
  const toModel = (m, px, py) => [((px - m.x0) / m.w * NX - 0.5) * DX, ((m.y0 + m.h - py) / m.h * NY - 0.5) * DY];

  function paint(m, lut, index) {
    const d = img.data;
    for (let j = 0; j < NY; j++) {
      const row = (NY - 1 - j) * NX;
      for (let i = 0; i < NX; i++) {
        const c = 3 * index(j * NX + i), o = (row + i) * 4;
        d[o] = lut[c]; d[o + 1] = lut[c + 1]; d[o + 2] = lut[c + 2]; d[o + 3] = 255;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, m.x0, m.y0, m.w, m.h);
  }
  // Isolines of the flow (marching squares, periodic east-west), worked out
  // once per model state in grid units and only scaled when drawn.
  function segments(S) {
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < S.length; k++) { if (S[k] < lo) lo = S[k]; if (S[k] > hi) hi = S[k]; }
    const step = P.U1 * P.W / 9, out = [];
    const first = Math.ceil(lo / step) * step;
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) {
      const i1 = (i + 1) % NX;
      const a = S[j * NX + i], b = S[j * NX + i1], c = S[(j + 1) * NX + i1], d = S[(j + 1) * NX + i];
      const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
      for (let level = Math.max(first, Math.ceil(mn / step) * step); level <= mx; level += step) {
        // crossings on the four edges, in order: bottom, right, top, left
        let n = 0, ax = 0, ay = 0;
        const edge = (p, q, px, py, qx, qy) => {
          if ((p < level) === (q < level)) return;
          const f = (level - p) / (q - p), ex = px + f * (qx - px), ey = py + f * (qy - py);
          if (n % 2 === 0) { ax = ex; ay = ey; } else out.push(ax, ay, ex, ey);
          n++;
        };
        edge(a, b, i, j, i + 1, j); edge(b, c, i + 1, j, i + 1, j + 1);
        edge(c, d, i + 1, j + 1, i, j + 1); edge(d, a, i, j + 1, i, j);
      }
    }
    return Float32Array.from(out);
  }
  function contours(m, seg) {
    const cw = m.w / NX, ch = m.h / NY, x0 = m.x0 + 0.5 * cw, y0 = m.y0 + m.h - 0.5 * ch;
    ctx.save();
    ctx.beginPath(); ctx.rect(m.x0, m.y0, m.w, m.h); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k < seg.length; k += 4) {
      ctx.moveTo(x0 + seg[k] * cw, y0 - seg[k + 1] * ch);
      ctx.lineTo(x0 + seg[k + 2] * cw, y0 - seg[k + 3] * ch);
    }
    ctx.stroke();
    ctx.restore();
  }

  const fmt1 = (v) => v.toFixed(1).replace('.', ',').replace('-', '−');
  function drawMap(m, mode) {
    const fa = fields(A, 0), fb = fields(B, 1);
    if (m.kind === 'diff') {
      paint(m, LUT_D, (k) => idxD(Math.abs(fa.T[k] - fb.T[k])));
      contours(m, fa.seg);
    } else {
      const f = m.kind === 'a' ? fa : fb;
      paint(m, LUT_T, (k) => idxT(f.T[k]));
      contours(m, f.seg);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(m.x0, m.y0, m.w, m.h);
    ctx.fillStyle = INK; ctx.font = '500 11px ' + FONT; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    ctx.fillText(t(m.kind === 'a' ? 'karte.mapA' : m.kind === 'b' ? 'karte.mapB' : 'karte.mapDiff'), m.x0, m.y0 - 3);
    // north is up: a small mark in the top right corner of each map
    ctx.textAlign = 'right';
    ctx.fillText(t('karte.northMark'), m.x0 + m.w, m.y0 - 3);
    // the bubble before the start (in B and the difference)
    if (mode === 'setup' && m.kind !== 'a' && delta !== 0) {
      const [bx, by] = toScreen(m, bubble.x, bubble.y), r = RADIUS / P.L * m.w;
      ctx.strokeStyle = INK; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, Math.max(r, 8), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(t('karte.bubble', fmtDelta(delta)), bx, by - Math.max(r, 8) - 3);
    }
    // the weather station: a pin, with the reading in A and B
    if (station) {
      const [sx, sy] = toScreen(m, station.x, station.y);
      ctx.fillStyle = INK; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 6, sy - 12); ctx.lineTo(sx + 6, sy - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (m.kind !== 'diff' && rec.t.length) {
        const v = m.kind === 'a' ? rec.a[rec.a.length - 1] : rec.b[rec.b.length - 1];
        const label = t('karte.stationValue', fmt1(v));
        ctx.font = '500 11px ' + FONT;
        const w = ctx.measureText(label).width + 8;
        const lx = Math.min(Math.max(sx - w / 2, m.x0 + 2), m.x0 + m.w - w - 2), ly = Math.max(sy - 32, m.y0 + 2);
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(lx, ly, w, 17);
        ctx.fillStyle = m.kind === 'a' ? INK : ACCENT; ctx.fillRect(lx, ly + 15, w, 2);
        ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(label, lx + 4, ly + 8.5);
      }
    }
  }

  // Where the maps go: for "all", whichever arrangement makes them largest
  // -- three in a column (phone), three in a row, or A and B side by side
  // with the difference below.
  const LABEL = 16, GAP = 10;
  function arrange(kinds, x0, y0, w, h) {
    if (kinds.length === 1) {
      const mw = Math.min(w, h * ASPECT);
      return [{ kind: kinds[0], x0: x0 + (w - mw) / 2, y0, w: mw, h: mw / ASPECT }];
    }
    const options = [
      { cols: 1, rows: 3 }, { cols: 3, rows: 1 }, { cols: 2, rows: 2 }
    ].map((o) => {
      const mw = Math.min((w - (o.cols - 1) * GAP) / o.cols, ((h - o.rows * LABEL - (o.rows - 1) * GAP) / o.rows) * ASPECT);
      return Object.assign(o, { mw });
    });
    const best = options.reduce((a, b) => (b.mw > a.mw ? b : a));
    const mw = best.mw, mh = mw / ASPECT;
    const totalW = best.cols * mw + (best.cols - 1) * GAP;
    const rows = best.cols === 3 ? 1 : best.cols === 2 ? 2 : 3;
    y0 += Math.max(0, (h - rows * (mh + LABEL) - (rows - 1) * GAP) / 2);   // centred in the height
    return kinds.map((kind, k) => {
      let col = k % best.cols, row = Math.floor(k / best.cols);
      let left = x0 + (w - totalW) / 2;
      if (best.cols === 2 && k === 2) { col = 0; left = x0 + (w - mw) / 2; }   // the difference centred below
      return { kind, x0: left + col * (mw + GAP), y0: y0 + row * (mh + LABEL + GAP), w: mw, h: mh };
    });
  }

  let view = 'all', maps = [];
  function render(mode) {
    layout();
    ctx.clearRect(0, 0, W, H);
    // narrow stages put the colour scale in its own row under the buttons
    const narrow = W < 560;
    const top = (narrow ? 104 : 60) + LABEL, side = 12, bottom = 32;
    const kinds = view === 'all' ? ['a', 'b', 'diff'] : [view];
    maps = arrange(kinds, side, top, W - 2 * side, H - top - bottom);
    maps.forEach((m) => drawMap(m, mode));
    // the scale bar under the lowest map
    const last = maps.reduce((a, b) => (b.y0 + b.h > a.y0 + a.h ? b : a));
    ctx.fillStyle = INK; ctx.font = '500 10px ' + FONT; ctx.textBaseline = 'top';
    const km = 1e6 / P.L * last.w;
    ctx.fillRect(last.x0, last.y0 + last.h + 8, km, 3);
    ctx.textAlign = 'left';
    ctx.fillText(t('karte.km'), last.x0 + km + 6, last.y0 + last.h + 4);
    legend(narrow);
  }
  function legend(narrow) {
    const diffOnly = view === 'diff';
    const bars = view === 'all' ? ['temp', 'diff'] : [diffOnly ? 'diff' : 'temp'];
    const w = Math.min(120, (W - 40) * (narrow ? 0.45 : 0.22));
    bars.forEach((kind, k) => {
      const x = narrow ? 14 + k * (w + 24) : W - (bars.length - k) * (w + 18), y = narrow ? 70 : 20;
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      for (let s = 0; s <= 10; s++) {
        const f = s / 10;
        g.addColorStop(f, kind === 'diff' ? 'rgb(' + [0, 1, 2].map((c) => Math.round(255 + (purple[c] - 255) * f)).join(',') + ')' : window.THEME.tempColor(f * 0.8 + 0.1));
      }
      ctx.fillStyle = g; ctx.fillRect(x, y, w, 8);
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, 8);
      ctx.fillStyle = INK; ctx.font = '500 10px ' + FONT; ctx.textBaseline = 'top';
      const ends = t(kind === 'diff' ? 'karte.legendDiffEnds' : 'karte.legendTempEnds');
      ctx.textAlign = 'left'; ctx.fillText(ends[0], x, y + 11);
      ctx.textAlign = 'right'; ctx.fillText(ends[1], x + w, y + 11);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(t(kind === 'diff' ? 'karte.legendDiff' : 'karte.legendTemp'), x + w / 2, y - 2);
    });
  }

  // ============ STATION CHART ============
  const sdpr = dpr;
  function drawStationChart(tMax) {
    const r = stationCanvas.getBoundingClientRect();
    const w = r.width, h = r.height;
    if (stationCanvas.width !== Math.round(w * sdpr)) { stationCanvas.width = Math.round(w * sdpr); stationCanvas.height = Math.round(h * sdpr); }
    const g = stationCtx;
    g.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    g.clearRect(0, 0, w, h);
    stationEmpty.hidden = !!station;
    if (!station) return;          // only the hint until a station is set
    const padL = 72, padR = 8, padT = 6, padB = 20;
    g.font = '500 10px ' + FONT; g.fillStyle = INK;
    // axes
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < rec.t.length; k++) { lo = Math.min(lo, rec.a[k], rec.b[k]); hi = Math.max(hi, rec.a[k], rec.b[k]); }
    if (!(hi > lo)) { lo = (isFinite(lo) ? lo : 0) - 5; hi = lo + 10; }
    const pad = Math.max(2, (hi - lo) * 0.1);
    lo = Math.floor((lo - pad) / 5) * 5; hi = Math.ceil((hi + pad) / 5) * 5;
    const x = (d) => padL + (w - padL - padR) * d / tMax, y = (v) => padT + (h - padT - padB) * (hi - v) / (hi - lo);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    const step = hi - lo > 30 ? 10 : 5;
    for (let v = lo; v <= hi; v += step) {
      g.beginPath(); g.moveTo(padL, y(v)); g.lineTo(w - padR, y(v)); g.stroke();
      g.fillText(fmt1(v).replace(',0', '') + ' °C', padL - 6, y(v));
    }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const st = tMax > 60 ? 20 : tMax > 30 ? 10 : 5;
    for (let d = 0; d <= tMax + 1e-9; d += st) g.fillText(String(d), x(d), h - padB + 5);
    g.textAlign = 'right';
    g.fillText(t('lab.chartDays'), padL - 8, h - padB + 5);
    g.save(); g.translate(8, padT + (h - padT - padB) / 2); g.rotate(-Math.PI / 2);
    g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(t('karte.legendTemp'), 0, 0); g.restore();
    const line = (vals, col, width) => {
      if (rec.t.length < 2) return;
      g.strokeStyle = col; g.lineWidth = width; g.lineJoin = 'round';
      g.beginPath();
      for (let k = 0; k < rec.t.length; k++) { const px = x(Math.min(rec.t[k], tMax)), py = y(vals[k]); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    };
    line(rec.b, ACCENT, 2.4);
    line(rec.a, INK, 1.6);
  }

  // ============ INTERACTION ============
  let lab;
  function setView(v) {
    view = v;
    viewBtns.forEach((x) => { const on = x.dataset.view === v; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
    if (lab) lab.frame();
  }
  viewBtns.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  function setDelta() {
    delta = sign * strength();
    deltaOut.textContent = fmtDelta(delta);
    signBtns.forEach((b) => { const on = +b.dataset.sign === sign; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  }
  deltaRange.addEventListener('input', () => { setDelta(); lab.restart(); });
  signBtns.forEach((b) => b.addEventListener('click', () => { sign = +b.dataset.sign; setDelta(); lab.restart(); }));
  setDelta();

  // Drag the bubble (before the start) or tap anywhere on a map for a
  // weather station.
  let press = null;
  const local = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const mapAt = (x, y) => maps.find((m) => x >= m.x0 && x <= m.x0 + m.w && y >= m.y0 && y <= m.y0 + m.h);
  stage.addEventListener('pointerdown', (e) => {
    const [x, y] = local(e), m = mapAt(x, y);
    if (!m) return;
    let onBubble = false;
    if (lab.mode === 'setup' && delta !== 0 && m.kind !== 'a') {
      const [bx, by] = toScreen(m, bubble.x, bubble.y);
      onBubble = Math.hypot(x - bx, y - by) < Math.max(RADIUS / P.L * m.w, 8) + 14;
    }
    press = { x, y, m, onBubble, moved: false };
    if (onBubble) { stage.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!press || !press.onBubble) return;
    const [x, y] = local(e);
    if (Math.hypot(x - press.x, y - press.y) > 4) press.moved = true;
    const [mx, my] = toModel(press.m, x, y);
    bubble = { x: ((mx % P.L) + P.L) % P.L, y: Math.max(0, Math.min(P.W - DY, my)) };
    lab.frame();
  });
  stage.addEventListener('pointerup', (e) => {
    if (!press) return;
    const p = press; press = null;
    if (p.onBubble && p.moved) { lab.restart(); return; }
    const [x, y] = local(e);
    if (Math.hypot(x - p.x, y - p.y) > 10) return;
    const [mx, my] = toModel(p.m, x, y);
    station = { x: ((mx % P.L) + P.L) % P.L, y: Math.max(0, Math.min(P.W - DY, my)) };
    setPhase();
    // the recording starts where the station is set
    rec = { t: [], a: [], b: [] };
    recordStation();
    stationPassed = false;
    hint.hide();
    lab.frame();
    lab.chart && drawStationChart(Math.max(model.chartDays, Math.ceil(model.day() / 10) * 10));
  });

  // ============ TASKS ============
  // 1: the difference map is on screen while the maps start to differ.
  // 2: the station shows more than 5 °C between A and B.
  // 3: the difference passes 50 %. 4: a 100 times weaker bubble.
  const times = {};
  let passed = false, stationPassed = false;
  function checkTasks(l) {
    const e = l.rec.last;
    if ((view === 'diff' || view === 'all') && e >= 0.01) tasks.done('where');
    const n = rec.t.length;
    if (!stationPassed && n && Math.abs(rec.a[n - 1] - rec.b[n - 1]) > 5) {
      stationPassed = true;
      $('station-feedback').textContent = t('karte.tasks.doneStation', l.fmtDays(model.day()));
      tasks.done('station');
    }
    if (!passed && e >= 0.5) {
      passed = true;
      $('apart-feedback').textContent = t('karte.tasks.doneApart', l.fmtDays(model.day()));
      tasks.done('apart');
      times[Math.abs(delta)] = model.day();
      const keys = Object.keys(times).map(Number).sort((x, y) => y - x);
      const label = (k) => fmtDelta(sign * k);
      $('smaller-times').hidden = false;
      $('smaller-times').textContent = t('karte.tasks.times', keys.map((k) => t('karte.tasks.timeItem', label(k), l.fmtDays(times[k]))).join(' · '));
      if (keys.length >= 2 && !tasks.isDone('smaller')) {
        const small = Math.min(...keys), big = keys.find((k) => k > small);
        $('smaller-feedback').textContent = t('karte.tasks.doneSmaller', l.fmtDays(times[small]), l.fmtDays(times[big]), Math.round(big / small).toLocaleString('de-DE'));
        tasks.done('smaller');
      }
    }
  }

  // ============ INIT ============
  SCAPE.onIdle = () => { location.replace('index.html' + location.search); };
  layout();
  setView('all');
  lab = SCAPE.chaosLab(model);
  lab.restart();
  hint.show(t('karte.hintStation'));
  setTimeout(() => { hint.hide(); }, 6000);
  window.addEventListener('resize', () => { W = 0; lab.frame(); });
})();
