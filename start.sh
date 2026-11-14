#!/bin/sh
cd "$(dirname "$0")"
[ -f dist/hitisop.html ] || { command -v node >/dev/null && node tools/build.mjs; }   # fehlt der Build, wird er automatisch erzeugt
(xdg-open dist/hitisop.html || open dist/hitisop.html) 2>/dev/null
