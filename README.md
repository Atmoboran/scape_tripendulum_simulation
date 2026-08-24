# SCAPE° — Chaos-Pendel

A browser-only double-pendulum simulation illustrating sensitive dependence on
initial conditions (the "butterfly effect") — the same phenomenon that limits
how far ahead weather can be forecast.

Drag the two masses into a starting position and press **Start**. A near-
identical twin pendulum is released alongside the original, offset by less
than a tenth of a degree. Watch both drawn trails separate over time.

- Pure client-side canvas + JavaScript — no build step, no server, no
  dependencies beyond a Google Fonts stylesheet.
- Physics: classic double-pendulum equations of motion, integrated with
  RK4 at a fixed physical timestep, decoupled from the render frame rate.
- Design: SCAPE° corporate design (Archivo, thick ink borders, poster-hero
  layout), mobile-first and optimized for touch.

Open `index.html` directly, or serve the folder with any static file server.
