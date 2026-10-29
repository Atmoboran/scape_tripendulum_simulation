// Chapter 3: Lorenz-96 twin experiment. Run A and run B start from the
// same state on the ring; B differs at one site by the chosen amount. The
// model is js/models/lorenz96.js, loop, buttons and chart js/chaos-lab.js.
(() => {
  'use strict';
  const L96 = window.Lorenz96;
  const { N, F, dt } = L96.DEFAULTS;
  const COL_A = window.THEME.data.pairA, COL_B = window.THEME.data.pairB;
  const INK = window.THEME.pendulum.ink;
  const PURPLE = window.THEME.palette.purple;
  const FONT = window.THEME.font;

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  const deltaSelect = document.getElementById('delta-select');
  const viewBtns = [...document.querySelectorAll('.view-pick')];
  const tasks = SCAPE.taskDialog('l96-tasks');
  const $ = (id) => document.getElementById(id);

  // ============ STATE ============
  let seed = 1;
  let start = L96.initialState(seed);
  let site = 20;                    // where B starts differently
  let delta = +deltaSelect.value;
  let a, b, steps = 0;
  let view = 'ring';
  // rows for the time view: one every ROW_EVERY steps (10 per model day),
  // newest last, 40 days kept
  const ROWS = 400, ROW_EVERY = 2;
  let rowsA = [], rowsB = [];

  const model = {
    stepsPerDay: 1 / (dt * L96.DAYS_PER_UNIT),   // 20 steps of 0.01 per model day
    sampleEvery: 1,
    maxStepsPerFrame: 60,
    chartDays: 30,
    restart() {
      a = Float64Array.from(start);
      b = L96.perturb(start, site, delta);
      steps = 0;
      passed = false;
      rowsA = [Float64Array.from(a)]; rowsB = [Float64Array.from(b)];
    },
    newStart() { seed++; start = L96.initialState(seed); },
    step() {
      L96.step(a, dt, F); L96.step(b, dt, F);
      steps++;
      if (steps % ROW_EVERY) return;
      rowsA.push(Float64Array.from(a)); rowsB.push(Float64Array.from(b));
      if (rowsA.length > ROWS) { rowsA.shift(); rowsB.shift(); }
    },
    day() { return steps * dt * L96.DAYS_PER_UNIT; },
    diff() { return L96.relDiff(a, b); },
    render(mode) { layout(); if (view === 'ring') drawRing(mode); else drawTime(); },
    onSample: checkTasks
  };

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

  // Ring geometry: value X at site i sits at radius R0 + X·K, site 0 on top,
  // going clockwise. X runs from about −8 to +13.
  function geo() {
    const m = Math.min(W, H);
    return { cx: W / 2, cy: H / 2 + m * 0.02, R0: m * 0.27, K: m * 0.0165 };
  }
  const angle = (i) => -Math.PI / 2 + 2 * Math.PI * i / N;

  function drawRing(mode) {
    const { cx, cy, R0, K } = geo();
    ctx.clearRect(0, 0, W, H);
    ctx.font = '500 11px ' + FONT;
    // zero circle and the 40 spokes
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0,0,0,.08)';
    for (let i = 0; i < N; i++) {
      const c = Math.cos(angle(i)), s = Math.sin(angle(i));
      ctx.beginPath(); ctx.moveTo(cx + c * (R0 - 8 * K), cy + s * (R0 - 8 * K)); ctx.lineTo(cx + c * (R0 + 13 * K), cy + s * (R0 + 13 * K)); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(t('l96.ringZero'), cx + 4, cy - R0 + 1);
    // the site where B starts differently
    const ca = Math.cos(angle(site)), sa = Math.sin(angle(site));
    const tipR = R0 + 14.5 * K;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(cx + ca * tipR, cy + sa * tipR);
    ctx.lineTo(cx + ca * (tipR + 12) - sa * 6, cy + sa * (tipR + 12) + ca * 6);
    ctx.lineTo(cx + ca * (tipR + 12) + sa * 6, cy + sa * (tipR + 12) - ca * 6);
    ctx.fill();
    if (mode === 'setup') {
      ctx.textAlign = ca > 0.3 ? 'left' : ca < -0.3 ? 'right' : 'center';
      ctx.textBaseline = sa > 0.3 ? 'top' : sa < -0.3 ? 'bottom' : 'middle';
      ctx.fillText(t('l96.perturbHere'), cx + ca * (tipR + 18), cy + sa * (tipR + 18));
    }
    // A and B: closed curves with a dot per site
    const curve = (x, col, width, r) => {
      ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const k = i % N, rr = R0 + x[k] * K;
        const px = cx + Math.cos(angle(k)) * rr, py = cy + Math.sin(angle(k)) * rr;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = col;
      for (let k = 0; k < N; k++) {
        const rr = R0 + x[k] * K;
        ctx.beginPath(); ctx.arc(cx + Math.cos(angle(k)) * rr, cy + Math.sin(angle(k)) * rr, r, 0, Math.PI * 2); ctx.fill();
      }
    };
    curve(a, COL_A, 3.2, 3.6);
    curve(b, COL_B, 1.8, 2.2);
    // legend, top right
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = '500 12px ' + FONT;
    [[COL_A, t('l96.legendA'), 3.2], [COL_B, t('l96.legendB'), 1.8]].forEach(([col, label, w], k) => {
      const y = 22 + k * 20;
      ctx.fillStyle = INK; ctx.fillText(label, W - 12, y);
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(W - 48, y); ctx.lineTo(W - 24, y); ctx.stroke();
    });
  }

  // Time view: three panels (A, B, |A − B|), sites across, time downwards
  // with the newest row on top.
  let img = null;
  function drawTime() {
    ctx.clearRect(0, 0, W, H);
    const top = 76, bottom = 40, gap = Math.max(8, W * 0.02);
    const pw = Math.min((W - 24 - 2 * gap) / 3, 260);
    const left = (W - 3 * pw - 2 * gap) / 2;
    const ph = H - top - bottom;
    const rows = rowsA.length;
    if (!img || img.height !== ROWS) img = ctx.createImageData(N, ROWS);
    const tmp = document.createElement('canvas');
    tmp.width = N; tmp.height = ROWS;
    const tctx = tmp.getContext('2d');
    const rgb = (s) => s.match(/\d+/g).map(Number);
    const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const purple = hexRgb(PURPLE);
    const panels = [
      [t('l96.colA'), (r, i) => rgb(window.THEME.tempColor((rowsA[r][i] + 6) / 17))],
      [t('l96.colB'), (r, i) => rgb(window.THEME.tempColor((rowsB[r][i] + 6) / 17))],
      [t('l96.colDiff'), (r, i) => {
        // log scale: 10⁻⁴ white … 10 full purple
        const d = Math.abs(rowsA[r][i] - rowsB[r][i]);
        const f = Math.max(0, Math.min(1, (Math.log10(Math.max(d, 1e-9)) + 4) / 5));
        return [255 + (purple[0] - 255) * f, 255 + (purple[1] - 255) * f, 255 + (purple[2] - 255) * f];
      }]
    ];
    ctx.font = '500 11px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    panels.forEach(([label, color], p) => {
      const d = img.data;
      d.fill(0);
      for (let row = 0; row < rows; row++) {
        const r = rows - 1 - row;          // newest on top
        for (let i = 0; i < N; i++) {
          const c = color(r, i), o = (row * N + i) * 4;
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
      tctx.putImageData(img, 0, 0);
      const x = left + p * (pw + gap);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, N, ROWS, x, top, pw, ph);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x, top, pw, ph);
      ctx.fillStyle = INK; ctx.fillText(label, x + pw / 2, top - 6);
    });
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(t('l96.timeAxis', ROWS * ROW_EVERY / model.stepsPerDay), W / 2, H - bottom + 8);
  }

  // ============ INTERACTION ============
  let lab;
  const note = document.querySelector('.stage-note');
  viewBtns.forEach((btn) => btn.addEventListener('click', () => {
    view = btn.dataset.view;
    note.hidden = view !== 'ring';
    viewBtns.forEach((x) => { x.classList.toggle('active', x === btn); x.setAttribute('aria-pressed', String(x === btn)); });
    lab.frame();
  }));
  deltaSelect.addEventListener('change', () => { delta = +deltaSelect.value; lab.restart(); });
  // a tap on the ring chooses the site (only before the start)
  stage.addEventListener('pointerup', (e) => {
    if (view !== 'ring' || lab.mode !== 'setup') return;
    const r = stage.getBoundingClientRect();
    const { cx, cy } = geo();
    const x = e.clientX - r.left - cx, y = e.clientY - r.top - cy;
    let ang = Math.atan2(y, x) + Math.PI / 2;
    if (ang < 0) ang += 2 * Math.PI;
    site = Math.round(ang / (2 * Math.PI) * N) % N;
    lab.restart();
  });

  // ============ TASKS ============
  // 1: the difference passes 50 %. 2: a 100 times smaller start difference
  // passes 50 % only a few days later. 3: the doubling time is read off.
  const times = {};
  const deltaLabel = () => deltaSelect.selectedOptions[0].textContent.split(' (')[0];
  let passed = false;
  function checkTasks(l) {
    const e = l.rec.last;
    if (!passed && e >= 0.5) {
      passed = true;
      const d = l.fmtDays(model.day());
      $('apart-feedback').textContent = t('l96.tasks.doneApart', d);
      tasks.done('apart');
      times[delta] = { day: model.day(), label: deltaLabel() };
      const keys = Object.keys(times).map(Number).sort((x, y) => y - x);
      $('smaller-times').hidden = false;
      $('smaller-times').textContent = t('l96.tasks.times', keys.map((k) => t('l96.tasks.timeItem', times[k].label, l.fmtDays(times[k].day))).join(' · '));
      if (keys.length >= 2 && !tasks.isDone('smaller')) {
        const small = Math.min(...keys), big = keys.find((k) => k > small);
        $('smaller-feedback').textContent = t('l96.tasks.doneSmaller', l.fmtDays(times[small].day), l.fmtDays(times[big].day));
        tasks.done('smaller');
      }
    }
    if (l.fit && e >= 0.2 && !tasks.isDone('doubling')) {
      $('doubling-feedback').textContent = t('l96.tasks.doneDoubling', l.fmtDays(l.fit.doubling));
      tasks.done('doubling');
    }
  }

  // ============ INIT ============
  SCAPE.onIdle = () => { location.replace('index.html' + location.search); };
  lab = SCAPE.chaosLab(model);
  window.addEventListener('resize', () => { W = 0; lab.frame(); });
  lab.restart();
})();
