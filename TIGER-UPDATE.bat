@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Tiger-Sheets einlesen ===
set PY=python
where python >nul 2>nul || set PY=py -3
%PY% -m pip install --quiet --disable-pip-version-check pillow numpy scipy
%PY% tools\import-tiger-sheets.py
if errorlevel 1 goto ende
node tools\build.mjs
if exist "assets\tiger\sheets\_vorschau.png" start "" "assets\tiger\sheets\_vorschau.png"
echo.
echo Fertig. Spiel starten: start.bat  (Kontrollbild: assets\tiger\sheets\_vorschau.png, Warnungen: _bericht.txt)
:ende
pause
