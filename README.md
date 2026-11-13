# H!TisOP – 1v1 Arcade Beat 'em Up

**Starten:** `start.bat` (Windows) / `start.sh` (Mac/Linux) – oder `index.html` bzw. `dist/hitisop.html` doppelklicken. Kein Server, keine Installation.

**Ablauf (Arcade):** Startmenü → Kämpfer wählen (← →, Enter/J oder Mausklick), Schwierigkeit mit ↑ ↓. Du kämpfst nacheinander gegen alle anderen Kämpfer (je 2 Runden-Siege = Stage geschafft, jede Stage hat ein eigenes Level). Spielbar: H!T (Tiger) und ST3-G0 sowie deine eigene Figur (Eigene Figur im Startmenü).

Das Spiel füllt das Fenster. **F** (oder Doppelklick) = Vollbild. **M** = Menü/Pause (Steuerung, Move-Liste, Optionen, Zurück zur Charakterwahl).

Kurzsteuerung: A/D laufen · W/Space springen (2× = Doppelsprung) · S ducken · zurück halten = Block · J/K/L Light/Medium/Heavy · U Special · I Hyper · O Dash. Combos: L→M→H (auch Ducken↔Stehen), Launcher (↓+L) → ↑ → Luft-Combo, Doppelsprung/Air-Dash als Cancel.

Weiterentwickeln / Übergabe: siehe `HANDOVER.md` und `docs/ARCHITECTURE.md`. Neu bauen: `build.bat` / `build.sh` (Node). Tests: `node tests/sim.test.js` usw. (siehe HANDOVER.md).

**Neue Moves (v8):** Jede Figur hat jetzt ein eigenes Moveset mit eigenen Stärken/Schwächen (Anzeige in der Charakterwahl, komplette Liste im Menü **M → Moves**). Zusätzliche Eingaben: **→ + K / → + L** (Command-Normals), **← + U** (Rück-Special), **U in der Luft** (Luft-Special), bei Wellen/Specials bestimmt **J/K/L** die Stärke (schnell/schwach … langsam/stark).

**HUD (v10):** Gold-/Tusche-Design mit Klingen-Lebensbalken, Portraits, Ring-Uhr und Pinsel-Combo-Zähler.

**Gasse zwischen Hochhäusern (v16):** Der Kampf beginnt in einer engen Gasse. Wer einen Gegner in der Ecke weiter bearbeitet (oder ihn mit Wucht dagegen schleudert), bricht die Erdgeschoss-Wand des Hochhauses durch – links in eine Spielhalle, rechts in eine Lobby. Mit jedem Durchbruch wird die Arena breiter (voll geöffnet 2140 px). Werte: `BARRIER` in `src/core/config.js`.

## Credits
Sound effects: "Hitstop – Punch, Kick & Hit Feedback SFX (FREE Lite)" by yetiancai (itch.io), siehe `sfx/LICENSE.txt`.

## KITSUNE (Neunschwanz-Fuchs) – dritte spielbare Figur
- Assets: `assets/kitsune/` (16 Posenbögen in `sheets/`, `atlas.webp`, `meta.json`, `meta.js`, Referenzbild in `referenz/`).
- Import: `python3 tools/import-kitsune-sheets.py` (entfernt Trennkreuz, Beschriftungen, Ziffern, aufgemaltes Schachbrett; Bericht in `assets/kitsune/sheets/_bericht.txt`, Kontrollbild `_vorschau.png`).
- Animationen: `KITSUNE_ANIMS` in `src/render/sprites.js`; Werte in `src/core/characters.js`; Moves in `src/core/movesets.js`.
- Hyper H!T: **Blitz-Kamehameha** (Blitz schlägt ein, lädt ihn auf, Blitzstrahl nach vorn, 12 Treffer + Launcher).
- Hyper (I, 1 Balken): **Neunschwanz-Inferno** – neun Geisterfeuer-Schwänze fegen nach vorn (9 Treffer + Launcher).
- Noch Behelfe: Duck-Schlag (`cpunch` nutzt den Ausfall), Feuer-Special (`special` nutzt Schlag-Frames), Heavy-Anfang teilt sich Frames mit dem Jab.

## Zweite Farbe (Skins)
- Jede Figur hat 2 Farben: Tiger blau/**weiß**, ST3-G0 grün/**graublau**, Kitsune grau/**lila**. Definition + Farbtausch: `src/render/skins.js` (der Atlas wird beim ersten Gebrauch per HSV umgefärbt, keine zusätzlichen Bilddateien).
- Auswahl: im Arcade-Menü **C** (wirkt auf die markierte Figur, gilt auch, wenn du gegen sie kämpfst); im 2-Spieler-Modus **C** (P1) / **L** (P2). Gleiche Figur + gleiche Farbe → P2 bekommt automatisch die andere. Die Wahl wird im Browser gespeichert.
- Weitere Farbe: Eintrag in `SKINS` + Regel in `RULES` ergänzen.

## Melee-Modus (Smash-Stil)
Im Startmenü mit **TAB** auf *MELEE* schalten (oder Schalter anklicken). Kämpfer + Stage wählen wie bei 2 Spieler.
- Schaden wird in **%** gezählt, je höher, desto weiter fliegt man. Raus aus dem Bild (Blast-Zone) = **Stock** weg, dann Respawn auf der schwebenden Scheibe.
- Offene Plattform ohne Wände, Kanten runterlaufen = fallen. Zurückkommen mit Doppelsprung/Air-Dash.
- **Rettungssprung (nur Melee):** in der Luft **Hoch + Special** (W/↑ + U bzw. T/I im 2-Spieler-Modus) – kurzes Verharren, dann steiler Aufstieg, seitlich steuerbar. Einmal pro Luftphase (Landung oder getroffen werden gibt ihn zurück), danach hilflos. Reicht nur, wenn man nicht zu weit draußen/tief hängt. Werte: `MELEE.rec` in `src/core/config.js`. Die KI nutzt ihn auch.
- Menü: **T** = Stocks (1–5), **B** = Spieler 2 Mensch/CPU (Standard: CPU; alle drei Optionen auch per Klick), **▲▼** = CPU-Stärke.
- Zeitlimit 8 min: mehr Stocks gewinnt, sonst weniger %.


## Endgegner Anubis
Im Arcade-Modus wartet nach allen Kämpfern Anubis als Endgegner. Einmal durchspielen schaltet ihn als spielbaren Kämpfer frei (Browser-Speicher). Zum Testen: `dist/hitisop.html?unlock=anubis` öffnen.

## Story-Modus (Insektenkrieger)
Im Startmenü mit **TAB** (oder Klick) auf *STORY* schalten, Kämpfer wählen. Du läufst durch ein Level (nach rechts); an fünf Stellen sperrt die Kamera, und **Mantis-Krieger springen in Gruppen von beiden Seiten herein** (3 → 4 → 5 → 6 → Alpha-Mantis mit Gefolge). Nur 2–3 greifen gleichzeitig an, der Rest kreist. Nach jeder Welle: Checkpoint, 30 % Leben zurück, Meter-Bonus. Bei Niederlage **Enter** = weiter ab Checkpoint, **Esc** = Menü.
- Logik: `src/core/story.js` (`ENC` = Wellen, `LV` = Level/Kampffeld), HUD/Welt: `src/render/storyhud.js`, Gegner: `mantis`/`mantisAlpha` in `src/core/characters.js`.
- Sprites: `assets/mantis/` (4 Posenbögen in `sheets/`), Import: `python3 tools/import-mantis-sheets.py`, Animationen: `MANTIS_ANIMS` in `src/render/sprites.js`.
- Test: `node tests/story.test.js`. Schwierigkeit (↑↓ im Menü) bestimmt KI-Stärke und Mantis-HP.

## Booster, Karten, Skins, Coins
- Besiegte Mantis lassen **Heilung (grüne Kapsel) oder einen Booster (goldene Karte)** fallen; bei wenig Leben immer Heilung. Drüberlaufen zum Einsammeln. Wellen-Ende: Heilung (35 %).
- **B** im Startmenü (Arcade/Story) oder nach Story-Ende öffnet das Booster-Overlay: Sammlung ansehen, mit Enter Booster öffnen. Jeder Booster = 3 Belohnungen: Coins (50 %), Sammelkarte (35 %), neuer Skin (15 %).
- Neue Skins (je 2 für H!T, ST3-G0, KITSUNE) erscheinen danach im Menü bei **C**. Coins sind für den späteren Shop gespeichert.
- Alles im Browser gespeichert (`hitisop.loot`). Logik: `src/core/loot.js` (`CARDS`, `SKIN_POOL`, Drop-Chancen in `rollOne`), UI: `src/render/lootui.js`. Test: `node tests/loot.test.js`.

## Eigener Hintergrund (Bild / Video, Drag & Drop)
- **Einfach ins Fenster ziehen:** Bild oder Video (JPG, PNG, WebP, GIF, MP4, WebM …) irgendwo in das Spielfenster ziehen und loslassen – es wird sofort der Hintergrund im Titelmenü, in allen Auswahlbildschirmen und im Kampf (Arcade, Story, 2 Spieler, Melee).
- **Oder hochladen:** Knopf **🖼 HINTERGRUND** (links unten im Titelmenü und in der Auswahl) oder Taste **H**; im Kampf über **M → Optionen → Eigener Hintergrund → Verwalten**.
- **Verwalten:** Im Panel kann man je Bereich (Überall / Titelmenü / Auswahl / Kampf) eine andere Datei setzen, einen Bereich auf den **Original**-Hintergrund zurückstellen oder alles entfernen. Außerdem: Abdunkeln, Füllen/Einpassen, leichte Kamerabewegung, Hochhaus-Wände im Kampf zeigen.
- Videos laufen stumm in Dauerschleife. Die Dateien bleiben im Browser (IndexedDB), nichts wird hochgeladen; sie sind nach dem Neuladen noch da.

## Booster aufreißen (Animation)
Im Booster-Overlay (**B**) mit **ENTER** (oder Klick) einen Booster öffnen: Das Päckchen schwebt ein, du **reißt es auf**, die drei Preise springen heraus und werden **einzeln groß aufgedeckt** – mit Titel (NICE / STARK / WOW / JACKPOT) und **Feuerwerk, das mit dem Wert wächst**. Für eine epische Karte gibt es die große Feuerwerksbombe, für neue Farben/Stages ein Finale-Feuerwerk. **ENTER** = weiter (überspringt auch die Spannung), **ESC** = alles überspringen.


## Online-Modus (2 Geräte, Internet)
- **Spielen:** Startmenü → **ONLINE** (oder Taste **O** im Titel-/Auswahlbildschirm). **Schnellsuche** (trifft jemanden, der auch sucht), **Raum erstellen** (4-stelliger Code + Einladungslink `…/?room=CODE`, der Freund landet nach dem Intro direkt im Raum) oder **Raum beitreten** (Code eingeben). Dann jeder Figur + Farbe wählen und BEREIT; der Gastgeber (Spieler 1, links) wählt die Stage und startet. Steuerung wie im Arcade (WASD + J K L U I O, Gamepad). Revanche: **ENTER** (beide müssen), Verlassen: **ESC**. Im Online-Kampf gibt es keine Pause.
- **Server:** `server/server.js` (Node + `ws`) liefert das Spiel aus und vermittelt die Spieler. Lokal: `online-lokal.sh` / `online-lokal.bat` (baut, startet, öffnet http://localhost:3000; für ein zweites Gerät die angezeigte WLAN-Adresse öffnen).
- **Render (einmalig):** Dashboard → New → **Blueprint** → Repo wählen (nutzt `render.yaml`: Web Service, Build `npm install --omit=dev && node tools/build.mjs`, Start `node server/server.js`). Den bisherigen Static Site danach löschen. Das Spiel muss über die Render-Adresse (https://…onrender.com) geöffnet werden, dann verbindet es sich automatisch. Gratis-Instanzen schlafen nach 15 min; das erste Verbinden danach dauert bis ~1 min.
- **Technik:** Lockstep mit Eingabe-Verzögerung (`src/core/netplay.js`, `netmatch.js`, `netclient.js`): nur Tasten werden übertragen, beide Geräte rechnen denselben Kampf (die Kampflogik ist deterministisch). Verzögerung = halbe Ping-Zeit + 3 Frames (min. 4, max. 16, bei 90 Rechenschritten/s). Alle 30 Frames wird ein Prüfwert verglichen; bei Abweichung (Desync) wird der Kampf beendet. Festes Tempo online (`SPEED`), damit beide gleich schnell rechnen.
- **Nur 2 Spieler (Versus):** Melee/Arcade/Story sind nicht online. Die eigene hochgeladene Figur gibt es online nicht. Wichtig für Änderungen an der Kampflogik: **kein `Math.random()`, keine Zeit/Bildrate und keine lokalen Einstellungen im Ablauf** (nur in Effekten), sonst Desync. Tests: `node tests/netplay.test.js` (Leitung mit Verzögerung/Jitter/Verlust), `node tests/online.test.js` (echter Server + WebSockets), Browser: `python3 tests/e2e-online.py`.
- Optional feste Server-Adresse für die Doppelklick-Version: `HITISOP_ONLINE_URL=https://…onrender.com node tools/build.mjs`.

## Controller (PS4 / PS5 / Xbox)
- Controller einfach per **Bluetooth** (Mac: Systemeinstellungen → Bluetooth, Controller mit PS + Share/Create-Taste in den Kopplungsmodus) oder USB-Kabel verbinden, im Spiel **eine Taste drücken** (Browser-Regel) – oben erscheint „… verbunden“. Nichts einzustellen.
- Kampf: Stick/Steuerkreuz bewegen (hoch = Springen) · ✕ Light · ▢ Medium · △ Heavy · ○ Special · R1 Hyper · L1/R2 Dash · Options = Pause. 1 Controller = Spieler 1 (Arcade/Melee gegen CPU) bzw. Spieler 2 (2 Spieler), 2 Controller = je Spieler einer.
- Menüs: Stick/Kreuz wählen · ✕ bestätigen · ○ zurück · ▢ Farbe · △ Booster · L1/R1 Modus · L2 Shop · Options Pause. Im Pausenmenü: ↑↓ Eintrag, ←→ Wert/Reiter, ✕ auslösen.
- Controller-Abbruch im Kampf pausiert das Spiel. Code: `src/core/gamepad.js` (Erkennung, Belegung), `KeyboardInput.pollPad` (Kampf), `padMenu` in `src/main.js` (Menüs). Test: `tests/gamepad.test.js`. Editor/Online-Lobby (Texteingabe) weiter mit Maus/Tastatur.
