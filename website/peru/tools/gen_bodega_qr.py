#!/usr/bin/env python3
"""Generate the owed picture `bodega-qr` (peru/img/README.md) through Ideogram.

Run it in the terminal where 1Password is signed in. The key is read from the vault inside this
process, sent only to api.ideogram.ai in the Api-Key header, and never printed or written down.
It saves four candidates as PNGs under peru/img/src/ and prints their paths and generation ids.
"""
import json, os, re, subprocess, sys, time, urllib.request, urllib.error, uuid, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
README = ROOT / "peru/img/README.md"
OUT = ROOT / "peru/img/src"
BASE = "https://api.ideogram.ai"
GENERATE = "/v1/ideogram-v4/async/generate"
POLL = "/v1/generations/{id}"

def key():
    k = os.environ.get("IDEOGRAM_API_KEY")
    if k: return k.strip()
    try:
        raw = subprocess.run(["op", "item", "get", "Ideogram API", "--vault", "Rocoto", "--format", "json", "--reveal"],
                             check=True, capture_output=True, text=True).stdout
    except subprocess.CalledProcessError as e:
        sys.exit("1Password did not answer in this terminal (sign in here first: eval $(op signin)). " + (e.stderr or "")[:160])
    fields = json.loads(raw).get("fields", [])
    for want in ("credential", "api key", "api_key", "key", "password", "token"):
        for f in fields:
            if (f.get("label") or "").lower() == want and f.get("value"): return f["value"].strip()
    for f in fields:
        if f.get("type") == "CONCEALED" and f.get("value"): return f["value"].strip()
    sys.exit("The vault item «Ideogram API» holds no concealed field.")

def prompt():
    text = README.read_text()
    block = text[text.index("**THE PROMPT, READY TO SEND**"):]
    m = re.search(r"^> (A stylized digital illustration.*)$", block, re.M)
    if not m: sys.exit("The ready-to-send prompt is missing from peru/img/README.md.")
    return m.group(1).strip()

def multipart(fields):
    b = "----rocoto" + uuid.uuid4().hex
    body = b"".join(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items()) + f"--{b}--\r\n".encode()
    return body, f"multipart/form-data; boundary={b}"

def call(method, url, k, body=None, ctype=None):
    req = urllib.request.Request(url, data=body, method=method, headers={"Api-Key": k, **({"Content-Type": ctype} if ctype else {})})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()

def find(o, names):
    if isinstance(o, dict):
        for n in names:
            if o.get(n): return o[n]
        for v in o.values():
            r = find(v, names)
            if r: return r
    if isinstance(o, list):
        for v in o:
            r = find(v, names)
            if r: return r
    return None

def urls(o, acc):
    if isinstance(o, dict):
        for kk, v in o.items():
            if kk == "url" and isinstance(v, str) and v.startswith("http"): acc.append(v)
            else: urls(v, acc)
    elif isinstance(o, list):
        for v in o: urls(v, acc)
    return acc

def main():
    k, p = key(), prompt()
    OUT.mkdir(parents=True, exist_ok=True)
    shapes = [{"aspect_ratio": "16x9"}, {"resolution": "1312x736"}, {}]
    status, raw, used = 0, b"", None
    for shape in shapes:
        body, ctype = multipart({"prompt": p, "rendering_speed": "QUALITY", "magic_prompt": "OFF", "num_images": "4", **shape})
        status, raw = call("POST", BASE + GENERATE, k, body, ctype)
        used = shape
        if status < 400: break
        print(f"Ideogram answered {status} to {shape or 'the default shape'}: {raw[:200].decode('utf-8','replace')}")
    if status >= 400: sys.exit("No shape was accepted; nothing was generated.")
    data = json.loads(raw); gid = find(data, ["generation_id", "id"])
    print("submitted", used, "generation", gid)
    got = urls(data, [])
    waited = 0
    while not got and gid and waited < 300:
        time.sleep(5); waited += 5
        status, raw = call("GET", BASE + POLL.format(id=gid), k)
        if status >= 400: sys.exit(f"Ideogram answered {status} to the poll: {raw[:200].decode('utf-8','replace')}")
        data = json.loads(raw); got = urls(data, [])
        state = str(find(data, ["status", "state"]) or "").lower()
        if state in ("failed", "error"): sys.exit("Ideogram could not paint it: " + raw[:300].decode("utf-8", "replace"))
    if not got: sys.exit(f"Still painting after {waited}s; generation {gid}. Check the account's quota.")
    (OUT / "bodega-qr-response.json").write_text(json.dumps(data, indent=1))
    for i, u in enumerate(got[:4]):
        for attempt in range(8):
            try:
                with urllib.request.urlopen(u, timeout=120) as r: blob = r.read()
                if blob: break
            except Exception: time.sleep(4)
        else: print("not downloadable yet:", u); continue
        f = OUT / f"cand-bodega-qr-{'abcd'[i]}.png"; f.write_bytes(blob); print("saved", f, len(blob))
    print("done. generation", gid)

if __name__ == "__main__": main()
