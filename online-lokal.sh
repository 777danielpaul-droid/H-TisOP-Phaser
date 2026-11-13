#!/bin/sh
# Startet Spiel + Online-Server lokal. Zweites Gerät im selben WLAN: die "Anderes Gerät"-Adresse im Browser öffnen.
cd "$(dirname "$0")"
[ -d node_modules/ws ] || npm install --omit=dev --no-audit --no-fund
node tools/build.mjs
(sleep 1.5; xdg-open http://localhost:3000 || open http://localhost:3000) >/dev/null 2>&1 &
node server/server.js
