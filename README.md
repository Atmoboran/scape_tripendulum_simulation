# SCAPE° — Chaos-Pendel

A browser-only double- or triple-pendulum simulation illustrating sensitive
dependence on initial conditions (the "butterfly effect") — the same
phenomenon that limits how far ahead weather can be forecast.

Choose double or triple pendulum, then position two pendulums by hand — Rot
(red) and Blau (blue), one at a time — anywhere from near-identical to
completely different. Press **Start** to release both. Trails fade over
time, showing how quickly the two paths separate. **Stopp** pauses the
simulation, **Weiter** resumes it, **Reset** returns to setup.

- Pure client-side canvas + JavaScript — no build step, no server, no
  dependencies beyond a Google Fonts stylesheet.
- Physics: general N-fold chain-pendulum equations of motion (mass-matrix
  form), solved each substep via Gaussian elimination and integrated with
  RK4 at a fixed physical timestep, decoupled from the render frame rate.
- Design: SCAPE° corporate design (Archivo, thick ink borders, poster-hero
  layout), mobile-first and optimized for touch.

Open `index.html` directly, or serve the folder with any static file server.
