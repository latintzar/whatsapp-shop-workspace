import importlib.util,json,os,shutil,stat,subprocess,sys
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]

def test_runner_excludes_parent_keys(tmp_path,monkeypatch):
 spec=importlib.util.spec_from_file_location('shop_dev',ROOT/'tools/dev.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 monkeypatch.setenv('WA_CLOUD_TOKEN','synthetic-parent-key');monkeypatch.setenv('ANTHROPIC_API_KEY','synthetic-parent-key')
 env=module.environment(tmp_path)
 assert 'WA_CLOUD_TOKEN' not in env and 'ANTHROPIC_API_KEY' not in env
 assert env['ROCOTO_EGRESS_SANDBOX']=='1' and env['CEDAR_WHATSAPP_BRIDGE_ENABLED']=='false'
 assert Path(env['ROCOTO_RUNTIME_STATE_DIR'])==tmp_path/'api'

@pytest.fixture
def copy(tmp_path):
 for rel in ['tools/configure.py','app/src/shop-config.json','app/capacitor.config.ts','app/android/app/build.gradle','app/android/app/src/main/AndroidManifest.xml','app/android/app/src/main/java/com/soyrocoto/app/MainActivity.java','app/android/app/src/main/java/com/soyrocoto/app/ReturnLink.java']:
  p=tmp_path/rel;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/rel,p)
 return tmp_path

def invoke(copy,*args):return subprocess.run([sys.executable,str(copy/'tools/configure.py'),*args],text=True,capture_output=True)

def test_owner_callback_package_consistency(copy):
 result=invoke(copy,'--origin','https://merchant.example.test','--package-id','com.example.merchant','--whatsapp-number','+12025550199');assert result.returncode==0,result.stderr
 settings=json.loads((copy/'app/src/shop-config.json').read_text());assert settings['nativeOrigin']=='https://merchant.example.test'
 for rel in ['app/android/app/src/main/AndroidManifest.xml','app/android/app/src/main/java/com/soyrocoto/app/MainActivity.java','app/android/app/src/main/java/com/soyrocoto/app/ReturnLink.java']:assert 'merchant.example.test' in (copy/rel).read_text()
 assert 'com.example.merchant' in (copy/'app/android/app/build.gradle').read_text()
 assert stat.S_IMODE((copy/'.local/providers.env').stat().st_mode)==0o600
 assert settings['botChat']=='https://wa.me/12025550199'

@pytest.mark.parametrize('origin',['https://user@merchant.example.test','https://merchant.example.test/path','http://merchant.example.test','https://merchant.example.test:8443'])
def test_callback_rejects_ambiguous_origin(copy,origin):assert invoke(copy,'--origin',origin).returncode!=0

def test_private_file_literal_round_trip_and_permissions(copy,tmp_path):
 secret=tmp_path/'private-input.json';value={'type':'service_account','private_key':'synthetic $literal `text` value'};secret.write_text(json.dumps(value));secret.chmod(0o600)
 result=invoke(copy,'--secret-file','BODEGA_PLAY_SERVICE_ACCOUNT_JSON',str(secret));assert result.returncode==0
 assert 'synthetic' not in result.stdout and 'literal' not in result.stdout
 from dotenv import dotenv_values
 assert json.loads(dotenv_values(copy/'.local/providers.env',interpolate=False)['BODEGA_PLAY_SERVICE_ACCOUNT_JSON'])==value
 secret.chmod(0o644);assert invoke(copy,'--secret-file','BODEGA_PLAY_SERVICE_ACCOUNT_JSON',str(secret)).returncode!=0
