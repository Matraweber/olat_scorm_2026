# serve.py: Development server for the SCORM Builder.
# Serves the project root on http://127.0.0.1:8765 with Cache-Control: no-cache
# on every response. ES modules under builder/js/ are imported without ?v=
# cache busters, so without these headers browsers may keep serving stale
# modules from the heuristic cache after files change on disk.
#
# Used by start.bat (Windows) and start.sh (macOS/Linux).
import http.server
import os
import re
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Suppress per-request noise; errors still reach stderr.
        pass

    # Byte-range support so <video> seeking works (the tutorial embed on the
    # welcome page). SimpleHTTPRequestHandler ignores Range headers, which
    # makes Chromium restart media from 0 on every seek.
    def do_GET(self):
        range_header = self.headers.get('Range')
        if not range_header:
            return super().do_GET()
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().do_GET()
        m = re.match(r'bytes=(\d*)-(\d*)$', range_header.strip())
        if not m:
            return super().do_GET()
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return
        with f:
            size = os.fstat(f.fileno()).st_size
            start_s, end_s = m.group(1), m.group(2)
            if start_s == '' and end_s == '':
                return super().do_GET()
            if start_s == '':
                # Suffix range: last N bytes.
                length = min(int(end_s), size)
                start = size - length
                end = size - 1
            else:
                start = int(start_s)
                end = min(int(end_s), size - 1) if end_s else size - 1
            if start >= size or start > end:
                self.send_response(416)
                self.send_header('Content-Range', 'bytes */%d' % size)
                self.end_headers()
                return
            self.send_response(206)
            self.send_header('Content-Type', self.guess_type(path))
            self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
            self.send_header('Content-Length', str(end - start + 1))
            self.end_headers()
            f.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                chunk = f.read(min(65536, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (ConnectionAbortedError, BrokenPipeError):
                    break
                remaining -= len(chunk)


def server_class():
    """Multi-threaded server, so one slow request (e.g. a video stream on the
    welcome page) can't block the many parallel fetches of a ZIP export.
    Falls back to the classic single-threaded server where Python has no
    thread support."""
    try:
        import threading  # noqa: F401  (only to confirm threads are available)
    except ImportError:
        return socketserver.TCPServer, False

    class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        # Don't let an open stream keep the process alive on Ctrl+C.
        daemon_threads = True

    return ThreadedServer, True


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # SO_REUSEADDR avoids TIME_WAIT trouble on quick restarts, but on Windows
    # it also allows binding a port that another process is already listening
    # on, silently hiding a stale server. Only enable it off Windows.
    socketserver.TCPServer.allow_reuse_address = (os.name != 'nt')
    ServerClass, threaded = server_class()
    try:
        httpd = ServerClass(('127.0.0.1', PORT), NoCacheHandler)
    except OSError:
        print(f'Port {PORT} ist bereits belegt. Laeuft der Server schon?')
        sys.exit(1)
    if not threaded:
        print('Hinweis: Threads nicht verfuegbar, Server bearbeitet Anfragen nacheinander.')
    with httpd:
        print(f'SCORM Builder: http://localhost:{PORT}/builder/')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer gestoppt.')
