# Wissenschaftliche Validierung

Alle Zahlen stammen aus reproduzierbaren Skripten:

```
node scripts/validate-lorenz96.js   # ~10 s
node scripts/validate-qg.js         # ~8 min
node --test tests/*.test.js         # automatisierte Tests
```

Getrennt wird im Folgenden zwischen **gemessen** (Skriptausgabe), **Literatur**
und **Einschätzung**.

## Was als Chaosnachweis gilt

Das bloße Auseinanderlaufen zweier Kurven reicht nicht. Geprüft wird jeweils:

1. ein **positiver größter Lyapunov-Exponent** λ₁ (Benettin-Verfahren:
   Zwillingslauf mit Abstand d₀, regelmäßig auf d₀ zurückskaliert, mittlere
   logarithmische Streckung pro Zeit), über mehrere Starts und lange Zeiten;
2. **exponentielles Wachstum** kleiner Störungen mit einer Rate, die zu λ₁
   passt und **nicht von der Größe der Störung abhängt**;
3. **Robustheit** gegenüber dem Zeitschritt (und beim Strömungsmodell der
   Auflösung), damit es kein numerisches Artefakt ist;
4. eine **Kontrolle**, in der das System nicht chaotisch sein darf und es auch
   nicht ist;
5. **exakte Reproduzierbarkeit**: Ohne Störung bleibt der Unterschied 0.

Die drei Phasen jedes Experiments: **Transiente** (die Störung richtet sich an
den am schnellsten wachsenden Mustern aus; Wachstum kann kurz ausbleiben),
**exponentielles Wachstum** (gerade Linie in der logarithmischen Grafik),
**Sättigung** (Unterschied ≈ 100 %, die Läufe sind unabhängig).

## Kandidat A: Lorenz-96 (N = 40, F = 8, RK4, dt = 0,01) – gemessen

| Prüfung | Ergebnis |
|---|---|
| Klimatologie (10 000 Zeiteinheiten) | Mittelwert 2,34, Standardabweichung 3,64 |
| λ₁ (5 Starts × 1000 Zeiteinheiten, Renormierung alle 0,1) | **1,702 ± 0,022** pro Zeiteinheit → Verdopplung 0,41 Einheiten ≈ 2,0 Modelltage |
| λ₁ bei dt = 0,005 / 0,02 / 0,05 | 1,669 / 1,688 / 1,689 |
| λ₁ bei F = 2 / 4 / 5 / 6 / 10 | −0,004 / 0,011 / 0,39 / 0,99 / 2,32 |
| RK4-Konvergenz nach t = 1 | Ordnung 4,14 / 4,08 |
| App-Experimente (30 Starts, eine Variable gestört) | Verdopplung im exponentiellen Bereich (Median): 0,44 / 0,44 / 0,40 Einheiten für δ = 0,1 / 0,001 / 0,00001 |
| Zeit bis 50 % Unterschied (Median) | 3,5 / 6,3 / 8,6 Einheiten (17 / 31 / 43 Modelltage) |
| Reproduzierbarkeit, 1000 Einheiten | Unterschied exakt 0 |

**Literatur:** Für N = 40, F = 8 werden λ₁ ≈ 1,7 pro Zeiteinheit und eine
Verdopplungszeit von ≈ 0,4 Einheiten berichtet (Lorenz 1996; Lorenz & Emanuel
1998) – übereinstimmend.

**Bewertung:** Chaos ist eindeutig nachgewiesen. Das Wachstum aus den
App-Experimenten (0,40–0,44) passt zu λ₁ (0,41) und hängt nicht von δ ab. Jede
100-fach kleinere Störung bringt nur ≈ 12 Modelltage mehr – genau die
logarithmische Abhängigkeit, die die App in Aufgabe 2 zeigt. F ≤ 4 ist
nicht chaotisch.

**Grenzen der Schätzung:** Die Verdopplungszeit, die die App live aus *einem*
Lauf schätzt, streut um ±20 % (abhängig vom Start, kurzes Fenster). Die
Benettin-Werte sind über 5000 Zeiteinheiten gemittelt und genauer.

## Kandidat B: Zweischichtenmodell (64 × 32, 16 000 × 8000 km, dt = 900 s) – gemessen

| Prüfung | Ergebnis |
|---|---|
| Gleichgewicht (600 Tage, 12 Fenster à 50 Tage) | RMS der Dicke schwankt zwischen 0,92 und 1,06 des Mittels → statistisch stationär |
| Temperatur (grobe Umrechnung) | Abweichungen ≈ 4,8 K RMS, Hintergrundgefälle ≈ 41 K über 8000 km (Süd–Nord) |
| Höchster Wind / Stabilitätszahl | 58 m/s / u·k·dt = 0,44 (Grenze 0,72) |
| λ₁ (Benettin, 3 Starts × 200 Tage, tägliche Renormierung) | **0,195 / 0,218 / 0,223 pro Tag** → Verdopplung ≈ 3,3 Tage |
| λ₁ bei halbem Zeitschritt (450 s) | 0,207 pro Tag |
| λ₁ bei doppelter Auflösung 128 × 64 (dt = 450 s, eigener Spin-up) | 0,279 pro Tag (Verdopplung 2,5 Tage); Wirbelenergie 1,00 × |
| App-Experimente (warme Blase 500 km, zufälliger Ort, 12 Läufe à 60 Tage) | Verdopplung (Median) 3,13 / 3,18 / 3,19 Tage für 1 % / 0,01 % / 0,0001 % der typischen Abweichung |
| Faktor nach 10 Tagen | 3,8–3,9 (lange Transiente: die runde Blase muss sich erst in die Wirbelstruktur einfügen) |
| Zeit bis 50 % Unterschied (Median) | 38 Tage (1 %); bei 0,01 % mehr als 60 Tage |
| Kontrolle: schwache Scherung 3 m/s, Start aus Rauschen 10⁻⁶ | nach 600 Tagen 1,1 · 10⁻⁶ – **keine Instabilität, keine Wirbel** |
| Scherung 6 m/s / 10 m/s | wächst langsam (9,7 · 10⁻² nach 600 Tagen) / volle Turbulenz nach ~250 Tagen |
| Reproduzierbarkeit, 100 Tage | Unterschied exakt 0 |
| Energieerhaltung der Advektion (ohne Antrieb/Reibung/Filter, 1 Tag) | relative Änderung < 10⁻³ (Test) |

**Bewertung:** Das Modell zeigt unter den verwendeten Bedingungen
**chaotische Dynamik**: positives λ₁, reproduzierbar über Starts, unabhängig
vom Zeitschritt; Störungen wachsen mit derselben Rate über vier
Größenordnungen; ohne Instabilität (schwache Scherung) wächst nichts. Das
schnellere Wachstum bei doppelter Auflösung zeigt, dass die *Zahl* (3,2 Tage) von der
Auflösung abhängt – die Aussage „kleine Unterschiede wachsen exponentiell bis
zur Sättigung“ bleibt bestehen.

**Numerische Fehler als Ursache?** Ausgeschlossen durch: (a) Unterschied
exakt 0 ohne Störung, (b) lineares Skalieren des frühen Unterschieds mit der
Störungsgröße (Faktor nach 10 Tagen identisch über vier Zehnerpotenzen),
(c) gleiche Rate bei halbem Zeitschritt, (d) Stabilitätszahl mit 30 %
Reserve, (e) Langläufe von 8 Jahren ohne Drift.

**Einordnung:** Für reale Wettermodelle schätzt man Fehlerverdopplungszeiten
von 1,5–3 Tagen für großräumige Strukturen (Lorenz 1982 und Folgearbeiten).
Das Modell liegt in derselben Größenordnung. Die Zeit bis zur völligen
Entkopplung ist mit 30–60 Tagen länger als die reale Vorhersagegrenze
(≈ 2 Wochen), weil das Modell die kleinen, schnellen Prozesse (Konvektion,
Feuchte) nicht enthält, die in der Atmosphäre Fehler zusätzlich verstärken –
die App sagt das ausdrücklich.

## Probleme, die bei der Validierung gefunden und behoben wurden

1. **pyqg-Standardparameter** (Ozeanwirbel): Verdopplung ≈ 20 Tage → Parameter
   auf atmosphärische Skalen umgestellt (siehe modelle.md).
2. **Explosion nach ~90 Tagen** bei starker Instabilität: Stabilitätsgrenze der
   spektralen Advektion; Zeitschritt nach u·k_max·dt bestimmt.
3. **Explosion nach ~700 Tagen**: wachsender nicht-hermitescher Anteil durch die
   gepackten FFTs → Symmetrisierung nach jedem Schritt.
4. **Zeitschrittabhängiger Filter** (pyqg filtert pro Schritt) → auf 900 s
   normiert; seither ist λ₁ bei halbem Zeitschritt unverändert.
5. **Kontrollexperiment** zunächst falsch angesetzt (Start im turbulenten
   Zustand); ersetzt durch Start aus Rauschen.
6. **Stärke des Flecks frei wählbar** (Regler 0,000 01 … 5 °C, warm oder
   kalt): bei drei Wetterlagen je 60 Tage mit ±0,000 01 bis +40 °C und −10 °C
   gerechnet – immer stabil, größter Wind 59–70 m/s, Stabilitätszahl ≤ 0,53.
   Der 500 km breite, weiche Fleck erzeugt selbst bei großen Werten nur mäßigen
   Wind. Die Obergrenze 5 °C ist inhaltlich gewählt (darüber ist es kein
   „winziger“ Unterschied mehr), nicht numerisch.
7. **Gebiet 2 : 1** (für drei Karten untereinander auf dem Handy): Ein
   schmales Gebiet 8000 × 4000 km wurde instabil; gewählt wurde
   16 000 × 8000 km auf 64 × 32 Punkten und neu validiert (Tabelle oben).
