// Texts of chapter 4 (karte.html), loaded after content/texts.de.js.
window.TEXTS.pageTitle = 'Zwei Wetterkarten – Chaos-Pendel';
window.TEXTS.description = 'Ein vereinfachtes Wettermodell im Browser: zwei Wetterkarten, die sich am Anfang nur durch einen winzigen warmen Fleck unterscheiden – und wie daraus zwei verschiedene Wetterlagen werden.';

window.TEXTS.karte = {
  poster: {
    headline: 'Zwei Wetter­karten',
    lead: 'Fast dieselbe Wetterlage. Dieselben Naturgesetze. Zwei verschiedene Entwicklungen.'
  },
  stageAria: 'Schematische Wetterkarte: Farben zeigen die Temperatur, Linien die Strömung. Tippen setzt den warmen Fleck für Karte B.',
  viewAria: 'Ansicht',
  viewA: 'A',
  viewB: 'B',
  viewBoth: 'A + B',
  viewDiff: 'Unterschied',
  stageNote: 'Tippen setzt den warmen Fleck in Karte B',
  mapA: 'Karte A',
  mapB: 'Karte B',
  mapDiff: 'Unterschied A – B',
  north: 'Norden · kalt',
  south: 'Süden · warm',
  km: '1000 km',
  bubble: d => '+' + d + ' °C',
  legendTemp: 'Temperatur',
  legendTempEnds: ['−20 °C', '+20 °C'],
  legendDiff: 'Unterschied',
  legendDiffEnds: ['0,001 °C', '10 °C'],

  delta: {
    label: 'Warmer Fleck in B',
    big: '+0,5 °C',
    small: '+0,005 °C (100× kleiner)',
    tiny: '+0,000 05 °C (100× kleiner)',
    none: 'kein Fleck (Kontrolle)',
    values: { '0.5': '0,5', '0.005': '0,005', '0.00005': '0,000 05' }
  },

  diffNote: '<p><b>Unterschied</b> vergleicht die Temperatur der beiden Karten an allen Orten: die mittlere Abweichung, geteilt durch die Abweichung zwischen zwei Karten von völlig zufälligen Tagen. <b>100 %</b> heißt: Die Wetterlagen haben nichts mehr miteinander zu tun.</p>' +
    '<p>Die Grafik zeigt den Unterschied <b>logarithmisch</b> – jede Linie 100-mal größer als die darunter. Steigt die Kurve gerade an, verdoppelt sich der Unterschied in festen Abständen; die gestrichelte orange Linie schätzt diese Verdopplungszeit. Grau: der Lauf davor.</p>',

  controlsNote: '<p>Zwei Karten, <b>A</b> und <b>B</b>, starten mit genau derselben Wetterlage. Nur in B ist an einer Stelle ein <b>warmer Fleck</b> so groß wie Deutschland, ein winziges bisschen wärmer – tipp in die Karte, um ihn zu verschieben. Beide werden mit denselben Gleichungen und demselben Verfahren gerechnet.</p>' +
    '<p><b>Farben</b>: Temperatur in etwa 5 km Höhe, warm im Süden, kalt im Norden. <b>Linien</b>: die Strömung in dieser Höhe – der Wind weht an den Linien entlang, umso stärker, je dichter sie liegen, wie bei Isobaren auf der Wetterkarte.</p>' +
    '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg></span> startet, dann Pause und Weiter. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg></span> startet beide noch einmal vom <b>selben</b> Anfang. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg></span> nimmt eine andere Wetterlage. Oben links wählst du, was du siehst: eine Karte, beide oder den <b>Unterschied</b>.</p>',

  tasks: {
    where: 'Schalte während des Laufs auf „Unterschied“. Wo werden die beiden Karten zuerst verschieden?',
    doneWhere: 'Der Unterschied bleibt nicht, wo er war: Die Strömung trägt ihn mit, und er wächst vor allem dort, wo warme und kalte Luft aufeinandertreffen und sich Wirbel bilden – an den Fronten.',
    apart: 'Wie viele Tage dauert es, bis die Karten so verschieden sind wie zwei zufällige Tage (Unterschied über 50 %)?',
    doneApart: d => 'Etwa ' + d + ' Tage. Dieses Modell ist viel einfacher als die Atmosphäre: Es kennt keine Gewitter, keine Wolken, keine Berge. In echten Wettermodellen wachsen Fehler auch durch solche kleinen, schnellen Vorgänge – deshalb liegt die Grenze der Vorhersage dort bei etwa zwei Wochen.',
    smaller: 'Mach den warmen Fleck 100-mal schwächer und starte noch einmal. Bleiben die Karten jetzt 100-mal länger gleich?',
    times: list => 'Über 50 % nach: ' + list,
    timeItem: (delta, days) => days + ' Tagen (bei +' + delta + ' °C)',
    doneSmaller: (a, b) => 'Nein – nur etwa ' + a + ' statt ' + b + ' Tage. 100-mal genauer messen bringt nur einige Tage mehr. Darum verbessern Wetterdienste nicht nur die Messungen, sondern rechnen viele leicht verschiedene Läufe und geben Wahrscheinlichkeiten an.'
  },

  topics: {
    what: {
      title: 'Was wird hier simuliert?',
      body: '<p>Ein stark vereinfachtes Modell der Atmosphäre in mittleren Breiten, wie über Europa: zwei übereinanderliegende Luftschichten auf einer rotierenden Erde (das „Zweischichtenmodell“ von Norman Phillips, 1956 – das erste Modell, mit dem ein Computer Wetter von selbst entstehen ließ).</p>' +
        '<p>Im Süden ist es warm, im Norden kalt. Dieser Temperaturunterschied treibt in der Höhe einen Westwind an – und er ist <b>instabil</b>: Von selbst bilden sich Wellen und Wirbel, die warme Luft nach Norden und kalte nach Süden tragen. Das sind die Hoch- und Tiefdruckgebiete unserer Breiten in ihrer einfachsten Form.</p>' +
        '<p>Gerechnet wird auf einem Gitter von 32 × 32 Punkten über ein Gebiet von 8000 × 8000 km, alle 15 Minuten Modellzeit ein Schritt – alles im Browser, auf jedem Gerät exakt gleich.</p>'
    },
    shows: {
      title: 'Was zeigt das Experiment – und was nicht?',
      body: '<p><b>Es zeigt:</b> Selbst wenn man die Naturgesetze genau kennt und exakt rechnet, wächst ein winziger Unterschied in den <b>Anfangsbedingungen</b> immer weiter – bis zwei Wetterlagen entstehen, die nichts mehr miteinander zu tun haben. Das Modell ist <b>deterministisch</b> (gleicher Anfang, gleiches Ergebnis – probier den Neustart) und trotzdem nur begrenzt vorhersagbar. Das ist <b>Chaos</b>.</p>' +
        '<p><b>Es zeigt nicht:</b> eine echte Wettervorhersage. Die Karte ist eine schematische Region ohne Länder, Meere und Berge; links und rechts schließt sie aneinander an wie ein Band um die Erde. Es gibt keine Feuchtigkeit, keine Wolken, keinen Regen. Die Temperaturen sind Abweichungen vom Mittel in etwa 5 km Höhe, aus dem Modell umgerechnet – grobe Werte, keine Messungen.</p>'
    },
    weather: {
      title: 'Was heißt das für die Wettervorhersage?',
      body: '<p>Jede <b>Wettervorhersage</b> beginnt mit einer Messung des heutigen Zustands der Atmosphäre – und keine Messung ist perfekt. Das <b>Modell</b> rechnet diesen kleinen Fehler mit in die Zukunft, wo er wächst, wie du es hier siehst.</p>' +
        '<p>Darum rechnen Wetterdienste dieselbe Vorhersage viele Male mit leicht veränderten Anfangszuständen (ein <b>Ensemble</b>). Liegen die Ergebnisse nah beieinander, ist die Vorhersage sicher; laufen sie auseinander, gibt man Wahrscheinlichkeiten an. Nach etwa zwei Wochen sind alle Läufe so verschieden, dass sich das Wetter eines bestimmten Tages nicht mehr vorhersagen lässt.</p>'
    },
    measure: {
      title: 'Ist das wirklich Chaos – oder nur ein Rechenfehler?',
      body: '<p>Beide Karten werden exakt gleich gerechnet: Startet man B ohne warmen Fleck, bleiben A und B auf jeder Stelle hinter dem Komma gleich. Der Unterschied kommt also nur von der Störung.</p>' +
        '<p>In Testrechnungen wächst der Unterschied immer mit derselben Verdopplungszeit von etwa 3,5 Tagen – egal wie klein er anfangs ist, egal wo er sitzt, und auch mit halbem Zeitschritt. Mit schwächerem Temperaturgefälle entstehen dagegen keine Wirbel, und der Unterschied wächst nicht. Die Einzelheiten stehen in der Dokumentation im Ordner <i>docs</i>.</p>'
    }
  }
};
