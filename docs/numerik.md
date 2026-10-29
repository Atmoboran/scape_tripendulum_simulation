# Numerik – Verfahren, Zeitschritte, Stabilität

## Gemeinsame Regeln (beide Modelle)

- **Fester Modellzeitschritt, unabhängig von der Bildrate.** `js/chaos-lab.js`
  rechnet pro Bild so viele *ganze* Modellschritte, wie die gewählte
  Geschwindigkeit verlangt. Schafft ein Gerät das nicht (Rechenbudget pro Bild
  mindestens 12 ms, bei langsamen Bildern bis zur Hälfte des Bildintervalls,
  höchstens 40 Schritte), wird der Rückstand
  verworfen: Die Simulation läuft dann langsamer, aber **jeder Schritt ist
  identisch** mit dem auf einem schnellen Gerät. Ein langsames Handy liefert
  dasselbe Ergebnis, nur später.
- **Reproduzierbarkeit.** Keine Zufallszahlen während des Laufs. Startzustände
  kommen aus einem festen Zufallsgenerator (mulberry32, `Lorenz96.rng`) bzw.
  aus gespeicherten, per Skript erzeugten Zuständen (`data/qg-start.js`).
  Gleicher Start → bitgleiches Ergebnis (getestet). Lauf A und B nutzen exakt
  dieselben Funktionen und Parameter; B unterscheidet sich nur durch die
  kontrollierte Störung, deren Größe auf 0 gestellt werden kann (Kontrolle:
  Unterschied bleibt exakt 0 %).
- **Messung der Abweichung.** Alle 1/20 bzw. 1/16 Modelltag wird der relative
  Unterschied gespeichert (RMS-Differenz geteilt durch √2 × klimatologische
  Standardabweichung, 1 = „so verschieden wie zwei zufällige Zustände“). Die
  Verdopplungszeit ist die Steigung von ln(Unterschied) per kleinster Quadrate
  im Fenster *10 × Anfangsunterschied … 20 %* (`js/models/compare.js`); unter
  zwei Verdopplungen Fensterbreite gibt es keine Schätzung.
- **Prüfung auf NaN/Unendlich:** `isFiniteState` / `Model.isFinite`.

## Lorenz-96

| | |
|---|---|
| Verfahren | klassisches Runge-Kutta 4. Ordnung, in place, ohne Speicheranlage pro Schritt |
| Zeitschritt | dt = 0,01 Zeiteinheiten (= 0,05 Modelltage), 20 Schritte pro Modelltag |
| Konvergenz | gemessen Ordnung 4,1 (Referenz dt = 0,0005) |
| Stabilität | stabil bis über dt = 0,05; λ₁ unabhängig von dt (1,67–1,70) |
| Randbedingungen | periodisch über Indexrechnung modulo N |
| Initialisierung | X_i = F + 0,01·(Zufall − ½) mit festem Startwert, dann 20 Zeiteinheiten Einschwingen; Störung: ein einzelner Wert X_k + δ |

## Zweischichtenmodell

| | |
|---|---|
| Raum | pseudospektral: Ableitungen und Inversion im Fourierraum, Produkte (Jacobi-Term) im Gitterraum; 2-D-FFT eigener Bauart (`js/models/fft.js`, Radix 2) |
| Gitter | 64 × 32 (Δx = Δy = 250 km); Anzeige direkt auf diesem Gitter, bilinear geglättet |
| Zeit | Adams-Bashforth 3. Ordnung (Start mit Euler, dann AB2), wie pyqg |
| Zeitschritt | dt = 900 s, 96 Schritte pro Modelltag |
| Inversion q → ψ | pro Wellenzahl ein 2 × 2-Gleichungssystem, exakt; Mittelwert (k = 0) = 0 |
| Randbedingungen | doppelt periodisch (durch die FFT automatisch) |
| Aliasing | 2/3-Regel auf dem Zustand: Wellenzahlen über 2/3 des Maximums werden nach jedem Schritt gelöscht |
| Kleinskalige Dämpfung | (a) Hyperviskosität ∇⁸, als exakter Integrationsfaktor, e-Faltungszeit 3 h an der kleinsten behaltenen Skala, darüber wirkungslos; (b) pyqgs exponentieller Spektralfilter, auf dt = 900 s normiert (so dass halbierter Zeitschritt nicht doppelt filtert) |
| Kosten | 5 komplexe 2-D-FFTs pro Schritt (je zwei reelle Felder in einer komplexen Transformation) |

### Stabilität – was gemessen und korrigiert wurde

1. **Zeitschritt.** Für pseudospektrale Advektion mit AB3 gilt
   u_max · k_max · dt < 0,72 (k_max = 2/3 · π/Δx nach Dealiasing). Mit
   Höhenwinden bis ≈ 60–70 m/s (inkl. 10 m/s Grundströmung) ergibt dt = 900 s
   einen Wert von 0,46–0,52 – rund 30 % Reserve. dt = 1200 s läuft noch,
   liegt aber an der Grenze (0,70).
2. **Hermitesche Symmetrie.** Weil je zwei reelle Felder in einer komplexen FFT
   gerechnet werden, muss das Spektrum reeller Felder exakt hermitesch sein
   (q̂(−k) = q̂(k)*). Rundungsfehler verletzen das minimal; ohne Gegenmaßnahme
   wuchs dieser unphysikalische Anteil exponentiell und der Lauf explodierte
   nach ~700 Tagen (diagnostiziert: zwei konjugierte Moden mit ungleicher
   Amplitude). Lösung: Projektion auf das hermitesche Spektrum nach jedem
   Schritt (`symmetrize`). Danach stabil über 3000 Tage (8 Jahre) bei
   dt = 900 und 1200 s.
3. **Spektrale Blockade.** Die Dämpfung ist auf die kleinste *behaltene* Skala
   bezogen, sonst stauen sich Fluktuationen dort.

### Konvergenz und Auflösung

- Zeitschritt: Gegen eine Referenz mit dt = 56 s fällt der Fehler eines
  Tageslaufs mit Ordnung ≈ 2 (Startphase des AB3 dominiert; Dämpfung dabei
  abgeschaltet, sie ist per Operator-Splitting angehängt). Der
  Lyapunov-Exponent ändert sich bei halbiertem Zeitschritt kaum (Mittel
  0,212 → 0,207 pro Tag).
- Raum: doppelte Auflösung 128 × 64 mit dt = 450 s (eigener Spin-up) ergibt
  dieselbe Wirbelenergie (Faktor 1,00) und ebenfalls Chaos, aber etwas
  schnelleres Fehlerwachstum (λ₁ = 0,28 statt 0,21 pro Tag), weil kleinere,
  schneller wachsende Strukturen aufgelöst werden. Die *qualitative* Aussage
  bleibt, die Verdopplungszeit ist auflösungsabhängig. Gewählt wurde 64 × 32
  wegen der Rechenzeit auf Handys (die doppelte Auflösung kostet etwa das
  8- bis 9-Fache pro Modelltag).

### Startzustände

`scripts/qg-spinup.js` startet aus winzigem, reproduzierbarem Rauschen,
rechnet 2 Jahre (Instabilität wächst ab ~Tag 150, Gleichgewicht ab ~Tag 250)
und speichert drei Zustände im Abstand von 120 Tagen als Float32/Base64
(64 KB). „Neuer Anfangszustand“ nimmt den nächsten und verschiebt ihn im
periodischen Gebiet – eine exakte Symmetrie des Modells.

### Darstellung

Temperatur und Stromfunktion werden pro Modellstand einmal auf das Gitter
zurücktransformiert (je eine FFT) und von allen drei Karten gemeinsam
genutzt; die Isolinien (Marching Squares, ost-west-periodisch) ebenfalls nur
einmal pro Modellstand. Farben über 256er-Nachschlagetabellen, bilineare
Glättung beim Skalieren. Ein langsames Gerät zeichnet die Karten seltener neu;
die Rechnung bekommt bis zur Hälfte jedes Bildintervalls und läuft so weiter
im Solltempo.

Die **Wetterstation** liest die Temperatur nicht aus dem Gitter, sondern
summiert die Fourier-Reihe exakt am angetippten Punkt (genau, auch zwischen
Gitterpunkten), alle 1/16 Modelltag in A und B.
