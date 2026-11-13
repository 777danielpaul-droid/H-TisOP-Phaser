#!/bin/sh
# ST3-G0-Bögen einlesen: assets/st3g0/sheets/bogen_N.(png|jpg) -> Atlas, danach neu bauen
cd "$(dirname "$0")" || exit 1
PY=python3; command -v python3 >/dev/null 2>&1 || PY=python
$PY -m pip install --quiet --disable-pip-version-check pillow numpy scipy 2>/dev/null || $PY -m pip install --quiet --break-system-packages pillow numpy scipy 2>/dev/null
$PY tools/import-st3g0-sheets.py && node tools/build.mjs
(xdg-open assets/st3g0/sheets/_vorschau.png || open assets/st3g0/sheets/_vorschau.png) 2>/dev/null
echo "Fertig. Kontrollbild: assets/st3g0/sheets/_vorschau.png, Warnungen: assets/st3g0/sheets/_bericht.txt"
