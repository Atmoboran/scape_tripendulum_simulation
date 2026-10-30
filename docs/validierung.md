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

## Kandidat B: Zweischichtenmodell (64 × 32, 16 000 × 8000 km, Scherung 15 m/s, dt = 450 s) – gemessen

| Prüfung | Ergebnis |
|---|---|
| Gleichgewicht (600 Tage, 12 Fenster à 50 Tage) | RMS der Dicke schwankt zwischen 0,96 und 1,07 des Mittels → statistisch stationär |
| Temperatur (grobe Umrechnung) | Abweichungen ≈ 9,3 K RMS, Hintergrundgefälle ≈ 61 K über 8000 km (Süd–Nord) |
| Höchster Wind / Stabilitätszahl | 113 m/s / u·k·dt = 0,42 (Grenze 0,72) |
| λ₁ (Benettin, 3 Starts × 200 Tage, tägliche Renormierung) | **0,486 / 0,487 / 0,490 pro Tag** → Verdopplung ≈ 1,4 Tage |
| λ₁ bei halbem Zeitschritt (225 s) | 0,475 pro Tag |
| App-Experimente (warme Blase 500 km, zufälliger Ort, 12 Läufe à 60 Tage, 1 % der typischen Abweichung) | Verdopplung (Median) 1,57 Tage; Zeit bis 50 % Unterschied 16,8 Tage; Faktor nach 10 Tagen 68 |
| Wetterstation: Unterschied > 2 °C (Median von 8 Läufen) | Messfehler 1 °C: ≈ 9–10 Tage; 0,1 °C: ≈ 14 Tage |
| Langlauf dt = 600 s | 3000 Tage stabil (aber Stabilitätszahl 0,62 → dt = 450 s gewählt) |
| Reproduzierbarkeit | ohne Störung Unterschied exakt 0 (Test) |
| Energieerhaltung der Advektion (ohne Antrieb/Reibung/Filter, 1 Tag) | relative Änderung < 10⁻³ (Test) |

Frühere Einstellung (Scherung 10 m/s, dt = 900 s), zum Vergleich: λ₁ =
0,195–0,223 pro Tag (Verdopplung ≈ 3,3 Tage), bei 128 × 64 Punkten 0,279;
Kontrolle mit schwacher Scherung 3 m/s aus Rauschen 10⁻⁶: nach 600 Tagen
1,1 · 10⁻⁶ – **keine Instabilität, keine Wirbel**.

**Bewertung:** Das Modell zeigt unter den verwendeten Bedingungen
**chaotische Dynamik**: positives λ₁, reproduzierbar über Starts, unabhängig
vom Zeitschritt; Störungen wachsen mit derselben Rate über vier
Größenordnungen; ohne Instabilität (schwache Scherung) wächst nichts. Das
schnellere Wachstum bei doppelter Auflösung zeigt, dass die *Zahl* (Verdopplungszeit) von der
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
Entkopplung ist mit 15–25 Tagen länger als die reale Vorhersagegrenze
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
6. **Stärke des Messfehlers frei wählbar** (heute ein Regler −1 … +1 °C in
   Zehnteln; früher 0,000 01 … 5 °C): bei drei Wetterlagen je 60 Tage mit
   ±0,000 01 bis +40 °C und −10 °C gerechnet – immer stabil. Der 500 km
   breite, weiche Fleck erzeugt selbst bei großen Werten nur mäßigen Wind.
7. **Gebiet 2 : 1** (für drei Karten untereinander auf dem Handy): Ein
   schmales Gebiet 8000 × 4000 km wurde instabil; gewählt wurde
   16 000 × 8000 km auf 64 × 32 Punkten und neu validiert (Tabelle oben).
8. **Zu langsames Auseinanderlaufen** (10 m/s: Station > 2 °C erst nach
   ≈ 3 Wochen) → Scherung 15 m/s, Zeitschritt halbiert, neu validiert.
