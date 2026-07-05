@echo off
setlocal
set PORT=8765
cd /d "%~dp0"
echo SCORM Builder wird auf http://localhost:%PORT%/builder/ gestartet ...
echo Druecke Strg+C zum Beenden.
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/builder/
  py -3 serve.py %PORT%
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:%PORT%/builder/
  python serve.py %PORT%
  goto :eof
)
echo Python wurde nicht gefunden. Bitte Python 3 installieren oder einen anderen lokalen Webserver nutzen.
pause
