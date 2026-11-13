@echo off
cd /d "%~dp0"
if not exist node_modules\ws call npm install --omit=dev --no-audit --no-fund
node tools\build.mjs
start "" http://localhost:3000
node server\server.js
