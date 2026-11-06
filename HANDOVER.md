# Übergabe – H!TisOP (Stand: Arcade-Modus mit 4 Kämpfern + Endgegner)

## Was das Projekt ist
2D-Beat-'em-up im Stil von Marvel vs. Capcom 2, reines HTML5-Canvas ohne Abhängigkeiten, läuft per Doppelklick (`start.bat` / `start.sh` / `index.html` / `dist/hitisop.html`).

## Fertig und getestet (automatische Tests, siehe unten)
- Kampfsystem: Chains/Cancels, Launcher + Luft-Combos (Doppelsprung-/Air-Dash-Cancel), Block/Chip, Schadensskalierung, Hitstop, Super (Hyper-Beam), Meter, Combo-Zähler, harter Knockdown nach Launcher.
- Bewegung: Doppelsprung, Coyote-Time, Jump-Buffer, Dash/Air-Dash, hohe Sprünge; Spieltempo einstellbar (Standard 1.5×).
- Kamera mit echtem Zoom/Schwenk (alle Welt-Objekte skalieren, HUD nicht), Weltgrenzen.
- KI mit 3 Schwierigkeitsstufen (Leicht/Normal/Hart); Endgegner +1 Stufe.
- **Arcade-Modus:** Startmenü mit Charakterwahl (Tastatur + Maus), Gegner-Leiter (alle anderen 3 + Minotaurus), je Stage 2 Runden-Siege, eigenes Level je Stage (4 Themes), Stage Clear / Game Over (Enter = nochmal) / Victory.
- Figuren: **Master** (Sprites), **Palm Master** (Sprites), **Sorceress** (Sprites, Ring-Projektil als echtes Sprite), **Tiger** (Sprites, 35 Einzelframes), **Minotaurus** (Sprites, Endgegner, 1.25× groß, nicht spielbar). Der **Wolf** (Vektor) ist noch im Code, aber nicht im Roster.
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

## HUD (v10): Gold-/Tusche-Design
- `src/render/hud.js` ist das Martial-Arts-HUD (Tusche-Platten, Klingen-Lebensbalken, Portraits im Goldring mit Hanko-Siegel, Ring-Uhr, Pinsel-Combo-Zähler, Ensō-Banner). Serifenschrift mit CJK-Fallback (Kanji 武 闘 勝 壱 弐 参 brauchen eine Systemschrift mit CJK, sonst Kästchen).
- Eigene Ergänzungen über das gelieferte HUD hinaus: Stage-Anzeige unter dem Timer (`STAGE n / total`, `FINAL BOSS`) und Arcade-Banner (Stage Clear / Game Over / Arcade geschafft) im selben Stil.
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
1. **Master:** keine Lauf-/Duck-/Sprung-/Block-Frames → schnelle Idle-Frames mit Wippen, gestauchter Idle, Knie-hoch-Frame, Treffer-Frame. Knockdown = gedrehter Treffer-Frame.
2. **Palm Master:** keine echten Angriffs-Sheets → Gesten-Frames (Zeigen, Handfläche) mit Energie-Leuchten als Angriffe.
3. **Sorceress:** nur Idle, Sprung, Zauber-Sheet → alle Angriffe nutzen Zauber-Posen; Treffer/Knockdown sind Behelfe (geneigter Idle-Frame, gedreht/aufgerichtet).
4. **Minotaurus:** Brüll-Schockwelle, Axt-Stoß (Lauf-Frames), Stampfen; Knockdown/Aufstehen = Roll-Sequenz. Keine eigenen Hit-/Duck-Frames.
5. **Tiger** (Sprites aus `assets/tiger/source/`, Atlas via `python3 tools/make-sprites.py tiger`): keine Lauf-/Sprung-/Duck-Frames (Idle schnell + Wippen, Kick-Pose in der Luft, kniende Get-up-Pose zum Ducken), keine Sieg-Pose (Rising-Claw-Pose), `hit_light_*` (nur Kopf) ungenutzt. Zuordnung: `TIGER_ANIMS` in `src/render/sprites.js`. Die Vektor-Figur (`rig.js`) wird nur noch für den Wolf benutzt.
6. Kein Sound, kein Gamepad, kein 2-Spieler-Modus, keine Rundenzeit-/Schwierigkeits-Persistenz außer Schwierigkeit (localStorage).
7. Sprite-Zuordnung (Frame-Listen) steht in `src/render/sprites.js` (`*_ANIMS`) – dort lassen sich Posen einfach tauschen, wenn bessere Sheets kommen.

## Wo was liegt
- Architektur + Erweiterungen: `docs/ARCHITECTURE.md` (Zustandsautomat, Physik, Kamera, Arcade, Stages, Sprites).
- Frame-Daten/Moves: `src/core/moves.js` · Charaktere/Roster/Leiter: `src/core/characters.js` · KI-Stufen: `src/core/ai.js` (`AI_LEVELS`) · Kamera-Werte: `src/core/config.js` (`CAMERA`) · Level-Themes: `src/render/stage.js` (`THEMES`) · Startmenü: `src/render/select.js`.
- Assets: `assets/<id>/atlas.webp + meta.json` (fertig gepackt). Quell-Sheets nur im Paket „…_mit_sprite-quellen“ (`assets/<id>/source/`). Neu packen: `python3 tools/make-sprites.py [hero|palm|witch|mino]` (Pillow + numpy nötig).

## Bauen und testen
- Bauen (Node): `node tools/build.mjs` oder `build.bat`/`build.sh` → erzeugt `dist/game.js` und `dist/hitisop.html` (Sprites eingebettet). **Nach jeder Code-Änderung in `src/` neu bauen**, sonst läuft `index.html` mit altem Stand.
- Tests (Node, kein Browser): `node tests/sim.test.js` (Kampfsystem), `node tests/camera.test.js`, `node tests/ai.test.js`, `node tests/arcade.test.js` (Arcade-Ablauf), `node tests/smoke.cjs` (Bundle mit DOM-Stub; Sprite-Bilder werden dort nicht geladen). Alle zusammen: `npm test` (+ smoke separat).

## Sinnvolle nächste Schritte
1. Im echten Browser durchspielen (alle 4 Figuren, alle 4 Stages, Game Over/Retry, Menü M, Vollbild F) und Fehler/Gefühl notieren.
2. Fehlende Sprite-Sheets nachliefern lassen (Master: Laufen/Ducken/Sprung/Block/Knockdown; Palm Master + Sorceress: echte Angriffe/Treffer) und in `HERO_ANIMS`/`PALM_ANIMS`/`WITCH_ANIMS` eintragen (ggf. `make-sprites.py` erweitern).
3. Balancing: `AI_LEVELS`, Boss-Werte (`mino` in characters.js), Frame-Daten.
4. Optional: Sound, Gamepad, 2-Spieler, Wolf ins Roster.

## Arbeitsweise-Wünsche des Auftraggebers (bitte beibehalten)
- Nach jeder Code-Änderung das Projekt als ZIP ausliefern, ohne dass man danach fragen muss.
- Bei Einrichtung/Konfiguration darf nichts manuell eingetippt werden müssen (alles fertig im Projekt/ZIP, höchstens ein Skript zum Ausführen).
- Sprache: Deutsch.

## Tiger-Qualität (NEU): Sheet-Pipeline
- Problem: Tiger-Frames sind klein/weich (~260 px Standhöhe) und zu wenige (6 Idle, 3–4 pro Angriff); Master hat 67 Frames in durchgehendem Stil.
- Lösung: neue Gemini-Sheets (3×2 bzw. 4×2 Zellen, grüner Hintergrund) nach `assets/tiger/sheets/` legen und `TIGER-UPDATE.bat` / `tiger-update.sh` ausführen. Prompts + Dateinamen: `docs/TIGER_PROMPTS.md`, Referenzbild: `assets/tiger/referenz/tiger_referenz.png`.
- `tools/import-tiger-sheets.py`: Hintergrund entfernen, Raster schneiden (Lückenerkennung, sonst gleichmäßig), Maßstab über Zelle 1 (= neutrale Haltung, Standhöhe 300), Fußlinie + horizontaler Schwerpunkt je Frame, Atlas + `meta.anims`. Die Zuordnung Sheet → Spiel-Animation steht in `ANIMS` im Skript.
- `sprites.js` übernimmt `meta.anims` automatisch (überschreibt nur Animationen, für die Sheets da sind; Rest bleibt `TIGER_ANIMS`). `fighter.js`: `air`-Animation läuft jetzt nach Flugbahn (vy).
- Pipeline wurde nur mit künstlichen Test-Sheets (alte Tiger-Frames auf Grün) geprüft, noch nicht mit echten Gemini-Sheets.

## Eigene Figur im Startmenü (NEU)
- Startmenü hat jetzt 5 Karten: 4 Kämpfer + Slot „EIGENE FIGUR“ (leer = gestricheltes „+“; Klick/Enter öffnet den Editor; mit Figur: Karte spielbar, „✎ EDIT“-Knopf oder Taste E bearbeitet). Auch im Pausenmenü (M) → „Editor öffnen“. `ROSTER` bleibt unverändert (4 Einträge, Tests), der 5. Slot ist `'custom'` und existiert nur, wenn `CHARACTERS.custom` registriert ist.
- Editor (`src/render/customstudio.js`, HTML wird dynamisch erzeugt, CSS `styles/main.css` ab „Eigene Figur“): Sheets per Drag&Drop (Dateiname → Slot, z. B. `idle_1.png`) oder je Slot „Wählen“; Live-Vorschau mit Animationsauswahl; Name, Moves-Vorlage (MASTER/PALM/TIGER/SORCERESS), Leben/Tempo/Schaden/Abwehr, Leuchtfarbe; „Prompt“-Knopf je Sheet kopiert fertigen Gemini-Prompt (Figurenbeschreibung vom Nutzer). Nötig ist nur `idle_1`; fehlende Animationen übernehmen Behelfe (`cusCompleteAnims`).
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

### Update v19c: Konfetti raus, nur dumpfe Schlag-Sounds
- Keine Splitter/Konfetti-Plättchen mehr (Treffer, K.O., Sieg). `ParticleSystem.shard/confetti` bleiben als ungenutzter Code.
- Sounds: Töne/Glocken (`combo_step_*`, `parry_clang`, `hitstop_freeze`, `hit_critical`, `heavy_hit_sweetener`, `heavy_hit_full`) werden nicht mehr abgespielt (Dateien bleiben in `sfx/`). Ersatz: `heavy_hit_impact`, `punch_heavy`, `ground_slam`, `block_guard`. Schwung-/Dash-Sounds und Projektil-Whoosh tiefer gepitcht (kein „Biu“), Master-Tiefpass 6,5 kHz in `render/audio.js`.

### Update v19d: ruhigere Animationen
- Startmenü: Idle-Tempo aller Karten gleich (`t/2`), kein 3×-Sprung mehr für die gewählte/gehoverte Karte. Menü-Zeit `selT` jetzt framerate-unabhängig (vorher lief sie auf 120/144-Hz-Monitoren zu schnell).
- Tiger-Laufen: 14 → 9 fps, Wippen 4 → 2, Neigung .08 → .04 (`assets/tiger/meta.json`, Quelle `tools/import-tiger-sheets.py`, Fallback in `sprites.js`). Angriffe unverändert.
