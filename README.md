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
  external dependencies (no web fonts are loaded from the internet).
- Physics: general N-fold chain-pendulum equations of motion (mass-matrix
  form), solved each substep via Gaussian elimination and integrated with
  RK4 at a fixed physical timestep, decoupled from the render frame rate.
- Design: SCAPE° corporate design, kept apart from the app in `theme/`
  (`theme.css`: font, palette, roles, wordmark; `theme.js`: brand texts and
  the canvas colours). To ship the exhibit in another design, edit `theme/`
  only — see `theme/README.md`. Founders Grotesk is used when installed or
  placed in `theme/fonts/`, otherwise Helvetica Neue / Inter / Arial.
- Layout: on a phone everything stacks (settings, pendulum, buttons); in the
  desktop view the pendulum sits on the left, as large as the screen allows,
  and all settings and buttons move to the right.

Open `index.html` directly, or serve the folder with any static file server.
