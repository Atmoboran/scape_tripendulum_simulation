// THEME – brand and colours used from JavaScript (logo, footer, canvas
// drawings). The CSS side lives in theme.css. For another institution,
// replace the values here; the keys are what the app looks up.
window.THEME = {
  brand: {
    name: 'SCAPE°',
    // Wordmark: name with the subtitle spread over its full width.
    logoHtml:
      '<span class="logo-word">SCAPE°</span>' +
      '<span class="logo-sub" aria-hidden="true"><span>Wetter</span><span>Klima</span><span>Mensch</span></span>',
    logoLabel: 'SCAPE° – Wetter Klima Mensch',
    // The one line in every footer.
    line: 'SCAPE° – Wetter. Klima. Mensch.',
    titleSuffix: ' – SCAPE°',
    themeColor: '#F2E4BA',
    // Short mark S° for the browser tab.
    favicon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#FFF487"/><text x="16" y="23.5" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="19" fill="#000">S°</text></svg>'
  },

  // Typeface for canvas text (the same stack as --font in theme.css).
  font: '"Founders Grotesk","Helvetica Neue",Inter,Arial,sans-serif',

  // The SCAPE° palette by name. Drawings refer to these names.
  palette: {
    black: '#000000', white: '#FFFFFF',
    olive: '#726B1E', sand: '#D4BFA3',
    gold: '#E09F00', amber: '#F59E24', yellow: '#FFE547', yellowStrong: '#FFD500', yellowBright: '#FFED00', yellowS: '#FDC618',
    yellowPastel: '#FFF487', yellowPale: '#FDF6B7',
    rust: '#D55117', orange: '#EE7518', salmon: '#EF887F', pink: '#F8E1E6', cream: '#F2E4BA',
    red: '#E41513', red2: '#E8472E',
    purple: '#442683', purple2: '#523E91', lavender: '#E0E5F5', lilac: '#C5B8DB',
    greenStrong: '#00983A', green: '#62BA91', greenPale: '#B0D8C0', mint: '#CFE6CE', paleGreen: '#D0E8DC',
    cyan: '#0097BE', cyan2: '#44ABCC', cyan3: '#80C0DA', petrol: '#1F6C8E', teal: '#007B73', grey: '#AEC4C2',
    navy: '#28348B', blue: '#0253A0', blue2: '#3274BA', bluePale: '#98B8DD', ice: '#D4EDF8'
  },

  // Meaningful data colours, the same in every app (style guide 4.3).
  data: {
    cold: '#3274BA', neutral: '#D9D6CF', warm: '#E41513',   // temperature scale
    low: '#E41513', high: '#3274BA',                        // T (Tief) red, H (Hoch) blue
    pairA: '#E41513', pairB: '#28348B'                      // two things compared: red vs blue
  }
};

// Colour on the CD temperature scale: t = 0 (cold) … 0.5 (neutral) … 1 (warm).
THEME.tempColor = function (t) {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = t < 0.5 ? [hex(THEME.data.cold), hex(THEME.data.neutral)] : [hex(THEME.data.neutral), hex(THEME.data.warm)];
  const f = Math.max(0, Math.min(1, t < 0.5 ? t * 2 : (t - 0.5) * 2));
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',') + ')';
};

// ---- Chaos-Pendel: canvas colours (match theme.css) ----
// The two pendulums use THEME.data.pairA / pairB (red vs blue).
THEME.pendulum = {
  stage: '#F2E4BA',    // stage background, trails fade into it
  ink: '#000000'       // rods, outlines, pivot
};
