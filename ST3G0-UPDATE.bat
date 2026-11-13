@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === ST3-G0-Bögen einlesen ===
set PY=python
where python >nul 2>nul || set PY=py -3
%PY% -m pip install --quiet --disable-pip-version-check pillow numpy scipy
%PY% tools\import-st3g0-sheets.py
if errorlevel 1 goto ende
node tools\build.mjs
if exist "assets\st3g0\sheets\_vorschau.png" start "" "assets\st3g0\sheets\_vorschau.png"
echo.
echo Fertig. Spiel starten: start.bat  (Kontrollbild: assets\st3g0\sheets\_vorschau.png, Warnungen: _bericht.txt)
:ende
pause
