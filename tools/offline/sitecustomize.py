"""Synthetic/verification Python processes permit loopback and Unix sockets only."""
import ipaddress,socket
_connect=socket.socket.connect;_connect_ex=socket.socket.connect_ex;_getaddrinfo=socket.getaddrinfo

def local(host):
 if host is None or host in {'localhost',b'localhost',''}:return True
 try:return ipaddress.ip_address(host.decode() if isinstance(host,bytes) else host).is_loopback
 except ValueError:return False

def check(address):
 if isinstance(address,tuple) and not local(address[0]):raise PermissionError('Synthetic mode permits loopback network connections only.')
def connect(self,address):check(address);return _connect(self,address)
def connect_ex(self,address):check(address);return _connect_ex(self,address)
def getaddrinfo(host,*args,**kwargs):
 if not local(host):raise PermissionError('Synthetic mode permits loopback network resolution only.')
 return _getaddrinfo(host,*args,**kwargs)
socket.socket.connect=connect;socket.socket.connect_ex=connect_ex;socket.getaddrinfo=getaddrinfo
