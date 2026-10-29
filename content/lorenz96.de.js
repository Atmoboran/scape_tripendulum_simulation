// Texts of chapter 3 (lorenz96.html), loaded after content/texts.de.js.
window.TEXTS.pageTitle = 'Chaos im Ring – Chaos-Pendel';
window.TEXTS.description = 'Das Lorenz-96-Modell im Browser: 40 Werte auf einem Ring, zwei fast gleiche Anfangszustände, dieselben Regeln – und wie schnell sich ihre Entwicklungen trennen.';

window.TEXTS.l96 = {
  poster: {
    headline: 'Chaos im Ring',
    lead: 'Zwei fast gleiche Anfänge. Dieselben Regeln. Wie lange bleiben sie gleich?'
  },
  stageAria: '40 Modellwerte auf einem Ring, Lauf A rot, Lauf B blau. Tippen wählt den Ort der Störung.',
  viewAria: 'Ansicht',
  viewRing: 'Ring',
  viewTime: 'Verlauf',
  stageNote: 'Tippen wählt, wo B anders startet',
  legendA: 'A',
  legendB: 'B',
  ringZero: 'null',
  perturbHere: 'hier anders',
  colA: 'Lauf A',
  colB: 'Lauf B',
  colDiff: 'Unterschied',
  timeAxis: d => 'oben jetzt · unten vor ' + d + ' Tagen',
  low: 'niedrig',
  high: 'hoch',

  delta: {
    label: 'Unterschied am Start',
    big: '0,1',
    small: '0,001 (100× kleiner)',
    tiny: '0,000 01 (100× kleiner)',
    none: '0 (Kontrolle: genau gleich)'
  },

  diffNote: '<p><b>Unterschied</b> vergleicht alle 40 Werte von A und B: die mittlere Abweichung (quadratisches Mittel), geteilt durch den Unterschied zwischen zwei völlig zufällig gewählten Zuständen des Modells. <b>100 %</b> heißt also: A und B haben nichts mehr miteinander zu tun.</p>' +
    '<p><b>Zeit</b> in Modelltagen: Edward Lorenz hat eine Zeiteinheit seines Modells mit etwa <b>5 Tagen</b> echter Atmosphäre gleichgesetzt, weil Fehler darin ähnlich schnell wachsen. Das ist eine Analogie, kein Kalender.</p>' +
    '<p>Die Grafik zeigt den Unterschied <b>logarithmisch</b>: Jede Linie ist 100-mal größer als die darunter. Eine gerade, ansteigende Kurve heißt: Der Unterschied verdoppelt sich immer in derselben Zeit. Die gestrichelte orange Linie ist diese Verdopplung, aus der Kurve geschätzt; der graue Verlauf ist der Lauf davor.</p>',

  controlsNote: '<p>Beide Läufe, <b>A</b> (rot) und <b>B</b> (blau), rechnen mit denselben Gleichungen und demselben Rechenverfahren. Nur an <b>einer</b> Stelle des Rings startet B um den eingestellten <b>Unterschied</b> anders – tipp auf den Ring, um die Stelle zu wählen.</p>' +
    '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg></span> startet, dann Pause und Weiter. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg></span> startet beide noch einmal vom <b>selben</b> Anfang – die Rechnung ist jedes Mal genau gleich. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg></span> würfelt einen neuen Anfangszustand.</p>' +
    '<p><b>Ring</b> zeigt die 40 Werte rund um den Kreis: nach außen hoch, nach innen niedrig. <b>Verlauf</b> zeigt sie über die Zeit, die neueste Zeile oben – links A, in der Mitte B, rechts, wo sie sich unterscheiden.</p>',

  tasks: {
    apart: 'Starte und beobachte den Ring. Nach wie vielen Tagen haben A und B nichts mehr miteinander zu tun (Unterschied über 50 %)?',
    doneApart: d => 'Nach etwa ' + d + ' Tagen. Am Anfang lagen Rot und Blau genau übereinander – nur ein einziger Wert war ein klein wenig anders.',
    smaller: 'Stell einen 100-mal kleineren Unterschied am Start ein und lass beide noch einmal laufen. Bleiben sie jetzt 100-mal länger gleich?',
    times: list => 'Über 50 % nach: ' + list,
    timeItem: (delta, days) => days + ' Tagen (bei ' + delta + ')',
    doneSmaller: (a, b) => 'Nein – nur etwa ' + a + ' statt ' + b + ' Tage. 100-mal genauer messen bringt nur ein paar Tage mehr, weil sich der Unterschied in festen Abständen verdoppelt.',
    doubling: 'Schau auf die Grafik unter den Messwerten: Wie lange braucht der Unterschied, um sich zu verdoppeln?',
    doneDoubling: d => 'Etwa ' + d + ' Tage – egal, wie klein der Unterschied am Anfang war. Für echte Wettermodelle schätzt man ähnliche Zeiten von wenigen Tagen. Diese feste Verdopplungszeit ist das Kennzeichen von Chaos, nicht bloß das Auseinanderlaufen.'
  },

  topics: {
    what: {
      title: 'Was wird hier simuliert?',
      body: '<p>Edward Lorenz hat 1996 – über 30 Jahre nach seinem Schmetterlings-Modell – ein zweites, berühmtes Testmodell vorgestellt: <b>40 Zahlen auf einem Ring</b>, die sich gegenseitig beeinflussen. Man kann sie sich als eine Wettergröße an 40 Orten rund um einen Breitenkreis vorstellen. Jede Zahl ändert sich nach derselben kurzen Regel:</p>' +
        '<p class="formula">dX<sub>i</sub>/dt = (X<sub>i+1</sub> − X<sub>i−2</sub>) · X<sub>i−1</sub> − X<sub>i</sub> + F</p>' +
        '<p>Der erste Teil verschiebt Muster um den Ring – wie Wind, der Wetter weiterträgt. −X<sub>i</sub> bremst wie Reibung, <b>F = 8</b> treibt an wie die Sonnenwärme. Weil der Ring geschlossen ist, ist der Nachbar von Ort 40 wieder Ort 1.</p>' +
        '<p>Gerechnet wird mit einem festen Zeitschritt (Runge-Kutta-Verfahren) – auf jedem Gerät exakt gleich, egal wie schnell es Bilder zeichnet.</p>'
    },
    shows: {
      title: 'Was zeigt das Experiment – und was nicht?',
      body: '<p><b>Es zeigt:</b> Ein Modell kann vollständig festen Regeln folgen – also <b>deterministisch</b> sein – und trotzdem nur begrenzt vorhersagbar. Ein winziger Unterschied in den <b>Anfangsbedingungen</b> wächst immer weiter, bis die beiden Läufe nichts mehr gemeinsam haben. Das nennt man <b>Chaos</b>.</p>' +
        '<p><b>Es zeigt nicht:</b> echtes Wetter. Die 40 Zahlen sind keine Temperaturen in Grad, es gibt keine Hoch- und Tiefdruckgebiete und keine Landkarte. Das Modell ist ein Werkzeug der Forschung: Wetterdienste testen damit neue Verfahren für die <b>Wettervorhersage</b>, bevor sie sie in große Modelle einbauen.</p>' +
        '<p>Und: Mit kleinerem Antrieb, etwa F = 4, ist das Modell gar nicht chaotisch – dann bleiben A und B zusammen. Chaos braucht genug Antrieb.</p>'
    },
    measure: {
      title: 'Woran erkennt man Chaos wirklich?',
      body: '<p>Dass zwei Kurven auseinanderlaufen, reicht als Beweis nicht – das tun auch zwei Bälle, die man verschieden stark wirft. Kennzeichen von Chaos ist, <b>wie</b> der Unterschied wächst: Er verdoppelt sich immer wieder in derselben Zeit, egal wie klein er war. In der logarithmischen Grafik ist das eine gerade, ansteigende Linie.</p>' +
        '<p>Man sieht drei Abschnitte: Zuerst muss sich die Störung „einsortieren“ (die Kurve ist flach oder schwankt), dann wächst sie gleichmäßig (gerade Linie), und am Ende hört das Wachstum auf, weil A und B schon so verschieden sind wie zwei zufällige Zustände (Sättigung bei 100 %).</p>' +
        '<p>Aus der geraden Strecke schätzt die App die <b>Verdopplungszeit</b>. In einer genauen Rechnung über tausend Zeiteinheiten ergibt sich für dieses Modell ein Wachstum um den Faktor e etwa alle 0,59 Zeiteinheiten (größter Lyapunov-Exponent 1,7) – eine Verdopplung in etwa 2 Modelltagen.</p>'
    }
  }
};
