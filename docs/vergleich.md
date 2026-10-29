# Vergleich und Empfehlung

Kandidat A: **Lorenz-96** (Kapitel 3, `lorenz96.html`).
Kandidat B: **Zweischichten-Strömungsmodell** (Kapitel 4, `karte.html`).
Beide sind vollständig implementiert, getestet und laufen offline im Browser.

Legende: **[M]** gemessen · **[W]** wissenschaftliche Prüfung/Literatur · **[E]** Einschätzung

| Kriterium | Lorenz-96 | Zweischichtenmodell |
|---|---|---|
| **Wissenschaftliche Fundierung** | Sehr hoch [W]. Etabliertes Testmodell der Datenassimilations- und Vorhersagbarkeitsforschung, Parameter und λ₁ ≈ 1,7 decken sich mit der Literatur. | Hoch [W]. Phillips-Modell, Grundlage der Theorie mittlerer Breiten; Formulierung wie pyqg. Parameter selbst auf atmosphärische Skalen gesetzt und begründet (keine Literaturkonfiguration 1:1). |
| **Nachweis chaotischer Dynamik** | Eindeutig [M]: λ₁ = 1,70 ± 0,02, unabhängig von dt; Wachstum unabhängig von der Störungsgröße; F ≤ 4 nicht chaotisch. | Klar [M]: λ₁ = 0,19–0,20 pro Tag über drei Starts, unverändert bei halbem dt; Kontrolle ohne Instabilität wächst nicht. Einschränkung: Zahl hängt von der Auflösung ab (64²: 0,33 pro Tag). |
| **Meteorologische Anschaulichkeit** | Gering [E]. 40 abstrakte Werte auf einem Ring; ehrlicherweise darf man sie nicht als Temperaturen ausgeben. Die Verlaufsansicht zeigt wandernde Muster, aber kein „Wetter“. | Hoch [E]. Sieht aus wie eine Wetterkarte: warm/kalt, Warm- und Kaltluftzungen, Wirbel, Strömungslinien wie Isobaren. Temperatur ist eine echte Zustandsgröße mit groben, aber plausiblen Grad-Werten. |
| **Verständlichkeit für Laien** | Mittel [E]. Das Experiment selbst (rot/blau liegen erst übereinander, dann nicht mehr) ist sofort verständlich; *was* die Werte sind, bleibt abstrakt. | Gut [E]. „Ein winziger warmer Fleck so groß wie Deutschland verändert nach Wochen die ganze Wetterlage“ ist ohne Vorwissen greifbar. Die Differenzkarte zeigt, *wo* die Wetterlagen auseinanderlaufen (an Fronten). |
| **Mobile Performance** | Sehr gut [M]: volle Modellgeschwindigkeit auch bei 8-fach gedrosselter CPU, ~10 MB Speicher. | Gut bis eingeschränkt [M]: ungedrosselt 60 fps; bei 4× ~40 % der Sollgeschwindigkeit, bei 8× zu langsam. Echte Geräte nicht getestet. |
| **Entwicklungsaufwand** | Gering [E]: Modell ~100 Zeilen, Darstellung ~250 Zeilen; ~1–2 Tage bis zur Ausstellungsreife. | Hoch [E]: spektrales Modell, FFT, Spin-up, drei Stabilitätsprobleme gefunden und gelöst, Darstellung mit Interpolation und Isolinien; weitere 3–5 Tage für Worker, echte Gerätetests und Feinschliff. |
| **Offline-Fähigkeit** | Ja [M] (Service Worker, getestet). | Ja [M] (Service Worker, getestet; Startzustände als JS-Datei, 32 kB). |
| **Erweiterbarkeit** | Begrenzt [E]: Zwei-Skalen-Version (Lorenz 2005), Ensemble, Datenassimilation – fachlich interessant, aber noch abstrakter. | Gut [E]: Ensemble-Wolke auf der Karte, „Messfehler“ statt Blase, Feuchte/Niederschlag als Erweiterung, Vorhersage-Spiel („Wo ist das Tief in 5 Tagen?“). |
| **Eignung für eine Museumsausstellung** | Als zweite Stufe gut [E]: zeigt sauber und schnell die Kernbotschaft (feste Verdopplungszeit, 100-mal genauer = nur ein paar Tage mehr). Allein zu abstrakt für „Wetter“. | Als Hauptstation sehr gut [E]: verbindet Chaos direkt mit Wetterkarten und Wettervorhersage. Voraussetzung: Performance auf den tatsächlich genutzten Geräten prüfen. |

## Empfehlung

**Beide einsetzen – als aufeinander aufbauende Stationen, mit dem
Zweischichtenmodell als Ziel.** Die vorhandene Kapitelstruktur ist diese
Reihenfolge bereits:

1. **Pendel** (Kapitel 1) – Chaos zum Anfassen.
2. **Lorenz-Attraktor** (Kapitel 2) – das historische Wettermodell, der
   Schmetterlingseffekt.
3. **Lorenz-96** (Kapitel 3) – *wie* man Chaos misst: feste Verdopplungszeit,
   logarithmischer Gewinn durch genauere Messung. Schnell, auch auf alten
   Handys flüssig.
4. **Zwei Wetterkarten** (Kapitel 4) – dieselbe Erkenntnis an etwas, das wie
   Wetter aussieht; Brücke zu Ensemble-Vorhersagen.

Wenn nur **ein** Kandidat weiterentwickelt werden kann: **das
Zweischichtenmodell.** Es erfüllt das Erfolgskriterium („zwei fast identische
Wetterlagen, verständlich, warum sie auseinanderlaufen“) deutlich besser, ist
wissenschaftlich ehrlich (echte Temperaturkopplung, keine Deko-Variablen) und
der Aufwand ist zum größten Teil schon erbracht. Vor dem Einsatz nötig:

1. Messung auf den Geräten, die Besucher typischerweise haben (iPhone mit
   Safari, ein günstiges Android-Gerät);
2. bei Bedarf Web Worker (siehe [performance.md](performance.md));
3. ein Test mit Besucherinnen und Besuchern, ob Differenzkarte und
   logarithmische Grafik verstanden werden – bei Zweifel die Grafik
   einklappbar machen und nur „Unterschied in %“ zeigen.

Lorenz-96 würde ich trotzdem behalten: Es ist billig, robust und erklärt die
Messung von Chaos sauberer als jedes andere Kapitel.

## Abweichungen vom ursprünglichen Plan (bewusst)

- **Kein separater Startbildschirm**, sondern die Kapitelnavigation des
  bestehenden Repos (1–4). Der vorgeschlagene Einleitungssatz steckt in den
  Untertiteln der Kapitel 3 und 4.
- **Kein Build-System / kein `/src`-Baum:** Das Repo ist bewusst statisch ohne
  Build (Doppelklick auf `index.html` genügt). Die vorgeschlagene Trennung ist
  trotzdem umgesetzt: Modelle `js/models/` (ohne DOM, in Node testbar),
  gemeinsame Vergleichslogik `js/models/compare.js` + `js/chaos-lab.js`,
  Darstellung pro Kapitel `js/lorenz96.js`, `js/karte.js`, Tests `tests/`,
  Skripte `scripts/`.
- **Gitter 32 × 32 statt 100 × 60:** spektrale Methode braucht Zweierpotenzen;
  32² ist für Handys bezahlbar, 64² validiert (siehe numerik.md).
- **F bei Lorenz-96 nicht einstellbar** in der App (siehe modelle.md).
