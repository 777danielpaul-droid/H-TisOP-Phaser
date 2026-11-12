# Übergabe – H!TisOP (Stand: Arcade-Modus mit 4 Kämpfern + Endgegner)

## Was das Projekt ist
2D-Beat-'em-up im Stil von Marvel vs. Capcom 2, reines HTML5-Canvas ohne Abhängigkeiten, läuft per Doppelklick (`start.bat` / `start.sh` / `index.html` / `dist/hitisop.html`).

## Fertig und getestet (automatische Tests, siehe unten)
- Kampfsystem: Chains/Cancels, Launcher + Luft-Combos (Doppelsprung-/Air-Dash-Cancel), Block/Chip, Schadensskalierung, Hitstop, Super (Hyper-Beam), Meter, Combo-Zähler, harter Knockdown nach Launcher.
- Bewegung: Doppelsprung, Coyote-Time, Jump-Buffer, Dash/Air-Dash, hohe Sprünge; Spieltempo einstellbar (Standard 1.5×).
- Kamera mit echtem Zoom/Schwenk (alle Welt-Objekte skalieren, HUD nicht), Weltgrenzen.
- KI mit 4 Schwierigkeitsstufen (Leicht/Normal/Hart/Alptraum); Endgegner +1 Stufe (bei Alptraum bereits am Maximum).
- **Arcade-Modus:** Startmenü mit Charakterwahl (Tastatur + Maus), Gegner-Leiter (alle anderen spielbaren Figuren, kein Endgegner mehr), je Stage 2 Runden-Siege, eigenes Level je Stage (4 Themes), Stage Clear / Game Over (Enter = nochmal) / Victory.
- Figuren: **H!T** (`tiger`, Sprites) und **ST3-G0** (`st3g0`, Sprites) sowie die **Eigene Figur** (Upload im Startmenü). Der **Wolf** (Vektor) ist noch im Code (Test-Gegner), aber nicht im Roster. Master, Palm Master, Sorceress und Minotaurus (inkl. Endgegner-Logik, Sprites, Movesets, Aura/Partikel, Projektil-Looks, Spezial-Mechaniken Griff/Heilen/Falle/Durchdringen/Hörner-Stoß) wurden entfernt.
- HUD (flashy), Pause-/Optionsmenü auf M, Vollbild auf F.

## Gasse zwischen zwei Hochhäusern (NEU, ersetzt die einseitige Hauswand)
- Start in einer engen Gasse (`WALL_L=110` .. `WALL_R=850`, 740 px). Links und rechts steht je ein Hochhaus, dessen Fassade ohne Dach bis über den oberen Bildrand reicht (Stockwerke, teils beleuchtete Fenster). Die Erdgeschoss-Wand zur Gasse ist die brechbare Begrenzung.
- Wird ein in die Ecke gedrängter Gegner getroffen, nimmt die Wand Schaden (Risse, HP-Balken, Blitz). Bricht sie, fliegt der Gegner ins Gebäude, die Grenze rückt um `BARRIER.width` (1000 px) nach außen, Banner „DURCH DIE WAND!“ mit Pfeil zur Seite. Je Seite ein Durchbruch, danach unzerstörbare Rückwand. Beide Seiten unabhängig: voll geöffnet ist die Arena 2740 px breit (Gasse 740 + 2×1000). Jede Runde startet wieder mit heilen Wänden.
- Rechts: Lobby (Marmorboden, Säule, Aufzugbank mit Etagenanzeige, Wanduhr, Sofa, Empfang, Pflanzen). Links: Spielhalle (Arcade-Automaten, Greifautomat, Highscore-Tafel, Preis-Tresen, Neonröhren, Neon-Gitterboden). Fassaden/Schilder: „GRAND TOWER“ / „GAME CENTER“, Farben aus dem Level-Theme.
- Schaden: Treffer auf Gegner in der Ecke (0,9 × Moveschaden, Launcher/harte Treffer ×1,5, geblockt ×0,35, ohne Combo-Skalierung) + Aufprall mit Tempo > 3. Werte: `BARRIER` in `src/core/config.js` (`steps` je Seite, `width`, `hp` 300, Multiplikatoren).
- Logik: `src/core/barrier.js` (`Arena`, `game.arena`; `l/r` = aktuelle Grenzen, `endL/endR` = Rückwände, `openT.L/.R` = Frames seit Bruch). Grenzen immer über `game.arena.l / .r` abfragen. Darstellung: `Renderer.houseLayers(theme, side)` (3 statische Offscreen-Ebenen je Seite: `upper`, `ground`, `inner`; nur das aktuelle Level bleibt im Speicher) und `houseSide()` (Risse, Blitz, Trümmer, HP-Balken), `areaBanner()`. `WORLD` = -1020..1980 (3000 px). Test: `node tests/arena.test.js`.
- Nicht im Browser geprüft (nur headless + Screenshots): Gefühl/Balancing, Performance der großen Offscreen-Ebenen (Stage-Cache ~4000 px breit). Das Gebäude-Set gilt für alle 4 Levels (inkl. Labyrinth). Ideen: KI nutzt die Ecke, Zuschauer/Items in den Gebäuden, andere Innenräume pro Level.

### Update v15: breitere Häuser, Decke, KI nutzt die Ecke
- **Breite:** `BARRIER.width` 700 → 1000, `WORLD` auf -1020..1980 erweitert. Lobby und Spielhalle haben zusätzliche Einrichtung (zweite Sitzgruppe + „LOUNGE“, Neonschilder „TOKENS“/„2 PLAYER“/„HYPER!“); Automaten-Reihe füllt sich automatisch. Performance der größeren Offscreen-Ebenen (Stage-Cache ~4500×1350 px) nicht im echten Browser geprüft.
- **Decke:** `HOUSE={top:150,ceil:168}` in `config.js` (top = Oberkante Erdgeschoss-Wand, ceil = Unterkante der Innendecke; beides gemeinsam verschieben). Im aufgebrochenen Gebäude (`arena.inside(x)` = 'L'|'R') darf der Kopf (Luft-Hurtbox, 132 × Größe) nicht über `ceil`; Aufprall an der Decke gibt Staub + leichten Shake (`Fighter.ceiling()`). Der Hof/die Gasse hat keine Decke. Vom Hof aus gilt die Decke als Türsturz: mit dem Kopf darüber stoppt man an der Wandlinie, tief fliegend (z. B. durch die Bresche geschleudert) kommt man hinein. Der Renderer zeichnet die Wand höher (`top` 190 → 150).
- **KI:** `AI_LEVELS[].corner` (0,12 / 0,5 / 0,85). `AIController.corner()`: Steht der Gegner < 150 px vor der Wand → Dash/Projektil/Normals/Launcher (1,5× Wandschaden), weniger Abwarten und kürzere Pausen; steht die KI selbst < 100 px vor der Wand → Ausbruch per Sprung über den Gegner oder Poke; kein Rückzug in die eigene Wand. Tests: `tests/ai.test.js` (Ecken-Vergleich), `tests/arena.test.js` (Decke, Türsturz, Breite).
- Nicht im Browser geprüft: Gefühl der Decke (Sprunghöhe im Haus ≈ 170 px statt ~300 px), Balancing der Wandbrüche durch HART.

### Update v16: Sound (Hitstop Punch/Hit SFX FREE Lite, yetiancai)
- **Dateien:** `sfx/*.ogg` (26 Samples + `LICENSE.txt`), vom Build als Data-URI in `window.__SFX__` eingebettet (läuft weiter per Doppelklick). Lizenz: im fertigen Spiel nutzbar, die Sounds dürfen nicht allein/als Pack weiterverteilt werden. Credit „Sound by yetiancai“ ist erwünscht.
- **Code:** `core/sfx.js` (reine Zuordnung, testbar), `render/audio.js` (`Sound`: WebAudio, Unlock bei erster Taste/Klick, Tonhöhen-Variation ±4 %, Mindestabstand je Sound, 28 Stimmen, Kompressor), `Game.sfx()/sfxList()` (no-op ohne `game.audio`), Hooks in `combat.js`, `fighter.js`, `barrier.js`, `game.js`. Optionen-Menü: Sound an/stumm + Lautstärke (gemerkt in localStorage `tf_volume`, `tf_mute`).
- **Zuordnung:** Stärke aus Move-Schaden (<45 leicht, <70 mittel, sonst schwer), Tritt = `anim` enthält „kick“. Schwung beim Start der aktiven Frames (`whoosh_light/heavy`, Launcher `heavy_hit_whoosh`, Rush zusätzlich `dash`); Treffer `punch_light/medium/heavy`, `kick_light`/`kick_heavy`; Launcher + Impact/Sweetener; Hyper-Finale `hit_critical`; harter Knockdown `heavy_hit_impact` + Landung `ground_slam`; Block `block_guard`, Rüstung `parry_clang`; Combo ab 2 Treffern `combo_step_01..04`; Fehlschlag mittlerer/schwerer Normals `whiff_miss`; Dash/Back-Dash/Air-Dash `dash`/`dodge`; Landung `land`, Knockdown `body_fall`; Wand `body_fall`, Bruch `heavy_hit_full` + `ground_slam`; Hyper-Start `hitstop_freeze`; K.O. `ko_hit`; Rundenstart `ui_round_start`; Projektil-Start `whoosh_heavy` (hoch gepitcht).
- **Nicht im Browser gehört/geprüft:** Lautstärke-Balance, Ogg-Vorbis in Safari (ältere Versionen spielen Ogg nicht; dann bleibt das Spiel still, kein Fehler). Tests: `tests/sfx.test.js`.

### Update v17: Pop-up / Feder-Effekt (MvC2-Luftkämpfe)
- **Idee:** Jeder normale Bodentreffer (kein Launcher, kein Knockdown, nicht geblockt) hebt den Gegner kurz an (`state='airhit'`, `pop=true`). Man kann per Jump-Cancel hinterher und in der Luft weiterschlagen; Launcher/`hard` bleiben wie vorher.
- **Werte:** `BOUNCE` in `src/core/config.js`: Stärke je Treffer nach Moveschaden (`L` < `mid` 45 ≤ `M` < `heavy` 75 ≤ `H`; Projektile `proj`, Mehrfachtreffer `multi`; pro Move überschreibbar mit `bounce:{vy,vx}`). Höhen ca.: L 25 px, M 32 px, H 94 px. `grav` (Schwerkraft im Pop), `drag` (Horizontal-Dämpfung), `land` (Erholung bei Landung), `cap` (ab dieser Höhe kaum Nachschub bei Re-Hits), `reach` (bis zu dieser Höhe reicht die Hurtbox im Pop bis zum Boden, damit Tiefschläge weiter treffen). `PHYS.hopV` = Sprung beim Jump-Cancel eines normalen Treffers (Launcher nutzt weiter `superJumpV`).
- **Logik:** `combat.js` (`bounceOf`, Pop-Zweig statt `state='hit'`), `fighter.js` (`pop`-Flag, Schwerkraft/Dämpfung, weiche Landung → `hit` mit `BOUNCE.land` statt Knockdown, Hurtbox-Verlängerung, Anim: erst `hit`-Pose, ab Frame 14 `airhit`). Jump-Cancel (`jc:true`) jetzt auch bei 5L/5M/5H/2L/2M/6M/6H. Wand: ein gefederter Gegner an der Wand zählt weiter als „in der Ecke“ (`pinned`), KI behandelt `opp.pop` wie Bodenstand.
- **Tests:** neu `tests/pop.test.js` (in `npm test`); `tests/hyper.test.js` erkennt „Wegfliegen“ jetzt über `p2.launched`, `tests/ai.test.js` hält gefederte Gegner an der Wand. `ai.test.js` (Ecken-Taktik, Marge 5 %) ist statistisch und kippt auch im Original gelegentlich.
- **Nicht im Browser gefühlt:** Balancing (Hoch-/Weite der Pops, Jump-Cancel-Timing), Optik der Pop-Pose je Figur.

### Update v18: Charakter-Rondell + Booster-Shop
- **Rondell (Arcade/Story-Menü):** `SelectScreen.carousel()` in `src/render/select.js` zeigt immer 3 Figuren, die mittlere ist gewählt (Enter/Klick = kämpfen). ◀ ▶ / A D schalten eine weiter (auch über das Listenende hinweg), Klick auf die linke/rechte Figur ebenfalls, Mausrad ebenfalls; Hover wählt nichts mehr. Die Position gleitet weich (`this.rp`, kürzester Weg). Maße/Abstände: `CAR` oben in `select.js`; Klickflächen `hitCar()`, `hitEdit()` (nur wenn die eigene Figur in der Mitte steht). Das 2-Spieler-/Melee-Menü hat je Spieler ein eigenes Rondell (`SelectScreen.vsRondell()`, Maße `VCAR`; P1 oben, P2 unten auf Höhe seines Profil-Blocks): P1 A/D, P2 ◀/▶, Klick auf Seitenfigur = dieses Rondell weiter (`hitVsCar`), Klick auf die Mitte = bestätigen.
- **Shop:** Angebote + Preise `SHOP` in `src/core/loot.js` (1 Booster = 100 Coins, 3 = 270, 5 = 425), `canBuy()`/`buyPack()`. Oberfläche als Modus `shop` im Booster-Overlay (`src/render/lootui.js`, `drawShop()`). Öffnen: Button „SHOP“ links neben dem Booster-Zähler im Startmenü (nur Arcade/Story), Taste P (auch auf Game-Over/Victory-Screen), oder „P – SHOP“ in der Booster-Übersicht. Im Shop: ◀ ▶ wählen, Enter/Klick kaufen, ESC/P/„ZURÜCK“ zurück. Solange das Overlay offen ist, gehen Klicks nur an das Overlay (vorher fielen sie ins Menü dahinter durch). Zustand/Logik: `main.js` (`lootOpen`, `shopBuy`).
- Im echten Browser (Headless-Chromium) geprüft: Rondell-Drehung inkl. Umlauf, Klicks, Shop-Kauf, zu wenig Coins, Booster öffnen. Nicht geprüft: Balancing der Preise (Coins gibt es nur aus Boostern, ca. 35-40 pro Pack), Gefühl der Drehgeschwindigkeit. Test: `tests/loot.test.js`.

## Update v20: Intro-Video + eigene Musik-Playlists
- **Intro:** `assets/intro/intro.mp4` (stumm, H.264, 12 s; Original `introvideo1.mp4` mit crf 27 neu komprimiert, 9 → 5 MB). Der Build bettet es als Data-URI in `window.__INTRO__` ein (läuft weiter per Doppelklick). `render/intro.js` (`Intro`) spielt es als DOM-Overlay `#intro` (index.html + CSS am Ende von `styles/main.css`) beim Start vor dem Titelmenü. **Enter / Esc / Klick auf „Überspringen“** beendet es; ein gehaltenes Enter startet danach nicht gleich den Modus (450 ms Sperre). Während des Intros steht das Spiel still, die Menümusik (Original oder eigene Playlist) läuft schon; Browser erlauben Ton erst nach einer Eingabe: ist der Ton gesperrt, zeigt das Intro zuerst einen schwarzen Startbildschirm „Beliebige Taste drücken oder klicken“ (`#intro-gate`); die erste Eingabe startet Video + Menümusik gemeinsam. Ist Ton schon erlaubt, entfällt der Startbildschirm; Fenster-Blur öffnet das Pausenmenü dann nicht. Lässt sich das Video nicht abspielen (Fehler/Codec/5 s ohne Start), geht es ohne Intro weiter. Anderes Intro: `assets/intro/intro.mp4` ersetzen und neu bauen.
- **Eigene Playlists:** Je eine für die **Menü-Musik** (Titelmenü + Auswahlbildschirme) und die **Kampf-Musik** (Kampf + Zwischenbildschirme). Panel `render/musicpanel.js` (`MusicPanel`, Daten `MusicStore`): Knopf „♪ Eigene Musik“ links unten im Titelmenü/Auswahl, Taste **N**, oder Pausenmenü (M) → Optionen → „Eigene Musik“. Lieder per „Lieder wählen“ (mehrere) oder Drag & Drop auf die Spalte; ▲▼ Reihenfolge, ✕ entfernen, „Alle entfernen“, „Eigene Playlist verwenden“ an/aus, „Zufällige Reihenfolge“. Das gerade laufende Lied ist markiert.
- **Speicherung:** Audiodateien in IndexedDB `hitisop_music`/`tracks` (nur lokal im Browser), Schalter in localStorage `tf_pl_on_<menu|fight>`, `tf_pl_shuf_<…>`. Ohne IndexedDB gilt die Playlist nur für die Sitzung (Hinweis im Panel).
- **Wiedergabe (`render/audio.js`):** `Sound.setPlaylist(kind,items,on,shuf)`. Lieder laufen als `<audio>` (gestreamt, nicht komplett dekodiert) über `createMediaElementSource` auf den Musik-Bus, also gelten Musik-Regler, Stumm und Limiter. Reihenfolge der Reihe nach, am Ende wieder von vorn (Einzellied = Loop). Aktive Playlist ersetzt den eingebauten Track des Bereichs (Crossfade); ohne Lieder / ausgeschaltet / alle Lieder nicht abspielbar → Original-Musik. Wechsel Menü ↔ Kampf: die Playlist macht beim Zurückkommen am selben Lied weiter. `suspend()/resume()` pausieren die `<audio>`-Elemente (Tab im Hintergrund).
- **Tests:** neu `tests/playlist.test.js` (in `npm test`). Im echten Chromium geprüft: Intro läuft/Skip/Ende, Panel, Upload (WAV/MP3/OGG), Reihenfolge, Persistenz nach Reload, Menü- und Kampf-Playlist. Nicht geprüft: Safari/Firefox (FLAC/Opus je nach Browser nicht abspielbar → wird beim Hinzufügen abgelehnt), sehr große Playlists.
- Bekannt (schon vorher): `tests/hyper.test.js` schlägt für `mantis` fehl („Hyper gestartet“), `tests/smoke-melee.cjs` meldet OK, beendet sich aber nicht von selbst.

## Deploy auf Render / Git (wichtig)
- **Keine Musik auf Render – Ursache:** `.gitignore` enthielt `*.ogg` (auch `*.png/*.jpg/*.webp/*.woff2`). Dadurch wurde `music/menu.ogg` + `music/fight.ogg` nie committet (menu.ogg sogar aus dem Repo gelöscht), Sounds (`sfx/`) waren nur wegen früherer Commits drin. Der Build bettet Musik nur ein, wenn die Dateien existieren → Render hatte Effekte, aber keine Musik. Jetzt: Ignore-Regeln entfernt, `music/*.ogg` müssen im Repo liegen; `tools/build.mjs` bricht auf Render/CI mit Fehler ab, wenn `music/menu.ogg` oder `music/fight.ogg` fehlt.
- **Repo wird ständig größer – Ursache:** `dist/` (3 × ~25 MB, Base64 von Video/Sprites/Musik) war committet; jeder Commit legte ~40 MB neu in `.git` ab (159 MB). Das Spiel selbst wächst beim Öffnen nicht (geprüft: localStorage/IndexedDB bleiben gleich). Jetzt: `dist/` ist nicht mehr im Repo (steht in `.gitignore`), Render baut selbst.
- **Render-Einstellungen:** Build Command `node tools/build.mjs`, Publish Directory `dist` (oder `render.yaml` als Blueprint).
- `assets/intro/poster.jpg` (Standbild fürs Intro) wird – falls vorhanden – eingebettet.

## HUD (v10): Gold-/Tusche-Design
- `src/render/hud.js` ist das Martial-Arts-HUD (Tusche-Platten, Klingen-Lebensbalken, Portraits im Goldring mit Hanko-Siegel, Ring-Uhr, Pinsel-Combo-Zähler, Ensō-Banner). Serifenschrift mit CJK-Fallback (Kanji 武 闘 勝 壱 弐 参 brauchen eine Systemschrift mit CJK, sonst Kästchen).
- Eigene Ergänzungen über das gelieferte HUD hinaus: Stage-Anzeige unter dem Timer (`STAGE n / total`) und Arcade-Banner (Stage Clear / Game Over / Arcade geschafft) im selben Stil.
- Portraits: `drawPortrait()` in `sprites.js` (Ausschnitt des ersten Idle-Frames); Figuren ohne Sprite (Wolf) bekommen den Anfangsbuchstaben.
- Die Charakterwahl nutzt dieselben Text-Helfer (`hud.fancy/txt/lab`), Titel ist an den Gold-Stil angepasst.

## Movesets (v8)
- Neue Datei `src/core/movesets.js`: Moves/Werte je Figur (Normals-Tuning via `norm()`, 7 Specials/Command-Normals je Figur, Hyper). Figurenwerte (`def`, `jump`, `dash`, `airJumps`, `meter`, `pros/cons`, KI-Werkzeuge `ai`) in `characters.js`.
- Neue Engine-Features: Rüstung (`armor`), Griff (`unb`), Teleport (`tp`), Sturzflug (`dive`), Heilung/Meter (`heal`/`gain`), Varianten je Taste (`v`), mehrere/gebogene/durchdringende Projektile (`proj` als Liste, `vy/grav/pierce/uniq/look`).
- Neue Eingaben: →+K/L (6M/6H), ←+U (`back`), U in der Luft (`airsp`). Nachteil: Vorwärts laufen + K/L löst jetzt das Command-Normal statt 5M/5H aus.
- Test: `node tests/moves.test.js`. Balancing nur per KI-gegen-KI (Skript-Idee: 30 Matches je Paarung) – im Browser mit echten Spielern prüfen!

## NICHT getestet (wichtig!)
- Alles wurde headless (Node + node-canvas, Screenshots) geprüft, **nie in einem echten Browser**. Zu prüfen: Eingabegefühl, Tempo, Mausklick/Hover im Startmenü, Vollbild, `localStorage`, Performance (große WebP-Atlanten), Fenster-Blur-Pause.
- Balancing der Figuren/KI nur grob (KI-Test gegen passiven Spieler).

## Bekannte Behelfe / offene Punkte
1. **Tiger** (Sprites aus `assets/tiger/source/`, Atlas via `python3 tools/make-sprites.py tiger`): keine Lauf-/Sprung-/Duck-Frames (Idle schnell + Wippen, Kick-Pose in der Luft, kniende Get-up-Pose zum Ducken), keine Sieg-Pose (Rising-Claw-Pose), `hit_light_*` (nur Kopf) ungenutzt. Zuordnung: `TIGER_ANIMS` in `src/render/sprites.js`. Die Vektor-Figur (`rig.js`) wird nur noch für den Wolf benutzt.
2. Kein Sound, kein Gamepad, kein 2-Spieler-Modus, keine Rundenzeit-/Schwierigkeits-Persistenz außer Schwierigkeit (localStorage).
3. Sprite-Zuordnung (Frame-Listen) steht in `src/render/sprites.js` (`*_ANIMS`) – dort lassen sich Posen einfach tauschen, wenn bessere Sheets kommen.

## Wo was liegt
- Architektur + Erweiterungen: `docs/ARCHITECTURE.md` (Zustandsautomat, Physik, Kamera, Arcade, Stages, Sprites).
- Frame-Daten/Moves: `src/core/moves.js` · Charaktere/Roster/Leiter: `src/core/characters.js` · KI-Stufen: `src/core/ai.js` (`AI_LEVELS`) · Kamera-Werte: `src/core/config.js` (`CAMERA`) · Level-Themes: `src/render/stage.js` (`THEMES`) · Startmenü: `src/render/select.js`.
- Assets: `assets/<id>/atlas.webp + meta.json` (fertig gepackt). Tiger neu packen: `python3 tools/make-sprites.py` bzw. Posenbögen via `tiger-update`; ST3-G0: `st3g0-update` (Pillow + numpy + scipy nötig).

## Bauen und testen
- Bauen (Node): `node tools/build.mjs` oder `build.bat`/`build.sh` → erzeugt `dist/game.js` und `dist/hitisop.html` (Sprites eingebettet). **Nach jeder Code-Änderung in `src/` neu bauen**, sonst läuft `index.html` mit altem Stand.
- Tests (Node, kein Browser): `node tests/sim.test.js` (Kampfsystem), `node tests/camera.test.js`, `node tests/ai.test.js`, `node tests/arcade.test.js` (Arcade-Ablauf), `node tests/smoke.cjs` (Bundle mit DOM-Stub; Sprite-Bilder werden dort nicht geladen). Alle zusammen: `npm test` (+ smoke separat).

## Sinnvolle nächste Schritte
1. Im echten Browser durchspielen (beide Figuren, Arcade, Game Over/Retry, Menü M, Vollbild F) und Fehler/Gefühl notieren.
2. Fehlende ST3-G0-Posen nachliefern lassen (siehe `docs/ST3G0_PROMPTS.md`) und in `ST3G0_ANIMS` eintragen.
3. Balancing: `AI_LEVELS`, Charakterwerte in characters.js, Frame-Daten.
4. Optional: Sound, Gamepad, 2-Spieler, Wolf ins Roster.

## Arbeitsweise-Wünsche des Auftraggebers (bitte beibehalten)
- Nach jeder Code-Änderung das Projekt als ZIP ausliefern, ohne dass man danach fragen muss.
- Bei Einrichtung/Konfiguration darf nichts manuell eingetippt werden müssen (alles fertig im Projekt/ZIP, höchstens ein Skript zum Ausführen).
- Sprache: Deutsch.

## Tiger-Qualität (NEU): Sheet-Pipeline
- Problem: Tiger-Frames sind klein/weich (~260 px Standhöhe) und zu wenige (6 Idle, 3–4 pro Angriff).
- Lösung: neue Gemini-Sheets (3×2 bzw. 4×2 Zellen, grüner Hintergrund) nach `assets/tiger/sheets/` legen und `TIGER-UPDATE.bat` / `tiger-update.sh` ausführen. Prompts + Dateinamen: `docs/TIGER_PROMPTS.md`, Referenzbild: `assets/tiger/referenz/tiger_referenz.png`.
- `tools/import-tiger-sheets.py`: Hintergrund entfernen, Raster schneiden (Lückenerkennung, sonst gleichmäßig), Maßstab über Zelle 1 (= neutrale Haltung, Standhöhe 300), Fußlinie + horizontaler Schwerpunkt je Frame, Atlas + `meta.anims`. Die Zuordnung Sheet → Spiel-Animation steht in `ANIMS` im Skript.
- `sprites.js` übernimmt `meta.anims` automatisch (überschreibt nur Animationen, für die Sheets da sind; Rest bleibt `TIGER_ANIMS`). `fighter.js`: `air`-Animation läuft jetzt nach Flugbahn (vy).
- Pipeline wurde nur mit künstlichen Test-Sheets (alte Tiger-Frames auf Grün) geprüft, noch nicht mit echten Gemini-Sheets.

## Eigene Figur im Startmenü (NEU)
- Startmenü hat jetzt 5 Karten: 4 Kämpfer + Slot „EIGENE FIGUR“ (leer = gestricheltes „+“; Klick/Enter öffnet den Editor; mit Figur: Karte spielbar, „✎ EDIT“-Knopf oder Taste E bearbeitet). Auch im Pausenmenü (M) → „Editor öffnen“. `ROSTER` bleibt unverändert (4 Einträge, Tests), der 5. Slot ist `'custom'` und existiert nur, wenn `CHARACTERS.custom` registriert ist.
- Editor (`src/render/customstudio.js`, HTML wird dynamisch erzeugt, CSS `styles/main.css` ab „Eigene Figur“): Sheets per Drag&Drop (Dateiname → Slot, z. B. `idle_1.png`) oder je Slot „Wählen“; Live-Vorschau mit Animationsauswahl; Name, Moves-Vorlage (H!T/ST3-G0), Leben/Tempo/Schaden/Abwehr, Leuchtfarbe; „Prompt“-Knopf je Sheet kopiert fertigen Gemini-Prompt (Figurenbeschreibung vom Nutzer). Nötig ist nur `idle_1`; fehlende Animationen übernehmen Behelfe (`cusCompleteAnims`).
- Logik ohne DOM in `src/core/custom.js` (Hintergrund entfernen, Raster, Maßstab über Zelle 1, Anker, Animationen, Figurenwerte, Prompts) = JS-Gegenstück zu `tools/import-tiger-sheets.py` (gleiche Sheet-Namen/Raster/ANKER-Logik; bei Änderungen beide anpassen). Unterschied: Im Editor sind spätere Teile (idle_2, walk_2) optional, das Python-Skript verlangt beide.
- Speicherung: IndexedDB `hitisop`/`custom`/`fighter` (Profil, Original-Sheets, fertiger Atlas als Blob, Meta). Geladen beim Start (`studioLoadSaved`). Laufzeit-Registrierung: `registerSpriteChar('custom',…)` in `sprites.js` + `window.__SPRITES__.custom={meta,img}`.
- Tests: `npm test` (inkl. `tests/custom.test.js`: reine Logik + Simulation gegen KI). UI-Tests mit simuliertem Browser in `tests/dom/` (eigene Installation: `npm i` dort; `studio.test.mjs`, `e2e.test.mjs`). Echter Browser (Layout/CSS des Editors, große Bilder, Safari/Firefox-WebP) noch nicht geprüft.

## Merge-Stand (hitisop_2 + Editor für die eigene Figur)
- Zusammengeführt: deine Arena-/HUD-/Effekt-Änderungen (`barrier.js`, Gasse mit Häusern, Neon-`hud.js`, `EFFECT`, `tests/arena.test.js`) mit dem Tiger-Sheet-Import und dem Editor für die eigene Figur. Gemeinsame Basis war `hitisop12`; nur `package.json`, `tools/build.mjs` (ORDER) und `HANDOVER.md` wurden von beiden Seiten geändert und von Hand zusammengeführt.
- Nicht übernommen: die lose Datei `"/Users/danielpaul/Desktop/hitisop 2/src/render/hud.js"` im ZIP (nur ein 4-KB-Schnipsel mit einer weiter auf Neon umgestellten `hpBar`-Methode; `hud.js` im Projekt enthält noch die ältere `hpBar` mit `GOLD`). Bei Bedarf Methode `hpBar` in `src/render/hud.js` durch den Schnipsel ersetzen.
- Hinweis: Die Überschrift „HUD (v10): Gold-/Tusche-Design“ weiter oben beschreibt noch den alten HUD-Stil.

## Update v18: neue Tiger-Posen-Bögen + langsameres Idle
- **Neue Assets:** `assets/tiger/sheets/neu_bewegung.png`, `neu_tritt.png`, `neu_schlag.png`, `neu_posen.png` (je 2×2 Posen, neuer Look: hellblauer Gürtel, weiße Handwickel). `tools/import-tiger-sheets.py` erkennt diese Bögen per zusammenhängender Figur (`slice_poses`, braucht scipy), auch wenn Arme/Füße über Zellgrenzen ragen; Hintergrund: Transparenz bzw. Ecken-Farbe (neu_posen hatte ein eingebackenes Schachbrett).
- **Zuordnung:** `ANIMS_NEU` im Skript (Kommentar dort zeigt, welche Zelle welche Pose ist). Neu aus den Bögen: idle, walk, dash, airdash, air, crouch, cblock, block, punch, heavy, kick, cpunch, ckick, jpunch, jkick, jheavy, upper, special. **Noch alte Behelfs-Frames (alter Look):** hit, airhit, kd, wakeup, win – dafür fehlen neue Posen.
- **Idle langsamer:** `IDLE_FPS = 6.5` im Skript (vorher 10 fps → Schleife ca. 0,9 s statt 0,6 s). Idle = 4 neutrale Haltungen als Ping-Pong. Rückfall-Idle in `sprites.js` (`TIGER_ANIMS`) von 10 auf 7 fps.
- **Neu einlesen:** `TIGER-UPDATE.bat` / `tiger-update.sh` (Atlas + Build). Dist-Build erzeugt zusätzlich `dist/index.html` (Render Static Site).

## Update v19: Modern-/Immersion-Look
- **Schriften** (offline eingebettet, `assets/fonts/*.woff2` → `window.__FONTS__`, Registrierung `render/fonts.js`): Bebas Neue (Banner/Namen), Orbitron (Logo), Rajdhani (UI-Text). Lizenzen (OFL) liegen daneben.
- **Neu `render/fx.js` (PostFX):** Bloom, Vignette (rot pulsierend bei niedrigem Leben), Filmkorn, chromatische Aberration, Impact-Frame mit Speedlines, Staubpartikel, Lichtstrahlen, Boden-Licht unter den Kämpfern, Schadenszahlen.
- **Game Feel:** Kamera-Zoom-Punch + Rückstoß in Schlagrichtung (`Camera.kick`, `Game.kickX/Y`), Zeitlupe beim K.O. (`Game.timeScale`, in `main.js` auf die Schrittlänge angewendet), Schadenszahlen/„BLOCK“/„ARMOR“-Pops (`Game.pop`, `Game.hitFeel`), Flares/Schlagstreifen/Bodenwellen (`particles.js`, `effects.js`). Werte in `EFFECT` (`config.js`).
- **UI:** Charakterwahl mit Glitch-Logo, Lichtstrahlen, Staub; Pausenmenü (CSS am Ende von `styles/main.css`) im Glas-/Neon-Stil.
- Geprüft in echtem Chromium (Screenshots, keine Konsolenfehler) + alle Node-Tests/Smoke. Nicht geprüft: Performance auf schwacher Hardware (Bloom/Aberration laufen auf der Canvas-Auflösung; bei Rucklern in `PostFX.scene` Bloom-Wert senken oder `aberr` entfernen), Safari/Firefox.

### Update v19b: Effekte stärker, Zahlen raus, Sieger-Finale
- Schadenszahlen/BLOCK-Pops entfernt (`Game.pop` bleibt ungenutzt im Code, wird nirgends aufgerufen).
- `core/particles.js`: neue Typen `glitter` (funkelnde Sterne), `shard` (kippende Splitter), `starpop` (Comic-Zackenstern), `marker` (Fadenkreuz-Hitmarker), `bolt` (Blitzbogen), `rocket` (Feuerwerk). `core/effects.js`: `hit/block/combo/ko/dash` damit deutlich dichter.
- Sieger-Finale: `Effects.win()` (Auftakt-Explosion) + `Effects.celebrate()` (Dauerbetrieb: Feuerwerk, Glitzerregen, aufsteigende Funken, Druckwellen), `Game.celeb`; Lichtsäule + rotierende Strahlen in `Renderer.celeb()`.
- Feuerwerk ersetzt (aus Ghostwriter `src/ui/visualizer.js` übernommen): `ParticleSystem.rocket(x,y,ty,color)` lässt eine Rakete mit Schweif aufsteigen, `boom()` sprengt sie zu einer 3D-Kugel aus 210 blinkenden Sternen (Fibonacci-Kugel, Luftwiderstand, Schwerkraft, Kreuz-Funkeln, Blitz). Parameter in der Konstante `FW` oben in `core/particles.js`. Zündrhythmus im Sieger-Finale: `Effects.celebrate()` (alle 16 Frames bis Frame 200, danach alle 48). Test: `tests/fireworks.test.js`.

### Update v19c: Konfetti raus, nur dumpfe Schlag-Sounds
- Keine Splitter/Konfetti-Plättchen mehr (Treffer, K.O., Sieg). `ParticleSystem.shard/confetti` bleiben als ungenutzter Code.
- Sounds: Töne/Glocken (`combo_step_*`, `parry_clang`, `hitstop_freeze`, `hit_critical`, `heavy_hit_sweetener`, `heavy_hit_full`) werden nicht mehr abgespielt (Dateien bleiben in `sfx/`). Ersatz: `heavy_hit_impact`, `punch_heavy`, `ground_slam`, `block_guard`. Schwung-/Dash-Sounds und Projektil-Whoosh tiefer gepitcht (kein „Biu“), Master-Tiefpass 6,5 kHz in `render/audio.js`.

### Update v19d: ruhigere Animationen
- Startmenü: Idle-Tempo aller Karten gleich (`t/2`), kein 3×-Sprung mehr für die gewählte/gehoverte Karte. Menü-Zeit `selT` jetzt framerate-unabhängig (vorher lief sie auf 120/144-Hz-Monitoren zu schnell).
- Tiger-Laufen: 14 → 9 fps, Wippen 4 → 2, Neigung .08 → .04 (`assets/tiger/meta.json`, Quelle `tools/import-tiger-sheets.py`, Fallback in `sprites.js`). Angriffe unverändert.

### Update v19e: eigenes Design je Level
- `render/stage.js`: Stile `city` (Neon City, jetzt mit Neon-Regen), `temple` (Berge im Nebel, Pagoden, Torii, Laternenketten + Kirschblüten, Dojo-Ring am Boden), `docks` (Fabrikskyline, Wasser, Frachter, Containerkräne mit Warnlichtern, Containerstapel, Fässer, Nebel, Suchscheinwerfer, Hazard-Boden), `labyrinth` (Bogenhallen, Säulen, Fackelflackern, Glut, Runenkreis). Dynamische Elemente liegen in `Stage.dyn` und werden in `Stage.draw` animiert.
- `render/houses.js` (neu): Häuser je Stil, links/rechts verschieden – Tempel: Dojo + Drachen-Schrein; Docks: Lagerhalle + Kontrollraum; Labyrinth: Waffenkammer + Schatzkammer/Thronsaal. Neon City nutzt weiter Spielhalle/Lobby (in `renderer.js`). Neuer Stil = Eintrag in `THEMES` (`style`) + Funktion in `houses.js`.

### Update v19f: 2-Spieler-Modus (PvP)
- Startmenü: Modus-Schalter oben links (ARCADE | 2 SPIELER, Taste TAB). Ablauf: beide wählen Kämpfer (P1: A/D + G, P2: ◀/▶ + Enter) → Stage-Wahl (4 Level oder Zufall) → Kampf bis 2 Runden → „SPIELER n GEWINNT“ mit ENTER = Revanche, ESC = Kämpferwahl.
- Logik in `core/arcade.js` (`mode`, `vs`, `vsMove/vsConfirm/vsStart/startVersus/rematchVs`, State `vsover`), Test `tests/versus.test.js`.
- Eingabe (`core/input.js`): `VS1_*` (WASD + G H J / T Y / B), `VS2_*` (Pfeile + K L ; / I O P bzw. Ziffernblock), Gamepad-Support in `KeyboardInput.pollPad` (1 Pad = Spieler 2, 2 Pads = je Spieler eins). Zuweisung in `main.js` (`useInputs`, `assignPads`).
- UI: `render/select.js` (`drawVs`, `drawStagePick`, `modePill`), HUD-Labels SPIELER 1/2 + Stage-Name, Steuerungs-Tab im Pause-Menü erweitert.

### Update v20: neue Kämpferauswahl + Tiger heißt H!T
- `src/render/select.js` neu: Kämpfer links als kleine Figuren ohne Rahmen (3×2-Raster, Bodenlicht + heller Name bei Auswahl/Hover), rechts Profil des gewählten Kämpfers (Porträt, Name, Beschreibung, Balken für Leben/Tempo/Schaden/Abwehr, Stärken/Schwächen, Arcade-Gegner). `cardRect/hitCard/hitEdit` behalten ihre Signatur (main.js unverändert). Größenausgleich je Figur: `FIG` oben in der Datei.
- Schriften vereinheitlicht: Orbitron nur Logo, Bebas Neue für Namen/Prompt, Rajdhani für alle Labels/Texte.
- Anzeigename `TIGER` → `H!T` (characters.js, Editor-Vorlage in custom.js, Highscore-Tafel im Renderer). Interne ID `tiger` und Asset-Ordner unverändert. Movenamen „Tiger-Uppercut“/„Tigerhatz“ (movesets.js) noch nicht umbenannt.

### Update v21: H!T-Posen (Treffer/Sieg/Besiegt) + Feuerwerk bei der Auswahl
- Neue Bögen `assets/tiger/sheets/neu_treffer.png`, `neu_sieg.png` (2×2, Transparenz). `tools/import-tiger-sheets.py`: `REF_H` = feste Standhöhe als Maßstab (Zelle 1 ist dort keine neutrale Haltung); Zell-Index +100 = dieselbe Pose an der Fußlinie statt Körpermitte verankert.
- Zuordnung (`ANIMS_NEU`): `hit` = Treffer 1→2→3, `airhit` = Pose 4 (Körpermitte), `kd` = Pose 4 (Fußlinie), `win` = Sieg-Pose 1→2→4 einmal durchlaufen, letzte bleibt (`fighter.js`: `animU = sf/110`), `defeat` = Sieg-Bogen Pose 3 (kniend). `defeat` wird bei KO am Boden gespielt, wenn `char.defeat` gesetzt ist (nur H!T), sonst `kd`. Noch Behelf: `wakeup`.
- Auswahl: `SelectScreen.launch(id,cb,sfx)` zündet 3 kleine Raketen (`rocket(...,sc=.72)`, Sterne ×0,65 kürzer), Eingaben sind gesperrt; erst wenn alles verglüht ist (max. ~7 s), startet `arcade.start(id)`. Ablauf in `main.js` (`startFight`).
- Update v21b: Besiegt-Pose auf 75 % verkleinert (`FRAME_SCALE` in tools/import-tiger-sheets.py).
- Update v22: neu_aufstehen.png (wakeup 0→2→1→3); alle alten Tiger-Einzelframes aus dem Atlas entfernt (Atlas nur noch 28 Frames). Rückfall TIGER_ANIMS in sprites.js ist damit toter Code.

### Update v23: Merge hitisop25 (2P-Modus, Level-Design) + hitisop29 (H!T-Assets, Auswahl-Menü, Feuerwerk)
- Basis war hitisop23; aus 29 stammen: H!T-Sprites/Atlas, neue Kämpferauswahl (`select.js`), Feuerwerk (`particles.js`/`effects.js`), `fighter.js`/`characters.js`/`custom.js`/`sprites.js`. Aus 25: `arcade.js` (2P-Logik), `input.js`, `stage.js` + `houses.js` (Level-Design), `hud.js` (2P-Labels), `build.mjs`, `tests/versus.test.js`.
- `select.js`: 29-Layout (Liste links, Profil rechts) für Arcade; 2-Spieler-Wahl (`drawVs`, `drawStagePick`, `modePill`) aus 25 mit eigener Kartengeometrie `vsCardRect`/`hitVsCard` (die alten großen Karten), weil das neue Raster nur für die Liste gedacht ist.
- `main.js`: Arcade-Start geht weiter erst über `sel.launch` (Feuerwerk), 2P startet direkt; Eingaben während des Feuerwerks gesperrt (auch Moduswechsel per Klick/TAB).

### Update v24: Sieg-/Niederlage-Screens + flashigeres HUD
- `render/hud.js`: Bei Rundenergebnis, Stage Clear / Game Over / Spieler X gewinnt und Match-Sieger fallen dunkler Hintergrundstreifen, roter Tuschekreis (`enso`) und 勝-Stempel (`seal`) weg; Schrift kleiner (30–36 statt 46–58 px).
- Neue Helfer: `Hud.glitz()` (Flashy-Text: wippende Buchstaben, pulsierender Chroma-Split, wanderndes Glanzlicht, Funkeln) und `Hud.sparks()` (Vierzack-Sterne).
- Mehr Glanz im restlichen HUD: Lebensbalken (glimmender Rahmen, zweiter Glanzstreifen, pulsierender Funke an der Spitze), Namen mit wanderndem Glanzlicht, Combo-Rang als `glitz`, Funkeln um Combo-Zahl, ROUND / FIGHT! / K.O.
- Update v24b: Siegtexte (Runde, Stage Clear / Game Over / Spieler X gewinnt, Match-Sieger inkl. ENTER-Hinweis) liegen höher (Grundlinie ca. y=158 statt 250–266), damit die Siegerpose frei bleibt.

## Update v20: Grafik-Option für schwache Hardware
- **Optionen → Grafik:** Auto / Hoch / Mittel / Niedrig (gemerkt in localStorage `tf_gfx`). Presets `GFX_PRESETS` + `setGfx()` in `src/core/config.js`: Canvas-Auflösung (`maxW`, `dpr`), Partikelfaktor `fx`, Bloom, Aberration, Filmkorn, Boden-Glow, Strahlen, Staub, Feuerwerk-Sterne, `shadowBlur` (bei Niedrig am Hauptcanvas abgeschaltet, `Renderer.applyGfx()`).
- **Auto:** startet auf Hoch und schaltet im Kampf eine Stufe herunter, wenn die Bildrate dauerhaft unter ca. 38 FPS liegt (`loop()` in `main.js`). Schaltet nie wieder hoch.
- Nicht auf echter schwacher Hardware gemessen. Nächster Schritt bei Bedarf: Post-Effekte per WebGL.

## Update v21: WebGL-Nachbearbeitung + kleinerer Tiger im Kampf
- **`src/render/gl.js` (`GLPost`):** Bloom (hell → 1/4 → Gauß 1/8), chromatische Aberration, Vignette und Filmkorn in einem GPU-Durchgang. Aktiv bei Grafik Mittel/Hoch (Niedrig nutzt keine Nachbearbeitung und zeichnet direkt).
- **Aufbau (`renderer.js`):** Die Szene wird per Canvas 2D in ein Offscreen-Canvas (`scv`/`gs`) gezeichnet, per WebGL veredelt und in einem eigenen Canvas **hinter** `#screen` angezeigt. `#screen` (`g`/`ui`) ist transparent und trägt nur Impact-Frame, Intro-Fade, Scanlines, HUD, Banner. Ohne WebGL, bei Shader-Fehlern oder Kontextverlust (`glp.ok=false`) schaltet `applyGfx()` auf den alten 2D-Pfad (`fx.js`) zurück; dort sind `gs` und `g` derselbe Canvas. Größenänderung immer über `renderer.resize(w,h)`.
- **Tiger („H!T“):** `SPRITE_CHARS.tiger.fightScale=.85` (in `sprites.js`). Alle Kampfposen sind 15 % kleiner (erst .75, auf Wunsch angehoben), `win` und `defeat` (`fullAnims`) bleiben in voller Größe. Faustposition (Leuchten) und Schatten skalieren mit. Hurtbox (150 px hoch) und Moves sind unverändert.
- Geprüft in Chromium (SwiftShader): WebGL-Pfad, Rückfall, alle drei Grafikstufen, keine Konsolenfehler. Nicht auf echter GPU/schwacher Hardware gemessen.

## Update v22: H!T im Menü
- **Idle:** nur noch 2 Frames im Wechsel (`t_neu_schlag_00`, `t_neu_posen_00`), 3 fps (angepasst in `assets/tiger/meta.json`/`meta.js` und in `tools/import-tiger-sheets.py`, `IDLE_FPS`). Der alte Tritt-Frame ist raus.
- **Charakterwahl:** `fightScale` (Kampf-Verkleinerung) gilt nicht für Menü-Figuren (`fake()` setzt `menu:true`, `fightK()` in `sprites.js`). `FIG.tiger` in `select.js` von .8 auf .9 (Kartenliste).
- **Profilbild (rechts):** `SPRITE_CHARS.tiger.profileAnim='win'` -> `drawFullFrame` zeigt die letzte Frame der Siegesanimation (Arme verschränkt). Das kleine HUD-Porträt im Kampf (`drawPortrait`) ist unverändert.

## Update v23: Feuerwerk & Siegesfeier
- **Feuerwerk hinter den Häusern:** `ParticleSystem.drawFw(g)` zeichnet nur das Feuerwerk; der Renderer ruft es direkt nach `stage.draw` und vor `house()` auf, alle übrigen Partikel weiter mit `draw(g,true)` (vorn). Das Menü-Feuerwerk (`select.js`) nutzt weiter `draw(g)`.
- **Seltener:** Zündung im Sieger-Finale alle 32 statt 16 Frames (danach alle 90 statt 48), `effects.js` `celebrate`.
- **Länger:** `ROUND.result` 150 -> 260 Frames (Siegesfeier nach Rundenende, ca. 2,9 s statt 1,7 s), Siegesanimation `fighter.js` `sf/110` -> `sf/180`.

### Update v20: Hintergrundmusik
- **Dateien:** `music/menu.ogg` (Auswahlmenüs: „robloxeur – clock fire“) und `music/fight.ogg` (Kämpfe: „van_wiese – rave tekno 176 bpm“), beide per ffmpeg auf −20 LUFS normalisiert, Vorbis q3 (je ~1,5 MB). Vom Build als Data-URI in `window.__MUSIC__` eingebettet (läuft weiter per Doppelklick). Tauschen = Datei gleichen Namens ersetzen + `node tools/build.mjs`.
- **Code:** `render/audio.js` (`Sound.music(name)`, Loop auf eigenem Bus ohne Kompressor/Tiefpass, Crossfade 0,9 s ein / 0,7 s aus, Pegel je Track in `MUSIC_VOL`, Stumm + Lautstärke gelten auch für Musik, `suspend()/resume()` bei Tab-Wechsel). `main.js`: `musicFor()` → `arcade.state==='select'` = `menu`, sonst `fight`; wird jede Frame gesetzt (gleicher Track = kein Neustart, die Musik läuft über Stage-Wechsel/Clear/Game-Over durch).
- **Hinweis:** Wie die Effekte startet die Musik erst nach der ersten Taste/Klick (Browser-Regel). Nicht im Browser gehört: Lautstärke-Balance Musik ↔ Effekte (Regler `MUSIC_VOL` in `audio.js`). Test: `tests/music.test.js` (Mock-AudioContext).
- **Musik-Optionen:** Optionen-Menü hat „Musik“ (An/Aus, `btn-music`) und „Musik-Lautstärke“ (`musicvol`), nur für die Musik (`Sound.setMusicMuted/setMusicVolume`, localStorage `tf_music_mute`, `tf_music_vol`); Effekte bleiben unberührt. Gesamt-Stumm/-Lautstärke gelten weiterhin für beides.
- **Musik-Pegel:** Track-Pegel `MUSIC_VOL` angehoben (menu .8, fight .7), Regler „Musik-Lautstärke" geht 0–200 % (Standard 100 %), Limiter auf dem Musik-Bus gegen Übersteuern.

### Update v21: Sieger-Aura statt Sonnenstrahlen
- `renderer.js` `celeb()`: Lichtsäule + rotierende Strahlen ersetzt durch **Kampfaura** (additiv, hinter dem Gewinner): gezackte Flammen-Silhouette in 3–4 Schichten, aufsteigende Energie-Streifen, Boden-Glühen + auslaufende Druckringe. Standard = Figurenfarbe (`char.glow`).
- **H! T (`tiger`) = Blitzaura:** blaue/weiße Aura + zuckende Blitze um den Körper und zwei lange Blitze Fuß→Kopf (alle 3–4 Frames neu gewürfelt), kurzes Aufblitzen. Alle anderen Figuren haben die Flammenaura.
- `effects.js` `celebrate()`: passende Zusatzpartikel je Figur (Blitze/Funken, Glut, Standard-Funken). Detailgrad folgt `GFX.rays`. Weitere Figuren: neuer Zweig `kind` + Palette `P` in `celeb()`.
- **Aura in zwei Ebenen:** `celeb(g,game,front)` wird zweimal aufgerufen: `front=false` vor den Figuren (große Flammen, Körper-/Boden-Glühen, hintere Ringhälfte), `front=true` direkt nach `drawFighter` (halbtransparente Innenflammen mit heller Kontur, Hälfte der Streifen, Blitze, vordere Ringhälfte) -> Figur steht in der Aura statt davor. Deckkraft der Vorder-Ebene: Werte in den `front`-Zweigen der Flammenschichten.
- **Blitzaura (H!T), Vordergrund:** zuckender: Blitze alle 2 Frames neu gewürfelt, je Blitz ~40 % aus (Blinken), 9 Segmente mit starkem Zickzack + Abzweig, 3 lange Blitze Fuß→Kopf, unregelmäßiges Voll-Aufblitzen (`str`) und Kern-Blinken alle 11 Frames. Stellschrauben im `kind==='bolt'&&front`-Block von `celeb()`.
- **Aura flackert + züngelt (alle Figuren):** `celeb()` hat jetzt `fl` (Flacker-Faktor: schnelles Pulsieren + gelegentliches fast-Aus, ca. 16 % der 1/14-s-Takte) für Flammenschichten, Zungen und Körper-Glühen, und `licks()` = einzelne Flammenzungen mit Lebenszyklus (wachsen aus der Körperkontur, züngeln nach oben, verlöschen, tauchen an neuer Stelle auf; Hinter- und Vordergrund-Ebene, vorn mit Kontur). Die großen Silhouetten sind dafür dezenter. Stellschrauben: `fl`-Zeile (Dip-Häufigkeit/-Tiefe), `NL` (Anzahl Zungen), Alpha-Werte in den Layer-Zweigen.

## Hyper-Kamerafahrt (hitisop47)
- Beim Hyper zoomt die Kamera sanft auf den Angreifer (Zoom 1.25, größere Figuren etwas weniger) und bleibt im Zoom, solange der Hyper-Move aktiv ist (Freeze + Strahl). `lead` (28) Frames vor dem Ende der aktiven Phase zoomt sie schon wieder raus, damit sie beim letzten Treffer (Gegner fliegt weg) wieder voll draußen ist. Der Gegner bleibt die ganze Zeit im Bild. Werte: `CAMERA.cine` in `src/core/config.js` (zoom, lift, bias, margin, inF, outF, lead, maxF, lerpPos, lerpZoom). Logik: `Camera.focus()` + `Game.cineCamera()`.
- Das Hyper-Banner zeigt den echten Move-Namen je Figur (Tigerhatz, Inferno-Strahl …) statt „HYPER <Name> BEAM“.
- Nicht im echten Browser geprüft (nur Logik-Tests); bei starker Unschärfe der Stage im Zoom `S` in `Stage.build` (stage.js) erhöhen.
- Siegerpose-Aura (`Renderer.celeb`): Zacken der Kontur kleiner (`AURA_SPIKE` .62 → .4) und Flammenzungen etwas kürzer (`AURA_LICK` .82); beide Konstanten oben in `celeb()` einstellbar.
- Siegerpose H!T (tiger): reine Blitzaura – keine Flammenkontur und keine Flammenzungen mehr (Blitze, Boden-/Körper-Glühen, Druckringe und Energie-Streifen bleiben). Flammenaura der anderen Figuren unverändert.
- Flammenaura (alle außer H!T) insgesamt kleiner (`SK` = .72 oben in `celeb()`): Flammenschichten und Zungen-Ansatzpunkte rücken enger an den Körper, die einzelnen Zacken und Flammenzungen behalten aber ihre ursprüngliche Größe (Zackenausschlag wird in `flame()` über `1/k` kompensiert). Einstellbar über `SK`.
- Flammenzungen (`licks()` in `celeb()`) werden nach oben hin kleiner: Faktor `tp` (unten 1, am Kopf ≈ .45) skaliert Länge, Pendeln und teilweise die Breite.

## ST3-G0 (neue Figur, hitisop53)
- Spielbar im Roster (`ROSTER`/`LADDER` in `src/core/characters.js`, Moveset `st3g0` in `src/core/movesets.js`, Animationen `ST3G0_ANIMS` in `src/render/sprites.js`). Arcade: jeder kämpft gegen alle anderen Figuren; Arenen der Reihe nach, bei mehr Gegnern als Arenen wiederholen sie sich (`Arcade.beginStage`).
- Sprites: 4 Posen-Bögen (15 Posen, ein Duplikat übersprungen) in `assets/st3g0/sheets/bogen_N.jpeg`, importiert mit `tools/import-st3g0-sheets.py` (Doppelklick: `ST3G0-UPDATE.bat` / `st3g0-update.sh`). Atlas: `assets/st3g0/atlas.webp` + `meta.json`; Frame-Namen `p_<Bogen>_<Zelle>`.
- Behelfs-Animationen (bis neue Bögen kommen): Ducken-/Luft-Angriffe nutzen Hocke bzw. Sprung-Pose, Treffer = geneigte Deckung, Knockdown = Rutschen → flach liegend (Blickrichtung der Liegepose evtl. anpassen). Fehlende Posen + fertige Gemini-Prompts: `docs/ST3G0_PROMPTS.md` (Bogen 5-12).
- **Bögen 5-12 eingebaut** (aus `stego.zip`, 48 Posen, Atlas ca. 2 MB): Inhalt weicht vom Prompt-Plan in `docs/ST3G0_PROMPTS.md` ab. Tatsächlich: 5 = Knie-/Seitkick, langer Schlag, Block (5 Posen, 3+2), 6 = Ausfall/Flugkick/Frontkick/Klauen, 7 = Idle/Brüllen, 8 = Aufwärtshaken, 9 = Schlagfolge, 10-11 = Siegesposen, 12 = Hyper mit Flügel-Aura (Pendant zu 11).
  Importer-Anpassungen (`tools/import-st3g0-sheets.py`): `ROWS` (Bogen 5 hat 3+2 Posen), `GRID_SHEETS` (Bogen 12: feste 2x2-Teilung + `defringe`, weil die Aura die Figuren verbindet), `REF_H` (Bögen 7-12 sind 1024x1024 und ca. 10 % größer -> Maßstab aus Standhöhe 421), `FRAME_SCALE` (obere Reihe von Bogen 5 war ca. 25 % zu klein gezeichnet), `AIR` (6/1 Flugkick), `CLIP_BURST` (8/2: abgeschnittener Lichtblitz entfernt).
  Special = Brüll-Pose (Bogen 7) mit Feuer-Atem (Projektil `look:'fire'` in `renderer.js`), Win = Drachen-Flügel-Pose (Bogen 12). Idle, Punch, Kick, Heavy, Upper, Block nutzen ebenfalls die neuen Posen. Weiter Behelf: Ducken-Angriffe, Luft-Schlag, Knockdown/Aufstehen (Prompt-Bögen 6 'Ducken' und 12 'Knockdown' fehlen noch).
- Weiße Hintergrund-Taschen (zwischen Arm und Körper) und Staub-Wolken: Import entfernt die Taschen, Staub bleibt in den Posen (Fußlinie wird nur an der grünen Haut gemessen).
- Startmenü: Gegner-Zeile kompakter ab 5 Gegnern, 2-Spieler-Kartenbreite für 6 Slots angepasst.


## Figuren entfernt + Schatten/Bodenhaftung (hitisop9)
- **Entfernt:** Master (`hero`), Palm Master (`palm`), Sorceress (`witch`), Minotaurus (`mino`, Endgegner): Charaktere, Movesets, KI-Profile, Sprite-Atlanten/-Animationen (`assets/hero|palm|witch|mino`), Projektil-Sprite-Code, Feuer-Aura und Partikel, Projektil-Looks (Blitz, Rune, Welle, Schock), Spezial-Mechaniken, die nur sie nutzten (Griff/`unb`, Heilen/`heal`, `gain`, Durchdringen/`pierce`, Falle/`uniq`, Hörner-Stoß/`rise`), Boss-Logik im Arcade (`BOSS`, `isBoss`, „FINAL BOSS“-Anzeige), Tools/Doku.
- **Roster jetzt:** `ROSTER = ['tiger','st3g0']`, Eigene Figur als dritter Slot. Arcade = alle anderen Figuren hintereinander (bei 2 Figuren: 1 Gegner → danach Victory), keine Endgegner-Stage. Eigene-Figur-Vorlagen: H!T und ST3-G0 (`CUS_TEMPLATES`).
- **Bodenschatten:** Mitte auf der Fußlinie (Füße stehen IM Schatten), Breite aus dem Fußabstand der Pose (`footSpan`), in der Luft kleiner/blasser, bei liegenden Posen (`SPRITE_CHARS[id].lie`) ganz weg. Siehe `docs/ARCHITECTURE.md`, Test `tests/shadow.test.js`.
- **Bodenhaftung:** `lean` (Neigung) schiefst die Figur am Boden statt sie zu drehen – die Füße schweben dadurch nicht mehr; gedreht wird nur in der Luft.
- **Sieger-/Verlierer-Posen Feinabstimmung (v25):** `SPRITE_CHARS[id].pose` in `src/render/sprites.js` (`POSE_ST3G0`, `POSE_KITSUNE`) = Größenfaktor `sc`, Drehung `rot` (rad), Absenkung `dy` (Spiel-Einheiten, näher zum Betrachter) und eigener Bodenschatten `shadow:[x,Radius,y]` je Animation. Unabhängig von den Anim-Listen, daher werden die Werte nicht von `meta.anims` (Tiger) überschrieben. Tiger bleibt unverändert (Referenz).
  - ST3-G0: `win` ×0.9 (Flügel-Aura war zu groß), `defeat` ×0.8 + 18° gekippt (waagerechter) + 12 px tiefer + eigener Schatten (die Pose p_3_2 ist ein Luft-Sturz und wirkte schwebend).
  - Kitsune: `win` ×0.92, `defeat` ×0.8.
  - Nachjustieren: nur diese Zahlen ändern, dann `node tools/build.mjs`. Im echten Browser noch nicht geprüft (Kontrollbild per Nachbau der Zeichenlogik).
- **v25b:** Kitsune ist die kleinste Figur: `SPRITE_CHARS.kitsune.fightScale=.78` (Kampf ca. 149 px, H!T 161, ST3-G0 206); `win` sc 1, `defeat` sc .9 (zusätzlich zu fightScale, nicht in `fullAnims`). ST3-G0 `defeat`: `dy` 30, `rot` .33, Schatten-Versatz 28 (liegt weiter vorn/unten).
- **Kitsune-Hyper „Neunschwanz-Inferno“ (v26):** eigener Hyper statt des Standard-Strahls (`MODS.kitsune.super` in `src/core/movesets.js`): 1 Balken, 16 F Startup (unverwundbar bis F34), 54 aktive Frames mit `multi:6` = 9 Treffer à 32 Schaden (Skalierung min. 50 %), letzter Treffer = Launcher, Trefferbox `[-40,-200,500,220]` (breiter Fächer nach vorn, ca. 230 Schaden an stehendem Gegner). Anim `hyper` (Hocke → Meditation mit Leuchten → zurück, `KITSUNE_ANIMS`), Optik `tailsFx()` in `src/render/rig.js` (neun geschwungene Geisterfeuer-Schwänze mit Flammenkugeln, Move-Flag `fx:'tails'`, Länge folgt `box`), pro Schwanz ein Ring + Rauschen (`Fighter.tickAttack`). Optik noch nicht im echten Browser geprüft; Feinabstimmung: Winkel/Länge/Breite in `tailsFx`, Werte im Moveset.
- **Zeichenreihenfolge (v26b):** `drawPri()` am Ende von `src/render/renderer.js`: liegend/K.O. (0) < getroffen/blockend (1) < neutral (2) < angreifend (3), bei Gleichstand nach Höhe `y`, danach P1/P2. Vorher zählte nur „liegend hinten, sonst y“ – bei gleicher Höhe war immer P2 vorn, egal wer zuschlug.
- **ST3-G0-Hyper „Drachen-Feuersturm“ (v27):** ersetzt den Standard-Strahl (`MODS.st3g0.super`): 1 Balken, 24 F Startup (unverwundbar bis F34), 50 aktive Frames mit `multi:5` = 10 Treffer à 30 (min. 50 % Skalierung, ca. 220 Schaden), letzter Treffer = Launcher, Trefferbox `[40,-235,520,210]` (Kegel aus dem Maul, leicht abwärts). Anim `hyper` (Luft holen p_7_0/1 -> Brüllen p_7_2 lange gehalten -> p_7_3), Optik `breathFx()` in `src/render/rig.js` (Move-Flag `fx:'breath'`: wandernde Glutballen im Look der Feuerwelle, Maul-Leuchten, Funken; Länge folgt `box[2]`, Maul bei [64,-172]), Rauschen + Druckring alle 10 Frames in `Fighter.tickAttack`. Optik noch nicht im echten Browser geprüft.
- **Stego-Verlierer (v28):** `POSE_ST3G0.defeat.dy` 30 -> 46 (Schatten-Versatz 44): liegt noch weiter vorn/unten.
- **Tiger-Hyper „Blitz-Kamehameha“ (v28):** ersetzt „Tigerhatz“ (`MODS.tiger.super`). Neues Sheet `assets/tiger/sheets/neu_blitz.png` (2x2 Posen: 0 Aufladen/Hände an der Hüfte · 1 dito, Blick zur Seite · 2 kniender Ausfall = Abschuss · 3 Arme gespreizt, brüllend = Blitzeinschlag; das Gemini-Original hatte ein eingebackenes Schachbrett, das ich per Randfüllung freigestellt habe) – im Importer als `neu_blitz` (POSE_SHEETS, `REF_H` 416 = 505 × 0,823 wegen kleinerer Bogenauflösung) und Anim `hyper` (`ANIMS_NEU`) eingetragen; Atlas neu gebaut (`python3 tools/import-tiger-sheets.py`). Ablauf: 44 F Startup (Einschlag F6 mit Vollbild-Flash/Shake, Körperblitze + Aura, Blitzkugel an den Händen), dann 48 aktive Frames `multi:4` = 12 Treffer à 28 (min. 50 %), letzter Treffer = Launcher, Box `[40,-175,640,150]`, unverwundbar bis F50 (ca. 220 Schaden). Optik `boltFx()` in `src/render/rig.js` (Flag `fx:'bolt'`; Einschlagpunkt Kopf [-26,-170], Hände/Strahlursprung [74,-105]), Flash/Sounds in `Fighter.tickAttack`. Optik nur per Nachbau geprüft, nicht im Browser.
- **ST3-G0 kleiner (v29):** `SPRITE_CHARS.st3g0.fightScale=.92` (Kampf ca. 190 px, bleibt größte Figur; H!T 161, Kitsune 149). Alle Posen skalieren mit; Pose-Schatten (`POSE_ST3G0.defeat.shadow`) und Feuer-Maulposition (`breathFx` [59,-158], Ring in `tickAttack`) angepasst. Trefferboxen unverändert.
- **ST3-G0 Ducken (v30):** `crouch`/`cblock`/`cpunch`/`ckick` nutzen alle p_4_1 (nur 170 px statt 190 hoch, Hurtbox 96) -> jetzt `squash:.8` (Anim) + `POSE_ST3G0.*.sc .88` = ca. 120 px. Duck-Schlag/-Tritt sind weiterhin Platzhalter (Standbild p_4_1); eigene Duck-Posen wären besser.

## Update v31: Spritesheet-Aura für Kitsune + ST3-G0 (Siegerpose)
- **Neu:** Kitsune (lila-goldene Pixel-Flamme) und ST3-G0 (grüne Flamme) haben in der Siegerpose eine eigene Aura aus je einem 4-Frame-Sheet. **H!T behält die Blitzaura** (unverändert, `kind==='bolt'`).
- **Assets:** Original-Sheets in `assets/aura/sheets/` (`kitsune_aura.jpeg`, `st3g0_aura.jpeg`); `tools/make-aura.py` (Pillow + numpy) entfernt den Hintergrund per Luminanz-Key und schreibt `assets/aura/<id>.webp` (Streifen, 4 Zellen, Flammenunterkante bündig) + `<id>.json`. Neu erzeugen: `python3 tools/make-aura.py`, danach `node tools/build.mjs`.
- **Meta** (`assets/aura/<id>.json`, bleibt beim Neuerzeugen erhalten): `k` Größe (Flammenhöhe ≈ `210·size·k`), `fps` (7), `seq` Frame-Reihenfolge (Ping-Pong 0,1,2,3,2,1), `front` Deckkraft der Vordergrund-Ebene je Frame (ST3-G0 Frame 4 hat keine Lücke in der Mitte -> 0), `i` Akzentfarbe für Streifen/Funken.
- **Code:** `build.mjs` bettet `assets/aura/*` als `window.__AURA__` ein. `Renderer.auraSprite(id)` lädt das Bild lazy; `celeb()` kennt jetzt `kind` `'bolt'` | `'sprite'` | `'aura'` (Fallback: alte prozedurale Flammen, wenn kein Aura-Sprite da ist, z. B. Eigene Figur). Bei `'sprite'` entfallen Flammenkontur/-zungen; Boden-Glühen, Druckringe, Energie-Streifen und Partikel bleiben. Neue Figur mit Aura = Sheet + `.json` in `assets/aura/<id>` ablegen.
- Geprüft in Chromium (Siegerpose aller 3 Figuren, keine Konsolenfehler) + alle Node-Tests. Nicht geprüft: Performance auf schwacher Hardware (zusätzlich 1 Bild pro Frame, ca. 380×665 px).

## Update: Melee-Modus (Smash-Stil) in den aktuellen Stand integriert
- Aus `melee.zip` übernommen: `src/core/melee.js` (Prozent, Rückstoß, Blast-Zonen, Stocks, Respawn), `src/render/meleehud.js` (Plattform, Prozent-Plaketten, Pfeile), `MELEE` in `config.js`, Melee-Teile in `fighter.js`, `combat.js`, `ai.js` (`meleeRecover`), `camera.js`, `barrier.js` (offene Arena), `arcade.js` (Modus arcade/versus/melee, `cpu`, `stocks`), `game.js`, `main.js`, `select.js`, `hud.js`, `renderer.js`.
- Der restliche Stand bleibt unverändert: Pop-up/Feder-Effekt, Kitsune-Hyper, Auren, Skins. Im Melee greift Pop-up nicht (Treffer laufen über `meleeHit`).
- Bedienung im Startmenü: TAB = Modus (Arcade → 2 Spieler → Melee), T = Stocks, B = Spieler 2 Mensch/CPU, ▲▼ = CPU-Stärke.
- Tests: `npm test` (inkl. `tests/melee.test.js`, `tests/smoke-melee.cjs`), alle bestanden. Nicht im echten Browser geprüft.
- Melee gegen CPU: Standard ist jetzt Spieler 2 = CPU. Die Optionen oben rechts im Melee-Menü sind klickbare Felder (Mensch/CPU, CPU-Stärke, Stocks; Tasten B / ▲▼ / T gehen weiter). `MELEE_OPTS`/`hitMeleeOpt` in `select.js`.
- 2-Spieler- und Melee-Menü (Kämpferwahl) im Stil des Arcade-Menüs: freie Idle-Figuren mit Bodenlicht in Spielerfarbe, ▼ P1 / ▼ P2 (✔ = bereit), Farbpunkte, rechts je Spieler ein Profil-Block (Porträt, Beschreibung, Balken, Stärken/Schwächen). Im Melee ohne LEBEN-Balken, Spieler 2 als „CPU“ beschriftet. Kopfzeile `title()` wie im Arcade-Menü (gilt auch für die Stage-Wahl). `vsCardRect` nutzt jetzt das Arcade-Raster (`cardRect`), `vsProfile()` in `select.js`.

## HUD (v18): Kristall-Design (ersetzt Gold-/Tusche-Look)
- Gesamtes HUD in Eisblau/Violett/Lavendel: `ICE`/`ICE_HI`/`ICE_DIM`/`CRYS` und `HPAL` oben in `src/render/hud.js`. P1 = Eisblau, P2 = Violett. Kein Gold, Rot, Orange mehr (auch Alarm bei wenig HP, Treffer-Blitz, Timer-Warnung, Melee-Prozentfarbe, Wand-HP-Balken, Menü-Akzente).
- Schrift: keine Umrandung mehr (`fancy()`/`glitz()`), nur weicher Glow; Farbsaum (Chroma) auf einen Hauch reduziert. Ausrufe deutlich kleiner (ROUND 34, FIGHT! 48, K.O. 68, Combo-Zahl 46, Sieger-Texte 20–24, „DURCH DIE WAND!“ 22).
- Entfernt: Ensō-Pinselringe um FIGHT!/K.O./Super, dunkle Platten und Haarlinien um Banner, ENTER-Kasten. Siegel/Kanji ersetzt durch Edelstein-Rauten (`seal()`), Hyper-Stufen als I/II/III, Wellenmuster durch Kristallgitter.
- Lebensbalken und Hyper-Meter haben diagonale Kristall-Facetten plus wanderndes Glanzlicht.
- Nur Optik geändert, keine Spiellogik. Nicht im echten Browser geprüft (nur offscreen gerendert).
- Siegespose H!T (Blitzaura, `celeb()` in renderer.js): das unregelmäßige Aufblitzen ist jetzt eine obere Halbkreis-Scheibe (Radius 1,3 × Figurenhöhe, Mitte am Boden) statt eines blinkenden Rechtecks.

### Update v17: Spam-Sperre (jede Taste nur 3× hintereinander)
- `SPAM={max:3,reset:90}` in `src/core/config.js`. Jede Angriffstaste (L/M/H/S) startet höchstens 3 Mal in Folge einen Angriff; danach ignoriert der Kämpfer diese Taste, bis (a) eine andere Angriffstaste benutzt wurde oder (b) 90 Frames (~1,5 s) seit dem letzten Einsatz vergangen sind. Hyper (SUP) ist ausgenommen, Reset bei jeder neuen Runde. Gilt für Spieler und KI, auch bei Cancels/Ketten.
- Logik: `Fighter.spamLocked(b)` / `noteSpam(b)` (gezählt in `startMove`), Prüfung in `tryAttack` und `tryCancel`. Zustand in `fighter.spam={btn,n,t}`.
- HUD: drei kleine Kristalle neben „HYPER“ zeigen die Folge (voll + violett = gesperrt), siehe `Hud.hyper()`. Test: `node tests/spam.test.js`.

### Update v18: Kitsune größer, Totenköpfe als Rundensieg-Anzeige
- Kitsune: `fightScale` in `SPRITE_CHARS` (`src/render/sprites.js`) .78 → .83. Nur die Darstellung; Hurt-/Hitboxen (`char.size`) unverändert. Bleibt die kleinste Figur (H!T .85, ST3-G0 .92).
- HUD: Rundensiege unter dem Lebensbalken sind jetzt Totenköpfe (`Hud.skull()`): gewonnen = leuchtend in der Spielerfarbe, offen = dunkler Umriss. Der Edelstein am Portrait bleibt.


## Update v21: Endgegner ANUBIS (freischaltbar)
- **Ablauf:** Im Arcade-Modus kommt nach allen anderen Kämpfern als letzte Stufe **Anubis** (Anzeige „ENDGEGNER“ statt „STAGE n / m“, KI eine Stufe härter, 1150 HP). Wer das Arcade einmal durchspielt („ARCADE GESCHAFFT – NEUER KÄMPFER FREIGESCHALTET: ANUBIS“), hat ihn danach als spielbaren Kämpfer in der Auswahl (auch 2 Spieler/Melee). Gesperrt steht er in der Gegnerliste als „???“. Spielt man selbst Anubis, gibt es keinen Endgegner.
- **Speicher:** `src/core/unlocks.js` (localStorage `hitisop.unlocks`). Zum Testen ohne Durchspielen: Seite mit **`?unlock=anubis`** öffnen. `characters.js`: `BOSS`, `unlockChar()`, `ROSTER` wächst zur Laufzeit; `arcade.js`: `ladderFor` (Endgegner am Ende), `isBoss()`, `newUnlock`.
- **Sprites:** 6 Bögen in `assets/anubis/sheets/bogen_1-6.png` (1 Idle, 2 Kampfposen, 3 Kampfkombo, 4 Treffer/Sturz, 5 Lauf/Sprung/Ducken, 6 Block) -> `python3 tools/import-anubis-sheets.py` (Atlas + meta; Maßstab je Bogen in `SHEET_SC`, Bogen 1-3/5 haben echte Transparenz, 4+6 aufgemaltes Schachbrett). Zuordnung `ANUBIS_ANIMS` in `sprites.js`.
- **Noch Behelfe (Bögen fehlen):** Laufen, Dash/Luft-Dash, Duck-Angriffe, Upper/Aufwärts-Special, Hyper, Aufstehen, Sieg-/Niederlagenpose; Luftangriffe teilen sich Frames mit den Bodenangriffen. Neue Bögen als `bogen_7.png` … ablegen, in `SHEETS` (Importer) eintragen, Skript laufen lassen und die Frame-Listen in `ANUBIS_ANIMS` tauschen.
- Moveset `anubis` in `movesets.js` (Seelenwelle, Schakal-Sprung, Richterspruch, Schweifhieb, Sturzklaue, Doppelklaue, Anubis-Hieb, Hyper „Urteil der Maat“). Test: `tests/anubis.test.js`. Anubis hat noch keine Zweitfarbe (skins.js).

## Auswahl-Videos (Übergangsclip beim Bestätigen einer Figur)
- Datei `assets/video/<id>.webm`, vom Build automatisch als Data-URI in `window.__VIDEOS__` eingebettet (`tools/build.mjs`). Das Format ist bei allen Figuren gleich: **VP9, 1280×720, 30 fps, 60 Frames = 2,0 s, ohne Ton, yuv420p** (Ton wird ohnehin stumm abgespielt).
- Schriftzug über dem Clip: `VTEXT` in `src/render/select.js` (`id: ['ENGLISCH','中文']`), Farbe = `glow` der Figur. Tiger „LET'S GO", ST3-G0 „UNLIKELY", Kitsune „TRY!", Anubis „JUDGMENT / 审判".
- ST3-G0-Clip (neu): die letzten 2 s von `hailuo-03_the_dino_on_te_picture_is_practicing_martial_arts-0.mp4` (4,58–6,58 s, 24 → 30 fps, 1344×768 → unten auf 16:9 beschnitten, dann 1280×720); der alte Clip ist ersetzt.
- Anubis-Clip: die letzten 2 s von `Pippit_1111_AnubisArrival.mp4` (6,1–8,1 s), Wasserzeichen oben links mit `delogo` entfernt, auf 1280×720 skaliert. Rezept für weitere Clips:
  `ffmpeg -ss <Start> -i quelle.mp4 -an -frames:v 60 -vf "scale=1280:720:flags=lanczos,fps=30,format=yuv420p" -c:v libvpx-vp9 -crf 31 -b:v 0 -g 60 <id>.webm` (bei Wasserzeichen vorher `delogo=x=..:y=..:w=..:h=..` davorsetzen).
- **Alle Clips sind freigestellt**: VP9 **mit Alpha-Kanal** (`yuva420p`, Tag `alpha_mode=1`), das Spiel legt sie auf Schwarz. Anubis und ST3-G0 (Quellen mit weißem Hintergrund) wurden per `rembg` (Modell `isnet-anime`) pro Frame freigestellt, Maske über 3 Frames geglättet, 1 px erodiert, bei Anubis zusätzlich helle Hintergrundreste entfernt. Encoding: `ffmpeg -framerate 30 -i f%03d.png -vf format=yuva420p -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 31 -b:v 0 -g 60 -metadata:s:v:0 alpha_mode=1 <id>.webm`.
- Alle Clips werden beim Start der Auswahl vorgeladen (auch Figuren, die noch nicht freigeschaltet sind). Der Clip bleibt am Ende auf dem letzten Frame stehen.

## Merge: Story-Stand (hitisop_story) + Startseite/Demokämpfe (hitisop_2)
- Basis war der Story-Stand (Story-Modus, Loot/Booster, Mantis). Aus dem zweiten Stand übernommen: Startseite mit KI-gegen-KI-Demokampf im Hintergrund (`DemoFight` in `src/main.js`, `Renderer.drawDemo`, `#start` in `index.html`/`styles/main.css`), freigestellte Übergangsvideos `assets/video/anubis.webm` und `st3g0.webm` (VP9 mit Alpha).
- Startseite bietet jetzt **Arcade / Story / 2 Spieler / Melee** (`START_MODES` in `src/main.js`, Buttons in `index.html`).
- `VTEXT` in `select.js` ohne den „heller Hintergrund“-Rand (3. Eintrag) – die Clips sind jetzt freigestellt.
- `tests/smoke-melee.cjs` an die Tab-Reihenfolge Arcade → Story → 2 Spieler → Melee angepasst. Bekannt: `tests/hyper.test.js` schlägt für `mantis` fehl (war schon im Story-Stand so).
- **Siegesfeuerwerk:** Es gibt nur das normale kleine Feuerwerk des Spiels (`Effects.win`/`celebrate`, Raketen + Aura). Das große Finale (`mega`) kommt ausschließlich im Übergangsvideo (`select.js`). Auch auf der Startseite spielt ein beendeter Demokampf diese Siegesfeier komplett ab (`Renderer.drawDemo` zeichnet Feuerwerk + Aura, `DemoFight` wartet 330 Frames bis zum nächsten Kampf).

## Freischaltungen: am Anfang nur eine Farbe und eine Stage
- Jede Figur startet nur mit **Farbe 0**; die Farben 1–3 (`SKIN_POOL` in `src/core/loot.js`, 9 Stück) und die **Stages 2–4** (`STAGE_POOL`: Crimson Temple, Toxic Docks, Labyrinth) gibt es nur aus **Boostern**. Frei ist nur NEON CITY.
- Speicherung: `localStorage 'hitisop.loot'` (`skins`, `stages`). Booster-Inhalt: Coins / Karte / Farbe oder Stage (Freischaltbares wird gleichmäßig verlost, nichts doppelt).
- Gesperrte Stages: im Stage-Menü (2 Spieler/Melee) „GESPERRT“, werden bei A/D übersprungen und sind nicht anklickbar; Zufall wählt nur unter freigeschalteten. Arcade durchläuft nur freigeschaltete Stages (`ownedStages`). Gesperrte Farben: blasse Punkte in der Auswahl, `C` überspringt sie.
- Booster-Übersicht (Taste B) zeigt Farben und Stages. Zum Testen alles freischalten: `unlockAll()` aus `loot.js` (in der Browser-Konsole nicht exponiert; in Tests importieren).

## Booster/Coins-Anzeige und Sammelkarten-Bilder
- Charaktermenü (Arcade/Story und 2 Spieler/Melee): oben rechts **BOOSTER n** und **COINS n** (Anzahl gesammelt; Booster-Feld leuchtet, wenn mindestens einer da ist). Code: `Renderer.drawSelect` in `src/render/renderer.js`.
- Sammelkarten stecken in den Boostern (`CARDS` in `src/core/loot.js`). Bilder: `assets/cards/<karten-id>.png|webp|jpg` (siehe `assets/cards/README.md`), der Build bettet sie als `window.__CARDS__` ein. Ohne Bild bleibt die Text-Karte. Die Sammlung (Taste B) zeigt die Karten im Hochformat, beim Aufdecken im Booster erscheint das Bild.

## Eigener Hintergrund per Drag & Drop (Bild/Video) – NEU
- **Bedienung:** Bild oder Video irgendwo ins Fenster ziehen (Titelmenü, Auswahl, Kampf, Pausenmenü …) = Hintergrund für **überall**. Alternativ Upload über den Knopf **🖼 HINTERGRUND** links unten (nur Titelmenü + Auswahlbildschirme), Taste **H** (dort), oder Pausenmenü **M → Optionen → Eigener Hintergrund → Verwalten**. Das Panel zeigt je Bereich (Überall / Titelmenü / Auswahl / Kampf) Vorschau, Hochladen, **Original** (Spiel-Hintergrund trotz „Überall“) und Entfernen; ist es offen, kann man Dateien auch auf eine Zeile ziehen (= nur dieser Bereich). Optionen: Abdunkeln (0–90 %), Füllen/Einpassen, leichte Kamera-Parallaxe, Hochhaus-Wände im Kampf zeigen (Standard aus).
- **Formate:** Bilder (JPG/PNG/WebP/AVIF/BMP/SVG, große Bilder werden einmalig auf 2560 px verkleinert), GIF + animiertes WebP (per `ImageDecoder` in Frames zerlegt, max. 400 Frames; ohne `ImageDecoder` Standbild), Videos MP4/WebM/OGV/MOV (stumm, Endlosschleife; was der Browser abspielen kann, H.264 meist ja). Textdateien o. Ä. werden mit Hinweis abgelehnt.
- **Speicherung:** Blob je Bereich in **IndexedDB** (`hitisop-bg`), Optionen in `localStorage 'hitisop.bg.opts'`. Nichts wird hochgeladen. Fehlt der Browser-Speicher / ist er voll, gilt die Datei nur bis zum Tab-Schließen (Hinweis im Panel).
- **Code:** `src/render/backdrop.js` (Klasse `Backdrop`: Laden, Speichern, `pick/has/draw`; reine Funktionen `bgKind`, `resolveSlot`), `src/render/bgpanel.js` (`BgPanel`: DOM-Panel, globales Drag & Drop, Knopf, Toast), CSS am Ende von `styles/main.css`, Verdrahtung in `src/main.js` (`bgUi`, Taste H, Blur-Guard, Knopf-Sichtbarkeit) und `index.html` (Zeile `#btn-bg`). Build-Reihenfolge: `render/backdrop`, `render/bgpanel` vor `render/renderer` (**Achtung:** alles landet im selben Scope, Namen wie `clamp` sind schon vergeben → Präfix `bg…`).
- **Einhängepunkte im Renderer (`renderer.js`):** `drawSelect` (Bereich `select`, +20 % Abdunkeln für Lesbarkeit), `drawDemo` (Titelmenü, `title`), `draw` (Kampf, `fight`): Hintergrund im Bildschirmraum **vor** der Kamera, `Stage.draw` entfällt, stattdessen `floorShade()` (weicher Bodenverlauf in Weltkoordinaten); Häuser nur mit Option; Melee: `meleeStage(g,T,t,cbg)` lässt den Abgrund-Verlauf weg (Plattform bleibt); Story: `storyWorld` (Boden + Laternen) bleibt.
- **Tests:** `node tests/backdrop.test.js` (Typ-Erkennung, Auflösung, Zeichnen, Parallaxe), Browser-Ende-zu-Ende mit echtem Chromium: `python3 tests/e2e-backdrop.py` (braucht `playwright` + `ffmpeg`, nach `node tools/build.mjs`). `npm run check` baut und prüft das Bundle auf Syntax/Namenskollisionen.
- **Grenzen:** Video-Ton ist immer aus (die Spielmusik läuft). Der Editor für die eigene Figur hat sein eigenes Drag & Drop; solange er offen ist, ignoriert der Hintergrund-Code Drops. Im Kampf mit eigenem Hintergrund ist die Gasse nur noch optisch weg – die brechbaren Wände funktionieren weiter (Banner „DURCH DIE WAND!“), mit der Option sieht man sie auch.

## Booster aufreißen mit Animation + Feuerwerk – NEU
- **Ablauf (Taste B → ENTER, Übersicht oder Story-/Game-Over-Bildschirm):** Das Päckchen fliegt ein und schwebt (wartet auf **ENTER / Klick**) → Wackeln mit aufsteigenden Tönen und Risslinie → Oberteil reißt ab, Blitz, Licht + Funken → die drei Karten springen verdeckt heraus → **jede Karte einzeln groß**: fliegt in die Mitte, wackelt (je wertvoller, desto länger), dreht sich um, Einschlag mit Titel („NICE!“ / „STARK!“ / „WOW!“ / „JACKPOT!!“) und Feuerwerk → ENTER = nächste Karte (davor überspringt ENTER die Spannung) → Übersicht mit allen drei Preisen und Abschlussfeuerwerk → ENTER = zurück zur Sammlung. **ESC** überspringt alles (die Belohnungen sind beim Öffnen schon gespeichert).
- **Wertigkeit (`prizeTier` in `src/core/loot.js`):** 0 = Coins unter 35 · 1 = Coins ab 35 / gewöhnliche Karte · 2 = seltene Karte · 3 = neue Farbe oder Stage · 4 = epische Karte (**JACKPOT**). Feuerwerk: 0 Funkenregen · 1 eine Rakete · 2 fünf Raketen + Schockwelle · 3 Riesenblume + Finale-Raketen + Finale-Sound · 4 die **große Bombe** (vierfache Riesenblume, Schockwellen, 24 Blitze, Splitter, 7 Nachzünder, 8 Raketen, Bildschirmwackeln, Blitz). Neue Schwellen/Effekte: `PackOpen.impact()`.
- **Code:** `src/render/packopen.js` (Klasse `PackOpen`: Zustandsautomat `idle/tear/pop/show/out/sum`, `advance()`, `draw()`, eigenes `ParticleSystem` wie bei der Charakterwahl, Zeit in 60-Hz-Schritten unabhängig von der Bildrate), `lootui.js` (`drawLoot` ruft `u.po.draw`, exportiert `card`, `boosterArt`, `prizeFace`; Kartentext passt sich der Länge an), `main.js` (`lootReveal`, `lootNext`; Debug: `window.__reveal(rewards)` startet die Animation mit beliebigen Preisen). Sounds: vorhandene SFX (`combo_step_0x`, `whoosh_*`, `hit_critical`, `ground_slam`, `fw_rocket`, `fw_finale`).
- **Tests:** `node tests/packopen.test.js` (Wertigkeit, Ablauf, Skip, Feuerwerk wächst mit dem Wert, Zeitsteuerung), Browser: `python3 tests/e2e-booster.py` (Screenshots der Schlüsselmomente). Die alte Kartenreihe in `drawLoot` bleibt nur als Rückfall, falls kein `u.po` gesetzt ist.

