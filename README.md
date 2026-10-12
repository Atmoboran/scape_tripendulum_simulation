# SCAPE° — Chaos-Pendel ("Wetter ist Chaos")

A browser-only single, double or triple pendulum illustrating sensitive
dependence on initial conditions (the "butterfly effect") — the same
phenomenon that limits how far ahead weather can be forecast.

Visitors place a red and a blue pendulum by hand — near-identical or
completely different — press **Start** and watch the paths separate. Trails
fade over time. Two optional tasks (start almost identically and watch them
separate; start with little swing and see them stay together) unlock the
"Merke" box with the key insight. Longer explanations sit in collapsible
topics below.

## Run

Open `index.html` (double-click works, no build, no server, works offline),
or serve the folder with any static file server / GitHub Pages.

URL switches for staff: `?kiosk` (exhibit mode: back to the start after
3 minutes without touch).

## Files

```
index.html          structure only (data-t placeholders for every text)
css/kit.css         shared SCAPE° components (same in every app)
css/app.css         layout of this app
js/view.js          phone/desktop layout switch (loaded in <head>)
js/texts.js         fills the texts from content/
js/brand.js         fills logo and footer line from the theme
js/kit.js           fullscreen button, hint badge, tasks/Merke, kiosk mode
js/physics.js       pendulum physics (pure functions)
js/app.js           stage, interaction, loop
content/texts.de.js every visible text (edit or translate here)
theme/              the design: font, palette, logo, colours (see theme/README.md)
```

## Physics

General N-fold chain-pendulum equations of motion (mass-matrix form), solved
each substep via Gaussian elimination and integrated with RK4 at a fixed
physical time step, decoupled from the frame rate. No friction.

## Layout

Phone: intro and settings, the square stage, readout, Start/Reset, tasks.
Desktop (automatic from 1000 px, or via the "Desktop-/Handy-Ansicht" toggle,
remembered for this app only): the stage on the left, sized to the screen;
intro, settings, buttons and tasks on the right.

## Adapting

Design: `theme/` only. Texts: `content/texts.de.js` only (lines marked
`LOCAL` refer to SCAPE° or its region). Founders Grotesk is used when
installed, otherwise the system fallback.
