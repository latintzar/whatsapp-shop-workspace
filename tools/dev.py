#!/usr/bin/env python3
"""Run the actual browser/API/collection modules using isolated synthetic state."""
import argparse,os,signal,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE_ENV={k:v for k,v in os.environ.items() if k in {'PATH','HOME','USER','LANG','LC_ALL','TMPDIR','SSL_CERT_FILE','SSL_CERT_DIR'}}

def environment(state:Path, providers:bool=False):
    from dotenv import dotenv_values
    env=BASE_ENV.copy()
    if providers:
        config=ROOT/'.local/providers.env'
        if config.is_symlink() or not config.is_file() or config.stat().st_uid!=os.getuid() or config.stat().st_mode & 0o077:
            raise SystemExit('Use the owning user’s .local/providers.env with mode 0600.')
        env.update({k:v for k,v in dotenv_values(config,interpolate=False).items() if v is not None})
    env.update(ROCOTO_RUNTIME_STATE_DIR=str(state/'api'),BODEGA_BUDDY_LOOP='off',ROCOTO_EGRESS_SANDBOX='1' if not providers else '0',
               VITE_ROCOTO_RUNTIME_BASE='http://127.0.0.1:18241')
    if not providers:
        env['CEDAR_WHATSAPP_BRIDGE_ENABLED']='false'
        env['PYTHONPATH']=str(ROOT/'tools/offline')
    return env

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--providers',action='store_true');parser.add_argument('--state-dir',type=Path);args=parser.parse_args()
    private=ROOT/'.local';private.mkdir(mode=0o700,exist_ok=True)
    state=args.state_dir or private/('connected' if args.providers else 'synthetic');state.mkdir(mode=0o700,parents=True,exist_ok=True)
    if state.is_symlink() or state.stat().st_uid!=os.getuid() or state.stat().st_mode & 0o077:raise SystemExit('Use a private .local directory owned by the current user.')
    env=environment(state,args.providers)
    # Native collection initializer preserves its existing key; configuration is never printed.
    sys.path.insert(0,str(ROOT/'app/src/prototypes/copper'))
    from runtime.__main__ import initialize,load_settings
    config=state/'collections.env'
    if config.exists():load_settings(config)
    else:initialize(config,state/'collections','http://127.0.0.1:18242')
    if not args.providers:
        text=config.read_text().replace('COPPER_ALLOW_LIVE=1','COPPER_ALLOW_LIVE=0').replace('CEDAR_SAMPLE_BANK=0','CEDAR_SAMPLE_BANK=1').replace('CEDAR_ALLOWED_ORIGINS=\n','CEDAR_ALLOWED_ORIGINS=http://127.0.0.1:18240\n')
        config.write_text(text);config.chmod(0o600)
    def stop(signum, frame):raise KeyboardInterrupt
    signal.signal(signal.SIGTERM,stop)
    processes=[]
    commands=[([sys.executable,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port','18241','--no-access-log'],ROOT/'mock-api',env),
              ([sys.executable,'-m','runtime','serve','--config',str(config),'--port','18242'],ROOT,{**env,'PYTHONPATH':os.pathsep.join(filter(None,[env.get('PYTHONPATH',''),str(ROOT/'app/src/prototypes/copper')]))}),
              (['npm','run','dev','--','--port','18240'],ROOT/'app',env)]
    try:
        for command,cwd,child_env in commands:processes.append(subprocess.Popen(command,cwd=cwd,env=child_env,start_new_session=True))
        print('Shop records: http://127.0.0.1:18240\nCollections: http://127.0.0.1:18242\nSynthetic shop and bank; own-key adapters require --providers.',flush=True)
        while True:
            for process in processes:
                if process.poll() is not None:raise SystemExit(process.returncode or 1)
            time.sleep(.3)
    except KeyboardInterrupt:pass
    finally:
        for process in reversed(processes):
            if process.poll() is None:os.killpg(process.pid,signal.SIGTERM)
        for process in processes:
            try:process.wait(timeout=5)
            except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL)
if __name__=='__main__':main()
