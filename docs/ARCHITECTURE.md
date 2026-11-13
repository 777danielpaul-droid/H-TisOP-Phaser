# Architektur

```
src/
  core/      reine Spiellogik, KEIN DOM  → headless testbar (tests/sim.test.js)
    config.js      Konstanten (Physik, Combo-Skalierung, Meter, Runden)
    input.js       InputBuffer (Historie, Puffer, Motionen, Doppeltipp) + KeyboardInput
    ai.js          AIController (gleiche Schnittstelle wie Tastatur)
    moves.js       Frame-Daten aller Moves (Startup/Active/Recovery, Hitboxen, Cancels)
    characters.js  Kämpfer-Stats + Move-Overrides
    fighter.js     Fighter: Zustandsautomat + Physik
    combat.js      Trefferauflösung, Block, Skalierung, Juggle
    projectile.js  Projektile        hitbox.js  Hitbox
    camera.js      Camera (x, y, zoom): folgt beiden Kämpfern, zoomt nach Abstand/Sprunghöhe – rein rechnerisch
    particles.js / effects.js   Partikel + Treffer-/Bewegungseffekte
    arcade.js      Arcade-Modus: Charakterwahl → Gegner-Leiter, Stage-Clear/Game Over/Victory
    game.js        Rundenablauf, Hitstop, Super-Flash, fester 60-Hz-Schritt
  render/    nur Darstellung (Canvas 2D)
    sprites.js (Sprite-Figuren aus Atlas, Animationen = Frame-Listen)  rig.js (Vektor-Skelett + Posen)  stage.js (Neon-Arena)  hud.js  renderer.js
  main.js    Verdrahtung: Loop, Eingabe, Dashboard
tools/build.mjs   bündelt src/ → dist/game.js + dist/hitisop.html
```

## Zustandsautomat (Fighter.state)
`idle · walk · crouch · air · dash · airdash · attack · hit · block · airhit · tumble · knockdown · wakeup · ko · win`

Freie Zustände (idle/walk/crouch/air) rufen jeden Frame `free()` auf: Angriff → Dash → Sprung → Bewegung.
`attack` läuft über Frame-Zähler `mf` (Startup → Active → Recovery). Hitbox nur im Active-Fenster.
Cancels (`tryCancel`) sind nur nach Kontakt (Treffer **oder** Block) erlaubt:
Chain L→M→H (Rang steigt), Special-Cancel, Hyper-Cancel (Special→Super), Jump-Cancel (Launcher `2H`).

## Physik & Sprung
- Pro Frame: `vy += gravity`, `y += vy`; Landung → `land()` (Zustandswechsel je nach Herkunft).
- **Jump-Buffering:** `UP` wird 6 Frames gepuffert (`PHYS.jumpBuffer`) – Sprung kurz vor der Landung wird sofort bei Bodenkontakt ausgeführt.
- **Coyote-Time:** `coyote` zählt 6 Frames nach Verlassen des Bodens (ohne Sprung) → Sprung bleibt erlaubt.
- **Doppelsprung:** `airJumps=1`, nur auf frische Taste (≤2 Frames); **Air-Dash:** `airDashes=1`, schwerkraftfrei (`noGrav`) für 17 Frames. Beides wird bei Landung zurückgesetzt.
- Spieltempo: `SPEED` (config.js, im Menü einstellbar) skaliert die Schrittfrequenz der Logik (Standard 1.5× = 90 Schritte/s). Bei hohen Sprüngen zoomt die Kamera (renderer.js) heraus.
- Eingabe-Puffer altern **nicht** während Hitstop/Super-Flash → Cancels bleiben zuverlässig.

## Treffer, Stun, Combos (combat.js)
- Block: zurück halten (stehend/ducken je nach `lv` high/mid/low, in der Luft nur nicht-low), Chip-Schaden 10 %, kann nie töten.
- Treffer: `hit` (Boden) oder `airhit` (Launcher/Luft). Hard-Knockdown (`jH`) → `tumble` → `knockdown`.
- **Luft-Combos:** Launcher `2H` → `airhit` (vy=-17) → Attacker Jump-Cancel (`superJumpV`) → `jL/jM/jH`.
  Jeder Treffer auf einen Luft-Gegner setzt `vy=-6` (schweben); nach `juggleMax`=6 Treffern fällt er.
- **Chains & Cancels (fighter.js `tryCancel`):** nur nach Kontakt; Rang muss steigen ODER bei gleichem Rang die Stance wechseln (5L→2L→5M→2M→5H…), `chainLen` begrenzt Ketten (max. 6, gleicher Rang max. 3×). Puffer: `PHYS.cancelBuffer` = 10 Frames. In der Luft nach Treffer/Block: Doppelsprung- oder Air-Dash-Cancel für lange Luft-Combos. Frame-Daten stehen gesammelt in `moves.js`.
- **Anti-Infinite:** `COMBO_SCALE` pro Treffer im Combo (100 % → 25 %), Super hat Mindestwert 50 %.
- Meter: Angreifer +18 % des Schadens, Verteidiger +10 %; Hyper kostet 100 (max 300).

## Kamera (core/camera.js, Aufruf in Game.step)
- `compute()`: Bounding-Box beider Kämpfer → nötige Weltbreite (`Abstand + 2·marginX`) und Welthöhe (Kopf-Oberkante + `headroom` bis Boden). `zoom = clamp(min(W/needW, H/needH), minZoom, maxZoom)`.
- Position: x = Mitte beider Kämpfer; y so, dass die Bildunterkante am Boden bleibt – bei Sprüngen neigt sich die Kamera nach oben. Alles wird in die Weltgrenzen (`WORLD`) geklemmt (kein leerer Rand).
- `update()`: Lerp (`lerpPos`, `lerpZoom`), läuft auch im Hitstop. `snap()` bei Rundenstart.
- Render-Pipeline (render/renderer.js): `save → Shake → save → camera.apply() → Stage, Fighter, Projektile, Partikel, Hitboxen → restore → restore → Scanlines/HUD/Super-Overlay` (HUD unskaliert). Der Stage-Hintergrund deckt die ganze Welt ab (`WORLD`), nicht nur den Bildschirm.
- Hyper-Kamerafahrt: `Game.cineCamera()` ruft `camera.focus(x,y,zoom,w)` auf den Angreifer auf und hält den Zoom (ca. 1.25, Gegner bleibt im Bild) solange der Hyper-Move aktiv ist (Freeze + Strahl); `w` blendet über `CAMERA.cine.inF` ein und ab `lead` Frames vor Ende der aktiven Phase über `outF` Frames sanft aus, danach übernimmt wieder die Kampfkamera. Banner zeigt den Move-Namen (`game.superName`). Tests: `node tests/hyper.test.js`.
- Werte justieren: `CAMERA` in config.js (minZoom 0.65, marginX, headroom, Lerp). Tests: `node tests/camera.test.js`.

## Movesets / Move-Felder (v8)
`moves.js` = Basis-Moves (Allrounder), `movesets.js` = Überschreibungen je Figur. Slots: `5/2/jL,M,H`, `6M`,`6H` (→+K/L), `fireball`/`rising`/`rush` (Motion oder U neutral/→/↓), `back` (←+U), `airsp` (U in der Luft), `super`.
Zusatzfelder: `armor:[von,bis]` (Rüstung), `unb` (Griff), `dive`, `tp`, `heal`, `gain`, `v:{L,M,H}`, `proj` (Objekt oder Liste; `ox,vy,grav,pierce,uniq,lv,look`). Stats: `def, jump, dash, airJumps, meter`.

## Erweitern
- Neuer Kämpfer: Eintrag in `characters.js` (+ Moveset in `movesets.js`, Sprites in `assets/<id>/` + `SPRITE_CHARS` in `render/sprites.js`).
- Neuer Move: Eintrag in `BASE_MOVES` (`moves.js`) + Zuordnung in `Fighter.select()`; Pose in `rig.js` (`A`).
- Neue Eingabe (Gamepad/P2): Klasse von `InputBuffer` erben und `tick()` implementieren.
- Nach Änderungen: `node tools/build.mjs` (oder `build.bat`), Tests: `node tests/sim.test.js`.

## Sprite-Figuren (H!T, ST3-G0)
- Quellen: Tiger = Einzelframes `assets/tiger/source/` (`tools/make-sprites.py`) bzw. Posenbögen `assets/tiger/sheets/` (`tools/import-tiger-sheets.py`); ST3-G0 = Posenbögen `assets/st3g0/sheets/` (`tools/import-st3g0-sheets.py`). Beide packen zu `assets/<id>/atlas.webp` + `meta.json` (+ `meta.js` für dev.html). Nur nötig, wenn sich die Sheets ändern; die fertigen Atlanten liegen bei.
- `tools/build.mjs` bettet alle Atlanten als Data-URI in `dist/game.js` ein (`window.__SPRITES__`) → läuft per Doppelklick, auch als Single-File-HTML.
- Animationen: Frame-Listen in `render/sprites.js` (`TIGER_ANIMS`, `ST3G0_ANIMS`). Der Fighter liefert `anim`, `animU` (0..1 über Move-Dauer bzw. Knockdown/Aufstehen) und `sf`. Optionen je Animation: `loop/fps`, `squash` (Ducken), `lean`, `bob`, `lying`, `flip` (gegen die Blickrichtung zeichnen, wenn Frames „nach vorn“ fallen).
- Anker je Frame: Fußlinie (Unterkante der Haut) = `f.y`, horizontal Körpermitte; fliegende Frames (`air`) = Körpermitte auf fester Höhe (damit eingebackene Bewegung der Sheets nicht doppelt zur Physik zählt).
- Bodenschatten (`groundShadow` in `sprites.js`): Ellipse mit der Mitte auf der Fußlinie, Breite = Fußabstand der aktuellen Pose (gemessen aus dem Atlas, `footSpan`), in der Luft kleiner/blasser und unter dem Körper; liegende Posen (`SPRITE_CHARS[id].lie`, `lying`) haben keinen Schatten. `lean` schiefst die Figur am Boden (Füße bleiben stehen) und dreht sie nur in der Luft. Test: `tests/shadow.test.js`.
- Neuer Sprite-Kämpfer: Atlas in `assets/<id>/`, Eintrag in `SPRITE_CHARS` (sprites.js, `lie` = Frames, in denen die Figur am Boden liegt), Charakter in `characters.js` mit `sprites:'<id>'`.
- Fehlende Frames werden behelfsmäßig ersetzt (siehe HANDOVER.md, Abschnitt ST3-G0).
- Knockdown: Launcher und harte Treffer setzen `launched` (keine Luft-Erholung) → Landung = harter Knockdown (`knockdown` → `wakeup`).

## Arcade-Modus (core/arcade.js)
- Zustände: `select → fight → clear | gameover | victory`. Die Charakterwahl ist ein Zustand, kein eigenes Spiel: Solange `state==='select'` läuft kein `game.step()`, der Renderer zeichnet `drawSelect()`.
- Leiter: `Arcade.ladderFor(id)` = `LADDER` ohne die eigene Figur (kein Endgegner mehr). Je Stage `game.rematch()` mit neuem Gegner (`p2.setChar`) und `game.stageIndex` → Hintergrund-Theme (`THEMES[stage]`).
- Eine Stage ist geschafft bei 2 Runden-Siegen (`ROUND.wins`). Danach `clear` (Banner, auto-weiter nach 240 Frames, Enter überspringt); bei Niederlage `gameover` (Enter = nochmal gegen denselben Gegner, Esc = Charakterwahl); nach dem letzten Gegner `victory`.
- Schwierigkeit (Leicht/Normal/Hart/Alptraum) wird im Startmenü mit ↑/↓ gewählt (auch im Menü M).
- Spielbare Figuren/Reihenfolge: `ROSTER`, `LADDER` in `characters.js`. Der Wolf (Vektor-Figur) existiert noch, ist aber nicht im Roster.
- `char.size` skaliert Hurtbox/Hitboxen/Kamera. `mods` eines Charakters darf je Move ein Objekt oder eine Funktion `base => patch` sein.

## Stages (render/stage.js)
`THEMES` = 4 Level (NEON CITY, CRIMSON TEMPLE, TOXIC DOCKS, LABYRINTH). Je Theme Farben, Skyline-Layer, Neon-Schilder, Boden; Stil `labyrinth` zeichnet Steinsäulen + Fackeln. Neues Level: Eintrag in `THEMES` (der Renderer wählt `THEMES[game.stageIndex]`).

## Gasse mit brechbaren Hochhauswänden (core/barrier.js)
`Arena` (`game.arena`) hält je Seite eine Begrenzung `{x, hp, max, step, final, visible, flash, show}`. `arena.l/.r` = aktuelle Spielfeldgrenzen (Start 110/850), beide Seiten brechbar (`BARRIER.steps = {L:1, R:1}`). `hitWall(game, victim, schaden, {launch})` wird von `combat.hit()` (Treffer/Block auf pinned Gegner) und `Fighter.physics()` (Aufprall > `BARRIER.impactV`) aufgerufen; bei hp ≤ 0 → `breakWall()`: Grenze rückt in das Gebäude (`x ± BARRIER.width`, aktuell 1000 px), Ziegel-Partikel, Shake/Hitstop, Opfer wird nach außen geschleudert (airhit, launched), `openT[side]` zählt Frames seit dem Bruch (Erdgeschoss-Fassade blendet aus, obere Fassade bleibt). Rückwände (`endL/endR`) sind `final` (unzerstörbar). `Game.startRound()` setzt die Arena zurück. Rendering: `Renderer.house()` → `houseSide('L'|'R')` mit Ebenen upper/ground/inner aus `houseLayers(theme, side)` (rechts Lobby, links Spielhalle), `areaBanner()` im Bildschirmraum.

**Decke (v15):** `HOUSE.ceil` (config.js) ist die Unterkante der Innendecke. `Arena.inside(x)` liefert 'L'/'R' im aufgebrochenen Gebäude; `Fighter.ceiling()` (am Ende von `physics()`) begrenzt dort die Kopfhöhe und blockt den Eintritt vom Hof, wenn der Kopf über der Decke liegt. KI-Ecken-Taktik: `AIController.corner()` + `AI_LEVELS[].corner`.

## Sound (v16)
`core/sfx.js` ordnet Ereignisse Sounds zu (`strike`, `hitSounds`, `swingSound`, `comboStep`), `Game.sfx(name,{vol,rate})` leitet an `game.audio.play()` weiter (`render/audio.js`, `main.js` setzt `game.audio`; headless/Tests = `null`). Samples: `sfx/<name>.ogg`, Build bettet sie als `window.__SFX__` ein. Neuer Sound: Datei in `sfx/` legen, in `core/sfx.js` oder per `game.sfx('name')` am Ereignis verwenden, Mindestabstand ggf. in `GAP` (audio.js).

## Eigener Hintergrund (render/backdrop.js, render/bgpanel.js)
`Backdrop` (`renderer.bd`) hält je Bereich (`all`, `title`, `select`, `fight`) ein Medium (Video-Element, Bitmap-Frames oder verkleinertes Canvas); `resolveSlot()` wählt Einzel-Bereich > `all` > Original. `Backdrop.draw(g,W,H,bereich,{cam,dimAdd})` zeichnet im Bildschirmraum (cover/contain, Abdunkeln, Parallaxe zur Kamera) und liefert `false`, wenn nichts gilt oder das Medium noch lädt – dann zeichnet der Renderer das Original. Der Renderer ruft es in `drawDemo` (Titelmenü), `drawSelect` und `draw` (Kampf, vor `cam.apply`) auf. `BgPanel` ist reine DOM-Oberfläche (Panel, Knopf, globales Drag & Drop, Toast) und kennt nur `Backdrop` und die Hooks `blocked/onOpen/onClose` aus `main.js`.

