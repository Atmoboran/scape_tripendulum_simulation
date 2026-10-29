// Texts of chapter 2 (lorenz.html), loaded after content/texts.de.js. The
// shared parts (kit, chapters, readout, tasks dialog) come from there.
window.TEXTS.pageTitle = 'Der Lorenz-Attraktor – Chaos-Pendel';
window.TEXTS.description = 'Der Lorenz-Attraktor im Browser: Schick zwei fast gleiche Punkte durch das berühmte Wettermodell von 1963 und sieh, wann sie sich trennen – der Ursprung des Schmetterlingseffekts.';

window.TEXTS.lorenz = {
  poster: {
    headline: 'Chaos hat Flügel',
    lead: 'Schick zwei fast gleiche Punkte durch das Wettermodell – und sieh, wann sie sich trennen.'
  },
  stageAria: 'Der Lorenz-Attraktor mit zwei Punkten, Rot und Blau. Ziehen dreht das Bild, Tippen setzt einen neuen Start.',
  stageNote: 'Ziehen dreht · Tippen setzt den Start',
  loupe: n => 'Lupe ×' + n,
  badge: {
    start: 'Drück Start – oder tipp ins Bild für einen neuen Startpunkt',
    newStart: 'Neuer Start gesetzt',
    caught: d => 'Erwischt! Abstand ' + d,
    missed: d => 'Abstand ' + d + ' – noch zu weit'
  },
  readout: {
    spread: 'Streuung',
    distanceNote: '<p><b>Abstand</b> ist die Luftlinie zwischen Rot und Blau – nicht nur im Bild, sondern im Raum aller drei Zahlen x, y und z des Modells: die Wurzel aus (Unterschied in x)² + (Unterschied in y)² + (Unterschied in z)². Gemessen wird in Einheiten des Modells; der ganze Attraktor ist etwa 50 Einheiten groß.</p>' +
      '<p>Ist die <b>Wolke</b> eingeschaltet, steht hier die <b>Streuung</b>: wie weit die 300 Punkte im Mittel von ihrer gemeinsamen Mitte entfernt sind (genau: die Wurzel aus dem mittleren Abstandsquadrat). Am Start ist sie winzig, über beide Flügel verteilt etwa 15 bis 20.</p>',
    time: s => s
  },
  primary: {
    startAria: 'Start',
    pauseAria: 'Pause',
    resumeAria: 'Weiter',
    resetAria: 'Zurück zum Startpunkt',
    ensembleAria: 'Wolke aus vielen Starts an oder aus'
  },
  controls: {
    note: '<p>Rot und Blau starten fast am selben Punkt – nur um den eingestellten <b>Unterschied</b> verschoben. Die graue Spur im Hintergrund ist der Attraktor: die Form, auf der sich das Modellwetter für immer bewegt. <b>Zeit</b> zählt in Einheiten des Modells, <b>Abstand</b> ist die Entfernung zwischen Rot und Blau.</p>' +
      '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg></span> startet, dann <b>Pause</b> und <b>Weiter</b>. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg></span> springt zurück zum Startpunkt.</p>' +
      '<p><span class="ico"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="2.2"/><circle cx="6" cy="9" r="1.6"/><circle cx="17.5" cy="7.5" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="16" r="1.6"/></svg></span> schickt statt zwei Punkten eine <b>Wolke</b> aus 300 fast gleichen Starts los – so wie Wetterdienste viele Vorhersagen auf einmal rechnen. <b>Streuung</b> sagt, wie weit die Wolke auseinandergezogen ist.</p>' +
      '<p>Im Bild: <b>ziehen</b> dreht den Attraktor, <b>tippen</b> setzt dort einen neuen Startpunkt – gern auch weit weg vom Schmetterling.</p>' +
      '<p>Die <b>Lupe</b> unten links vergrößert rund um Rot so stark, dass man Blau daneben sieht – am Anfang oft hunderttausendfach. Während die Lücke wächst, zoomt sie heraus und verschwindet, sobald man den Unterschied auch so sieht – bis zum nächsten Start.</p>'
  },
  delta: {
    label: 'Unterschied am Start',
    big: '0,01',
    small: '0,000 01 (1000-mal kleiner)',
    tiny: '0,000 000 01 (noch 1000-mal kleiner)',
    infoAria: 'Unterschied am Start erklären',
    note: '<p>So weit liegt Blau beim Start neben Rot. Zum Vergleich: Der ganze Attraktor ist etwa 50 Einheiten groß. Jede Stufe ist 1000-mal genauer – als hätte man das Wetter 1000-mal genauer gemessen.</p>'
  },
  tasks: {
    wings: 'Starte und warte, bis Rot und Blau auf verschiedenen Flügeln kreisen.',
    doneWings: 'Getrennt! Aus einem winzigen Unterschied wurde ein ganz anderes „Wetter“.',
    attractor: 'Tipp in eine Ecke des Bildes, weit weg vom Schmetterling, und starte. Wo landet der Punkt?',
    doneAttractor: 'Auf dem Schmetterling! Egal wo das Modellwetter startet – es landet auf derselben Form. Darum heißt sie Attraktor: Sie zieht alles an. Wo genau der Punkt ist, bleibt chaotisch (Wetter); die Form selbst ist berechenbar (Klima).',
    precise: 'Wähle einen 1000-mal kleineren Unterschied am Start und lass beide laufen, bis sie sich trennen. Bleiben sie jetzt 1000-mal länger zusammen?',
    times: list => 'Getrennt nach: ' + list,
    timeItem: (delta, time) => time + ' (bei ' + delta + ')',
    donePrecise: (a, b) => 'Nein! ' + a + ' statt ' + b + ' Zeiteinheiten – 1000-mal genauer bringt nur ein paar Einheiten mehr. Deshalb kann auch die beste Messung das Wetter nicht wochenlang vorhersagen.',
    catch: '<b>Für Profis:</b> Warte, bis sich Rot und Blau getrennt haben. Drück dann auf Pause, wenn sie sich zufällig wieder ganz nahe kommen – <b>Abstand unter 2</b>. Das passiert nur selten und dauert kaum einen Augenblick!',
    catchBest: d => 'Dein knappster Versuch: ' + d,
    doneCatch: 'Erwischt! Rot und Blau kommen sich immer wieder nahe – aber nur kurz, und wann, weiß man vorher nicht. Darum sagen Wetterdienste für die fernere Zukunft keine genauen Tageswerte voraus, sondern Wahrscheinlichkeiten und Trends: Wird es eher wärmer oder kälter, eher nasser oder trockener als üblich?',
    ensemble: 'Schalte die Wolke ein, starte und warte, bis sie sich über beide Flügel verteilt hat.',
    doneEnsemble: 'So arbeiten Wetterdienste: Sie rechnen viele leicht verschiedene Starts – ein Ensemble. Je weiter die Wolke streut, desto unsicherer ist die Vorhersage.'
  },
  topics: {
    what: {
      title: 'Was ist der Lorenz-Attraktor?',
      body: '<p>1963 suchte der Meteorologe <b>Edward N. Lorenz</b> am Massachusetts Institute of Technology nach dem einfachsten Wettermodell, das noch „wie Wetter“ aussieht. Er nahm eine Luftschicht, die unten erwärmt wird – warme Luft steigt auf, kühle sinkt ab – und kürzte die Strömung auf drei Zahlen zusammen: wie stark die Luft umwälzt und wie sich die Temperatur verteilt. Übrig blieben drei kurze Gleichungen:</p>' +
        '<p class="formula">dx/dt = 10 · (y − x)<br>dy/dt = x · (28 − z) − y<br>dz/dt = x · y − 8/3 · z</p>' +
        '<p>Der Punkt (x, y, z) zeichnet im Bild seine Bahn. Er kreist um zwei Zentren – die beiden „Flügel“ – und springt unregelmäßig zwischen ihnen hin und her. Er wiederholt sich nie genau und verlässt doch nie diese Form. So eine Form heißt <b>seltsamer Attraktor</b>.</p>'
    },
    shape: {
      title: 'Was zeigt der Schmetterling?',
      body: '<p>Der Schmetterling ist zunächst eine geometrische Darstellung des Systems. Er zeigt, dass sich die Entwicklung des Systems bevorzugt in zwei Bereichen abspielt, zwischen denen es immer wieder wechselt. Seine Bahn ist weder eine geschlossene Schleife noch eine völlig ungeordnete Bewegung: Sie ist <b>strukturiert, aber nicht periodisch</b>.</p>' +
        '<p>Daraus ergibt sich eine wichtige Erkenntnis. Ein System kann gleichzeitig drei Eigenschaften besitzen:</p>' +
        '<ul><li>Es folgt festen Regeln.</li><li>Es erzeugt komplizierte, nicht periodische Bewegungen.</li><li>Seine langfristige Entwicklung ist empfindlich gegenüber kleinen Anfangsunterschieden.</li></ul>' +
        '<p>Man kann die gesamte Idee auf einen einzigen Gedanken reduzieren:</p>' +
        '<p class="formula"><b>Vorhersagbarkeit und Gesetzmäßigkeit sind nicht dasselbe.</b></p>' +
        '<p>Ein System kann vollständig durch mathematische Regeln beschrieben sein und trotzdem langfristig schwer vorherzusagen bleiben. Das Lorenz-Modell ist dafür ein besonders anschauliches Beispiel: Die drei Variablen x, y und z entwickeln sich nach festen Gleichungen. Dennoch entsteht eine Bewegung, deren konkreter Verlauf empfindlich von den Anfangsbedingungen abhängt.</p>' +
        '<p>Das System ist also nicht regellos. Es ist vielmehr ein Beispiel dafür, wie aus einfachen Regeln komplexes Verhalten entstehen kann.</p>'
    },
    variables: {
      title: 'Was bedeuten x, y und z – ist das die Temperatur?',
      body: '<ul><li><b>x</b> beschreibt die idealisierte Luftzirkulation.</li><li><b>y</b> beschreibt einen Anteil der Temperaturverteilung, der mit der Zirkulation gekoppelt ist.</li><li><b>z</b> beschreibt einen weiteren Anteil der Temperaturstruktur.</li></ul>' +
        '<p>Keine der drei Variablen ist für sich genommen einfach die Temperatur der Luft. Erst ihr Zusammenspiel bildet die Dynamik des Modells ab.</p>' +
        '<p>Das ist auch der Grund, weshalb der Lorenz-Attraktor nicht einfach eine Grafik der Temperaturentwicklung ist. Er zeigt die gesamte Entwicklung des modellierten Systems in einem dreidimensionalen <b>Zustandsraum</b>: Jeder Punkt im Bild ist ein vollständiger Zustand des Modellwetters.</p>'
    },
    butterfly: {
      title: 'Woher kommt der Name Schmetterlingseffekt?',
      body: '<p>Lorenz wollte eine Rechnung wiederholen und tippte die Zwischenwerte vom Ausdruck ab – gerundet auf drei statt sechs Stellen, etwa 0,506 statt 0,506127. Die neue Rechnung lief erst gleich, dann immer weiter auseinander, bis sie ein völlig anderes Wetter zeigte. Der winzige Rundungsfehler war gewachsen, genau wie bei Rot und Blau.</p>' +
        '<p>1972 gab Lorenz einem Vortrag den Titel: „Kann der Flügelschlag eines Schmetterlings in Brasilien einen Tornado in Texas auslösen?“ Seitdem heißt die empfindliche Abhängigkeit von den Anfangsbedingungen <b>Schmetterlingseffekt</b>. Dass der Attraktor selbst wie ein Schmetterling aussieht, ist ein schöner Zufall.</p>'
    },
    ensemble: {
      title: 'Wie gehen Wetterdienste damit um?',
      body: '<p>Weil jede Messung ein wenig ungenau ist, rechnen Wetterdienste nicht nur eine Vorhersage, sondern Dutzende – jede mit einem leicht veränderten Start. Dieses <b>Ensemble</b> ist die Wolke im Bild.</p>' +
        '<p>Bleiben die Vorhersagen nah beieinander, ist das Wetter gut vorhersagbar. Laufen sie auseinander, wird die Vorhersage unsicher – daraus entstehen Angaben wie „70 Prozent Regenwahrscheinlichkeit“. Nach etwa zwei Wochen ist die Wolke so weit gestreut, dass sich das Wetter eines einzelnen Tages nicht mehr vorhersagen lässt.</p>' +
        '<p>Das Klima dagegen – die Form des Attraktors – bleibt berechenbar: Wo sich der Punkt aufhalten kann, weiß man genau. Nur nicht, wann er wo ist.</p>'
    }
  }
};
