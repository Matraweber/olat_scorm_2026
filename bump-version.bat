@echo off
REM Bumps the cache-buster version in builder\index.html.
REM Usage: bump-version.bat          - bump by 1
REM        bump-version.bat 42       - set to specific version
setlocal EnableDelayedExpansion

cd /d "%~dp0"

set "FILE=builder\index.html"
if not exist "%FILE%" (
  echo Error: %FILE% not found. Run this script from the project root. 1>&2
  exit /b 1
)

REM Extract current ?v=N value (first occurrence)
set "CURRENT="
for /f "tokens=2 delims==" %%A in ('findstr /r /c:"?v=[0-9][0-9]*" "%FILE%"') do (
  if "!CURRENT!"=="" (
    REM %%A looks like:  105"   - strip trailing quote and anything after
    set "RAW=%%A"
    for /f "delims=^"" %%B in ("!RAW!") do set "CURRENT=%%B"
  )
)

if "!CURRENT!"=="" (
  echo No ?v=N pattern found in %FILE%. Nothing to bump. 1>&2
  exit /b 1
)

if not "%~1"=="" (
  set "NEW=%~1"
) else (
  set /a NEW=!CURRENT! + 1
)

REM Do the replacement via PowerShell (BAT-only string replace is fragile)
powershell -NoProfile -Command "(Get-Content -Raw '%FILE%') -replace '\?v=!CURRENT!\"', '?v=!NEW!\"' | Set-Content -NoNewline -Encoding utf8 '%FILE%'"
if errorlevel 1 (
  echo Error: PowerShell replacement failed. 1>&2
  exit /b 1
)

REM Count references for confirmation
set "COUNT=0"
for /f %%A in ('findstr /r /c:"?v=!NEW!\"" "%FILE%" ^| find /c /v ""') do set "COUNT=%%A"
echo Bumped cache-buster: v=!CURRENT! -^> v=!NEW! (!COUNT! references in %FILE%)
endlocal
