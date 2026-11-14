# Sammelkarten-Bilder

Pro Karte eine Bilddatei, benannt nach der **Karten-ID** (`src/core/loot.js`, Liste `CARDS`):

`larve`, `spaeher`, `krieger`, `laterne`, `drink`, `wirbel`, `tiger`, `st3g0`, `kitsune`, `alpha`, `anubis`, `koenigin`

Beispiel: `assets/cards/tiger.png` (auch `.webp` oder `.jpg`). Empfohlen: Hochformat 5:7, z. B. 600×840 px.

Dann `node tools/build.mjs` (bzw. `build.bat` / `build.sh`) – die Bilder werden automatisch ins Spiel eingebettet.
Ohne Bild zeigt das Spiel die Karte weiter als Text-Karte. Neue Karten: Eintrag in `CARDS` (`loot.js`) + Bild mit derselben ID.

## Automatisch erzeugte Karten (Kampfposen)

`python3 tools/make-cards.py` erzeugt `tiger`, `st3g0`, `kitsune`, `anubis`, `alpha`, `krieger`, `spaeher` als `.webp` (600×840) aus den Sprite-Atlanten: Hintergrund in der Figurenfarbe + eine Kampfpose. Pose/Farbe pro Karte stehen oben im Skript (`CARDS`). Danach `node tools/build.mjs`.
Die übrigen Karten (`larve`, `laterne`, `drink`, `wirbel`, `koenigin`) sind weiter Text-Karten, bis Bilder mit gleicher ID hier liegen.
