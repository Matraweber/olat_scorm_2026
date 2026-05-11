#!/bin/bash

# Define the port
PORT=8765 # [cite: 1]

# Print startup messages
echo "SCORM Builder wird auf http://localhost:$PORT/builder/ gestartet ..." # [cite: 1]
echo "Druecke Strg+C zum Beenden." # [cite: 1]

# Check for python3 (Default on modern macOS)
if command -v python3 >/dev/null 2>&1; then
  open "http://localhost:$PORT/builder/" # [cite: 2]
  python3 -m http.server $PORT --bind 127.0.0.1 # [cite: 2]
  exit 0
fi

# Fallback: Check for python (In case it's an older system or aliased)
if command -v python >/dev/null 2>&1; then
  open "http://localhost:$PORT/builder/" # [cite: 2]
  python -m http.server $PORT --bind 127.0.0.1 # [cite: 2]
  exit 0
fi

# Error messages if Python is missing
echo "Python wurde nicht gefunden." # [cite: 2]
echo "Bitte Python 3 installieren oder einen anderen lokalen Webserver nutzen." # [cite: 3]

# Emulate the Windows 'pause' command
read -n 1 -s -r -p "Druecke eine beliebige Taste zum Beenden..." # [cite: 3]
echo ""