#!/usr/bin/env python3
"""Run preserved source suites sequentially with loopback-only Python networking."""
import json,os,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
 env={k:v for k,v in os.environ.items() if k in {'PATH','HOME','LANG','LC_ALL','TMPDIR','SSL_CERT_FILE','SSL_CERT_DIR'}}
 env.update(PYTHONPATH=str(ROOT/'tools/offline'),BODEGA_BUDDY_LOOP='off')
 out=ROOT/'.local/verification';out.mkdir(mode=0o700,parents=True,exist_ok=True)
 commands=[('typescript',['npx','--no-install','tsc','--noEmit','-p','tsconfig.app.json'],ROOT/'app',None)]
 for p in sorted((ROOT/'app/tools').glob('test-bodega*.mjs')):commands.append((p.stem,['node',str(p)],ROOT/'app',None))
 api=sorted((ROOT/'mock-api/tests').glob('test_bodega*.py'))+[ROOT/'mock-api/tests'/n for n in ['test_cedar_whatsapp_bridge.py','test_cedar_order_intake.py','test_cedar_access.py']]
 commands += [('prototype-api',[sys.executable,'-m','pytest','-q',*[str(p) for p in api]],ROOT,None),('whatsapp-history',[sys.executable,'-m','pytest','-q','app/src/prototypes/cedar/connections/proof'],ROOT,'app/src/prototypes/cedar/connections/proof'),('collections',[sys.executable,'-m','pytest','-q','app/src/prototypes/copper/tests'],ROOT,'app/src/prototypes/copper'),('portable-setup',[sys.executable,'-m','pytest','-q','tools/test_portable_setup.py'],ROOT,None),('marketing-referrals',['node','website/tools/test_waitlist_referral.mjs'],ROOT,None)]
 results=[]
 for name,command,cwd,extra in commands:
  child=env.copy()
  if extra:child['PYTHONPATH']+=os.pathsep+str(ROOT/extra)
  started=time.monotonic()
  with (out/(name+'.log')).open('w') as log:process=subprocess.run(command,cwd=cwd,env=child,stdout=log,stderr=subprocess.STDOUT)
  results.append({'name':name,'returncode':process.returncode,'seconds':round(time.monotonic()-started,2)})
  print(name,'passed' if process.returncode==0 else 'FAILED (private verification log)',flush=True)
 (out/'verification.json').write_text(json.dumps({'source':'e4801f58454c3a7fa639d0570b71f3434d2dc759','python_network':'loopback-only','suites':results},indent=2)+'\n')
 return 1 if any(x['returncode'] for x in results) else 0
if __name__=='__main__':raise SystemExit(main())
