@echo off
rem Baut bei jedem Start neu (dauert nur kurz), damit nie eine alte Version aus dist/ startet
where node >nul 2>nul && node "%~dp0tools\build.mjs"
start "" "%~dp0dist\hitisop.html"
