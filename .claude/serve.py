import http.server, sys, os

DIRECTORY = '/Users/paulbecaud/Desktop/isseo-app'
PORT = int(os.environ.get('PORT', 8080))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        sys.stderr.write("[%s] %s\n" % (self.address_string(), format % args))
        sys.stderr.flush()

with http.server.HTTPServer(('', PORT), Handler) as httpd:
    sys.stderr.write('Serving %s on port %d\n' % (DIRECTORY, PORT))
    sys.stderr.flush()
    httpd.serve_forever()
