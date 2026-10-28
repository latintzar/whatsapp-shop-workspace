#!/usr/bin/env python3
"""Report local setup and variable presence; performs no provider requests."""
from pathlib import Path
import importlib.util,json,os,shutil,stat,subprocess
ROOT=Path(__file__).resolve().parents[1]
for name in ['node','npm','python3','java']:
 print(name, 'available' if shutil.which(name) else 'install')
for name in ['fastapi','httpx','cryptography','dotenv','uvicorn','pytest']:
 print(name,'available' if importlib.util.find_spec(name) else 'install requirements.txt')
for rel in ['app/node_modules','app/android/gradle/wrapper/gradle-wrapper.jar']:
 print(rel,'present' if (ROOT/rel).exists() else 'setup required')
config=ROOT/'.local/providers.env'
if config.exists():
 if config.is_symlink() or config.stat().st_uid!=os.getuid() or config.stat().st_mode & 0o077:raise SystemExit('Fix private configuration ownership and mode before checking presence.')
 print('private provider config','private')
 from dotenv import dotenv_values
 values=dotenv_values(config,interpolate=False)
 for name in ['WA_CLOUD_TOKEN','WA_CLOUD_PHONE_ID','BODEGA_OTP_TEMPLATE_NAME','BODEGA_PLAY_TESTERS_GROUP','CEDAR_PROOF_APP_ID','CEDAR_PROOF_APP_SECRET','CEDAR_PROOF_CONFIG_ID','CEDAR_PROOF_PUBLIC_ORIGIN','ANTHROPIC_API_KEY','GEMINI_API_KEY']:
  print(name,'present' if values.get(name) else 'awaiting configuration')
else:print('Provider mode: add your own private configuration when ready.')
print('Presence describes setup. Authenticated provider/device receipts establish connection and delivery.')
