// Every visible text of the app. Edit or translate this file to adapt the
// exhibit; index.html only holds data-t="path.to.key" placeholders that
// js/texts.js fills from here. Entries written as functions build a sentence
// around runtime values. Lines marked LOCAL refer to SCAPE° or its region.
window.TEXTS = {
  lang: 'de',
  pageTitle: 'Wetter ist Chaos – Chaos-Pendel',
  description: 'Ein Doppel-, Dreifach- oder Vierfachpendel im Browser: Stelle zwei Pendel selbst ein und beobachte, wie aus winzigen Unterschieden völlig verschiedene Wege werden – über das Chaos hinter der Wettervorhersage.',

  // Texts of the shared kit (js/view.js, js/kit.js).
  kit: {
    viewToDesktop: 'Desktop-Ansicht',
    viewToMobile: 'Handy-Ansicht',
    viewToDesktopAria: 'Zur Desktop-Ansicht wechseln',
    viewToMobileAria: 'Zur Handy-Ansicht wechseln',
    fullscreenEnter: 'Vollbild',
    fullscreenExit: 'Vollbild beenden',
    infoAria: 'Erklärung anzeigen',
    merkeLocked: 'Löse die Aufgaben – dann erscheint hier, was du herausgefunden hast.',
    devLink: '(dev)'
  },

  chapters: {
    aria: 'Kapitel',
    one: 'Pendel',
    two: 'Lorenz',
    three: 'Karte',
    next: 'Kapitel 2: Der Lorenz-Attraktor',
    prev: 'Kapitel 1: Das Chaos-Pendel',
    toThree: 'Kapitel 3: Zwei Wetterkarten',
    backTwo: 'Kapitel 2: Der Lorenz-Attraktor'
  },

  // Shared by the twin experiment of chapter 3 (js/chaos-lab.js).
  lab: {
    startAria: 'Start: beide Läufe rechnen',
    pauseAria: 'Pause',
    resumeAria: 'Weiter',
    resetAria: 'Neustart: beide Läufe wieder vom selben Anfang',
    newAria: 'Neuer Anfangszustand',
    speed: 'Tempo',
    slow: 'Langsam',
    normal: 'Normal',
    fast: 'Schnell',
    days: d => d + ' Tage',
    chartDays: 'Tage',
    chartY: 'Unterschied A – B',
    chartAria: 'Wie der Unterschied zwischen A und B mit der Zeit wächst, logarithmisch',
    doubling: d => 'Der Unterschied verdoppelt sich etwa alle ' + d + ' Tage.',
    difference: 'Unterschied',
    differenceInfoAria: 'Was bedeutet der Unterschied?'
  },

  poster: {
    headline: 'Wetter ist Chaos',
    lead: 'Stell zwei Pendel fast gleich ein – und schau, was passiert.'
  },

  labels: {
    type: 'Pendelart',
    simple: 'Einfachpendel',
    double: 'Doppelpendel',
    triple: 'Dreifachpendel',
    quad: 'Vierfachpendel',
    typeInfoAria: 'Pendelarten erklären',
    typeNote: '<p>Ein <b>Einfachpendel</b> schwingt brav und vorhersagbar. Ab dem <b>Doppelpendel</b> wird es chaotisch – und je mehr Glieder, desto schneller trennen sich Rot und Blau. Ein Wechsel der Pendelart setzt beide Pendel zurück.</p>',
    editor: 'Pendel einstellen',
    red: 'Rot',
    blue: 'Blau',
    stageAria: 'Zwei Pendel, Rot und Blau. Zieh an den Kugeln, um sie in Position zu bringen.'
  },
  badge: {
    placeRed: 'Zieh Rot in Position',
    placeBlue: 'Zieh Blau in Position',
    nowBlue: 'Jetzt Blau in Position ziehen',
    frictionOn: 'Reibung an',
    frictionOff: 'Reibung aus'
  },
  readout: {
    status: 'Status',
    time: 'Zeit',
    distance: 'Abstand',
    distanceInfoAria: 'Wie wird der Abstand berechnet?',
    distanceNote: '<p><b>Abstand</b> ist die Luftlinie zwischen der untersten roten und der untersten blauen Kugel – so, als würdest du mit einem Lineal quer durchs Bild messen.</p>' +
      '<p>Jeder Arm ist im Modell <b>1 m</b> lang. Ein Doppelpendel reicht also 2 m weit, und seine beiden unteren Kugeln können höchstens 4 m auseinander sein (beim Vierfachpendel 8 m).</p>' +
      '<p>Gemessen wird nur die unterste Kugel: Liegen die unteren Kugeln genau aufeinander, können die oberen trotzdem ein wenig verschieden stehen. Beim Einstellen zeigt der Abstand, wie genau Blau auf Rot liegt; während der Bewegung, wie schnell sich die beiden trennen.</p>',
    ready: 'Bereit',
    running: 'Läuft',
    paused: 'Pausiert',
    seconds: s => s + ' s',
    cm: v => v + ' cm',
    m: v => v + ' m'
  },
  primary: {
    startAria: 'Start: beide Pendel loslassen',
    pauseAria: 'Pause',
    resumeAria: 'Weiter',
    resetAria: 'Zurücksetzen',
    frictionAria: 'Reibung an oder aus'
  },
  controls: {
    infoAria: 'Bedienung erklären',
    note: '<p>Stell Rot und Blau per Fingerzug ein – fast gleich oder ganz verschieden. Tipp dazu auf ein Pendel oder oben links auf <b>Rot</b> / <b>Blau</b>. <b>Abstand</b> zeigt, wie weit die beiden unteren Kugeln auseinander sind.</p>' +
      '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg></span> lässt beide Pendel los, dann <b>Pause</b> und <b>Weiter</b>. Schau, wie sich ihre Wege trennen – die Spuren verblassen mit der Zeit.</p>' +
      '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg></span> holt die Pendel zurück an ihren Start – so kannst du fein nachjustieren. Noch einmal gedrückt hängen beide wieder gerade nach unten.</p>' +
      '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12c1.5-9 3.5-9 5 0s3 6 4.5 0 2.5-4 3.5 0 2 2.5 3 0 1.5-1 2.5 0"/></svg></span> schaltet die <b>Reibung</b> an oder aus. Ohne Reibung schwingt das Pendel ewig – ein Modell. Echte Pendel werden langsamer und kommen zur Ruhe; das Chaos am Anfang bleibt.</p>'
  },

  tasks: {
    open: 'Aufgaben',
    title: 'Aufgaben',
    closeAria: 'Aufgaben schließen',
    intro: 'Sie haken sich von selbst ab, sobald du sie geschafft hast.',
    progress: (done, total) => done + '/' + total,
    butterfly: 'Stell Rot und Blau fast genau gleich ein und starte. Wann trennen sich ihre Wege?',
    calm: 'Lenk beide nur wenig aus (unter 20°). Bleiben sie 10 Sekunden zusammen?',
    precision: '<b>Für Profis:</b> Zieh mindestens eine Kugel über die Aufhängung und setz Blau so genau wie möglich auf Rot. Schaffst du es, dass die unteren Kugeln <b>4 Sekunden</b> lang weniger als <b>10 cm</b> auseinander bleiben?',
    precisionBest: s => 'Dein bester Versuch: ' + s + ' s',
    doneButterfly: 'Getrennt – trotz fast gleichem Start!',
    doneCalm: 'Ruhig geblieben – wenig Schwung, wenig Chaos.',
    donePrecision: 'Geschafft! Doch schau weiter zu: Kurz danach trennen sie sich trotzdem. Mehr Genauigkeit schiebt das Chaos nur ein wenig hinaus – wie beim Wetter.'
  },

  // LOCAL
  moreChaos: 'In SCAPE° begegnet dir das Chaos immer wieder: in den Turbulenzen am Wirbeltouch oder am Galtonbrett.',

  topics: {
    what: {
      title: 'Was ist ein Mehrfachpendel?',
      body: '<p>Hängt man ein zweites Pendel an das Ende eines ersten – oder gleich ein drittes und viertes daran –, entsteht eines der einfachsten chaotischen Systeme der Physik. Ein einzelnes Pendel schwingt vorhersagbar hin und her. Mehrere gekoppelte Pendel dagegen taumeln, überschlagen sich und wechseln unregelmäßig zwischen ruhigem Schwingen und wilden Drehungen – obwohl die Bewegungsgleichungen genau bekannt sind. Was fehlt, ist nicht die Formel, sondern die Vorhersagbarkeit.</p>'
    },
    weather: {
      title: 'Was hat das mit dem Wetter zu tun?',
      body: '<p>Der Grund heißt <b>sensitive Abhängigkeit von den Anfangsbedingungen</b> – bekannt als Schmetterlingseffekt. Starten zwei fast gleiche Pendel mit einem winzigen Unterschied, wächst dieser Unterschied mit jeder Schwingung. Nach wenigen Sekunden bewegen sich beide völlig unabhängig voneinander.</p><p>Genau das begrenzt Wettervorhersagen: Den Zustand der Atmosphäre kann man nie ganz genau messen, und diese kleine Unsicherheit wächst mit der Zeit. Deshalb werden Vorhersagen nach einigen Tagen unsicherer – egal wie stark der Supercomputer ist.</p>'
    },
    energy: {
      title: 'Warum bleibt es manchmal ruhig?',
      body: '<p>Entscheidend ist die Energie im System. Lenkst du beide Pendel nur wenig aus, bleiben Rot und Blau erstaunlich ähnlich: Bei kleinen Auslenkungen verhält sich ein Mehrfachpendel fast wie ein einfaches Pendel – kleine Unterschiede bleiben klein. Erst wenn sich die Massen überschlagen können, wird die Bewegung chaotisch.</p><p>Auch das gibt es beim Wetter: Bei ruhigen, stabilen Lagen – etwa einem großen Hochdruckgebiet – bleiben Vorhersagen länger zuverlässig. Bei Stürmen und wechselhaftem Wetter wächst dieselbe kleine Unsicherheit viel schneller.</p>'
    }
  }
};
