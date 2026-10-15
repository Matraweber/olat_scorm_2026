@echo off
REM Runs the browser test suite (needs Node 18+, Python 3, Edge or Chrome).
REM Installs the dev tools on first use.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js nicht gefunden. Bitte Node 18+ installieren: https://nodejs.org & pause & exit /b 1)
if not exist node_modules (
  echo Installiere Test-Werkzeuge ^(einmalig^)...
  call npm install || (pause & exit /b 1)
)
call npm test
echo.
pause
