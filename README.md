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
picture, a tap sets a new start point. Three tasks: separate wings,
1000× more precise start buys only a few time units, the ensemble cloud.

## Run

Open `index.html` (double-click works, no build, no server, works offline),
or serve the folder with any static file server / GitHub Pages.

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
content/texts.de.js every visible text of chapter 1 + shared texts
content/lorenz.de.js texts of chapter 2
theme/              the design: font, palette, logo, colours (see theme/README.md)
```

## Physics

General N-fold chain-pendulum equations of motion (mass-matrix form), solved
each substep via Gaussian elimination and integrated with RK4 at a fixed
physical time step, decoupled from the frame rate. Optional friction (a
damping term per joint, 0.15 1/s). Lorenz: σ = 10, ρ = 28, β = 8/3, RK4.

## Layout

Phone: the square stage, readout, icon buttons, tasks button, topics.
Desktop (automatic from 1000 px, or via the "Desktop-/Handy-Ansicht" toggle,
remembered for this app only): the stage on the left, sized to the screen
height; readout, buttons and tasks on the right.

## Adapting

Design: `theme/` only. Texts: `content/texts.de.js` only (lines marked
`LOCAL` refer to SCAPE° or its region). Founders Grotesk is used when
installed, otherwise the system fallback.
