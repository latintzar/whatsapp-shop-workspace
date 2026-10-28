#!/usr/bin/env python3
"""Prove the actual local sample browser and collection API, with no external requests."""
import argparse,asyncio,json,uuid
from pathlib import Path
from urllib.parse import urlsplit
import httpx
ROOT=Path(__file__).resolve().parents[1]

def ledger_proof():
 base='http://127.0.0.1:18242'
 with httpx.Client(base_url=base,timeout=15,trust_env=False) as client:
  workspace=client.post('/api/cedar/workspaces',json={});workspace.raise_for_status();auth={'Authorization':'Bearer '+workspace.json()['token']}
  payload={'invoice_id':'sample-sale','document_id':'sample-note','seller_name':'Sample shop','description':'Sample shop delivery',
   'customer_name':'Sample customer','amount_minor':10000,'invoice_amount_minor':10000,'currency':'PEN','receiving_bank':'bbva',
   'account_label':'Sample receiving account','reference':'SAMPLE-SALE','idempotency_key':str(uuid.uuid4()),'sample_clock':'2026-09-18T10:00:00Z'}
  created=client.post('/api/cedar/requests',headers=auth,json=payload);created.raise_for_status();row=created.json()
  same=client.post('/api/cedar/requests',headers=auth,json=payload);same.raise_for_status();assert same.json()['id']==row['id']
  partial=client.post('/api/cedar/requests/'+row['id']+'/receipts',headers=auth,json={'amount_minor':4000,'currency':'PEN','reference':'sample-proof','method':'yape','source':'sample'});partial.raise_for_status();result=partial.json()
  assert result['balance_minor']==6000 and result['status']=='partial',result['status']
  assert result['sample_minor']==4000 and result['confirmed_minor']==0
  buyer=row['buyer_url'];assert urlsplit(buyer).hostname=='127.0.0.1';assert client.get(buyer).status_code==200
 with httpx.Client(base_url=base,timeout=15,trust_env=False) as fresh:
  reread=fresh.get('/api/cedar/requests/'+row['id'],headers=auth);reread.raise_for_status();assert reread.json()['balance_minor']==6000
 return {'request_created':True,'idempotent_request':True,'sample_principal_minor':10000,'sample_receipt_minor':4000,'remaining_minor':6000,'state':'partial','new_http_session_same_ledger':True}

async def browser_proof(out):
 from playwright.async_api import async_playwright
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--disable-dev-shm-usage','--no-sandbox'])
  for width,height in [(1440,980),(390,844)]:
   context=await browser.new_context(viewport={'width':width,'height':height},is_mobile=width<560,has_touch=width<560)
   page=await context.new_page();errors=[];external=[];collection_responses=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.on('response',lambda response:collection_responses.append((urlsplit(response.url).path,response.status)) if urlsplit(response.url).port==18242 else None)
   async def fence(route):
    host=urlsplit(route.request.url).hostname
    if host not in {'127.0.0.1','localhost',None}:external.append(host);await route.abort()
    else:await route.continue_()
   await context.route('**/*',fence)
   await page.goto('http://127.0.0.1:18240/#/prep',wait_until='networkidle')
   await page.get_by_text('Prep',exact=True).last.wait_for();await page.wait_for_timeout(500)
   text=await page.locator('body').inner_text();assert 'Maribel obra' in text and 'Rosa menú' in text
   assert await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
   await page.screenshot(path=str(out/f'{width}-prep.png'),full_page=width>=560)
   await page.goto('http://127.0.0.1:18240/#/money',wait_until='networkidle');await page.wait_for_timeout(600)
   intro=page.get_by_role('button',name='Open Money',exact=True)
   if await intro.count() and await intro.is_visible():
    await page.screenshot(path=str(out/f'{width}-money-introduction.png'))
    await intro.click();await page.wait_for_timeout(300)
   text=await page.locator('body').inner_text();assert 'Money' in text and 'record' in text.lower()
   assert await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
   await page.screenshot(path=str(out/f'{width}-money.png'),full_page=width>=560)
   await page.goto('http://127.0.0.1:18240/#/customers',wait_until='networkidle');await page.wait_for_timeout(300)
   text=await page.locator('body').inner_text();assert 'Sample chats' in text
   assert not errors,errors;assert not external,external
   assert ('/api/cedar/workspaces',201) in collection_responses,collection_responses
   assert ('/api/cedar/bank',200) in collection_responses,collection_responses
   results.append({'width':width,'routes':['prep','money','customers'],'sample_source_label':True,'persistent_collection_workspace':True,'sample_bank_http':200,'page_errors':0,'external_requests':0,'horizontal_overflow':False})
   await context.close()
  await browser.close()
 return results

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,default=ROOT/'.local/proof');args=parser.parse_args()
 args.output.mkdir(mode=0o700,parents=True,exist_ok=True)
 receipt={'fixture':'authored Bodega world','ledger':ledger_proof(),'browser':asyncio.run(browser_proof(args.output))}
 (args.output/'first-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
 print(json.dumps(receipt,indent=2))
if __name__=='__main__':main()
