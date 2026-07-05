# serve.py: Development server for the SCORM Builder.
# Serves the project root on http://127.0.0.1:8765 with Cache-Control: no-cache
# on every response. ES modules under builder/js/ are imported without ?v=
# cache busters, so without these headers browsers may keep serving stale
# modules from the heuristic cache after files change on disk.
#
# Used by start.bat (Windows) and start.sh (macOS/Linux).
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Suppress per-request noise; errors still reach stderr.
        pass


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # SO_REUSEADDR avoids TIME_WAIT trouble on quick restarts, but on Windows
    # it also allows binding a port that another process is already listening
    # on, silently hiding a stale server. Only enable it off Windows.
    socketserver.TCPServer.allow_reuse_address = (os.name != 'nt')
    try:
        httpd = socketserver.TCPServer(('127.0.0.1', PORT), NoCacheHandler)
    except OSError:
        print(f'Port {PORT} ist bereits belegt. Laeuft der Server schon?')
        sys.exit(1)
    with httpd:
        print(f'SCORM Builder: http://localhost:{PORT}/builder/')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer gestoppt.')
