import http.server, sys, os

DIRECTORY = '/Users/paulbecaud/Desktop/isseo-app'
PORT = int(os.environ.get('PORT', 8080))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, format, *args):
        sys.stderr.write("[%s] %s\n" % (self.address_string(), format % args))
        sys.stderr.flush()

with http.server.HTTPServer(('', PORT), Handler) as httpd:
    sys.stderr.write('Serving %s on port %d\n' % (DIRECTORY, PORT))
    sys.stderr.flush()
    httpd.serve_forever()
