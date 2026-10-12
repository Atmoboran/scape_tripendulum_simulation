(() => {
  'use strict';
  const { rk4, jointPositions, zeroState } = window.Pendulum;

  // ============ COLOURS (theme/theme.js) ============
  const PC = window.THEME.pendulum;
  // two things compared: always red vs blue (theme data colours)
  PC.a = window.THEME.data.pairA; PC.b = window.THEME.data.pairB;
  function rgba(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
  }
  const COL_A = PC.a, COL_B = PC.b, TRAIL_A = rgba(PC.a, 0.9), TRAIL_B = rgba(PC.b, 0.85), FADE = rgba(PC.stage, 0.045);

  // ============ DOM / CANVAS SETUP ============
  const stage = document.getElementById('stage');
  const trailCanvas = document.getElementById('trail-canvas');
  const drawCanvas = document.getElementById('draw-canvas');
  const trailCtx = trailCanvas.getContext('2d');
  const drawCtx = drawCanvas.getContext('2d');

  const primaryBtn = document.getElementById('sim-primary');
  const primaryLabel = document.getElementById('sim-primary-label');
  const primarySub = document.getElementById('sim-primary-sub');
  const primaryIcon = document.getElementById('sim-primary-icon');
  const resetBtn = document.getElementById('sim-reset');
  const hint = SCAPE.badge(stage);
  const tasks = SCAPE.tasks(document.getElementById('tp-tasks'));
  const roStatus = document.getElementById('ro-status');
  const roZeit = document.getElementById('ro-zeit');

  const modeRow = document.getElementById('mode-row');
  const modeSimpleBtn = document.getElementById('mode-simple');
  const modeDoubleBtn = document.getElementById('mode-double');
  const modeTripleBtn = document.getElementById('mode-triple');
  const editorRow = document.getElementById('editor-row');
  const editorABtn = document.getElementById('editor-a');
  const editorBBtn = document.getElementById('editor-b');
  const legendA = document.getElementById('legend-a');
  const legendB = document.getElementById('legend-b');

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let pivotX = 0, pivotY = 0, scale = 1;

  const SEG_LEN = 1.0; // meters, per arm

  function layout() {
    const rect = stage.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    [trailCanvas, drawCanvas].forEach((c) => {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    });
    trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pivot dead-center: a full loop reaches the same distance in every
    // direction, so a centered pivot in a square box is the only way to
    // fit that reach without clipping on some sides but not others.
    pivotX = W * 0.5;
    pivotY = H * 0.5;

    const totalLen = PARAMS.N * SEG_LEN;
    scale = (Math.min(W, H) * 0.46) / totalLen;

    trailCtx.fillStyle = PC.stage;
    trailCtx.fillRect(0, 0, W, H);
  }

  // ============ STATE ============
  const STATE_SETUP = 'setup', STATE_RUN = 'run', STATE_PAUSED = 'paused';
  let mode = STATE_SETUP;
  let activeEditor = 'A';

  const PARAMS = { N: 2, m: [1, 1], l: [1, 1] };
  let stateA = zeroState(2), stateB = zeroState(2);
  let elapsed = 0;
  let lastPrevA = null, lastPrevB = null;
  let drag = null; // { editor, index } | null

  function toPx(pt) { return { x: pivotX + pt.x * scale, y: pivotY + pt.y * scale }; }

  function bobRadius(i, N) { return 7 + i * (N === 3 ? 1.6 : 2.6); }

  // ============ DRAWING ============
  function clearDraw() { drawCtx.clearRect(0, 0, W, H); }

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

  function fadeTrail() {
    trailCtx.fillStyle = FADE;
    trailCtx.fillRect(0, 0, W, H);
  }

  function trailSegment(prev, cur, color) {
    if (!prev) return;
    trailCtx.strokeStyle = color;
    trailCtx.lineWidth = 2.4;
    trailCtx.lineCap = 'round';
    trailCtx.beginPath();
    trailCtx.moveTo(prev.x, prev.y);
    trailCtx.lineTo(cur.x, cur.y);
    trailCtx.stroke();
  }

  function renderSetup() {
    clearDraw();
    drawPivot();
    if (activeEditor === 'A') {
      drawPendulum(stateB, COL_B, 0.32);
      drawPendulum(stateA, COL_A, 1);
    } else {
      drawPendulum(stateA, COL_A, 0.32);
      drawPendulum(stateB, COL_B, 1);
    }
  }

  // ============ INTERACTION ============
  function localPoint(ev) {
    const rect = stage.getBoundingClientRect();
    const t = (ev.touches && ev.touches[0]) || ev;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function angleFrom(px, py, ox, oy) {
    return Math.atan2(px - ox, py - oy);
  }

  function activeState() { return activeEditor === 'A' ? stateA : stateB; }
  function setActiveState(s) { if (activeEditor === 'A') stateA = s; else stateB = s; }

  function hitTest(pt) {
    const pts = jointPositions(activeState(), PARAMS).map(toPx);
    for (let i = pts.length - 1; i >= 0; i--) {
      if (Math.hypot(pt.x - pts[i].x, pt.y - pts[i].y) < 32) return i;
    }
    return null;
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
    const idx = hitTest(pt);
    if (idx === null) return;
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
    renderSetup();
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
    modeSimpleBtn.classList.toggle('active', n === 1);
    modeDoubleBtn.classList.toggle('active', n === 2);
    modeTripleBtn.classList.toggle('active', n === 3);
    layout();
    renderSetup();
  }

  function selectPendulumType(n) {
    if (mode !== STATE_SETUP) resetSim();
    setN(n);
  }

  function setEditor(who) {
    clearIdleHint();
    activeEditor = who;
    editorABtn.classList.toggle('active', who === 'A');
    editorBBtn.classList.toggle('active', who === 'B');
    legendA.classList.toggle('editing', who === 'A');
    legendB.classList.toggle('editing', who === 'B');
    hint.show(who === 'A' ? t('badge.placeRed') : t('badge.placeBlue'));
    renderSetup();
  }

  modeSimpleBtn.addEventListener('click', () => { selectPendulumType(1); });
  modeDoubleBtn.addEventListener('click', () => { selectPendulumType(2); });
  modeTripleBtn.addEventListener('click', () => { selectPendulumType(3); });
  editorABtn.addEventListener('click', () => { if (mode === STATE_SETUP) setEditor('A'); });
  editorBBtn.addEventListener('click', () => { if (mode === STATE_SETUP) setEditor('B'); });

  // ============ SIM LOOP ============
  const PHYS_DT = 1 / 1000;
  const MAX_SUBSTEPS = 40;
  let running = false;
  let lastT = 0;

  function fmt1(n) { return n.toFixed(1).replace('.', ','); }

  function step(now) {
    if (!running) return;
    const frameDt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    const steps = Math.min(Math.round(frameDt / PHYS_DT), MAX_SUBSTEPS);

    for (let i = 0; i < steps; i++) {
      stateA = rk4(stateA, PHYS_DT, PARAMS);
      stateB = rk4(stateB, PHYS_DT, PARAMS);
    }
    elapsed += steps * PHYS_DT;

    const pa = jointPositions(stateA, PARAMS)[PARAMS.N - 1];
    const pb = jointPositions(stateB, PARAMS)[PARAMS.N - 1];
    const pxA = toPx(pa), pxB = toPx(pb);

    fadeTrail();
    trailSegment(lastPrevA, pxA, TRAIL_A);
    trailSegment(lastPrevB, pxB, TRAIL_B);
    lastPrevA = pxA;
    lastPrevB = pxB;

    clearDraw();
    drawPivot();
    drawPendulum(stateB, COL_B, 1);
    drawPendulum(stateA, COL_A, 1);

    roZeit.textContent = t('readout.seconds', fmt1(elapsed));
    checkTasks();

    requestAnimationFrame(step);
  }

  function setControlsEnabled(enabled) {
    editorABtn.disabled = !enabled;
    editorBBtn.disabled = !enabled;
  }

  function setPrimary(label, sub, iconPath, filled) {
    primaryLabel.textContent = label;
    primarySub.textContent = sub;
    primaryIcon.innerHTML = iconPath;
  }

  const ICON_PLAY = '<path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/>';
  const ICON_PAUSE = '<path d="M8 5v14M16 5v14"/>';

  function startSim() {
    mode = STATE_RUN;
    elapsed = 0;
    lastPrevA = null;
    lastPrevB = null;
    clearIdleHint();
    roStatus.textContent = t('readout.running');
    roZeit.textContent = t('readout.seconds', '0,0');
    startA = stateA.slice(); startB = stateB.slice();
    hint.hide();
    legendA.classList.remove('editing');
    legendB.classList.remove('editing');
    setControlsEnabled(false);
    setPrimary(t('primary.stop'), t('primary.stopSub'), ICON_PAUSE);
    running = true;
    lastT = performance.now();
    requestAnimationFrame(step);
  }

  function pauseSim() {
    mode = STATE_PAUSED;
    running = false;
    roStatus.textContent = t('readout.paused');
    setPrimary(t('primary.resume'), t('primary.resumeSub'), ICON_PLAY);
  }

  function resumeSim() {
    mode = STATE_RUN;
    roStatus.textContent = t('readout.running');
    setPrimary(t('primary.stop'), t('primary.stopSub'), ICON_PAUSE);
    running = true;
    lastT = performance.now();
    requestAnimationFrame(step);
  }

  function resetSim() {
    running = false;
    mode = STATE_SETUP;
    stateA = zeroState(PARAMS.N);
    stateB = zeroState(PARAMS.N);
    elapsed = 0;
    lastPrevA = null;
    lastPrevB = null;
    setControlsEnabled(true);
    setPrimary(t('primary.start'), t('primary.startSub'), ICON_PLAY);
    roStatus.textContent = t('readout.ready');
    roZeit.textContent = t('readout.seconds', '0,0');
    setEditor('A');
    trailCtx.fillStyle = PC.stage;
    trailCtx.fillRect(0, 0, W, H);
    renderSetup();
  }

  primaryBtn.addEventListener('click', () => {
    if (mode === STATE_SETUP) startSim();
    else if (mode === STATE_RUN) pauseSim();
    else if (mode === STATE_PAUSED) resumeSim();
  });
  resetBtn.addEventListener('click', resetSim);

  function relayout() {
    layout();
    lastPrevA = null; lastPrevB = null;
    if (mode === STATE_SETUP) renderSetup();
  }

  // ============ TASKS ============
  // 1: start both pendulums almost identically and watch them separate.
  // 2: with little swing (all arms under 20°), they stay together for 10 s.
  let startA = null, startB = null;
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
  function checkTasks() {
    if (!startA || PARAMS.N < 2) return;
    const deg = Math.PI / 180;
    const tipA = toPx(jointPositions(stateA, PARAMS)[PARAMS.N - 1]);
    const tipB = toPx(jointPositions(stateB, PARAMS)[PARAMS.N - 1]);
    const apart = Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y) > PARAMS.N * SEG_LEN * scale * 0.35;
    const nearlySame = maxAngleDiff(startA, startB) < 3 * deg && maxAngleDiff(startA, startB) > 0;
    if (nearlySame && apart && tasks.done('butterfly')) roStatus.textContent = t('tasks.doneButterfly');
    const calm = maxSwing(startA) < 20 * deg && maxSwing(startB) < 20 * deg && maxSwing(startA) > 2 * deg;
    if (calm && elapsed > 10 && !apart && tasks.done('calm')) roStatus.textContent = t('tasks.doneCalm');
  }

  // ============ INIT / RESIZE ============
  function init() {
    roZeit.textContent = t('readout.seconds', '0,0');
    layout();
    setEditor('A');
  }
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', () => {
    setTimeout(relayout, 200);
  });

  init();
})();
