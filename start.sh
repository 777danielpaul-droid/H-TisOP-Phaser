#!/bin/sh
cd "$(dirname "$0")"
(xdg-open dist/hitisop.html || open dist/hitisop.html) 2>/dev/null
