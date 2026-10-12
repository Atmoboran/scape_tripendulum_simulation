// Every visible text of the app. Edit or translate this file to adapt the
// exhibit; index.html only holds data-t="path.to.key" placeholders that
// js/texts.js fills from here. Entries written as functions build a sentence
// around runtime values. Lines marked LOCAL refer to SCAPE° or its region.
window.TEXTS = {
  lang: 'de',
  pageTitle: 'Wetter ist Chaos – Chaos-Pendel',
  description: 'Ein Doppel- oder Dreifachpendel im Browser: Stelle zwei Pendel selbst ein und beobachte, wie aus winzigen Unterschieden völlig verschiedene Wege werden – über das Chaos hinter der Wettervorhersage.',

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

  poster: {
    headline: 'Wetter ist<br>Chaos',
    lead: 'Zwei fast gleiche Starts. Zwei völlig verschiedene Wege.'
  },
  intro: 'Stell Rot und Blau per Fingerzug ein – fast gleich oder ganz verschieden. Drück auf Start und schau, wie sich ihre Wege trennen.',

  labels: {
    type: 'Pendelart',
    simple: 'Einfach­pendel',
    double: 'Doppel­pendel',
    triple: 'Dreifach­pendel',
    editor: 'Pendel einstellen',
    red: 'Rot',
    blue: 'Blau',
    stageAria: 'Zwei Pendel, Rot und Blau. Zieh an den Kugeln, um sie in Position zu bringen.'
  },
  badge: {
    placeRed: 'Zieh Rot in Position',
    placeBlue: 'Zieh Blau in Position',
    nowBlue: 'Jetzt Blau in Position ziehen'
  },
  readout: {
    status: 'Status',
    time: 'Zeit',
    ready: 'Bereit',
    running: 'Läuft',
    paused: 'Pausiert',
    seconds: s => s + ' s'
  },
  primary: {
    start: 'Start',
    startSub: 'Beide Pendel loslassen',
    stop: 'Stopp',
    stopSub: 'Simulation anhalten',
    resume: 'Weiter',
    resumeSub: 'Simulation fortsetzen',
    reset: 'Reset',
    resetSub: 'Zurück zum Einstellen'
  },
  hint: 'Die Spuren verblassen mit der Zeit. Das Pendel ist ein Modell ohne Reibung: Echte Pendel werden langsamer – das Chaos bleibt.',

  tasks: {
    title: 'Aufgaben',
    butterfly: 'Stell Rot und Blau fast genau gleich ein und starte. Wann trennen sich ihre Wege?',
    calm: 'Lenk beide nur wenig aus (unter 20°). Bleiben sie 10 Sekunden zusammen?',
    doneButterfly: 'Getrennt – trotz fast gleichem Start!',
    doneCalm: 'Ruhig geblieben – wenig Schwung, wenig Chaos.'
  },
  merke: {
    title: 'Merke',
    text: 'Ein winziger Unterschied am Anfang wird beim Chaos-Pendel riesig. Genau deshalb kann niemand das Wetter für Wochen im Voraus berechnen. Mit wenig Schwung bleibt das Pendel aber berechenbar – wie ruhiges Hochdruckwetter.'
  },

  topics: {
    what: {
      title: 'Was ist ein Doppel- oder Dreifachpendel?',
      body: '<p>Hängt man ein zweites Pendel an das Ende eines ersten – oder gleich ein drittes an das zweite –, entsteht eines der einfachsten chaotischen Systeme der Physik. Ein einzelnes Pendel schwingt vorhersagbar hin und her. Mehrere gekoppelte Pendel dagegen taumeln, überschlagen sich und wechseln unregelmäßig zwischen ruhigem Schwingen und wilden Drehungen – obwohl die Bewegungsgleichungen genau bekannt sind. Was fehlt, ist nicht die Formel, sondern die Vorhersagbarkeit.</p>'
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
