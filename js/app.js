(() => {
  'use strict';
  const { rk4, jointPositions, zeroState } = window.Pendulum;

  // ============ COLOURS (theme/theme.js) ============
  const PC = window.THEME.pendulum;
  // two things compared: always red vs blue (theme data colours)
  PC.a = window.THEME.data.pairA; PC.b = window.THEME.data.pairB;
  const COL_A = PC.a, COL_B = PC.b;

  // ============ DOM / CANVAS SETUP ============
  const stageFrame = document.getElementById('stage-frame');
  const stage = document.getElementById('stage');
  const drawCanvas = document.getElementById('draw-canvas');
  const drawCtx = drawCanvas.getContext('2d');

  const primaryBtn = document.getElementById('sim-primary');
  const primaryIcon = document.getElementById('sim-primary-icon');
  const resetBtn = document.getElementById('sim-reset');
  const frictionBtn = document.getElementById('sim-friction');
  const hint = SCAPE.badge(stageFrame);
  const tasks = SCAPE.taskDialog('tp-tasks');
  const precisionBest = document.getElementById('precision-best');
  const roStatus = document.getElementById('ro-status');
  const roZeit = document.getElementById('ro-zeit');
  const roDist = document.getElementById('ro-dist');

  const modeSelect = document.getElementById('mode-select');
  const editorABtn = document.getElementById('editor-a');
  const editorBBtn = document.getElementById('editor-b');

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let pivotX = 0, pivotY = 0, scale = 1;

  const SEG_LEN = 1.0; // meters, per arm
  const FRICTION = 0.15; // 1/s when the friction button is on

  // Resizing the canvas wipes it, so only do that when the stage really
  // changed size -- a phone fires "resize" while scrolling (the address bar
  // comes and goes) and when the tab comes back, and that used to leave an
  // empty box behind until the next simulation frame.
  function layout(force) {
    const rect = stage.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    if (!force && Math.abs(w - W) < 0.5 && Math.abs(h - H) < 0.5) return false;
    W = w; H = h;
    drawCanvas.width = Math.round(W * dpr);
    drawCanvas.height = Math.round(H * dpr);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pivot dead-center: a full loop reaches the same distance in every
    // direction, so a centered pivot in a square box is the only way to
    // fit that reach without clipping on some sides but not others.
    pivotX = W * 0.5;
    pivotY = H * 0.5;

    const totalLen = PARAMS.N * SEG_LEN;
    scale = (Math.min(W, H) * 0.46) / totalLen;
    return true;
  }

  // ============ STATE ============
  const STATE_SETUP = 'setup', STATE_RUN = 'run', STATE_PAUSED = 'paused';
  let mode = STATE_SETUP;
  let activeEditor = 'A';

  const PARAMS = { N: 2, m: [1, 1], l: [1, 1], friction: 0 };
  let stateA = zeroState(2), stateB = zeroState(2);
  let startA = null, startB = null; // the positions of the last Start
  let elapsed = 0;
  // The tips' paths of the last frames, in metres: drawn fresh every frame
  // with fading strength, so they survive a resize and never tint the stage.
  let trailA = [], trailB = [];
  const TRAIL_FRAMES = 110;
  let drag = null; // index of the bob being dragged | null

  function toPx(pt) { return { x: pivotX + pt.x * scale, y: pivotY + pt.y * scale }; }

  function bobRadius(i, N) { return 7 + i * (N >= 3 ? 4.8 / N : 2.6); }

  function tip(st) { return jointPositions(st, PARAMS)[PARAMS.N - 1]; }
  function tipDistance() {
    const a = tip(stateA), b = tip(stateB);
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // ============ DRAWING ============
  function clearDraw() { drawCtx.clearRect(0, 0, W, H); }
  function clearTrail() { trailA = []; trailB = []; }

  function drawPivot() {
    drawCtx.beginPath();
    drawCtx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    drawCtx.fillStyle = PC.ink;
    drawCtx.fill();
  }

  function drawPendulum(state, color, alpha) {
    const pts = jointPositions(state, PARAMS);
    const px = pts.map(toPx);
    drawCtx.save();
    drawCtx.globalAlpha = alpha;
    drawCtx.lineCap = 'round';
    drawCtx.strokeStyle = PC.ink;
    drawCtx.lineWidth = 5;
    drawCtx.beginPath();
    drawCtx.moveTo(pivotX, pivotY);
    for (let i = 0; i < px.length; i++) drawCtx.lineTo(px[i].x, px[i].y);
    drawCtx.stroke();
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = 3;
    drawCtx.beginPath();
    drawCtx.moveTo(pivotX, pivotY);
    for (let i2 = 0; i2 < px.length; i2++) drawCtx.lineTo(px[i2].x, px[i2].y);
    drawCtx.stroke();

    drawCtx.fillStyle = color;
    drawCtx.strokeStyle = PC.ink;
    drawCtx.lineWidth = 2;
    for (let i3 = 0; i3 < px.length; i3++) {
      drawCtx.beginPath();
      drawCtx.arc(px[i3].x, px[i3].y, bobRadius(i3, px.length), 0, Math.PI * 2);
      drawCtx.fill();
      drawCtx.stroke();
    }
    drawCtx.restore();
    return px;
  }

  // Oldest part faintest: the path is drawn in bands of rising strength.
  function drawTrail(trail, color) {
    const n = trail.length, BANDS = 10;
    if (n < 2) return;
    drawCtx.save();
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = 2.4;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    for (let k = 0; k < BANDS; k++) {
      const from = Math.floor(n * k / BANDS), to = Math.min(n - 1, Math.floor(n * (k + 1) / BANDS));
      if (to <= from) continue;
      drawCtx.globalAlpha = 0.85 * Math.pow((k + 1) / BANDS, 1.6);
      drawCtx.beginPath();
      let q = toPx(trail[from]);
      drawCtx.moveTo(q.x, q.y);
      for (let i = from + 1; i <= to; i++) { q = toPx(trail[i]); drawCtx.lineTo(q.x, q.y); }
      drawCtx.stroke();
    }
    drawCtx.restore();
  }

  // Draws the pendulums as they are now, in any state. Called on every
  // frame, after a drag and whenever the page comes back into view.
  function render() {
    clearDraw();
    drawTrail(trailB, COL_B);
    drawTrail(trailA, COL_A);
    drawPivot();
    if (mode === STATE_SETUP && activeEditor === 'A') {
      drawPendulum(stateB, COL_B, 0.32);
      drawPendulum(stateA, COL_A, 1);
    } else if (mode === STATE_SETUP) {
      drawPendulum(stateA, COL_A, 0.32);
      drawPendulum(stateB, COL_B, 1);
    } else {
      drawPendulum(stateB, COL_B, 1);
      drawPendulum(stateA, COL_A, 1);
    }
    roDist.textContent = fmtDist(tipDistance());
  }

  // ============ READOUT ============
  function fmt1(n) { return n.toFixed(1).replace('.', ','); }
  // Tip distance in metres (one arm is 1 m): centimetres up close, metres
  // once they are far apart.
  function fmtDist(m) {
    const cm = m * 100;
    if (cm < 10) return t('readout.cm', fmt1(cm));
    if (cm < 100) return t('readout.cm', String(Math.round(cm)));
    return t('readout.m', fmt1(m));
  }

  // ============ INTERACTION ============
  function localPoint(ev) {
    const rect = stage.getBoundingClientRect();
    const tt = (ev.touches && ev.touches[0]) || ev;
    return { x: tt.clientX - rect.left, y: tt.clientY - rect.top };
  }

  function angleFrom(px, py, ox, oy) {
    return Math.atan2(px - ox, py - oy);
  }

  function activeState() { return activeEditor === 'A' ? stateA : stateB; }
  function setActiveState(s) { if (activeEditor === 'A') stateA = s; else stateB = s; }

  // The bob closest to the finger, within reach.
  function nearestBob(st, pt) {
    const pts = jointPositions(st, PARAMS).map(toPx);
    let best = null, bestD = 32;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pt.x - pts[i].x, pt.y - pts[i].y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // ============ IDLE HINT (nudge towards Blau after Rot goes quiet) ============
  let idleTimer = null;

  function clearIdleHint() {
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    editorBBtn.classList.remove('attn');
  }

  function scheduleBlauPrompt() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      if (mode !== STATE_SETUP || activeEditor !== 'A') return;
      hint.show(t('badge.nowBlue'));
      editorBBtn.classList.add('attn');
    }, 1500);
  }

  function onPointerDown(ev) {
    if (mode !== STATE_SETUP) return;
    const pt = localPoint(ev);
    // The selected pendulum wins: when Blau lies right on top of Rot, the
    // finger keeps moving the one being set. Otherwise a touch on the other
    // pendulum selects it and moves it straight away.
    let idx = nearestBob(activeState(), pt);
    if (idx === null) {
      const other = activeEditor === 'A' ? 'B' : 'A';
      idx = nearestBob(other === 'A' ? stateA : stateB, pt);
      if (idx === null) return;
      setEditor(other, true);
    }
    ev.preventDefault();
    drag = idx;
    clearIdleHint();
    hint.hide();
    onPointerMove(ev);
  }

  function onPointerMove(ev) {
    if (drag === null || mode !== STATE_SETUP) return;
    ev.preventDefault();
    const pt = localPoint(ev);
    const s = activeState();
    const pts = jointPositions(s, PARAMS).map(toPx);
    const origin = drag === 0 ? { x: pivotX, y: pivotY } : pts[drag - 1];
    s[2 * drag] = angleFrom(pt.x, pt.y, origin.x, origin.y);
    s[2 * drag + 1] = 0;
    setActiveState(s);
    render();
  }

  function onPointerUp() {
    if (drag !== null && mode === STATE_SETUP && activeEditor === 'A') scheduleBlauPrompt();
    drag = null;
  }

  stage.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  stage.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  // ============ MODE / EDITOR CONTROLS ============
  function setN(n) {
    PARAMS.N = n;
    PARAMS.m = new Array(n).fill(1);
    PARAMS.l = new Array(n).fill(1);
    stateA = zeroState(n);
    stateB = zeroState(n);
    startA = startB = null;
    modeSelect.value = String(n);
    layout(true);
    render();
  }

  function selectPendulumType(n) {
    if (mode !== STATE_SETUP) resetSim(true);
    setN(n);
  }

  function setEditor(who, quiet) {
    clearIdleHint();
    activeEditor = who;
    editorABtn.classList.toggle('active', who === 'A');
    editorBBtn.classList.toggle('active', who === 'B');
    editorABtn.setAttribute('aria-pressed', String(who === 'A'));
    editorBBtn.setAttribute('aria-pressed', String(who === 'B'));
    if (quiet) hint.hide();
    else hint.show(who === 'A' ? t('badge.placeRed') : t('badge.placeBlue'));
    render();
  }

  modeSelect.addEventListener('change', () => { selectPendulumType(+modeSelect.value); });
  editorABtn.addEventListener('click', () => { if (mode === STATE_SETUP) setEditor('A'); });
  editorBBtn.addEventListener('click', () => { if (mode === STATE_SETUP) setEditor('B'); });

  frictionBtn.addEventListener('click', () => {
    const on = !PARAMS.friction;
    PARAMS.friction = on ? FRICTION : 0;
    frictionBtn.classList.toggle('active', on);
    frictionBtn.setAttribute('aria-pressed', String(on));
    hint.show(on ? t('badge.frictionOn') : t('badge.frictionOff'));
    clearTimeout(frictionBtn._t);
    frictionBtn._t = setTimeout(() => { hint.hide(); }, 1800);
  });

  // ============ SIM LOOP ============
  const PHYS_DT = 1 / 1000;
  const MAX_SUBSTEPS = 40;
  let running = false;
  let lastT = 0;

  function step(now) {
    if (!running) return;
    const frameDt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    const steps = Math.min(Math.round(frameDt / PHYS_DT), MAX_SUBSTEPS);

    for (let i = 0; i < steps; i++) {
      stateA = rk4(stateA, PHYS_DT, PARAMS);
      stateB = rk4(stateB, PHYS_DT, PARAMS);
      elapsed += PHYS_DT;
      // checked on every physics step, so the precision task cannot slip
      // past its limit between two frames
      trackPrecision();
    }

    trailA.push(tip(stateA));
    trailB.push(tip(stateB));
    if (trailA.length > TRAIL_FRAMES) { trailA.shift(); trailB.shift(); }

    render();
    roZeit.textContent = t('readout.seconds', fmt1(elapsed));
    checkTasks();

    requestAnimationFrame(step);
  }

  function setControlsEnabled(enabled) {
    editorABtn.disabled = !enabled;
    editorBBtn.disabled = !enabled;
  }

  function setPrimary(ariaKey, iconPath) {
    primaryBtn.setAttribute('aria-label', t(ariaKey));
    primaryIcon.innerHTML = iconPath;
  }

  const ICON_PLAY = '<path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/>';
  const ICON_PAUSE = '<path d="M8 5v14M16 5v14"/>';

  function startSim() {
    mode = STATE_RUN;
    elapsed = 0;
    clearTrail();
    clearIdleHint();
    roStatus.textContent = t('readout.running');
    roZeit.textContent = t('readout.seconds', '0,0');
    startA = stateA.slice(); startB = stateB.slice();
    beginPrecisionAttempt();
    hint.hide();
    setControlsEnabled(false);
    setPrimary('primary.pauseAria', ICON_PAUSE);
    running = true;
    lastT = performance.now();
    requestAnimationFrame(step);
  }

  function pauseSim() {
    mode = STATE_PAUSED;
    running = false;
    roStatus.textContent = t('readout.paused');
    setPrimary('primary.resumeAria', ICON_PLAY);
  }

  function resumeSim() {
    mode = STATE_RUN;
    roStatus.textContent = t('readout.running');
    setPrimary('primary.pauseAria', ICON_PAUSE);
    running = true;
    lastT = performance.now();
    requestAnimationFrame(step);
  }

  // After a run, Reset brings back the positions of the last Start, so a
  // near miss can be fine-tuned instead of set up again from scratch. In
  // the setup, Reset lets both pendulums hang straight down.
  function resetSim(toRest) {
    const back = !toRest && mode !== STATE_SETUP && startA;
    running = false;
    mode = STATE_SETUP;
    stateA = back ? startA.slice() : zeroState(PARAMS.N);
    stateB = back ? startB.slice() : zeroState(PARAMS.N);
    elapsed = 0;
    attempt = null;
    setControlsEnabled(true);
    setPrimary('primary.startAria', ICON_PLAY);
    roStatus.textContent = t('readout.ready');
    roZeit.textContent = t('readout.seconds', '0,0');
    clearTrail();
    setEditor(back ? activeEditor : 'A', back);
  }

  primaryBtn.addEventListener('click', () => {
    if (mode === STATE_SETUP) startSim();
    else if (mode === STATE_RUN) pauseSim();
    else if (mode === STATE_PAUSED) resumeSim();
  });
  resetBtn.addEventListener('click', () => { resetSim(false); });

  function relayout() {
    layout(false);
    render();
  }

  // ============ TASKS ============
  // 1: start both pendulums almost identically and watch them separate.
  // 2: with little swing (all arms under 20°), they stay together for 10 s.
  // 3: precision: from a high start (a bob above the pivot), keep the tips
  //    closer than PRECISION_DIST for PRECISION_TIME. Calibrated on the
  //    double pendulum: a careful mouse hand (start ~0.3° apart per arm)
  //    makes it in about one try in four, a finger in about one in ten.
  const PRECISION_TIME = 4;      // s
  const PRECISION_DIST = 0.10;   // m
  let attempt = null;            // { valid, done } for the running Start
  let bestHeld = 0;              // longest time held under the limit so far

  function maxAngleDiff(a, b) {
    let d = 0;
    for (let i = 0; i < PARAMS.N; i++) d = Math.max(d, Math.abs(a[2 * i] - b[2 * i]));
    return d;
  }
  function maxSwing(st) {
    let m = 0;
    for (let i = 0; i < PARAMS.N; i++) m = Math.max(m, Math.abs(st[2 * i]));
    return m;
  }
  function highStart(st) {
    return jointPositions(st, PARAMS).some((p) => p.y < 0);
  }

  function beginPrecisionAttempt() {
    const valid = PARAMS.N >= 2 && highStart(startA) && maxAngleDiff(startA, startB) > 0 && tipDistance() < PRECISION_DIST;
    attempt = valid ? { done: false } : null;
  }

  function trackPrecision() {
    if (!attempt || attempt.done) return;
    const held = Math.min(elapsed, PRECISION_TIME);
    if (tipDistance() >= PRECISION_DIST || elapsed >= PRECISION_TIME) {
      attempt.done = true;
      if (held > bestHeld) bestHeld = held;
      precisionBest.hidden = false;
      precisionBest.textContent = t('tasks.precisionBest', fmt1(bestHeld));
      if (elapsed >= PRECISION_TIME) tasks.done('precision');
    }
  }

  function checkTasks() {
    if (!startA || PARAMS.N < 2) return;
    const deg = Math.PI / 180;
    const apart = tipDistance() > PARAMS.N * SEG_LEN * 0.35;
    const nearlySame = maxAngleDiff(startA, startB) < 3 * deg && maxAngleDiff(startA, startB) > 0;
    if (nearlySame && apart) tasks.done('butterfly');
    const calm = maxSwing(startA) < 20 * deg && maxSwing(startB) < 20 * deg && maxSwing(startA) > 2 * deg;
    if (calm && elapsed > 10 && !apart) tasks.done('calm');
  }

  // ============ INIT / RESIZE ============
  function init() {
    roZeit.textContent = t('readout.seconds', '0,0');
    setPrimary('primary.startAria', ICON_PLAY);
    layout(true);
    setEditor('A');
  }
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', () => {
    setTimeout(relayout, 200);
  });
  // Back from another tab or app: some phones drop the canvas contents of
  // a hidden page, so draw the current picture again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { lastT = performance.now(); render(); }
  });
  window.addEventListener('pageshow', () => { render(); });

  init();
})();
