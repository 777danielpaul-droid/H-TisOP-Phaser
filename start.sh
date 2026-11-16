#!/bin/sh
cd "$(dirname "$0")"
# Neu bauen, wenn der Build fehlt oder der Code neuer ist als der Build (sonst startet man versehentlich eine alte Version)
if [ ! -f dist/hitisop.html ] || [ -n "$(find src styles index.html assets tools -newer dist/hitisop.html -type f 2>/dev/null | head -1)" ]; then
  command -v node >/dev/null && node tools/build.mjs
fi
(xdg-open dist/hitisop.html || open dist/hitisop.html) 2>/dev/null
