#!/bin/bash

PORT=8765
cd "$(dirname "$0")"

echo "SCORM Builder wird auf http://localhost:$PORT/builder/ gestartet ..."
echo "Druecke Strg+C zum Beenden."

if command -v python3 >/dev/null 2>&1; then
  open "http://localhost:$PORT/builder/" 2>/dev/null || true
  python3 serve.py "$PORT"
  exit 0
fi

if command -v python >/dev/null 2>&1; then
  open "http://localhost:$PORT/builder/" 2>/dev/null || true
  python serve.py "$PORT"
  exit 0
fi

echo "Python wurde nicht gefunden."
echo "Bitte Python 3 installieren oder einen anderen lokalen Webserver nutzen."
read -n 1 -s -r -p "Druecke eine beliebige Taste zum Beenden..."
echo ""
