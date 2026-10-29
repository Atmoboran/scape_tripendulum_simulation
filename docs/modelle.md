# Modelle – Spezifikation und Interpretation

Dieses Dokument beschreibt die beiden geprüften Kandidaten: was sie rechnen,
warum diese Varianten gewählt wurden und welche Aussagen sie tragen. In der
App ist heute nur Kandidat B als Kapitel 3 („Karte“) enthalten; Kandidat A
war Kapitel 3 „Ring“ und wurde nach der Durchsicht herausgenommen (Modell,
Tests und Validierung sind im Repo geblieben).
Numerik: [numerik.md](numerik.md) · Prüfungen: [validierung.md](validierung.md).

---

## Kandidat A: Lorenz-96 (nicht mehr in der App)

### Gleichung

$$\frac{dX_i}{dt} = (X_{i+1} - X_{i-2})\,X_{i-1} - X_i + F, \qquad i = 1 \dots N,\quad X_{i+N} = X_i$$

Code: `js/models/lorenz96.js` (`rhs`, `step`).

| Parameter | Wert | Begründung |
|---|---|---|
| N | 40 | Standardkonfiguration aus Lorenz (1996) und unzähligen Folgearbeiten |
| F | 8 | klar chaotisch; geprüft: λ₁ = 1,70 pro Zeiteinheit (Literatur: ≈ 1,7) |
| dt | 0,01 Zeiteinheiten | RK4, weit unter der Stabilitätsgrenze; λ₁ ändert sich zwischen dt = 0,005 und 0,05 um < 2 % |

N und F stehen in `Lorenz96.DEFAULTS`. In der App sind sie fest: Ein
Regler für F würde Besucher eher verwirren, und die Kontrolle „F = 4 ist nicht
chaotisch“ steht im Erklärtext und in der Validierung.

### Bedeutung der Größen

- **Zustandsvariablen X_i:** abstrakte Werte an N Punkten eines Rings. Lorenz
  dachte an eine nicht näher bestimmte Größe an N Orten eines Breitenkreises.
  Sie sind **keine Temperaturen in Grad Celsius** und keine Druckwerte. Die App
  nennt sie „Werte“ und zeigt sie als Abstand vom Ring (hoch/niedrig). Die
  Farbskala in der Verlaufsansicht (blau – rot) ist ausdrücklich als
  „niedrig – hoch“ beschriftet, nicht als Temperatur.
- **Der quadratische Term** `(X_{i+1} − X_{i−2}) X_{i−1}` ist eine
  vereinfachte Advektion. Er erhält die „Energie“ Σ X_i²/2 und verschiebt
  Muster um den Ring (sichtbar als schräge Streifen in der Verlaufsansicht).
- **−X_i** ist lineare Dämpfung (Reibung), **F** ein konstanter Antrieb (wie
  Erwärmung). Erst durch das Zusammenspiel von Antrieb, Dämpfung und
  nichtlinearem Transport entsteht ein Gleichgewicht.
- **Periodische Randbedingungen:** Der Ring ist geschlossen, es gibt keine
  Ränder. Das spiegelt einen Breitenkreis wider und verhindert Randeffekte.

### Voraussetzungen für Chaos

Für kleine F ist das System stationär (F ≲ 1) oder schwingt regelmäßig. Erst ab
etwa F ≈ 5 wird es chaotisch (gemessen für N = 40: λ₁ ≈ 0 bei F = 2 und F = 4,
0,39 bei F = 5, 1,70 bei F = 8, 2,32 bei F = 10). Chaos braucht hier also genug
Antrieb.

### Zeit und „Modelltage“

Lorenz (1996) setzte eine Zeiteinheit mit etwa **5 Tagen** gleich, weil die
Fehlerverdopplungszeit des Modells (~0,4 Einheiten) dann etwa der damals für
die Atmosphäre geschätzten (~2 Tage) entspricht. Die App zeigt diese Analogie
als „Modelltage“ an und erklärt sie im (i). Sie ist kein Kalender.

### Was das Modell trägt – und was nicht

Es trägt: deterministisches Chaos, empfindliche Abhängigkeit von den
Anfangsbedingungen, exponentielles Fehlerwachstum mit fester
Verdopplungszeit, Sättigung, die Wirkung kleinerer Anfangsfehler
(logarithmischer Zeitgewinn).

Es trägt nicht: Hoch- und Tiefdruckgebiete, Wetterkarten, Temperaturen,
geografische Aussagen. Die App behauptet nichts davon.

---

## Kandidat B: Zweischichtenmodell (Kapitel 3, `karte.html`)

### Modellwahl

Geprüft wurden drei Kandidaten:

| Variante | Für | Gegen |
|---|---|---|
| Flachwassergleichungen (eine Schicht, mit Coriolis) | anschaulich (Schichtdicke ≈ Druck) | keine Temperatur; schnelle Schwerewellen erzwingen kleine Zeitschritte (teuer auf Handys); erzeugt ohne zusätzlichen Antrieb kein dauerhaftes Chaos |
| 2D-Navier-Stokes / barotrope Vorticity + passiver Temperaturtracer | einfach | Temperatur wäre nur ein mitgeführter Farbstoff ohne Rückwirkung – die Vorgabe „keine Variablen nur aus optischen Gründen“ wäre verletzt |
| **Quasigeostrophisches Zweischichtenmodell (Phillips 1956)** | Standardmodell des Wetters mittlerer Breiten; **Temperatur ist eine echte Zustandsgröße** (Schichtdicke, thermischer Wind) und treibt die Dynamik (barokline Instabilität); filtert Schwerewellen heraus → große Zeitschritte | etwas aufwendigere Numerik (spektral, FFT) |

**Entscheidung: quasigeostrophisches Zweischichtenmodell.** Formulierung wie im
bekannten Python-Paket *pyqg* (Abernathey et al.), hier unabhängig in
JavaScript implementiert (`js/models/qg2layer.js`).

### Gleichungen

Zwei übereinanderliegende Schichten m = 1 (oben), 2 (unten) auf einer
β-Ebene, doppelt periodisches Gebiet, aufgeprägte vertikale Scherung U₁ − U₂:

- Potenzielle Vorticity:
  q₁ = ∇²ψ₁ + F₁(ψ₂ − ψ₁), q₂ = ∇²ψ₂ + F₂(ψ₁ − ψ₂),
  F₁ = 1/(r_d²(1+δ)), F₂ = δF₁, δ = H₁/H₂
- Zeitentwicklung:
  ∂q_m/∂t + J(ψ_m, q_m) + U_m ∂q_m/∂x + Q_{y,m} ∂ψ_m/∂x = −δ_{m2} r_ek ∇²ψ₂
- Hintergrund-PV-Gradienten: Q_{y,1} = β + F₁(U₁ − U₂), Q_{y,2} = β − F₂(U₁ − U₂)
- Wind: u = U_m − ∂ψ_m/∂y, v = ∂ψ_m/∂x

### Zustandsgrößen und ihre Bedeutung

| Größe | physikalisch | in der App |
|---|---|---|
| ψ₁, ψ₂ | Stromfunktion ≈ Druck/f₀ (geostrophisches Gleichgewicht); der Wind weht entlang der Isolinien | Linien auf der Karte (obere Schicht, inkl. Grundströmung) |
| q₁, q₂ | potenzielle Vorticity – die eigentlich prognostische Größe | intern |
| ψ₁ − ψ₂ | Dicke zwischen den Schichten ∝ mittlere Temperatur der Säule (hypsometrische Gleichung, thermischer Wind) | Farben (Temperaturabweichung) |

**Kopplung Temperatur – Strömung:** Die Temperatur ist keine Zusatzvariable,
sondern ψ₁ − ψ₂. Ihr Süd-Nord-Gefälle ist über den thermischen Wind
gleichbedeutend mit der Scherung U₁ − U₂, und diese Scherung ist die
Energiequelle der Wirbel (barokline Instabilität). Wirbel transportieren
warme Luft nach Norden und kalte nach Süden und bauen dadurch das Gefälle ab;
der aufgeprägte Hintergrund hält es aufrecht.

**Umrechnung in Grad:** T′ ≈ T₀ f₀ (ψ₁ − ψ₂) / (g ΔZ) mit T₀ = 250 K,
f₀ = 10⁻⁴ s⁻¹, ΔZ = 5 km (Abstand der Schichtmitten). Das ergibt ≈ 41 K
Gefälle über 8000 km (Süd–Nord) und Wirbel-Abweichungen von ≈ 5 K RMS – realistische
Größenordnungen für die mittlere Troposphäre. Die Umrechnung ist grob; die App
spricht von „Temperatur in etwa 5 km Höhe“ und „grobe Werte“.

**Erhaltungsgrößen:** Ohne Antrieb, Reibung und Filter erhält die Advektion
die Gesamtenergie (kinetisch + verfügbar potenziell); getestet in
`tests/qg2layer.test.js` (Änderung < 10⁻³ über einen Tag). Die Masse jeder
Schicht ist im QG-Modell automatisch erhalten (der Mittelwert von ψ bleibt 0).

**Coriolis und Reibung:** f₀ steckt in r_d (Deformationsradius), seine
Breitenabhängigkeit in β. Reibung am Boden: r_ek in der unteren Schicht.

**Randbedingungen:** doppelt periodisch. Ost-West entspricht das einem Band
um die Erde, Nord-Süd ist es eine Idealisierung (die Störungen sind
periodisch, das aufgeprägte Temperaturgefälle nicht). Die Karte ist eine
**schematische Region** ohne Geografie; es gibt bewusst keine Landkarte im
Hintergrund.

### Parameter

| Parameter | Wert | Bedeutung |
|---|---|---|
| Gebiet | 16 000 × 8000 km (Ost-West × Süd-Nord) | Band mittlerer Breiten; Karten im Seitenverhältnis 2 : 1 passen untereinander aufs Handy |
| Gitter | 64 × 32 (250 km) | Rechenaufwand für Handys, siehe [numerik.md](numerik.md) |
| r_d | 500 km | Deformationsradius (bestimmt die Größe der Wirbel) |
| δ | 1 | zwei gleich dicke Schichten |
| U₁ − U₂ | 10 m/s | Windscherung (Westwind oben) |
| β | 1,6·10⁻¹¹ (m s)⁻¹ | etwa 45° N |
| r_ek | 1,2·10⁻⁵ s⁻¹ | Bodenreibung, e-Faltungszeit ≈ 1 Tag |
| dt | 900 s | siehe Stabilitätsanalyse |

**Warum nicht die pyqg-Standardwerte?** pyqg ist für Ozeanwirbel
voreingestellt (r_d = 15 km, U = 2,5 cm/s). Getestet: stabil und chaotisch,
aber Fehler verdoppeln sich erst alle ~20 Tage, und 64 × 64 Punkte für 1000 km wären
nötig – für die Atmosphäre unrealistisch langsam und für Handys zu teuer.
Die Werte oben skalieren das Modell auf die Atmosphäre: Wirbel von
1000–2000 km, Höhenwinde bis ≈ 60 m/s, Fehlerverdopplung ≈ 3,2 Tage
(doppelte Auflösung: ≈ 2,5 Tage; Schätzungen für reale Wettermodelle:
1,5–3 Tage).

Ein schmaleres Gebiet (8000 × 4000 km, 32 × 16) wurde ebenfalls getestet: Es
läuft nicht stabil (Instabilität nach ~200 Tagen) und wurde verworfen. Das
erste quadratische Gebiet (8000 × 8000 km, 32 × 32) verhielt sich wie das
heutige (Verdopplung 3,5 Tage).

### Was das Modell trägt – und was nicht

Es trägt: Entstehung von Wirbeln aus einem Temperaturgefälle, Transport von
Warm- und Kaltluft, chaotische Dynamik mit messbarer Verdopplungszeit, die
Grenze der Vorhersagbarkeit in einem physikalisch begründeten Modell.

Es trägt nicht: eine Wettervorhersage für Mitteleuropa, Feuchte, Wolken,
Niederschlag, Gebirge, Land/Meer, Jahreszeiten. Die Zeit bis zum völligen
Auseinanderlaufen (≈ 30–60 Tage) ist **länger** als in der Wirklichkeit
(≈ 2 Wochen), weil kleine, schnelle Prozesse (Konvektion) fehlen; die App sagt
das in der Rückmeldung zur Aufgabe 2.

### Literatur

- Lorenz, E. N. (1996): Predictability – a problem partly solved. ECMWF Seminar on Predictability.
- Lorenz, E. N. & Emanuel, K. A. (1998): Optimal sites for supplementary weather observations. J. Atmos. Sci. 55.
- Phillips, N. A. (1956): The general circulation of the atmosphere: a numerical experiment. Q. J. R. Meteorol. Soc. 82.
- Vallis, G. K. (2017): Atmospheric and Oceanic Fluid Dynamics, Kap. 5 und 9.
- Abernathey, R. et al.: pyqg – Python quasigeostrophic model, https://pyqg.readthedocs.io
