# SCAPE° — Chaos-Pendel ("Wetter ist Chaos")

A browser-only single, double, triple or quadruple pendulum illustrating
sensitive dependence on initial conditions (the "butterfly effect") — the
same phenomenon that limits how far ahead weather can be forecast.

**Chapter 1 (`index.html`)** — visitors place a red and a blue pendulum by
hand (pick one with the Rot/Blau chips in the picture or by tapping the
pendulum itself), press Start and watch the paths separate. The status line
shows status, time and the distance between the two lowest bobs. Icon
buttons: start/pause, reset (first back to the last start positions, then
to rest), friction on/off; the (i) beside them explains everything. Three
tasks in a pop-up check themselves off — the last one ("keep the tips under
10 cm for 4 s from a high start") is calibrated to be hard but doable.

**Chapter 2 (`lorenz.html`)** — the Lorenz attractor: two points (or a
cloud of 300) start 0.01, 0.000 01 or 0.000 000 01 apart; drag turns the
picture, a tap sets a new start point (also far off the attractor). A
loupe in the corner follows Rot, magnified in 1-2-5 steps (up to several
100 000×) so that the tiny gap to Blau shows and grows. Five tasks:
separate wings, a far start lands on the attractor anyway, a 1000× more
precise start buys only a few time units, the ensemble cloud, and for
experts: once apart, pause while the two pass within 2 of each other
(about 2-3 chances a minute, ~0.3 s each).

**Chapter 3 (`karte.html`)** — a two-layer quasi-geostrophic model of the
mid-latitude atmosphere (64 × 32 points, 16 000 × 8000 km): map A, map B
(with a small warm bubble the visitor drags into place) and their
difference, all three at once by default; temperature in colour,
upper-level flow as lines. A tap sets a weather station that records the
temperature there in A and B. Errors double in ≈ 3 days.

Chapter 3 is the winner of two candidate prototypes for a museum station
(the other, Lorenz-96, was tried as a chapter and taken out again; its model
and validation stay in the repo). Models, numerics, validation,
performance and the comparison are in [`docs/`](docs/) (German):
[modelle](docs/modelle.md) · [numerik](docs/numerik.md) ·
[validierung](docs/validierung.md) · [performance](docs/performance.md) ·
[vergleich](docs/vergleich.md).

## Run

Open `index.html` (double-click works, no build, no server), or serve the
folder with any static file server / GitHub Pages, e.g.

```
python3 -m http.server 8000      # then http://localhost:8000/
```

Offline: served over http(s), a service worker (`sw.js`) stores every file
on the first visit, so all chapters start without a network afterwards
(opened from disk the app needs none anyway). It works network first: with
a connection each file comes fresh from the server, so updates reach
visitors without any version bump; only offline (or after 4 s without an
answer) the stored copy is used. New files of the app must be added to the
`FILES` list in `sw.js`.

## Tests and scripts

```
node --test --test-concurrency=1 tests/*.test.js   # models, numerics, UI, offline;
                                      # browser + offline tests need Playwright
node scripts/validate-lorenz96.js     # Lyapunov exponent, convergence, controls
node scripts/validate-qg.js           # same for the two-layer model (~8 min)
node scripts/qg-spinup.js             # regenerates data/qg-start.js
node scripts/perf.js                  # frame rate / model speed, CPU throttled
node scripts/load.js                  # bytes and load time per page
```

No dependencies for the app; Node ≥ 18 for tests and scripts, Playwright
(`npm i -g playwright`, then `NODE_PATH=$(npm root -g)`) for the browser
tests and measurements.

URL switches for staff: `?kiosk` (exhibit mode: back to the start after
3 minutes without touch).

## Files

```
index.html          chapter 1 (pendulum): structure only (data-t placeholders)
lorenz.html         chapter 2 (Lorenz attractor)
css/kit.css         shared SCAPE° components (same in every app)
css/app.css         layout of this app
js/view.js          phone/desktop layout switch (loaded in <head>)
js/texts.js         fills the texts from content/
js/brand.js         fills logo and footer line from the theme
js/kit.js           fullscreen button, info buttons, hint badge, tasks, kiosk mode
js/tasks-dialog.js  "Aufgaben" button with progress + pop-up
js/physics.js       pendulum physics (pure functions)
js/app.js           chapter 1: stage, interaction, loop, tasks
js/lorenz.js        chapter 2: Lorenz model, view, interaction, tasks
karte.html          chapter 3 (two weather maps, two-layer model)
js/models/          model cores without DOM, testable in Node:
  lorenz96.js         Lorenz-96, RK4 (candidate A; validation and tests only)
  qg2layer.js         two-layer quasi-geostrophic model, pseudo-spectral, AB3
  fft.js              radix-2 FFT, 1-D and 2-D
  compare.js          difference records, growth rate / doubling time
js/chaos-lab.js     chapter 3: loop, buttons, status line, log chart
js/karte.js         chapter 3: maps, difference map, bubble, station, tasks
js/offline.js       registers the service worker
sw.js               service worker (offline cache)
data/qg-start.js    equilibrated start states of the two-layer model
content/texts.de.js every visible text of chapter 1 + shared texts
content/lorenz.de.js texts of chapter 2 (likewise karte.de.js for chapter 3)
tests/              node:test suites (models, UI, offline)
scripts/            validation, spin-up, performance
docs/               model documentation and reports (German)
theme/              the design: font, palette, logo, colours (see theme/README.md)
```

## Physics

General N-fold chain-pendulum equations of motion (mass-matrix form), solved
each substep via Gaussian elimination and integrated with RK4 at a fixed
physical time step, decoupled from the frame rate. Optional friction (a
damping term per joint, 0.15 1/s). Lorenz: σ = 10, ρ = 28, β = 8/3, RK4.
Two-layer model (and Lorenz-96): see docs/modelle.md and docs/numerik.md.

## Layout

Phone: the square stage, readout, icon buttons, tasks button, topics.
Desktop (automatic from 1000 px, or via the "Desktop-/Handy-Ansicht" toggle,
remembered for this app only): the stage on the left, sized to the screen
height; readout, buttons and tasks on the right.

## Adapting

Design: `theme/` only. Texts: `content/texts.de.js` only (lines marked
`LOCAL` refer to SCAPE° or its region). Founders Grotesk is used when
installed, otherwise the system fallback.
