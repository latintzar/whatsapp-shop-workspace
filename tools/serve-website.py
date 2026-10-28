#!/usr/bin/env python3
"""Serve original historical Peru templates on loopback with their documented aliases."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]/'website'
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  original=urlsplit(self.path);path=original.path.rstrip('/') or '/'
  aliases={'/':'/peru.html','/en':'/peru.html','/es':'/peru/es/index.html','/selling':'/peru/sales.html','/en/selling':'/peru/sales.html','/es/selling':'/peru/es/selling.html'}
  for name in ['privacy','terms','cookies']:
   aliases['/'+name]='/peru/'+name+'.html';aliases['/en/'+name]='/peru/'+name+'.html';aliases['/es/'+name]='/peru/es/'+name+'.html'
  self.path=aliases.get(path,original.path)+('?' +original.query if original.query else '')
  return super().do_GET()
 def log_message(self,*args):pass
if __name__=='__main__':
 print('Historical Peru templates: http://127.0.0.1:18244',flush=True)
 try:ThreadingHTTPServer(('127.0.0.1',18244),partial(Handler,directory=str(ROOT))).serve_forever()
 except KeyboardInterrupt:pass
