# Hier kommen die neuen Tiger-Sheets rein

1. Prompts + Referenzbild: `docs/TIGER_PROMPTS.md` und `assets/tiger/referenz/tiger_referenz.png`
2. Gemini-Bild hier speichern, **Dateiname genau wie im Prompt** (z. B. `idle_1.png`, `walk_1.png`, `punch.png`) – PNG, JPG oder WebP.
3. `TIGER-UPDATE.bat` (Windows) bzw. `tiger-update.sh` doppelklicken. Das Skript schneidet die Sheets, gleicht Größe/Fußlinie an, baut den Atlas, trägt die Animationen ein und baut das Spiel neu.
4. Kontrolle: `_vorschau.png` (alle Frames auf einer Fußlinie) und `_bericht.txt` (Warnungen, z. B. abgeschnittene Frames oder zu niedrige Auflösung).

Dateinamen: idle_1, idle_2, walk_1, walk_2, punch, kick, jump, hit, heavy, crouch, crouch_atk, air_atk, dash, claw, special, block, down, getup, win
Neue 2x2-Posenbögen: neu_bewegung, neu_tritt, neu_schlag, neu_posen (Zuordnung: ANIMS_NEU in tools/import-tiger-sheets.py)
Was noch fehlt, bleibt auf den alten Behelfs-Animationen – du kannst die Sheets nach und nach nachliefern.
