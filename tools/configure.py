#!/usr/bin/env python3
"""Configure recipient-owned identifiers and private credentials without provider calls."""
import argparse,getpass,json,os,re,tempfile
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
SECRET_NAMES={'CEDAR_PROOF_APP_SECRET','CEDAR_PROOF_ENCRYPTION_KEY','CEDAR_PROOF_VERIFY_TOKEN','WA_CLOUD_TOKEN','BODEGA_WA_APP_SECRET','BODEGA_WA_VERIFY_TOKEN','BODEGA_OTP_DIGEST_KEY','BODEGA_PLAY_SERVICE_ACCOUNT_JSON','ANTHROPIC_API_KEY','GEMINI_API_KEY','GOOGLE_PLACES_API_KEY'}
PUBLIC_NAMES={'CEDAR_PROOF_APP_ID','CEDAR_PROOF_CONFIG_ID','CEDAR_PROOF_GRAPH_VERSION','CEDAR_PROOF_PUBLIC_ORIGIN','CEDAR_PROOF_STATE_DIR','CEDAR_PROOF_STATIC_DIR','WA_CLOUD_PHONE_ID','BODEGA_OTP_TEMPLATE_NAME','BODEGA_OTP_TEMPLATE_LANGUAGE','BODEGA_PLAY_TESTERS_GROUP','BODEGA_PLAY_DELEGATED_ADMIN','BODEGA_PLAY_OPT_IN_URL','BODEGA_PLAY_PACKAGE_ID','SHOP_PUBLIC_ORIGIN','SHOP_WHATSAPP_ORIGIN','SHOP_MARKETING_ORIGIN','SHOP_WHATSAPP_UPSTREAM','ROCOTO_RUNTIME_PUBLIC_BASE','CEDAR_WHATSAPP_BRIDGE_ENABLED','BODEGA_BUDDY_LOOP'}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--origin');parser.add_argument('--package-id');parser.add_argument('--whatsapp-number');parser.add_argument('--set',nargs=2,metavar=('NAME','VALUE'));parser.add_argument('--secret',choices=sorted(SECRET_NAMES));parser.add_argument('--secret-file',nargs=2,metavar=('NAME','PRIVATE_FILE'));args=parser.parse_args()
 private=ROOT/'.local';private.mkdir(mode=0o700,exist_ok=True)
 if private.is_symlink() or private.stat().st_uid!=os.getuid() or private.stat().st_mode & 0o077:raise SystemExit('Use a private .local directory owned by the current user.')
 target=private/'providers.env'
 if target.is_symlink() or target.exists() and (target.stat().st_uid!=os.getuid() or target.stat().st_mode & 0o077):raise SystemExit('Use an owned mode-0600 private configuration file.')
 from dotenv import dotenv_values
 values={k:v for k,v in dotenv_values(target,interpolate=False).items() if v is not None} if target.exists() else {}
 public=ROOT/'app/src/shop-config.json';settings=json.loads(public.read_text())
 if args.origin:
  u=urlsplit(args.origin)
  if u.scheme!='https' or not u.hostname or u.username or u.password or u.port or u.path or u.query or u.fragment:raise SystemExit('Use your exact HTTPS origin, such as https://shop.example.com.')
  previous=urlsplit(settings['nativeOrigin']).hostname;settings['nativeOrigin']=args.origin
  for rel in ['app/android/app/src/main/AndroidManifest.xml','app/android/app/src/main/java/com/soyrocoto/app/MainActivity.java','app/android/app/src/main/java/com/soyrocoto/app/ReturnLink.java']:
   p=ROOT/rel;p.write_text(p.read_text().replace(previous,u.hostname))
  for name in ['SHOP_PUBLIC_ORIGIN','SHOP_WHATSAPP_ORIGIN','SHOP_MARKETING_ORIGIN','ROCOTO_RUNTIME_PUBLIC_BASE','CEDAR_PROOF_PUBLIC_ORIGIN']:values[name]=args.origin
 if args.package_id:
  if not re.fullmatch(r'[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}',args.package_id):raise SystemExit('Use your application package identifier.')
  for rel,pattern in [('app/capacitor.config.ts',r"appId: '[^']+'"),('app/android/app/build.gradle',r'applicationId "[^"]+"')]:
   p=ROOT/rel;replacement=f"appId: '{args.package_id}'" if rel.endswith('.ts') else f'applicationId "{args.package_id}"';p.write_text(re.sub(pattern,replacement,p.read_text()))
  values.update(BODEGA_PLAY_PACKAGE_ID=args.package_id,BODEGA_PLAY_OPT_IN_URL='https://play.google.com/apps/testing/'+args.package_id)
 if args.whatsapp_number:
  if not re.fullmatch(r'\+[1-9]\d{7,14}',args.whatsapp_number):raise SystemExit('Use the E.164 number owned by your messaging account.')
  settings['botNumber']=args.whatsapp_number;settings['botChat']='https://wa.me/'+args.whatsapp_number[1:]
 if args.set:
  name,value=args.set
  if name not in PUBLIC_NAMES:raise SystemExit('Choose a declared public configuration name; use --secret for credentials.')
  values[name]=value
 if args.secret:values[args.secret]=getpass.getpass(args.secret+' (private input): ')
 if args.secret_file:
  name,filename=args.secret_file;p=Path(filename).expanduser()
  if name not in SECRET_NAMES or p.is_symlink() or not p.is_file() or p.stat().st_uid!=os.getuid() or p.stat().st_mode & 0o077:raise SystemExit('Use a declared credential name and an owned mode-0600 input file.')
  raw=p.read_text();values[name]=json.dumps(json.loads(raw),separators=(',',':')) if name.endswith('_JSON') else raw.strip()
 if any('\n' in value or '\r' in value for value in values.values()):raise SystemExit('Each configuration value must fit on one line.')
 public.write_text(json.dumps(settings,indent=2)+'\n')
 if (ROOT/'website/peru').is_dir():
  (ROOT/'website/peru/owner.js').write_text('export const whatsappNumber = '+json.dumps(settings['botNumber'].lstrip('+'))+';\n')
 fd,temporary=tempfile.mkstemp(dir=private,prefix='.providers-')
 try:
  with os.fdopen(fd,'w') as out:
   for name,value in sorted(values.items()):out.write(name+'='+json.dumps(value)+'\n')
   out.flush();os.fsync(out.fileno())
  os.replace(temporary,target)
 finally:Path(temporary).unlink(missing_ok=True)
 print('Recipient settings saved. Private configuration is mode 0600; provider/device acceptance is separate.')
if __name__=='__main__':main()
