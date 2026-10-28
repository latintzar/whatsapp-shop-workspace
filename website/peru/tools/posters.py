#!/usr/bin/env python
"""Posters for the phones on /peru.

Opens every demo at 390 x 844 with deviceScaleFactor 2 and ?poster (motion off), and writes
peru/demos/posters/<name>.webp at 780 x 1688 — the size the page draws a phone at on a retina
screen, and a quarter of the weight of the 1170-wide captures that came before.

Each demo names its own poster frame (`poster:` in its scene), so this tool only presses the
shutter: compras rests on the whole exchange, with the link whose preview is Rocoto's confirmation
in the middle of it; cobro on the Rocoto app with that purchase paid in full; entrega on the Rocoto
app with the invoice read and its one act; and tienda — the selling page's own demo — on the
customer's page, open on the order with its amount and its act.

    /home/peter/wt/bodega-pay-later/.venv/bin/python peru/tools/posters.py
    …/python peru/tools/posters.py --base http://127.0.0.1:8188 --only compras
    …/python peru/tools/posters.py --lang es      # writes <name>-es.webp

A static server must already serve the repository root (default http://127.0.0.1:8188).
"""
import argparse, pathlib, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "peru" / "demos" / "posters"

DEMOS = ["compras", "cobro", "entrega", "tienda"]

W, H, SCALE = 390, 844, 2
QUALITY = 82


def webp(png: pathlib.Path, dest: pathlib.Path) -> None:
    subprocess.run(["cwebp", "-quiet", "-q", str(QUALITY), str(png), "-o", str(dest)], check=True)
    print(f"  {dest.relative_to(ROOT)}  {dest.stat().st_size // 1024} KB")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8188")
    ap.add_argument("--only", default=None, help="one demo name")
    ap.add_argument("--lang", default="en", choices=["en", "es"])
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright is missing: run with /home/peter/wt/bodega-pay-later/.venv/bin/python", file=sys.stderr)
        return 2

    OUT.mkdir(parents=True, exist_ok=True)
    demos = [args.only] if args.only else DEMOS
    suffix = "" if args.lang == "en" else "-" + args.lang
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="posters-"))

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--force-color-profile=srgb", "--font-render-hinting=none"])
        ctx = browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=SCALE)
        page = ctx.new_page()

        for name in demos:
            url = f"{args.base}/peru/demos/{name}.html?poster&lang={args.lang}"
            page.goto(url, wait_until="load")
            page.wait_for_selector("html[data-ready]", timeout=15000)
            # The kit serves its own Inter (peru/wa/fonts), so a poster paints exactly what a
            # visitor paints. Prove it rather than assume it: the face has to be loaded AND the
            # stack has to resolve to it, which a width measurement settles.
            page.wait_for_function("document.fonts.check('16px Inter')", timeout=8000)
            painted = page.evaluate("""() => {
                const cv = document.createElement('canvas').getContext('2d');
                const w = fam => { cv.font = '16px ' + fam; return +cv.measureText('S/ 386.00 langostinos').width.toFixed(2); };
                return { stack: w(getComputedStyle(document.body).fontFamily), inter: w('Inter') };
            }""")
            if abs(painted["stack"] - painted["inter"]) > 0.01:
                raise SystemExit(f"  {name}: the screen is NOT painting Inter ({painted})")
            page.wait_for_timeout(350)          # let the pictures and the fonts settle
            png = tmp / f"{name}.png"
            page.screenshot(path=str(png))
            webp(png, OUT / f"{name}{suffix}.webp")
            png.unlink(missing_ok=True)

        browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
