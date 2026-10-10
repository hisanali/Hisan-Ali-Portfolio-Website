"""Local Evermile preview, including its existing public Realtime configuration.
Run: python3 scripts/serve-evermile.py [port]
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
import json
import os
import sys

os.chdir(Path(__file__).resolve().parent.parent)

class Preview(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0].rstrip('/') != '/api/multiplayer/config':
            return super().do_GET()
        try:
            with urlopen('https://hisanali.com/api/multiplayer/config', timeout=15) as response:
                config = json.load(response)
            body = json.dumps({'url': config['url'], 'publishableKey': config['publishableKey']}).encode()
            self.send_response(200)
        except Exception:
            body = b'{"error":"Multiplayer configuration unavailable"}'
            self.send_response(502)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
print(f'Evermile preview: http://127.0.0.1:{port}/evermile/', flush=True)
ThreadingHTTPServer(('127.0.0.1', port), Preview).serve_forever()
