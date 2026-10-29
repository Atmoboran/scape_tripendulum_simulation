// Chapter 2: the Lorenz attractor. Two points (Rot, Blau) -- or a cloud of
// many -- start a tiny distance apart and fly through Lorenz's 1963 weather
// model. Drag turns the picture, a tap sets a new start point. A loupe in
// the corner magnifies around Rot so far that Blau shows beside it.
(() => {
  'use strict';

  // ============ COLOURS (theme/theme.js) ============
  const PC = window.THEME.pendulum;
  const COL_A = window.THEME.data.pairA, COL_B = window.THEME.data.pairB;
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const RGB_A = hexRgb(COL_A), RGB_B = hexRgb(COL_B), RGB_INK = hexRgb(PC.ink);
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

  // ============ MODEL ============
  const SIGMA = 10, RHO = 28, BETA = 8 / 3;
  function f(x, y, z) { return [SIGMA * (y - x), x * (RHO - z) - y, x * y - BETA * z]; }
  function rk4(p, h) {
    const a = f(p[0], p[1], p[2]);
    const b = f(p[0] + a[0] * h / 2, p[1] + a[1] * h / 2, p[2] + a[2] * h / 2);
    const c = f(p[0] + b[0] * h / 2, p[1] + b[1] * h / 2, p[2] + b[2] * h / 2);
    const d = f(p[0] + c[0] * h, p[1] + c[1] * h, p[2] + c[2] * h);
    return [
      p[0] + h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]),
      p[1] + h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1]),
      p[2] + h / 6 * (a[2] + 2 * b[2] + 2 * c[2] + d[2])
    ];
  }
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

  const DT = 0.002;          // model time per step
  const SPEED = 0.8;         // model time per real second
  const SEPARATED = 5;       // "apart" for the readout and the tasks
  const TRAIL = 1200;        // steps of trail behind Rot and Blau
  const CLOUD = 300;         // members of the ensemble

  // The grey attractor behind everything: one long run, settled first.
  const GHOST = (() => {
    let p = [1, 1, 1];
    for (let i = 0; i < 2000; i++) p = rk4(p, 0.01);
    const pts = [];
    for (let i = 0; i < 14000; i++) { p = rk4(p, 0.01); pts.push(p); }
    return pts;
  })();
  const DEFAULT_START = GHOST[1500];
  // How far a point is from the attractor, roughly: from the nearest point
  // of the grey run. On the attractor that stays within a few units.
  function offAttractor(p) {
    let best = Infinity;
    for (let i = 0; i < GHOST.length; i += 2) {
      const q = GHOST[i], d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  const FAR = 10, ON = 3;    // "far from" / "back on" the attractor

  // ============ DOM ============
  const stageFrame = document.getElementById('stage-frame');
  const stage = document.getElementById('stage');
  const ghostCanvas = document.getElementById('ghost-canvas');
  const drawCanvas = document.getElementById('draw-canvas');
  const ghostCtx = ghostCanvas.getContext('2d');
  const drawCtx = drawCanvas.getContext('2d');
  const primaryBtn = document.getElementById('sim-primary');
  const primaryIcon = document.getElementById('sim-primary-icon');
  const resetBtn = document.getElementById('sim-reset');
  const ensembleBtn = document.getElementById('sim-ensemble');
  const deltaSelect = document.getElementById('delta-select');
  const roStatus = document.getElementById('ro-status');
  const roZeit = document.getElementById('ro-zeit');
  const roDist = document.getElementById('ro-dist');
  const roDistLabel = document.getElementById('ro-dist-label');
  const legend = stageFrame.querySelector('.pick-ctl');
  const hint = SCAPE.badge(stageFrame);
  const tasks = SCAPE.taskDialog('lz-tasks');
  const preciseTimes = document.getElementById('precise-times');
  const preciseFeedback = document.getElementById('precise-feedback');
  const catchBest = document.getElementById('catch-best');
  const loupe = document.getElementById('loupe');
  const loupeCanvas = document.getElementById('loupe-canvas');
  const loupeCtx = loupeCanvas.getContext('2d');
  const loupeLabel = document.getElementById('loupe-label');

  // ============ VIEW (rotation + projection) ============
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, S = 1, LW = 0, LH = 0;
  let yaw = 0, pitch = 0;        // 0/0 = the classic butterfly view (x across, z up)
  const CENTER = [0, 0, 25];
  let R = null;                  // rows: screen-right, screen-up, depth

  function updateRotation() {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    R = [
      [cy, sy, 0],
      [-sp * sy, sp * cy, cp],
      [-cp * sy, cp * cy, -sp]
    ];
  }
  function project(p) {
    const x = p[0] - CENTER[0], y = p[1] - CENTER[1], z = p[2] - CENTER[2];
    return [W / 2 + S * (R[0][0] * x + R[0][1] * y), H / 2 - S * (R[1][0] * x + R[1][1] * y + R[1][2] * z)];
  }
  // A tap: the point under the finger in the plane through the centre.
  function unproject(sx, sy) {
    const u = (sx - W / 2) / S, v = -(sy - H / 2) / S;
    return [0, 1, 2].map((k) => CENTER[k] + R[0][k] * u + R[1][k] * v);
  }

  function layout(force) {
    const rect = stage.getBoundingClientRect();
    if (!force && Math.abs(rect.width - W) < 0.5 && Math.abs(rect.height - H) < 0.5) return;
    W = rect.width; H = rect.height;
    [ghostCanvas, drawCanvas].forEach((c) => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    ghostCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(W, H) * 0.47 / 27;
    const hidden = loupe.hidden;   // measured even while it is stepped aside
    loupe.hidden = false;
    const lr = loupe.getBoundingClientRect();
    loupe.hidden = hidden;
    LW = lr.width; LH = lr.height;
    loupeCanvas.width = Math.round(LW * dpr); loupeCanvas.height = Math.round(LH * dpr);
    loupeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGhost();
  }

  function drawGhost() {
    ghostCtx.fillStyle = PC.stage;
    ghostCtx.fillRect(0, 0, W, H);
    ghostCtx.strokeStyle = rgba(RGB_INK, 0.09);
    ghostCtx.lineWidth = 1;
    ghostCtx.beginPath();
    GHOST.forEach((p, i) => { const q = project(p); if (i) ghostCtx.lineTo(q[0], q[1]); else ghostCtx.moveTo(q[0], q[1]); });
    ghostCtx.stroke();
  }

  // ============ STATE ============
  const STATE_SETUP = 'setup', STATE_RUN = 'run', STATE_PAUSED = 'paused';
  let mode = STATE_SETUP;
  let start = DEFAULT_START.slice();
  let delta = +deltaSelect.value;
  let ensemble = false;
  let a, b, trailA, trailB, cloud, elapsed, apartAt, startFar, loupeGone;

  function seed() {
    a = start.slice();
    b = [start[0] + delta, start[1], start[2]];
    trailA = [a]; trailB = [b];
    cloud = [];
    if (ensemble) {
      for (let i = 0; i < CLOUD; i++) {
        // evenly inside a ball of radius delta around the start
        let v;
        do { v = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]; } while (Math.hypot(v[0], v[1], v[2]) > 1);
        cloud.push([start[0] + v[0] * delta, start[1] + v[1] * delta, start[2] + v[2] * delta]);
      }
    }
    elapsed = 0;
    apartAt = null;
    loupeGone = false;
    startFar = offAttractor(start) > FAR;
  }

  // ============ DRAWING ============
  function drawTrail(trail, rgb) {
    const n = trail.length;
    if (n < 2) return;
    const BANDS = 8;
    drawCtx.lineWidth = 2.2;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    for (let k = 0; k < BANDS; k++) {
      const from = Math.floor(n * k / BANDS), to = Math.min(n - 1, Math.floor(n * (k + 1) / BANDS));
      if (to <= from) continue;
      drawCtx.strokeStyle = rgba(rgb, 0.12 + 0.88 * (k + 1) / BANDS);
      drawCtx.beginPath();
      let q = project(trail[from]);
      drawCtx.moveTo(q[0], q[1]);
      for (let i = from + 1; i <= to; i++) { q = project(trail[i]); drawCtx.lineTo(q[0], q[1]); }
      drawCtx.stroke();
    }
  }
  function dot(p, color, r) {
    const q = project(p);
    drawCtx.beginPath();
    drawCtx.arc(q[0], q[1], r, 0, Math.PI * 2);
    drawCtx.fillStyle = color;
    drawCtx.fill();
    drawCtx.lineWidth = 2;
    drawCtx.strokeStyle = PC.ink;
    drawCtx.stroke();
  }
  function mix(i) {
    const f2 = i / (CLOUD - 1);
    return 'rgb(' + [0, 1, 2].map((k) => Math.round(RGB_A[k] + (RGB_B[k] - RGB_A[k]) * f2)).join(',') + ')';
  }

  function render() {
    drawCtx.clearRect(0, 0, W, H);
    if (mode === STATE_SETUP) {
      // the start point, ringed
      const q = project(start);
      drawCtx.beginPath();
      drawCtx.arc(q[0], q[1], 13, 0, Math.PI * 2);
      drawCtx.lineWidth = 2;
      drawCtx.strokeStyle = PC.ink;
      drawCtx.setLineDash([3, 4]);
      drawCtx.stroke();
      drawCtx.setLineDash([]);
    }
    if (ensemble) {
      cloud.forEach((p, i) => {
        const q = project(p);
        drawCtx.fillStyle = mix(i);
        drawCtx.fillRect(q[0] - 2.5, q[1] - 2.5, 5, 5);
      });
    } else {
      drawTrail(trailB, RGB_B);
      drawTrail(trailA, RGB_A);
      dot(b, COL_B, 6);
      dot(a, COL_A, 6);
    }
    roDist.textContent = fmtDist(ensemble ? spread() : dist(a, b));
    renderLoupe();
  }

  // ============ LOUPE ============
  // Centred on Rot (or the middle of the cloud), magnified so that the gap
  // to Blau (or the cloud's spread) takes about a third of the loupe. The
  // factor goes in 1-2-5 steps so the label stays readable; once the gap
  // shows in the big picture anyway, the loupe steps aside until the next
  // start.
  function niceFactor(m) {
    const e = Math.floor(Math.log10(m)), f = m / Math.pow(10, e);
    return (f >= 5 ? 5 : f >= 2 ? 2 : 1) * Math.pow(10, e);
  }
  // Screen offset of p from the centre c at magnification m -- from the
  // difference p - c, so tiny gaps keep their digits.
  function rel(p, c, m) {
    const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
    return [LW / 2 + m * S * (R[0][0] * x + R[0][1] * y), LH / 2 - m * S * (R[1][0] * x + R[1][1] * y + R[1][2] * z)];
  }
  function renderLoupe() {
    let c, gap;
    if (ensemble) {
      c = [0, 0, 0];
      cloud.forEach((p) => { c[0] += p[0] / CLOUD; c[1] += p[1] / CLOUD; c[2] += p[2] / CLOUD; });
      gap = spread();
    } else {
      c = a; gap = dist(a, b);
    }
    const m = niceFactor(Math.max(1, LW * 0.32 / Math.max(gap * S, 1e-12)));
    // Once the two have come apart, the loupe stays away for this run --
    // even when they happen to pass close by each other again later.
    if (m < 5 && mode !== STATE_SETUP) loupeGone = true;
    loupe.hidden = m < 5 || loupeGone;
    if (loupe.hidden) return;
    loupeLabel.textContent = t('lorenz.loupe', m.toLocaleString('de-DE').replace(/\./g, '\u202f'));
    const g = loupeCtx;
    g.fillStyle = PC.stage;
    g.fillRect(0, 0, LW, LH);
    if (ensemble) {
      cloud.forEach((p, i) => { const q = rel(p, c, m); g.fillStyle = mix(i); g.fillRect(q[0] - 2, q[1] - 2, 4, 4); });
      return;
    }
    // the last stretch of both paths: two lines side by side
    [[trailB, COL_B], [trailA, COL_A]].forEach(([tr, col]) => {
      g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath();
      for (let i = Math.max(0, tr.length - 160); i < tr.length; i++) { const q = rel(tr[i], c, m); if (i === Math.max(0, tr.length - 160)) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); }
      g.stroke();
    });
    [[b, COL_B], [a, COL_A]].forEach(([p, col]) => {
      const q = rel(p, c, m);
      g.beginPath(); g.arc(q[0], q[1], 5, 0, Math.PI * 2);
      g.fillStyle = col; g.fill(); g.lineWidth = 2; g.strokeStyle = PC.ink; g.stroke();
    });
  }

  // ============ READOUT ============
  const fmt1 = (n) => n.toFixed(1).replace('.', ',');
  // Small distances with as many digits as they need to show something.
  function fmtDist(d) {
    if (d >= 10) return String(Math.round(d));
    if (d >= 1) return fmt1(d);
    const digits = Math.min(10, Math.max(2, Math.ceil(-Math.log10(Math.max(d, 1e-12))) + 1));
    return d.toFixed(digits).replace('.', ',');
  }
  function spread() {
    const m = [0, 0, 0];
    cloud.forEach((p) => { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; });
    m[0] /= CLOUD; m[1] /= CLOUD; m[2] /= CLOUD;
    let s = 0;
    cloud.forEach((p) => { s += (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2 + (p[2] - m[2]) ** 2; });
    return Math.sqrt(s / CLOUD);
  }

  // ============ LOOP ============
  let running = false, lastT = 0;
  function step(now) {
    if (!running) return;
    const frameDt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    const steps = Math.round(frameDt * SPEED / DT);
    for (let i = 0; i < steps; i++) {
      if (ensemble) {
        for (let k = 0; k < CLOUD; k++) cloud[k] = rk4(cloud[k], DT);
      } else {
        a = rk4(a, DT); b = rk4(b, DT);
        trailA.push(a); trailB.push(b);
      }
      elapsed += DT;
      if (!ensemble && apartAt === null && dist(a, b) > SEPARATED) { apartAt = elapsed; recordSeparation(); }
    }
    if (trailA.length > TRAIL) { trailA.splice(0, trailA.length - TRAIL); trailB.splice(0, trailB.length - TRAIL); }
    render();
    roZeit.textContent = t('lorenz.readout.time', fmt1(elapsed));
    checkTasks();
    requestAnimationFrame(step);
  }

  const ICON_PLAY = '<path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/>';
  const ICON_PAUSE = '<path d="M8 5v14M16 5v14"/>';
  function setPrimary(key, icon) { primaryBtn.setAttribute('aria-label', t(key)); primaryIcon.innerHTML = icon; }

  function run() {
    mode = STATE_RUN;
    running = true;
    hint.hide();
    roStatus.textContent = t('readout.running');
    setPrimary('lorenz.primary.pauseAria', ICON_PAUSE);
    lastT = performance.now();
    requestAnimationFrame(step);
  }
  function pause() {
    mode = STATE_PAUSED;
    running = false;
    tryCatch();
    roStatus.textContent = t('readout.paused');
    setPrimary('lorenz.primary.resumeAria', ICON_PLAY);
  }
  function reset() {
    running = false;
    mode = STATE_SETUP;
    seed();
    roStatus.textContent = t('readout.ready');
    roZeit.textContent = t('lorenz.readout.time', '0,0');
    setPrimary('lorenz.primary.startAria', ICON_PLAY);
    render();
  }

  primaryBtn.addEventListener('click', () => {
    if (mode === STATE_RUN) pause(); else run();
  });
  resetBtn.addEventListener('click', reset);
  deltaSelect.addEventListener('change', () => { delta = +deltaSelect.value; reset(); });
  ensembleBtn.addEventListener('click', () => {
    ensemble = !ensemble;
    ensembleBtn.classList.toggle('active', ensemble);
    ensembleBtn.setAttribute('aria-pressed', String(ensemble));
    legend.hidden = ensemble;
    roDistLabel.textContent = ensemble ? t('lorenz.readout.spread') : t('readout.distance');
    reset();
  });

  // ============ INTERACTION: drag turns, tap sets the start ============
  let press = null;
  stage.addEventListener('pointerdown', (e) => {
    press = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!press) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (!press.moved && Math.hypot(dx, dy) < 6) return;
    press.moved = true;
    hint.hide();
    yaw = press.yaw + dx * 0.01;
    pitch = Math.max(-1.2, Math.min(1.2, press.pitch + dy * 0.01));
    updateRotation();
    drawGhost();
    render();
  });
  const release = (e) => {
    if (!press) return;
    stage.classList.remove('dragging');
    if (!press.moved && e.type === 'pointerup') {
      const rect = stage.getBoundingClientRect();
      start = unproject(e.clientX - rect.left, e.clientY - rect.top);
      // exactly on the z axis the model has a fixed line into the origin;
      // nudge off it so every start really flies
      if (Math.hypot(start[0], start[1]) < 0.01) start[0] = 0.01;
      reset();
      hint.show(t('lorenz.badge.newStart'));
      clearTimeout(release.t);
      release.t = setTimeout(() => { hint.hide(); }, 1400);
    }
    press = null;
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  // ============ TASKS ============
  // 1: Rot and Blau circle on different wings.
  // 2: a 1000 times smaller start difference -- and only a few time units
  //    more before they separate (about 6 → 14 → 21 units).
  // 3: the cloud spreads over both wings.
  // 4: a start far from the butterfly ends up on it all the same.
  // 5: once apart, pause while they happen to pass within CATCH of each
  //    other. In the model that happens about 2-3 times a minute and lasts
  //    about 0.3 s -- hard, but it can be done. Every pause after the split
  //    counts, rapid Pause/Weiter included.
  const separations = {};   // delta → model time until "apart"
  const deltaLabel = () => deltaSelect.selectedOptions[0].textContent.split(' (')[0];

  function recordSeparation() {
    separations[delta] = { time: elapsed, label: deltaLabel() };
    const keys = Object.keys(separations).map(Number).sort((x, y) => y - x);
    preciseTimes.hidden = false;
    preciseTimes.textContent = t('lorenz.tasks.times', keys.map((k) => t('lorenz.tasks.timeItem', separations[k].label, fmt1(separations[k].time))).join(' · '));
    if (keys.length >= 2 && !tasks.isDone('precise')) {
      // the smaller difference that has just run against the bigger one before it
      const small = Math.min(...keys), big = keys.find((k) => k > small);
      preciseFeedback.textContent = t('lorenz.tasks.donePrecise', fmt1(separations[small].time), fmt1(separations[big].time));
      tasks.done('precise');
    }
  }

  const CATCH = 2;
  let closest = Infinity;
  function tryCatch() {
    if (ensemble || apartAt === null) return;
    const d = dist(a, b);
    closest = Math.min(closest, d);
    catchBest.hidden = false;
    catchBest.textContent = t('lorenz.tasks.catchBest', fmtDist(closest));
    hint.show(d < CATCH ? t('lorenz.badge.caught', fmtDist(d)) : t('lorenz.badge.missed', fmtDist(d)));
    clearTimeout(tryCatch.t);
    tryCatch.t = setTimeout(() => { hint.hide(); }, 2200);
    if (d < CATCH) tasks.done('catch');
  }

  let frameNo = 0;
  function checkTasks() {
    frameNo++;
    if (startFar && elapsed > 1 && frameNo % 15 === 0 && offAttractor(ensemble ? cloud[0] : a) < ON) tasks.done('attractor');
    if (!ensemble && Math.sign(a[0]) !== Math.sign(b[0]) && Math.abs(a[0]) > 4 && Math.abs(b[0]) > 4) tasks.done('wings');
    if (ensemble && elapsed > 1) {
      let left = 0;
      cloud.forEach((p) => { if (p[0] < 0) left++; });
      if (left > CLOUD * 0.3 && left < CLOUD * 0.7 && spread() > 5) tasks.done('ensemble');
    }
  }

  // ============ INIT ============
  // Kiosk: after three idle minutes, back to the first chapter.
  SCAPE.onIdle = () => { location.replace('index.html' + location.search); };

  updateRotation();
  seed();
  layout(true);
  render();
  roZeit.textContent = t('lorenz.readout.time', '0,0');
  setPrimary('lorenz.primary.startAria', ICON_PLAY);
  hint.show(t('lorenz.badge.start'));

  const relayout = () => { layout(false); render(); };
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', () => { setTimeout(relayout, 200); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { lastT = performance.now(); layout(true); render(); }
  });
})();
