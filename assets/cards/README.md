# Sammelkarten-Bilder

Pro Karte eine Bilddatei, benannt nach der **Karten-ID** (`src/core/loot.js`, Liste `CARDS`):

`larve`, `spaeher`, `krieger`, `laterne`, `drink`, `wirbel`, `tiger`, `st3g0`, `kitsune`, `alpha`, `anubis`, `koenigin`

Beispiel: `assets/cards/tiger.png` (auch `.webp` oder `.jpg`). Empfohlen: Hochformat 5:7, z. B. 600×840 px.

Dann `node tools/build.mjs` (bzw. `build.bat` / `build.sh`) – die Bilder werden automatisch ins Spiel eingebettet.
Ohne Bild zeigt das Spiel die Karte weiter als Text-Karte. Neue Karten: Eintrag in `CARDS` (`loot.js`) + Bild mit derselben ID.
