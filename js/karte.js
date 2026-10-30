// Chapter 3: two weather maps from the two-layer model. Map A and map B
// start from the same equilibrated weather; B has a small measurement error
// (a warmer or colder spot). Always on screen: A, B and where they differ;
// a weather station (a thermometer, moved by tapping) records the
// temperature at one place in A and B. On wide screens its chart is the
// fourth tile of a 2 × 2 grid, on phones it sits under the maps. The model is
// js/models/qg2layer.js, loop and buttons js/chaos-lab.js.
(() => {
  'use strict';
  const QG = window.QG2;
  const FFT = window.FFT;
  const PAL = window.THEME.palette;
  const INK = window.THEME.pendulum.ink;
  const ACCENT = PAL.orange;
  const FONT = window.THEME.font;
  const P = QG.DEFAULTS;
  const NX = P.nx, NY = P.ny, ASPECT = P.L / P.W;   // maps are twice as wide as high
  const DX = P.L / NX, DY = P.W / NY;
  const RADIUS = 5e5;                 // the measurement-error spot, metres
  const T_RANGE = 35;                 // temperature colours: −35 … +35 °C
  const D_RANGE = 4;                  // difference colours: −4 … +4 °C

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  const deltaRange = document.getElementById('delta-range');
  const deltaOut = document.getElementById('delta-out');
  const stationBox = document.querySelector('.station-box');
  const stationCanvas = document.getElementById('station-chart');
  const stationCtx = stationCanvas.getContext('2d');
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
  // The error in B: −1.0 … +1.0 °C in tenths, 0 = none (control). Checked
  // stable far beyond that (docs/validierung.md).
  const fmtC = (v, digits = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(digits).replace('.', ',') + ' °C';
  const fmtDelta = (v) => (v === 0 ? t('karte.delta.none') : fmtC(v));
  let delta = +deltaRange.value / 10;
  let A, B;
  let bubble = { x: 0.35 * P.L, y: 0.5 * P.W };
  // a station from the start, a little downstream (east) of the error
  let station = { x: bubble.x + 1.2e6, y: bubble.y };
  let rec = { t: [], a: [], b: [] };  // station recording
  let cache = { t: -1, e: 0 };
  const model = {
    stepsPerDay: QG.DAY / P.dt,       // 192 steps of 7.5 minutes
    sampleEvery: 12,                  // 16 samples per model day
    maxStepsPerFrame: 60,
    msBudget: 12,
    // the weather changes slowly on screen: 20 pictures a second are plenty
    // and spare the phone a lot of pixel work
    minDrawMs: 50,
    chartDays: 20,
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
    drawCharts: (tMax) => { if (!stationInStage) drawStationChart(stationCtx, null, tMax); }
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
    rec.t.push(model.day()); rec.a.push(temperatureAt(A)); rec.b.push(temperatureAt(B));
  }

  // ============ FIELDS FOR THE DISPLAY ============
  // Temperature (°C) and upper-level flow of one run on the model grid,
  // cached per model time: all maps share them.
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

  // ============ COLOURS ============
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f));
  // 256-step tables. Temperature: the CD scale cold – neutral – warm.
  // Difference B − A: violet (B colder) – white (equal) – yellow (B warmer),
  // linear, so 0 is plain white.
  const LUT_T = new Uint8Array(256 * 3), LUT_D = new Uint8Array(256 * 3);
  const VIOLET = hexRgb(PAL.purple), WHITE = [255, 255, 255], YELLOW = hexRgb(PAL.gold);
  const diffRgb = (f) => (f < 0.5 ? mix(VIOLET, WHITE, f * 2) : mix(WHITE, YELLOW, (f - 0.5) * 2));
  for (let k = 0; k < 256; k++) {
    LUT_T.set(window.THEME.tempColor(k / 255).match(/\d+/g).map(Number), 3 * k);
    LUT_D.set(diffRgb(k / 255), 3 * k);
  }
  const idx = (v, range) => Math.max(0, Math.min(255, Math.round((v / range + 1) / 2 * 255)));
  // The difference is stretched near 0 (power 0.3, with or without sign),
  // so a 0,1 °C start is visible -- below 0,005 °C it stays plain white.
  const D_POW = 0.3, D_MIN = 0.005;
  const dScale = (v) => { const a = Math.abs(v); return a <= D_MIN ? 0 : Math.sign(v) * Math.min(1, ((a - D_MIN) / (D_RANGE - D_MIN)) ** D_POW); };
  const idxD = (v) => Math.round((dScale(v) + 1) / 2 * 255);

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
    const step = P.U1 * P.W / 12, out = [];
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
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < seg.length; k += 4) {
      ctx.moveTo(x0 + seg[k] * cw, y0 - seg[k + 1] * ch);
      ctx.lineTo(x0 + seg[k + 2] * cw, y0 - seg[k + 3] * ch);
    }
    ctx.stroke();
    ctx.restore();
  }

  // A thermometer: stem with a bulb, standing on the station's spot.
  function thermometer(x, y, s, fill) {
    const r = 3.6 * s, w = 2.6 * s, h = 13 * s;
    ctx.save();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#fff'; ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y - r, r + 1.5, 0, Math.PI * 2);
    ctx.rect(x - w / 2 - 1.5, y - r - h - 1.5, w + 3, h + 1.5);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y - r, r - 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - w / 2 + 0.8, y - r - h * 0.65, w - 1.6, h * 0.65);
    ctx.restore();
    return y - 2 * r - h;     // top of the thermometer
  }

  let fs = 11;                         // label size, follows the size of the maps
  const font = (k = 1, weight = 500) => weight + ' ' + Math.round(fs * k) + 'px ' + FONT;
  function drawMap(m, mode) {
    const fa = fields(A, 0), fb = fields(B, 1);
    if (m.kind === 'diff') {
      paint(m, LUT_D, (k) => idxD(fb.T[k] - fa.T[k]));
      contours(m, fa.seg);
    } else {
      const f = m.kind === 'a' ? fa : fb;
      paint(m, LUT_T, (k) => idx(f.T[k], T_RANGE));
      contours(m, f.seg);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(m.x0, m.y0, m.w, m.h);
    ctx.fillStyle = INK; ctx.font = font(1.15); ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    ctx.fillText(t(m.kind === 'a' ? 'karte.mapA' : m.kind === 'b' ? 'karte.mapB' : 'karte.mapDiff'), m.x0, m.y0 - 4);
    // the colour scale right in the title row: temperature next to map A,
    // the difference next to its own map
    if (m.kind !== 'b') colourBar(m, m.kind === 'diff' ? 'diff' : 'temp');
    // the measurement error before the start (in B and the difference)
    if (mode === 'setup' && m.kind !== 'a' && delta !== 0) {
      const [bx, by] = toScreen(m, bubble.x, bubble.y), r = Math.max(RADIUS / P.L * m.w, 8);
      ctx.strokeStyle = INK; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = font(1, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(fmtDelta(delta), bx, by - r - 3);
    }
    // the weather station: a thermometer with its reading -- in the
    // difference map the difference B − A
    const [sx, sy] = toScreen(m, station.x, station.y);
    const n = rec.t.length;
    const v = m.kind === 'a' ? rec.a[n - 1] : m.kind === 'b' ? rec.b[n - 1] : rec.b[n - 1] - rec.a[n - 1];
    const s = Math.max(0.7, Math.min(1.2, m.w / 560));
    const fill = m.kind === 'diff' ? (v >= 0 ? PAL.gold : PAL.purple) : (m.kind === 'a' ? INK : ACCENT);
    const top = thermometer(sx, sy, s, m.kind === 'diff' ? fill : (window.THEME.tempColor(Math.max(0, Math.min(1, (v / T_RANGE + 1) / 2)))));
    const label = m.kind === 'diff' ? (Math.abs(v) < 0.05 ? '±0,0 °C' : fmtC(v)) : fmtC(v).replace('+', '');
    ctx.font = font(0.9, 600);
    const lw = ctx.measureText(label).width + 8, lh = fs * 1.3;
    const lx = Math.min(Math.max(sx + 7 * s, m.x0 + 2), m.x0 + m.w - lw - 2), ly = Math.max(top - 2, m.y0 + 2);
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(lx, ly, lw, lh);
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, lx + 4, ly + lh / 2);
  }

  // Where the tiles go. Wide stages: 2 × 2 -- A, B, difference and the
  // station's chart. Narrow ones (phones): the three maps in a column, the
  // chart under the stage.
  let stationInStage = false;
  function arrange(x0, y0, w, h) {
    const lab = fs * 1.6, gap = Math.max(10, fs);
    const col = Math.min(w, ((h - 3 * lab - 2 * gap) / 3) * ASPECT);
    const grid = Math.min((w - gap) / 2, ((h - 2 * lab - gap) / 2) * ASPECT);
    if (grid >= col * 0.9 && W > 560) {
      const mw = grid, mh = mw / ASPECT;
      const left = x0 + (w - 2 * mw - gap) / 2, top = y0;
      const at = (c, r) => ({ x0: left + c * (mw + gap), y0: top + lab + r * (mh + lab + gap), w: mw, h: mh });
      return [Object.assign(at(0, 0), { kind: 'a' }), Object.assign(at(1, 0), { kind: 'b' }), Object.assign(at(0, 1), { kind: 'diff' }), Object.assign(at(1, 1), { kind: 'station' })];
    }
    const mw = col, mh = mw / ASPECT;
    const left = x0 + (w - mw) / 2, top = y0 + Math.max(0, (h - 3 * (mh + lab) - 2 * gap) / 2);
    return ['a', 'b', 'diff'].map((kind, r) => ({ kind, x0: left, y0: top + lab + r * (mh + lab + gap), w: mw, h: mh }));
  }

  let maps = [];
  function render(mode) {
    layout();
    ctx.clearRect(0, 0, W, H);
    // text grows with the stage: 11 px on a phone up to 18 px on a big screen
    fs = Math.max(11, Math.min(18, Math.min(W, H * 1.4) / 52));
    const tiles = arrange(12, 6, W - 24, H - 6 - fs * 2.6);
    maps = tiles.filter((m) => m.kind !== 'station');
    maps.forEach((m) => drawMap(m, mode));
    const st = tiles.find((m) => m.kind === 'station');
    if (stationInStage !== !!st) { stationInStage = !!st; stationBox.hidden = stationInStage; }
    if (st) drawStationChart(ctx, st, Math.max(model.chartDays, Math.ceil(model.day() / 10) * 10));
    // the scale bar under the lowest map
    const last = maps.reduce((a, b) => (b.y0 + b.h > a.y0 + a.h ? b : a));
    ctx.fillStyle = INK; ctx.font = font(0.95); ctx.textBaseline = 'top';
    const km = 1e6 / P.L * last.w;
    ctx.fillRect(last.x0, last.y0 + last.h + 8, km, 3);
    ctx.textAlign = 'left';
    ctx.fillText(t('karte.km'), last.x0 + km + 6, last.y0 + last.h + 3);
  }
  // A small colour bar at the right end of a map's title row:
  // "−35 °C [bar] +35 °C"; the difference bar carries ticks at ±1 and 0.
  function colourBar(m, kind) {
    const ends = t(kind === 'diff' ? 'karte.legendDiffEnds' : 'karte.legendTempEnds');
    ctx.font = font(0.85);
    const lw = ctx.measureText(ends[0]).width, rw = ctx.measureText(ends[2]).width;
    ctx.save(); ctx.font = font(1.15);
    const title = ctx.measureText(t(kind === 'diff' ? 'karte.mapDiff' : 'karte.mapA')).width;
    ctx.restore();
    const room = m.w - title - fs * 1.5 - lw - rw - 12;
    const w = Math.min(fs * 11, room), h = fs * 0.7;
    if (w < fs * 3) return;
    const x = m.x0 + m.w - rw - 6 - w, y = m.y0 - 6 - h;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    for (let s = 0; s <= 20; s++) {
      const f = s / 20;
      g.addColorStop(f, kind === 'diff' ? 'rgb(' + diffRgb(f).join(',') + ')' : window.THEME.tempColor(f));
    }
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    const ticks = kind === 'diff' ? [-1, 0, 1].map((v) => (dScale(v) + 1) / 2) : [0.5];
    ticks.forEach((f) => { ctx.moveTo(x + f * w, y + h); ctx.lineTo(x + f * w, y + h + 3); });
    ctx.stroke();
    ctx.fillStyle = INK; ctx.font = font(0.85); ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillText(ends[0], x - 4, y + h / 2);
    ctx.textAlign = 'left'; ctx.fillText(ends[2], x + w + 4, y + h / 2);
  }

  // ============ STATION CHART ============
  // Temperature at the station in A (black) and B (orange) over the days.
  // Drawn into its own canvas under the stage, or into the 4th tile.
  function drawStationChart(g, tile, tMax) {
    let x0 = 0, y0 = 0, w, h;
    if (tile) {
      ({ x0, y0, w, h } = tile);
      g.fillStyle = '#fff'; g.fillRect(x0, y0, w, h);
      g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x0, y0, w, h);
      g.fillStyle = INK; g.font = font(1.15); g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText(t('karte.station.title'), x0, y0 - 4);
      // the key, top right above the tile
      g.font = font(0.95); g.textAlign = 'right';
      g.fillText(t('karte.mapB'), x0 + w, y0 - 4);
      const kb = g.measureText(t('karte.mapB')).width;
      g.fillStyle = ACCENT; g.fillRect(x0 + w - kb - 26, y0 - 4 - fs * 0.55, 18, 3);
      g.fillStyle = INK; g.fillText(t('karte.mapA'), x0 + w - kb - 34, y0 - 4);
      const ka = g.measureText(t('karte.mapA')).width;
      g.fillRect(x0 + w - kb - ka - 60, y0 - 4 - fs * 0.55, 18, 3);
    } else {
      const r = stationCanvas.getBoundingClientRect();
      w = r.width; h = r.height;
      if (stationCanvas.width !== Math.round(w * dpr)) { stationCanvas.width = Math.round(w * dpr); stationCanvas.height = Math.round(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
    }
    const f = tile ? fs : 11;
    const padL = f * 4.6, padR = 10, padT = 10, padB = f * 2.1;
    g.font = '500 ' + Math.round(f * 0.9) + 'px ' + FONT; g.fillStyle = INK;
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < rec.t.length; k++) { lo = Math.min(lo, rec.a[k], rec.b[k]); hi = Math.max(hi, rec.a[k], rec.b[k]); }
    if (!(hi > lo)) { lo = (isFinite(lo) ? lo : 0) - 5; hi = lo + 10; }
    lo = Math.floor((lo - 2) / 5) * 5; hi = Math.ceil((hi + 2) / 5) * 5;
    const X = (d) => x0 + padL + (w - padL - padR) * d / tMax, Y = (v) => y0 + padT + (h - padT - padB) * (hi - v) / (hi - lo);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    const step = hi - lo > 30 ? 10 : 5;
    for (let v = lo; v <= hi; v += step) {
      g.beginPath(); g.moveTo(x0 + padL, Y(v)); g.lineTo(x0 + w - padR, Y(v)); g.stroke();
      g.fillText(fmtC(v, 0).replace('+', ''), x0 + padL - 6, Y(v));
    }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const st = tMax > 60 ? 20 : tMax > 30 ? 10 : 5;
    for (let d = 0; d <= tMax + 1e-9; d += st) {
      // the last tick carries the unit: "20 Tage"
      const last = d + st > tMax + 1e-9;
      g.textAlign = last ? 'right' : 'center';
      g.fillText(last ? d + ' ' + t('lab.chartDays') : String(d), last ? X(d) + 2 : X(d), y0 + h - padB + 6);
    }
    const line = (vals, col, width) => {
      if (rec.t.length < 2) return;
      g.strokeStyle = col; g.lineWidth = width; g.lineJoin = 'round';
      g.beginPath();
      for (let k = 0; k < rec.t.length; k++) { const px = X(Math.min(rec.t[k], tMax)), py = Y(vals[k]); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    };
    line(rec.b, ACCENT, tile ? 3 : 2.4);
    line(rec.a, INK, tile ? 2 : 1.6);
  }

  // ============ INTERACTION ============
  let lab;
  function setDelta() {
    delta = +deltaRange.value / 10;
    deltaOut.textContent = fmtDelta(delta);
  }
  deltaRange.addEventListener('input', () => { setDelta(); lab.restart(); });

  // Drag the error spot (before the start), tap anywhere on a map to move
  // the weather station there.
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
    // the thermometer can be dragged too, at any time
    const [sx, sy] = toScreen(m, station.x, station.y);
    const onStation = !onBubble && Math.abs(x - sx) < 16 && y > sy - 34 && y < sy + 10;
    press = { x, y, m, onBubble, onStation, moved: false };
    if (onBubble || onStation) { stage.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!press || !(press.onBubble || press.onStation)) return;
    const [x, y] = local(e);
    if (Math.hypot(x - press.x, y - press.y) > 4) press.moved = true;
    const [mx, my] = toModel(press.m, x, y);
    const at = { x: ((mx % P.L) + P.L) % P.L, y: Math.max(0, Math.min(P.W - DY, my)) };
    if (press.onBubble) bubble = at; else moveStation(at);
    lab.frame();
  });
  stage.addEventListener('pointerup', (e) => {
    if (!press) return;
    const p = press; press = null;
    if (p.onBubble && p.moved) { lab.restart(); return; }
    const [x, y] = local(e);
    if (Math.hypot(x - p.x, y - p.y) > 10) return;
    if (p.onStation && p.moved) return;
    const [mx, my] = toModel(p.m, x, y);
    moveStation({ x: ((mx % P.L) + P.L) % P.L, y: Math.max(0, Math.min(P.W - DY, my)) });
    lab.frame();
  });
  function moveStation(at) {
    station = at;
    setPhase();
    // the recording starts where the station is set
    rec = { t: [], a: [], b: [] };
    recordStation();
    stationPassed = false;
  }

  // ============ TASKS ============
  // 1: the difference map shows the maps drifting apart.
  // 2: the station shows more than 2 °C between A and B.
  // 3: the difference passes 50 %. 4: a 10 times smaller error.
  // 5: the same error at three places at least 1500 km apart.
  const times = {}, places = [];
  function notePlace(l, day) {
    const near = (q) => Math.hypot(Math.min(Math.abs(q.x - bubble.x), P.L - Math.abs(q.x - bubble.x)), q.y - bubble.y) < 1.5e6;
    const known = places.find(near);
    if (known) known.day = day; else places.push({ x: bubble.x, y: bubble.y, day });
    $('place-times').hidden = false;
    $('place-times').textContent = t('karte.tasks.placeTimes', places.map((q) => l.fmtDays(q.day)).join(' · '));
    if (places.length >= 3 && !tasks.isDone('place')) {
      const ds = places.map((q) => q.day);
      $('place-feedback').textContent = t('karte.tasks.donePlace', l.fmtDays(Math.min(...ds)), l.fmtDays(Math.max(...ds)));
      tasks.done('place');
    }
  }
  let passed = false, stationPassed = false;
  function checkTasks(l) {
    const e = l.rec.last;
    if (e >= 0.05) tasks.done('where');
    const n = rec.t.length;
    if (!stationPassed && n && Math.abs(rec.a[n - 1] - rec.b[n - 1]) > 2) {
      stationPassed = true;
      $('station-feedback').textContent = t('karte.tasks.doneStation', l.fmtDays(model.day()));
      tasks.done('station');
    }
    if (!passed && e >= 0.5) {
      passed = true;
      $('apart-feedback').textContent = t('karte.tasks.doneApart', l.fmtDays(model.day()));
      tasks.done('apart');
      times[Math.abs(delta)] = model.day();
      notePlace(l, model.day());
      const keys = Object.keys(times).map(Number).sort((x, y) => y - x);
      $('smaller-times').hidden = false;
      $('smaller-times').textContent = t('karte.tasks.times', keys.map((k) => t('karte.tasks.timeItem', fmtC(k).replace('+', '±'), l.fmtDays(times[k]))).join(' · '));
      if (keys.length >= 2 && !tasks.isDone('smaller')) {
        const small = Math.min(...keys), big = Math.max(...keys);
        $('smaller-feedback').textContent = t('karte.tasks.doneSmaller', l.fmtDays(times[small]), l.fmtDays(times[big]), Math.round(big / small).toLocaleString('de-DE'));
        tasks.done('smaller');
      }
    }
  }

  // ============ INIT ============
  SCAPE.onIdle = () => { location.replace('index.html' + location.search); };
  setPhase();
  setDelta();
  layout();
  lab = SCAPE.chaosLab(model);
  lab.restart();
  // for the tests: the relative difference of the two maps (no longer shown)
  SCAPE.karteDiff = () => model.diff();
  window.addEventListener('resize', () => { W = 0; lab.frame(); });
})();
