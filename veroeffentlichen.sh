#!/bin/sh
# Alles committen und zu GitHub hochladen -> Render baut das Spiel neu (Static Site, "yarn build").
cd "$(dirname "$0")" || exit 1
git add -A && git commit -m "${1:-Neue Sammelkarten}" && git push
