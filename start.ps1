$port = 8765
$root = $PSScriptRoot
Write-Host "SCORM Builder wird auf http://localhost:$port/builder/ gestartet ..." -ForegroundColor Cyan
Write-Host "Druecke Strg+C zum Beenden." -ForegroundColor Yellow
Start-Process "http://localhost:$port/builder/"
Set-Location $root
py -3 -m http.server $port --bind 127.0.0.1
