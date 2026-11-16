@echo off
cd /d "%~dp0"
git add -A
git commit -m "Neue Sammelkarten"
git push
pause
