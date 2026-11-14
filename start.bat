@echo off
if not exist "%~dp0dist\hitisop.html" ( where node >nul 2>nul && node "%~dp0tools\build.mjs" )
start "" "%~dp0dist\hitisop.html"
