# Performance

## Testumgebung – und was fehlt

Gemessen wurde in **Headless-Chromium (Playwright) auf einem Linux-Server**
ohne Grafikbeschleunigung. **Echte Geräte (iPhone, Android, älteres Handy)
standen nicht zur Verfügung.** Als Ersatz dient die CPU-Drosselung der
Chrome-DevTools (4× und 8× langsamer), dazu ein simuliertes langsames
Mobilnetz. Die Messungen sind reproduzierbar:

```
node scripts/perf.js    # Bildrate, erreichte Modellgeschwindigkeit, Speicher
node scripts/load.js    # Datenmenge und Ladezeit
```

Einordnung (Erwartung, nicht gemessen): Ein aktuelles Mittelklasse-Handy
liegt grob zwischen 1× und 4× dieses Servers, ein älteres Einsteigergerät
bei 4×–8×. Da die Testumgebung ohne GPU zeichnet, sind die Zeichenkosten hier
eher höher als auf einem echten Handy.

## Laufzeit (Handy-Ansicht 390 × 844, Pixeldichte 2)

| Seite | CPU | Tempo (Soll) | Bilder/s | 95 % der Bilder unter | erreicht | Speicher |
|---|---|---|---|---|---|---|
| Ring (Lorenz-96) | 1× | 3 Tage/s | 60 | 17 ms | 2,99 Tage/s | 9,5 MB |
| | 1× | 8 Tage/s | 60 | 17 ms | 7,98 | 9,5 MB |
| | 4× | 3 | 36 | 50 ms | 3,10 | 9,5 MB |
| | 4× | 8 | 38 | 33 ms | 8,07 | 9,5 MB |
| | 8× | 3 | 16 | 100 ms | 3,05 | 9,5 MB |
| | 8× | 8 | 16 | 100 ms | 8,01 | 9,5 MB |
| Karte (Zweischichten) | 1× | 2 Tage/s | 60 | 17 ms | 1,99 | 9,5 MB |
| | 1× | 5 | 52 | 33 ms | 4,55 | 9,5 MB |
| | 4× | 2 | 16 | 83 ms | 0,78 | 9,5 MB |
| | 4× | 5 | 16 | 83 ms | 0,74 | 9,5 MB |
| | 8× | 2 | 9 | 150 ms | 0,23 | 9,5 MB |
| | 8× | 5 | 8 | 167 ms | 0,21 | 9,5 MB |

**Kosten im Einzelnen (Browser, 1×):** Lorenz-96 ist rechnerisch fast gratis
(40 Variablen). Zweischichtenmodell: ein Schritt ≈ 0,25 ms (Node) bzw.
≈ 0,4–0,7 ms (Browser), zwei Läufe à 96 Schritte pro Modelltag; eine Karte
zeichnen ≈ 3–5 ms (zwei FFTs 64², Farbtabelle, Isolinien).

**Bewertung:**

- Lorenz-96 erreicht auf allen Stufen die volle Modellgeschwindigkeit; die
  Bildrate sinkt bei 8× auf 16 fps – ruckelig, aber bedienbar.
- Die Karte läuft ungedrosselt flüssig. Bei 4× erreicht sie ~0,8 statt
  2 Modelltage pro Sekunde: Das Experiment (+0,5 °C bis 50 % Unterschied,
  ~30 Modelltage) dauert dann ~40 s statt 15 s. Bei 8× wird es mit ~2 min
  zu langsam für eine Museumsstation.
- **Keine langen Blockaden:** Die Rechnung pro Bild ist auf ≈ 12 ms begrenzt;
  das Zeichnen passt sich an (seltener neu zeichnen statt ruckeln).
- **Ergebnisse hängen nicht vom Gerät ab:** Langsamere Geräte rechnen weniger
  Schritte pro Sekunde, nie andere.

## Langlauf, Hintergrund, Neustarts

- Karte, schnellste Stufe, 160 s mit 6 Neustarts: Speicher 9,5 → 9,5 MB, keine
  Fehler.
- Rückkehr aus dem Hintergrund (`visibilitychange`): Die Zeitmessung wird neu
  gesetzt, damit nach der Pause nicht „nachgerechnet“ wird; die Bühne wird neu
  gezeichnet.
- Hoch- und Querformat: Die Bühne passt sich an (`resize`); auf dem Handy ist
  die Karten-Bühne 4:5, damit Legende und Karte Platz haben.

## Laden

| Seite | Daten (unkomprimiert) | lokal | langsames Mobilnetz (1,6 Mbit/s, 150 ms, CPU 4×) |
|---|---|---|---|
| Kapitel 1 Pendel | 92 kB | 95 ms | 0,9 s |
| Kapitel 2 Lorenz | 101 kB | 120 ms | 1,2 s |
| Kapitel 3 Ring | 105 kB | 113 ms | 1,1 s |
| Kapitel 4 Karte | 157 kB (davon 32 kB Startzustände) | 134 ms | 1,5 s |

Keine Bibliotheken, keine Schriften aus dem Netz, keine externen Aufrufe.
Mit gzip auf dem Server schrumpft das etwa auf ein Drittel.

## Nächste Schritte, falls nötig

1. Modell der Karte in einen **Web Worker** verlegen: Rechnen und Zeichnen
   laufen dann parallel; auf Handys mit mehreren Kernen etwa doppelte
   Geschwindigkeit.
2. FFT in **WebAssembly** oder mit reellen Transformationen (halbe Arbeit).
3. Auf sehr langsamen Geräten die Anzeige auf 48² statt 64² interpolieren.
4. Messung auf echten Geräten nachholen (Safari/iOS verhält sich bei Canvas
   anders als Chromium).
