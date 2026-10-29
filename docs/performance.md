# Performance

## Testumgebung – und was fehlt

Gemessen wurde in **Headless-Chromium (Playwright) auf einem Linux-Server
ohne Grafikbeschleunigung.** **Echte Geräte (iPhone, Android, älteres Handy)
standen nicht zur Verfügung.** Als Ersatz dient die CPU-Drosselung der
Chrome-DevTools (4× und 8× langsamer), dazu ein simuliertes langsames
Mobilnetz. Reproduzierbar mit:

```
node scripts/perf.js    # Bildrate, erreichte Modellgeschwindigkeit, Speicher
node scripts/load.js    # Datenmenge und Ladezeit
```

**Wichtig für die Einordnung:** Ein CPU-Profil der Karte (4× gedrosselt)
zeigt, dass rund **75 % der Zeit** auf das Rastern der Zeichenfläche durch den
Browser selbst entfallen – in dieser Testumgebung in Software, weil es keine
GPU gibt. Unser JavaScript (Modell, Zeichenlogik, FFT) macht nur ~20 % aus.
Echte Handys rastern mit der GPU; die Bildraten unten sind deshalb eher
**zu pessimistisch**. Ein aktuelles Mittelklasse-Handy liegt (Erwartung,
nicht gemessen) grob zwischen 1× und 4× dieses Servers, ein älteres
Einsteigergerät bei 4×–8×.

## Kapitel 3 „Karte“ (Handy-Ansicht 390 × 844, Pixeldichte 2, alle drei Karten)

| CPU | Tempo (Soll) | Bilder/s | 95 % der Bilder unter | erreicht | Speicher |
|---|---|---|---|---|---|
| 1× | Normal 0,5 Tage/s | 57 | 33 ms | 0,51 Tage/s | 9,5 MB |
| 1× | Schnell 2 Tage/s | 46 | 33 ms | 1,99 Tage/s | 9,5 MB |
| 4× | Normal 0,5 | 10 | 167 ms | 0,45 | 9,5 MB |
| 4× | Schnell 2 | 6 | 233 ms | 0,84 | 9,5 MB |
| 8× | Normal 0,5 | 4 | 300 ms | 0,22 | 9,5 MB |
| 8× | Schnell 2 | 3 | 417 ms | 0,44 | 9,5 MB |

**Kosten im Einzelnen (Browser, 1×):** ein Modellschritt (64 × 32) ≈ 0,5 ms,
zwei Läufe à 96 Schritte pro Modelltag; im Normaltempo also ≈ 50 ms Rechnen
pro Sekunde.

**Bewertung:**

- Ungedrosselt flüssig, Normaltempo und schnelles Tempo werden erreicht.
- Bei 4× wird das Normaltempo fast erreicht (das Experiment dauert ~10 %
  länger), die Animation ruckelt aber (10 Bilder/s) – in dieser Umgebung ohne
  GPU; auf echten Geräten ist mehr zu erwarten.
- Bei 8× läuft alles mit halbem Tempo.
- **Keine langen Blockaden:** Die Rechnung pro Bild ist begrenzt (mindestens
  12 ms, bei langsamen Bildern bis zur Hälfte des Bildintervalls); das Zeichnen
  passt sich an.
- **Ergebnisse hängen nicht vom Gerät ab:** Langsamere Geräte rechnen weniger
  Schritte pro Sekunde, nie andere.

Was in dieser Runde optimiert wurde: Felder und Isolinien werden einmal pro
Modellstand berechnet und von allen drei Karten geteilt; die Zeichenfläche
der Karten hat höchstens 1,5 Bildpunkte pro CSS-Pixel; die Rechnung bekommt
bei langsamen Bildern mehr Zeit (vorher erreichte 4× nur die Hälfte des
Normaltempos).

## Langlauf, Hintergrund, Neustarts

- Schnellste Stufe, 160 s mit 6 Neustarts: Speicher 9,5 → 9,5 MB, keine
  Fehler.
- Rückkehr aus dem Hintergrund (`visibilitychange`): Die Zeitmessung wird neu
  gesetzt, damit nach der Pause nicht „nachgerechnet“ wird; die Bühne wird neu
  gezeichnet.
- Hoch- und Querformat: Die Bühne passt sich an; die drei Karten ordnen sich
  untereinander, nebeneinander oder 2 + 1 an, je nachdem was am größten wird.

## Laden

| Seite | Daten (unkomprimiert) | lokal | langsames Mobilnetz (1,6 Mbit/s, 150 ms, CPU 4×) |
|---|---|---|---|
| Kapitel 1 Pendel | 92 kB | 0,14 s | 0,9 s |
| Kapitel 2 Lorenz | 102 kB | 0,13 s | 1,2 s |
| Kapitel 3 Karte | 200 kB (davon 64 kB Startzustände) | 0,17 s | 1,8 s |

Keine Bibliotheken, keine Schriften aus dem Netz, keine externen Aufrufe.
Mit gzip auf dem Server schrumpft das etwa auf ein Drittel.

## Kandidat A (Lorenz-96), solange er in der App war

Volle Modellgeschwindigkeit auch bei 8-fach gedrosselter CPU (16 Bilder/s),
Speicher 9,5 MB, 105 kB Ladegröße.

## Nächste Schritte, falls nötig

1. Messung auf echten Geräten (Safari/iOS verhält sich bei Canvas anders als
   Chromium).
2. Modell in einen **Web Worker**: Rechnen und Zeichnen parallel.
3. FFT mit reellen Transformationen oder in WebAssembly (halbe Arbeit).
4. Auf sehr langsamen Geräten nur die gewählte Karte statt aller drei
   zeichnen.
