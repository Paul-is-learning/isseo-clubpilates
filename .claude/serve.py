import http.server, sys, os

DIRECTORY = '/Users/paulbecaud/Desktop/isseo-app'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        sys.stderr.write("[%s] %s\n" % (self.address_string(), format % args))
        sys.stderr.flush()

with http.server.HTTPServer(('', 8080), Handler) as httpd:
    sys.stderr.write('Serving %s on port 8080\n' % DIRECTORY)
    sys.stderr.flush()
    httpd.serve_forever()
