# H!TisOP – 1v1 Arcade Beat 'em Up

**Starten:** `start.bat` (Windows) / `start.sh` (Mac/Linux) – oder `index.html` bzw. `dist/hitisop.html` doppelklicken. Kein Server, keine Installation.

**Ablauf (Arcade):** Startmenü → Kämpfer wählen (← →, Enter/J oder Mausklick), Schwierigkeit mit ↑ ↓. Du kämpfst nacheinander gegen alle anderen drei Kämpfer (je 2 Runden-Siege = Stage geschafft, jede Stage hat ein eigenes Level) und zuletzt gegen den **Minotaurus** (Endgegner, nicht spielbar). Spielbar: Master, Palm Master, Sorceress, Tiger.

Das Spiel füllt das Fenster. **F** (oder Doppelklick) = Vollbild. **M** = Menü/Pause (Steuerung, Move-Liste, Optionen, Zurück zur Charakterwahl).

Kurzsteuerung: A/D laufen · W/Space springen (2× = Doppelsprung) · S ducken · zurück halten = Block · J/K/L Light/Medium/Heavy · U Special · I Hyper · O Dash. Combos: L→M→H (auch Ducken↔Stehen), Launcher (↓+L) → ↑ → Luft-Combo, Doppelsprung/Air-Dash als Cancel.

Weiterentwickeln / Übergabe: siehe `HANDOVER.md` und `docs/ARCHITECTURE.md`. Neu bauen: `build.bat` / `build.sh` (Node). Tests: `node tests/sim.test.js` usw. (siehe HANDOVER.md).

**Neue Moves (v8):** Jede Figur hat jetzt ein eigenes Moveset mit eigenen Stärken/Schwächen (Anzeige in der Charakterwahl, komplette Liste im Menü **M → Moves**). Zusätzliche Eingaben: **→ + K / → + L** (Command-Normals), **← + U** (Rück-Special), **U in der Luft** (Luft-Special), bei Wellen/Specials bestimmt **J/K/L** die Stärke (schnell/schwach … langsam/stark).

**HUD (v10):** Gold-/Tusche-Design mit Klingen-Lebensbalken, Portraits, Ring-Uhr und Pinsel-Combo-Zähler.

**Gasse zwischen Hochhäusern (v16):** Der Kampf beginnt in einer engen Gasse. Wer einen Gegner in der Ecke weiter bearbeitet (oder ihn mit Wucht dagegen schleudert), bricht die Erdgeschoss-Wand des Hochhauses durch – links in eine Spielhalle, rechts in eine Lobby. Mit jedem Durchbruch wird die Arena breiter (voll geöffnet 2140 px). Werte: `BARRIER` in `src/core/config.js`.

## Credits
Sound effects: "Hitstop – Punch, Kick & Hit Feedback SFX (FREE Lite)" by yetiancai (itch.io), siehe `sfx/LICENSE.txt`.
