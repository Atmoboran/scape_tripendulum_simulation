// Texts of chapter 3 (karte.html), loaded after content/texts.de.js.
window.TEXTS.pageTitle = 'Zwei Wetterkarten – Chaos-Pendel';
window.TEXTS.description = 'Ein vereinfachtes Wettermodell im Browser: zwei Wetterkarten, die sich am Anfang nur durch einen winzigen warmen Fleck unterscheiden – und wie daraus zwei verschiedene Wetterlagen werden.';

window.TEXTS.karte = {
  poster: {
    headline: 'Zwei Wetter­karten',
    lead: 'Fast dieselbe Wetterlage. Dieselben Naturgesetze. Zwei verschiedene Entwicklungen.'
  },
  stageAria: 'Schematische Wetterkarten A und B und ihr Unterschied: Farben zeigen die Temperatur, Linien die Strömung. Ein Thermometer zeigt die Wetterstation; Tippen versetzt sie, den Messfehler in B verschiebt man durch Ziehen.',
  mapA: 'Karte A',
  mapB: 'Karte B',
  mapDiff: 'Unterschied B − A',
  km: '1000 km',
  legendTemp: 'Temperatur',
  legendTempEnds: ['−35 °C', '0', '+35 °C'],
  legendDiff: 'Unterschied B − A',
  legendDiffEnds: ['−4 °C', '0', '+4 °C'],
  station: {
    title: 'Wetterstation',
    aria: 'Temperatur an der Wetterstation in Karte A und Karte B über die Zeit'
  },

  delta: {
    label: 'Messfehler in Karte B',
    none: 'kein Messfehler (Kontrolle)',
    scaleLow: '−1 °C kälter',
    scaleMid: '0',
    scaleHigh: 'wärmer +1 °C'
  },

  diffNote: '<p><b>Unterschied</b> vergleicht die Temperatur der beiden Karten an allen Orten: die mittlere Abweichung, geteilt durch die Abweichung zwischen zwei Karten von völlig zufälligen Tagen. <b>0 %</b>: beide Karten gleich. <b>100 %</b>: Die Wetterlagen haben nichts mehr miteinander zu tun.</p>' +
    '<p>Wo genau sie sich unterscheiden, zeigt die Karte <b>Unterschied B − A</b>: weiß, wo beide gleich sind, gelb, wo B wärmer ist, violett, wo B kälter ist.</p>',
  controlsNote: '<p>Zwei Karten, <b>A</b> und <b>B</b>, starten mit genau derselben Wetterlage. In B gibt es nur einen kleinen <b>Messfehler</b>: einen Fleck so groß wie Deutschland, ein paar Zehntel Grad wärmer oder kälter. Den Regler darunter stellst du von −1 bis +1 °C, in der Mitte ist gar kein Fehler (Kontrolle: dann bleiben A und B genau gleich). Den gestrichelten Kreis kannst du in der Karte verschieben.</p>' +
    '<p><b>Farben</b>: Temperatur in etwa 5 km Höhe, warm im Süden, kalt im Norden. <b>Linien</b>: die Strömung in dieser Höhe – der Wind weht an den Linien entlang, umso stärker, je dichter sie liegen, wie bei Isobaren auf der Wetterkarte. Die dritte Karte zeigt, <b>wo</b> sich A und B unterscheiden.</p>' +
    '<p>Das <b>Thermometer</b> ist eine Wetterstation: Es misst in beiden Karten die Temperatur an diesem Ort und zeichnet sie auf – schwarz in A, orange in B. Tipp in eine Karte, um die Station zu versetzen.</p>' +
    '<p><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg></span> startet, daneben das <b>Tempo</b>. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg></span> startet beide noch einmal vom <b>selben</b> Anfang. <span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg></span> nimmt eine andere Wetterlage.</p>',

  tasks: {
    where: 'Schau auf die Karte „Unterschied B − A“, während die Zeit läuft. Wo werden die Karten zuerst verschieden?',
    doneWhere: 'Der Unterschied bleibt nicht, wo er war: Die Strömung trägt ihn mit, und er wächst vor allem dort, wo warme und kalte Luft aufeinandertreffen und sich Wirbel bilden – an den Fronten.',
    station: 'Nach wie vielen Tagen zeigen A und B an der Wetterstation mehr als 2 °C Unterschied?',
    doneStation: d => 'Nach ' + d + ' Tagen. Am Anfang zeigen beide Stationen fast dasselbe Wetter – dann geht es auseinander. Für einen einzelnen Ort geht eine Vorhersage oft schon daneben, wenn die große Wetterlage noch ähnlich aussieht.',
    apart: 'Wie viele Tage dauert es, bis die Karten so verschieden sind wie zwei zufällige Tage (Unterschied über 50 %)?',
    doneApart: d => 'Etwa ' + d + ' Tage. In echten Wettermodellen liegt diese Grenze bei rund zwei Wochen. Dieses Modell ist viel einfacher als die Atmosphäre: Es kennt keine Gewitter, keine Wolken, keine Berge.',
    smaller: 'Lass die Karten einmal mit einem Messfehler von 1,0 °C laufen und dann noch einmal mit 0,1 °C – 10-mal kleiner. Bleiben sie dann 10-mal länger gleich?',
    times: list => 'Über 50 % nach: ' + list,
    timeItem: (delta, days) => days + ' Tagen (bei ' + delta + ')',
    doneSmaller: (a, b, f) => 'Nein – nur etwa ' + a + ' statt ' + b + ' Tage. ' + f + '-mal genauer messen bringt nur einige Tage mehr. Darum verbessern Wetterdienste nicht nur die Messungen, sondern rechnen viele leicht verschiedene Läufe und geben Wahrscheinlichkeiten an.'
  },

  topics: {
    what: {
      title: 'Was wird hier simuliert?',
      body: '<p>Ein stark vereinfachtes Modell der Atmosphäre in mittleren Breiten, wie über Europa: zwei übereinanderliegende Luftschichten auf einer rotierenden Erde (das „Zweischichtenmodell“ von Norman Phillips, 1956 – das erste Modell, mit dem ein Computer Wetter von selbst entstehen ließ).</p>' +
        '<p>Im Süden ist es warm, im Norden kalt. Dieser Temperaturunterschied treibt in der Höhe einen Westwind an – und er ist <b>instabil</b>: Von selbst bilden sich Wellen und Wirbel, die warme Luft nach Norden und kalte nach Süden tragen. Das sind die Hoch- und Tiefdruckgebiete unserer Breiten in ihrer einfachsten Form.</p>' +
        '<p>Gerechnet wird auf einem Gitter von 64 × 32 Punkten über ein Gebiet von 16 000 × 8000 km, alle 7,5 Minuten Modellzeit ein Schritt – alles im Browser, auf jedem Gerät exakt gleich.</p>'
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
        '<p>In Testrechnungen wächst der Unterschied immer mit derselben Verdopplungszeit von etwa anderthalb Tagen – so, wie man es auch für echte Wettermodelle schätzt – egal wie klein er anfangs ist, egal wo er sitzt, und auch mit halbem Zeitschritt. Mit schwächerem Temperaturgefälle entstehen dagegen keine Wirbel, und der Unterschied wächst nicht. Die Einzelheiten stehen in der Dokumentation im Ordner <i>docs</i>.</p>'
    }
  }
};
