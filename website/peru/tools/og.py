#!/usr/bin/env python
"""peru/og-peru.jpg and peru/og-peru-es.jpg — 1200 x 630, captured from the page's own parts.

The card is one grid: the Rocoto lockup, the page's H1 and the page's own sentence on the left,
the handset on the right, playing a demo the site actually serves.

The SHIPPED ENGLISH CARD IS NOT RE-SHOT. It was made from `vender.html`, a demo that has since
left the site, so re-running it whole would quietly change the English asset. What `--lang en`
re-renders here is the LEFT COLUMN only, pasted onto the shipped card's own handset pixels from
x = SEAM rightwards — a check that this tool's type layer is the shipped card's type layer. The
type reaches x = 710 and the phone starts at x = 789, so the seam falls in flat background.

The SPANISH CARD IS SHOT WHOLE, because a Spanish link preview cannot hold a phone full of English
chat. Its handset plays `compras.html` in Spanish — the root page's own story, which is also the
right story for a card on the Buying page. The two cards therefore show two different phones, each
speaking its page's language, which is what the card is for.

    /home/peter/wt/bodega-pay-later/.venv/bin/python peru/tools/og.py --lang es
    …/python peru/tools/og.py --lang en --out /tmp/check.jpg   # re-render EN to prove the type

A static server must already serve the repository root (default http://127.0.0.1:8188).
"""
import argparse, os, pathlib, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
PLATE = ROOT / "peru" / "og-peru.jpg"          # the shipped card; its handset is the handset
SEAM = 750                                      # flat background between the last word and the phone

# The words on each card. English is what the shipped card says, so `--lang en` reproduces it and
# the pipeline can be checked against the file. Spanish is the Spanish page's own hero, verbatim.
WORDS = {
    "en": ("Pay with credit, from WhatsApp",
           "Credit that understands the reality of your business, from your relationships to your opportunities."),
    "es": ("Paga con crédito, desde WhatsApp",
           "Crédito que entiende la realidad de tu negocio, desde tus relaciones hasta tus oportunidades."),
}

PAGE = """<!doctype html><html lang="__LANG__"><head><meta charset="utf-8">
<link rel="stylesheet" href="/peru/phone.css">
<link rel="stylesheet" href="/peru/peru.css">
<style>
 html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#FAF7F3}
 .og{width:1200px;height:630px;display:grid;grid-template-columns:1fr 430px;align-items:center;
     padding:0 0 0 76px;box-sizing:border-box;position:relative}
 .lock{display:flex;align-items:center;gap:11px;margin-bottom:34px}
 .lock img{display:block}
 .lock b{font-family:var(--display);font-weight:500;font-size:27px;letter-spacing:-.035em;color:#1A1413}
 h1{font-family:var(--display);font-weight:400;font-size:76px;line-height:1.0;letter-spacing:-.045em;color:#1A1413;margin:0}
 p{margin:28px 0 0;font-family:var(--display);font-weight:400;font-size:23px;line-height:1.42;letter-spacing:-.012em;color:#6F665C;max-width:30ch}
 .stage{position:relative;height:630px;overflow:hidden}
 .ph{--ph-w:300px;position:absolute;top:64px;left:40px}
 .ph .ph-note{display:none}
</style></head><body>
<div class="og">
  <div>
    <div class="lock"><img src="/brand/face-open.svg" width="36" height="36" alt=""><b>Rocoto</b></div>
    <h1>__H1__</h1>
    <p>__SUB__</p>
  </div>
  <div class="stage">__STAGE__</div>
</div>
<script>
 var ph = document.querySelector('.ph'), sc = ph && ph.querySelector('.ph-screen');
 if (sc) new ResizeObserver(function(e){
   ph.style.setProperty('--ph-s', (e[0].contentRect.width/390).toFixed(5)); }).observe(sc);
</script></body></html>"""

STAGE = """<figure class="ph is-ready" data-mode="static">
  <div class="ph-body"><div class="ph-stage">
    <img class="ph-plate" src="/peru/handset/front.webp" width="1170" height="1500" alt="">
    <div class="ph-screen">
      <iframe class="ph-frame" width="390" height="844"
              src="/peru/demos/__DEMO__.html?poster&amp;lang=__L__"></iframe>
      <span class="ph-island"></span>
    </div>
  </div></div>
</figure>"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8188")
    ap.add_argument("--lang", default="es", choices=["en", "es"])
    ap.add_argument("--out", default=None)
    ap.add_argument("--demo", default="compras")
    ap.add_argument("--whole", action="store_true",
                    help="shoot the handset too, instead of keeping the shipped card's pixels "
                         "(the default for Spanish)")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright is missing: run with /home/peter/wt/bodega-pay-later/.venv/bin/python",
              file=sys.stderr)
        return 2
    from PIL import Image

    h1, sub = WORDS[args.lang]
    out = pathlib.Path(args.out) if args.out else ROOT / "peru" / (
        "og-peru.jpg" if args.lang == "en" else f"og-peru-{args.lang}.jpg")
    whole = args.whole or args.lang != "en"
    body = (PAGE.replace("__LANG__", "es-PE" if args.lang == "es" else "en")
                .replace("__H1__", h1).replace("__SUB__", sub)
                .replace("__STAGE__", STAGE.replace("__DEMO__", args.demo)
                                           .replace("__L__", args.lang) if whole else ""))
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="og-"))

    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--force-color-profile=srgb"])
        ctx = b.new_context(viewport={"width": 1200, "height": 630}, device_scale_factor=2)
        pg = ctx.new_page()
        pg.route("**/__og.html", lambda r: r.fulfill(
            status=200, content_type="text/html; charset=utf-8", body=body))
        pg.goto(f"{args.base}/__og.html", wait_until="networkidle")
        pg.wait_for_function("document.fonts.ready.then(() => true)", timeout=8000)
        if whole:
            # the demo paints inside the glass on its own clock; wait for the frame to say it is
            # ready rather than for a guessed number of milliseconds
            pg.frame_locator(".ph-frame").locator("html[data-ready]").wait_for(timeout=20000)
        pg.wait_for_timeout(900)
        pg.screenshot(path=str(tmp / "raw.png"))
        b.close()

    card = Image.open(tmp / "raw.png").convert("RGB").resize((1200, 630), Image.LANCZOS)
    # The words must not run into the seam, or the handset would be pasted over a letter. The
    # measurement is on the PAINTED pixels — a block element's own rect is the whole column and
    # would report 770 for a line of type that ends at 640.
    px = card.load()
    bg = px[4, 4]
    right = max((x for x in range(SEAM + 40)
                 if any(sum(abs(a - b) for a, b in zip(px[x, y], bg)) > 12
                        for y in range(0, 630, 2))), default=0)
    if right > SEAM - 8:
        raise SystemExit(f"  the text reaches x={right}, past the seam at {SEAM}")
    if not whole:
        plate = Image.open(PLATE).convert("RGB")
        card.paste(plate.crop((SEAM, 0, 1200, 630)), (SEAM, 0))
    for q in (88, 84, 80, 76, 72):
        card.save(out, quality=q, optimize=True, progressive=False)
        if out.stat().st_size <= 120_000:
            break
    name = out.relative_to(ROOT) if out.is_relative_to(ROOT) else out
    print(f"  {name}  {out.stat().st_size // 1024} KB  "
          f"(text right edge {right:.0f}, seam {SEAM}, quality {q})")
    for f in tmp.iterdir():
        f.unlink()
    tmp.rmdir()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
