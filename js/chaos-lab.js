// Shared lab for the twin experiment of chapter 3: run A and run B
// (B with a tiny change at the start) are stepped together; this file owns
// the loop, the buttons, the status line and the chart of how far they
// drift apart. Each chapter hands in a model adapter:
//   stepsPerDay, sampleEvery (steps), maxStepsPerFrame, msBudget (optional:
//   computing time per frame, ms), minDrawMs (optional: redraw the stage at
//   most this often while running)
//   restart()        both runs back to the same start, B with the change
//   newStart()       a different start (then restart() follows)
//   step()           one model step of both runs
//   day()            model time in days
//   diff()           relative difference (1 = as different as two random days)
//   render(mode)     draw the stage ('setup' | 'run' | 'paused')
//   onSample(lab)    optional, after each recorded sample (tasks)
// The model time step never depends on the frame rate: a slow phone runs
// fewer steps per second, never different ones.
(() => {
  'use strict';
  const S = (window.SCAPE = window.SCAPE || {});

  // ============ CHART: difference over time, logarithmic ============
  function Chart(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const LOG_MIN = -6, LOG_MAX = 0.4;     // 0.0001 % … 250 %
    let W = 0, H = 0;
    const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    function size() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(rec, prev, fit, tMax) {
      if (!W) size();
      ctx.clearRect(0, 0, W, H);
      const padL = 72, padR = 8, padT = 8, padB = 22;
      const x = (t) => padL + (W - padL - padR) * t / tMax;
      const y = (e) => padT + (H - padT - padB) * (LOG_MAX - Math.log10(Math.max(e, 1e-12))) / (LOG_MAX - LOG_MIN);
      const ink = css('--ink') || '#000', soft = css('--rule-soft') || '#d9d9d9';
      ctx.font = '500 10px ' + (window.THEME.font || 'sans-serif');
      ctx.textBaseline = 'middle';
      // decades
      [[-6, '0,0001 %'], [-4, '0,01 %'], [-2, '1 %'], [0, '100 %']].forEach(([l, label]) => {
        ctx.strokeStyle = l === 0 ? ink : soft;
        ctx.lineWidth = 1;
        ctx.setLineDash(l === 0 ? [4, 4] : []);
        ctx.beginPath(); ctx.moveTo(padL, y(10 ** l)); ctx.lineTo(W - padR, y(10 ** l)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = ink; ctx.textAlign = 'right';
        ctx.fillText(label, padL - 6, y(10 ** l));
      });
      // time axis
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const stepT = tMax > 60 ? 20 : tMax > 30 ? 10 : 5;
      for (let d = 0; d <= tMax + 1e-9; d += stepT) ctx.fillText(String(d), x(d), H - padB + 6);
      ctx.textAlign = 'right';
      ctx.fillText(t('lab.chartDays'), padL - 8, H - padB + 6);
      // what the curve is: the difference between A and B, upright on the left
      ctx.save();
      ctx.translate(8, padT + (H - padT - padB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(t('lab.chartY'), 0, 0);
      ctx.restore();
      const line = (r, color, width) => {
        if (!r || r.t.length < 2) return;
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let k = 0; k < r.t.length; k++) { const px = x(Math.min(r.t[k], tMax)), py = y(r.e[k]); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
      };
      line(prev, 'rgba(0,0,0,.25)', 2);
      line(rec, ink, 2.4);
      if (fit) {
        // the fitted exponential through the growth window
        const k0 = rec.e.findIndex((e) => e > fit.lo), k1 = rec.e.findIndex((e) => e >= fit.hi);
        const t0 = rec.t[k0 >= 0 ? k0 : 0], t1 = k1 >= 0 ? rec.t[k1] : rec.t[rec.t.length - 1];
        const e0 = rec.e[k0 >= 0 ? k0 : 0];
        ctx.strokeStyle = css('--accent') || '#EE7518'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(x(t0), y(e0)); ctx.lineTo(x(t1), y(e0 * Math.exp(fit.rate * (t1 - t0)))); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    return { draw, size };
  }

  // ============ LAB ============
  S.chaosLab = (model) => {
    const $ = (id) => document.getElementById(id);
    const primaryBtn = $('sim-primary'), primaryIcon = $('sim-primary-icon');
    const resetBtn = $('sim-reset'), newBtn = $('sim-new');
    const speedSelect = $('speed-select');
    const roStatus = $('ro-status'), roZeit = $('ro-zeit'), roDiff = $('ro-diff');
    // the log chart of the difference is optional (a page may leave it out)
    const doublingNote = $('doubling-note');
    const chartCanvas = $('diff-chart');
    const chart = chartCanvas ? Chart(chartCanvas) : { draw() {}, size() {} };

    const ICON_PLAY = '<path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/>';
    const ICON_PAUSE = '<path d="M8 5v14M16 5v14"/>';

    const lab = {
      mode: 'setup',
      rec: new window.Compare.Record(),
      prev: null,           // the record of the run before, drawn in grey
      fit: null,
      steps: 0
    };

    const fmt = (v, d) => v.toFixed(d).replace('.', ',');
    // A percentage with as many digits as it needs to show something.
    lab.fmtPercent = (e) => {
      const p = e * 100;
      if (p === 0) return '0 %';
      if (p >= 10) return fmt(p, 0) + ' %';
      if (p >= 1) return fmt(p, 1) + ' %';
      const digits = Math.min(8, Math.max(1, Math.ceil(-Math.log10(Math.max(p, 1e-9))) + 1));
      return fmt(p, digits) + ' %';
    };
    lab.fmtDays = (d) => fmt(d, d < 10 ? 1 : 0);

    function setPrimary(key, icon) { primaryBtn.setAttribute('aria-label', t(key)); primaryIcon.innerHTML = icon; }

    function readout() {
      roZeit.textContent = t('lab.days', lab.fmtDays(model.day()));
      roDiff.textContent = lab.fmtPercent(model.diff());
    }

    function sample() {
      lab.rec.push(model.day(), model.diff());
      // the estimate only once the whole window (up to 20 %) has been run
      // through -- before that the start phase would dominate it
      const g = lab.rec.last >= 0.2 ? window.Compare.growth(lab.rec) : null;
      lab.fit = g && isFinite(g.doubling) ? Object.assign(g, { lo: 10 * lab.rec.e[0], hi: 0.2 }) : lab.fit;
      if (model.onSample) model.onSample(lab);
    }

    function drawChart() {
      const last = Math.max(lab.rec.t[lab.rec.t.length - 1] || 0, lab.prev ? lab.prev.t[lab.prev.t.length - 1] : 0);
      const tMax = Math.max(model.chartDays || 20, Math.ceil(last / 10) * 10);
      chart.draw(lab.rec, lab.prev, lab.fit, tMax);
      if (model.drawCharts) model.drawCharts(tMax);
      if (!doublingNote) return;
      if (lab.fit) {
        doublingNote.hidden = false;
        doublingNote.textContent = t('lab.doubling', lab.fmtDays(lab.fit.doubling));
      } else doublingNote.hidden = true;
    }

    function frame() {
      model.render(lab.mode);
      readout();
      drawChart();
    }
    // While running, a slow device redraws the stage less often (at most a
    // third of the time goes to drawing) -- the model keeps its pace.
    let drawCost = 0, lastDraw = 0, lastChart = 0;
    function runFrame(now) {
      if (now - lastDraw >= Math.max(model.minDrawMs || 0, Math.min(100, 2 * drawCost))) {
        const t0 = performance.now();
        model.render(lab.mode);
        drawCost = 0.8 * drawCost + 0.2 * (performance.now() - t0);
        lastDraw = now;
      }
      readout();
      // the chart changes slowly: five times a second is plenty
      if (now - lastChart > 200) { drawChart(); lastChart = now; }
    }

    // ---- loop ----
    let running = false, lastT = 0, carry = 0;
    function loop(now) {
      if (!running) return;
      const frameMs = now - lastT;
      const dt = Math.min(frameMs / 1000, 0.1);
      lastT = now;
      carry += dt * +speedSelect.value * model.stepsPerDay;
      let n = Math.floor(carry);
      // a slow device skips the backlog instead of piling it up: the run
      // gets slower, never different
      if (n > model.maxStepsPerFrame) { n = model.maxStepsPerFrame; carry = 0; } else carry -= n;
      const t0 = performance.now();
      for (let i = 0; i < n; i++) {
        // never let the computation eat the frame: the rest waits (or is
        // dropped) -- slower, but each step is the same as on a fast device
        // when frames are slow (drawing, or the browser putting pixels on
        // the screen), computing gets up to half of the frame interval
        if (model.msBudget && i && performance.now() - t0 > Math.max(model.msBudget, drawCost, 0.5 * frameMs)) { carry = 0; break; }
        model.step();
        lab.steps++;
        if (lab.steps % model.sampleEvery === 0) sample();
      }
      runFrame(now);
      requestAnimationFrame(loop);
    }

    function run() {
      lab.mode = 'run';
      running = true;
      roStatus.textContent = t('readout.running');
      setPrimary('lab.pauseAria', ICON_PAUSE);
      lastT = performance.now(); carry = 0;
      requestAnimationFrame(loop);
    }
    function pause() {
      lab.mode = 'paused';
      running = false;
      roStatus.textContent = t('readout.paused');
      setPrimary('lab.resumeAria', ICON_PLAY);
      frame();
    }
    // Back to the start: A and B from exactly the same state again, B with
    // the change. The run so far stays in the chart in grey.
    lab.restart = () => {
      running = false;
      lab.mode = 'setup';
      if (lab.rec.t.length > 1) { lab.prev = lab.rec; lab.rec = new window.Compare.Record(); } else lab.rec.clear();
      lab.fit = null;
      lab.steps = 0;
      model.restart();
      lab.rec.push(model.day(), model.diff());
      roStatus.textContent = t('readout.ready');
      setPrimary('lab.startAria', ICON_PLAY);
      frame();
    };
    lab.frame = frame;

    primaryBtn.addEventListener('click', () => { if (lab.mode === 'run') pause(); else run(); });
    resetBtn.addEventListener('click', lab.restart);
    if (newBtn) newBtn.addEventListener('click', () => { model.newStart(); lab.prev = null; lab.restart(); });

    lab.chart = chart;
    window.addEventListener('resize', () => { chart.size(); frame(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') { lastT = performance.now(); chart.size(); frame(); }
    });

    return lab;
  };
})();
