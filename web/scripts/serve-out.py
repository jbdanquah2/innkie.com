#!/usr/bin/env python3
"""
Serves the static export (./out) locally the way firebase.json will at cutover:
  /r/**                  -> /r/index.html            (password / redirect shell)
  /dashboard/details/**  -> /dashboard/details/index.html  (link details shell)
Usage: python3 scripts/serve-out.py [dir=out] [port=4300]
"""
import http.server, os, sys

root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'out')
port = int(sys.argv[2]) if len(sys.argv) > 2 else 4300
SHELLS = ('/r', '/dashboard/details')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=root, **k)

    def do_GET(self):
        path, _, query = self.path.partition('?')
        for shell in SHELLS:
            if path.startswith(shell + '/') and path.strip('/') != shell.strip('/'):
                self.path = shell + '/index.html' + ('?' + query if query else '')
                break
        return super().do_GET()

if __name__ == '__main__':
    print(f'Serving {root} on http://localhost:{port}')
    http.server.ThreadingHTTPServer(('', port), Handler).serve_forever()
