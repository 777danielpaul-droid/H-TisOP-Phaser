# Ausdauer-System (Stamina)

Jede Aktion kostet Ausdauer. Dauer-Button-Spamming lohnt sich nicht mehr, aber Angriffe reagieren weiter sofort auf die Tasten.
Alle Zahlen stehen an **einer** Stelle: `STAMINA` in `src/core/config.js` (Zeiten in Frames, 60 = 1 Sekunde; Ausdauer in Punkten, volle Leiste = 75).
Die Regeln gelten für Spieler, KI-Gegner und Online-Gegner gleich (derselbe Kämpfer-Code, kein Zufall → Online-Lockstep-tauglich).

## Bedienung
| Was | Taste |
|---|---|
| Verschnaufen (1 Spieler) | `P` oder `Shift` |
| Verschnaufen (2 Spieler) | P1 `V`, P2 `'` (Ä-Taste, Ziffernblock `,`) |
| Verschnaufen (Controller) | `L2` |
| Ausdauer an/aus | Menü `M` → Optionen → „Ausdauer“ (wird gespeichert). Online bestimmt der Gastgeber für beide, der Schalter ist dann gesperrt. |

Die Leiste sitzt unter dem Lebensbalken: Gold = normal, orange = knapp (< 25), rot pulsierend = erschöpft (weiße Marke = ab hier wieder handlungsfähig),
mintgrün = Verschnaufen, rote Umrandung + „KEINE AUSDAUER“ = Aktion nicht bezahlbar.

## Regeln
- **Kosten** (`STAMINA.cost`): leicht 3,5 · mittel 7 · schwer 13 · Specials 10–18 (je Move) · Dash 8 · Luft-Dash 10 · Sprung 2,5 · Doppelsprung 2,5. Hypers kosten **keine** Ausdauer (nur die Hyper-Leiste).
- **Blocken** (`STAMINA.block`): jeder geblockte Treffer kostet `base + Move-Schaden × perDmg`. Beim **aktiven Blocken** (Block-Zustand oder gehaltene Rück-Taste) gibt es **keine** Regeneration.
- **Regeneration** (`regen`, `delay`): `0,36` Punkte pro Frame (~22/s), nachdem `40` Frames lang nichts verbraucht wurde. Keine Regeneration beim Angreifen, Dashen, Blocken.
- **Auspowern** (`emptyDelay`, `exhaust`): Fällt die Leiste auf 0, beginnt die Regeneration erst nach `94` Frames (mehr als doppelt so lang wie normal) und der Kämpfer ist **erschöpft**, bis wieder `25` erreicht sind:
  schwere und mittlere Normals, Specials und Dash gesperrt · Lauftempo ×0,82 · Schaden ×0,85 · Block-Schaden (HP) ×1,5 · Regeneration ×0,85.
  Immer möglich (nie handlungsunfähig): leichte Angriffe, Laufen, Springen, Blocken, Verschnaufen. Weitere leichte Angriffe bei leerer Leiste verlängern die lange Pause nicht.
  Schwere Normals und Specials sind schon bei zu wenig Ausdauer gesperrt (Preis nicht bezahlbar), nicht erst bei 0.
- **Verschnaufen** (`STAMINA.rest`): am Boden kurz innehalten, `1,2` Punkte pro Frame (~3× schneller), ignoriert die Pause. Mindestens `18`, höchstens `70` Frames; nach der Mindestdauer per Richtung/Taste abbrechbar.
  Währenddessen kein Block; jeder Treffer unterbricht es, und der Verschnaufende nimmt `×1,25` Schaden („ERWISCHT!“).
- **Nicht aktiv** in Melee und Story (viele Gegner gleichzeitig mit eigener KI). Figuren können mit `char.stam` (Faktor auf Leiste und Regeneration) angepasst werden, `char.noStamina = true` schaltet es für eine Figur ab.

## Balancing-Stand (KI gegen KI, Stufe „Hart“, alle Paarungen)
Gemessen mit `node tools/balance.mjs --n=60 --stam=1`:
~7 % der Zeit erschöpft, ~15 % der Zeit unter 25, Auspowern ~jede zweite Runde, Rundenlänge ~35 s (ohne Ausdauer ~31 s), Hypers ~0,4 pro Runde (ohne ~0,2).
Ausdauer verstärkt Unterschiede zwischen den Figuren (Dashes/Sprünge kosten): Der Tiger braucht dafür `stam: 1.15`, siehe unten.

### Werkzeuge
- `node tools/balance.mjs [--n=60] [--level=2] [--stam=0|1] [--tune=S.regen=.4,S.cost.L=3,tiger.hp=1000]` – Gewinnquoten-Matrix, Schaden je Move, Ausdauer-Kennzahlen. `--tune` überschreibt Werte nur für den Lauf.
- `node tools/balance-fit.mjs [--measure]` – gleicht Leben/Schaden der Figuren schrittweise in Richtung 50 % Gewinnquote an (Stand in `/tmp/balance-tune.json`).
- `node tests/stamina.test.js` – prüft alle Regeln (Kosten, Pause, kein Regenerieren beim Blocken, Auspowern, Einschränkungen, Verschnaufen, Schalter, KI, Determinismus).

## Typische Anpassungen
| Ziel | Stellschraube |
|---|---|
| Ausdauer insgesamt knapper/großzügiger | `regen` hoch/runter, oder alle `cost` skalieren |
| Auspowern härter/milder bestrafen | `emptyDelay`, `exhaust.until`, `exhaust.dmg/speed` |
| Blocken teurer (gegen Turtling) | `block.perDmg`, `block.base` |
| Verschnaufen stärker/schwächer | `rest.regen`, `rest.vuln`, `rest.min/max` |
| Spezielle Figur flinker/zäher | `char.stam` in `characters.js` |
| Standard Ein/Aus | `STAMINA.on` |
