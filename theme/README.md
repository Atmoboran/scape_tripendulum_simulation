# Theme – Gestaltung austauschen

Alles, was diese App nach **SCAPE°** aussehen lässt, liegt in diesem Ordner.
Der übrige Code (`index.html`, `js/`) enthält Aufbau, Verhalten und Inhalte,
aber keine Farbwerte, Schriften, Logos oder Adressen. Für eine Version für
eine andere Einrichtung genügt es, diesen Ordner anzupassen:

| Datei | Inhalt |
|---|---|
| `theme.css` | Schrift (`--font`, `@font-face`, Schriftschnitte), Farbpalette (`--c-…`), Rollen (`--ink`, `--paper`, `--accent`, …), Farbfelder des Plakatkopfs (`--field-1` … `--field-4`), Fußzeile, Eckenradius, Aussehen der Wortmarke (`.logo`). |
| `theme.js` | `brand`: Name, Wortmarke (HTML), Claim, Adresse, Titelzusatz, Favicon, Browserfarbe. `font`: Schrift für Canvas-Text. `palette` und weitere Einträge: Farben, mit denen die Simulationen zeichnen. |
| `fonts/` | Platz für die lizenzierte Hausschrift (siehe README dort). |

Regeln:

* Die App-CSS nutzt nur Variablen aus `theme.css`. Neue Farben also dort
  als Variable anlegen, nicht direkt im Code.
* Die Schlüssel in `theme.js` (z. B. `palette.orange`) sind Namen, unter denen
  der Code eine Farbe nachschlägt. Für ein anderes Design die **Werte**
  ersetzen und die Schlüssel stehen lassen. Farben mit Bedeutung (blau = kalt,
  rot = warm) sollten ihre Bedeutung behalten.
* Texte, die Farben nennen („die rote Linie“), stehen in den Inhalten –
  bei geänderten Farben dort mit anpassen.
* Logo, Claim und Adresse werden über `data-brand="…"`-Platzhalter in die
  Seite eingesetzt (`js/brand.js`).
