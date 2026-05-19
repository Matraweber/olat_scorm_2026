#!/bin/bash

PORT=8765

echo "SCORM Builder wird auf http://localhost:$PORT/builder/ gestartet ..."
echo "Druecke Strg+C zum Beenden."

if command -v python3 >/dev/null 2>&1; then
  open "http://localhost:$PORT/builder/"
  python3 - <<'PYEOF'
import http.server, socketserver, os, sys

PORT = 8765

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """Like SimpleHTTPRequestHandler but adds Cache-Control: no-cache to every
    response so that Safari (and other browsers) always fetch fresh files."""
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, fmt, *args):
        pass  # suppress per-request noise; errors still go to stderr

os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(('127.0.0.1', PORT), NoCacheHandler) as httpd:
    httpd.allow_reuse_address = True
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer gestoppt.')
PYEOF
  exit 0
fi

if command -v python >/dev/null 2>&1; then
  open "http://localhost:$PORT/builder/"
  python -m http.server $PORT --bind 127.0.0.1
  exit 0
fi

echo "Python wurde nicht gefunden."
echo "Bitte Python 3 installieren oder einen anderen lokalen Webserver nutzen."
read -n 1 -s -r -p "Druecke eine beliebige Taste zum Beenden..."
echo ""