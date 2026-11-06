#!/bin/sh
# Tiger-Sheets einlesen: assets/tiger/sheets/*.png -> Atlas + Animationen, danach neu bauen
cd "$(dirname "$0")" || exit 1
PY=python3; command -v python3 >/dev/null 2>&1 || PY=python
$PY -m pip install --quiet --disable-pip-version-check pillow numpy scipy 2>/dev/null || $PY -m pip install --quiet --break-system-packages pillow numpy scipy 2>/dev/null
$PY tools/import-tiger-sheets.py && node tools/build.mjs
(xdg-open assets/tiger/sheets/_vorschau.png || open assets/tiger/sheets/_vorschau.png) 2>/dev/null
echo "Fertig. Kontrollbild: assets/tiger/sheets/_vorschau.png, Warnungen: assets/tiger/sheets/_bericht.txt"
