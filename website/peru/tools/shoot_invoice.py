#!/usr/bin/env python
"""The photographed invoice: render the paper, warp it onto a counter, light it, grain it.

Out: peru/demos/av/invoice-counter.webp at 1170 x 1560 (3x of the camera's 390 x 520 window).

THE PAPER IS PRINTED IN ONE LANGUAGE, so it is an asset with a language. `peru/demos/entrega.html`
asks for `invoice-counter-es.webp` when it is painting Spanish and falls back to the English one
until that file lands.

ONE TEMPLATE, TWO PAPERS. `invoice.html` beside this file is the English paper and stays English;
`WORDS` below is the Spanish twin of every printed word on it, keyed by the exact English, the same
shape `peru/i18n/es/*.json` uses for the pages. Nothing else on the paper moves: the supplier, the
R.U.C., the series and number, the date, the four lines, their amounts and S/ 386.00 are the same
document in both languages, which is what `entrega.html`'s `es` table reads back off the screen.

    /home/peter/wt/bodega-pay-later/.venv/bin/python peru/tools/shoot_invoice.py
    …/python peru/tools/shoot_invoice.py --lang es      # writes invoice-counter-es.webp

It came out of the build's scratchpad on 20 September so it survives the session that wrote it;
`peru/tools/` is excluded from the upload by .vercelignore, as the rest of the rig is.
"""
import math, pathlib, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageChops

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
AV = ROOT / "peru" / "demos" / "av"
W, H = 1170, 1560
PAPER_W, PAPER_H = 900, 1010

# The printed words, in the order they stand on the paper. A Lima distributor's own vocabulary:
# the series E001 is SUNAT's electronic one, so the box says FACTURA ELECTRÓNICA; the two signature
# lines on a Peruvian delivery are «Recibí conforme» and «Transportista»; the telephone is «Telf.».
WORDS = {
    "es": [
        ('<html lang="en">', '<html lang="es-PE">'),
        ("Tel. 01 000 0000", "Telf. 01 000 0000"),
        ('<div class="k">INVOICE</div>', '<div class="k">FACTURA ELECTRÓNICA</div>'),
        (">CUSTOMER<", ">CLIENTE<"),
        (">ADDRESS<", ">DIRECCIÓN<"),
        ('<th class="c">QTY</th>', '<th class="c">CANT.</th>'),
        ("<th>DESCRIPTION</th>", "<th>DESCRIPCIÓN</th>"),
        ('<th class="r">AMOUNT</th>', '<th class="r">IMPORTE</th>'),
        ("<td>Rice 5 kg</td>", "<td>Arroz 5 kg</td>"),
        ("<td>Cooking oil 1 L</td>", "<td>Aceite vegetal 1 L</td>"),
        ("<td>Evaporated milk 400 g</td>", "<td>Leche evaporada 400 g</td>"),
        ("<td>Powder detergent 780 g</td>", "<td>Detergente en polvo 780 g</td>"),
        ('<td class="u">box</td>', '<td class="u">caja</td>'),
        ('<td class="u">unit</td>', '<td class="u">unidad</td>'),
        ('<div class="s">DELIVERED</div>', '<div class="s">ENTREGADO</div>'),
        ('<div class="line">Received by</div>', '<div class="line">Recibí conforme</div>'),
        ('<div class="line">Driver</div>', '<div class="line">Transportista</div>'),
        ("THANK YOU FOR YOUR PURCHASE", "GRACIAS POR SU COMPRA"),
    ],
}


def paper_source(lang: str) -> pathlib.Path:
    """The paper in one language. English is the file as it stands; Spanish is that file with
    every printed word replaced, and a word that no longer matches stops the shoot rather than
    printing half a translated invoice."""
    src = HERE / "invoice.html"
    if lang == "en":
        return src
    text = src.read_text(encoding="utf-8")
    for was, now in WORDS[lang]:
        if was not in text:
            raise SystemExit(f"  invoice.html no longer says {was!r} — the {lang} paper is stale")
        text = text.replace(was, now)
    out = pathlib.Path(tempfile.mkdtemp(prefix="paper-")) / f"invoice-{lang}.html"
    out.write_text(text, encoding="utf-8")
    return out


def render_paper(png: pathlib.Path, lang: str) -> None:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--force-color-profile=srgb", "--font-render-hinting=none"])
        ctx = b.new_context(viewport={"width": PAPER_W, "height": PAPER_H}, device_scale_factor=2)
        page = ctx.new_page()
        page.goto("file://" + str(paper_source(lang)), wait_until="load")
        page.wait_for_timeout(300)
        # A translated label is longer, and on this paper nothing ever overflows — the boxes grow
        # and the text wraps — so «does it overflow» is a question that can only ever answer no.
        # What a longer word actually costs is VERTICAL room: the head, the table and the total
        # grow down the sheet towards the stamp and the signature lines, which are pinned to the
        # foot. The clearance between them is the thing to measure.
        room = page.evaluate("""() => {
            const b = e => document.querySelector(e).getBoundingClientRect();
            return { body: Math.round(b('.tot').bottom), stamp: Math.round(b('.stamp').top),
                     foot: Math.round(b('.foot').top) };
        }""")
        gap = min(room["stamp"], room["foot"]) - room["body"]
        if gap < 40:
            raise SystemExit(f"  the invoice has grown into its own foot: the total ends at "
                             f"{room['body']}, the stamp starts at {room['stamp']} and the "
                             f"signatures at {room['foot']} — {gap} px of clearance")
        print(f"  {lang}: {gap} px between the total and the stamp")
        page.screenshot(path=str(png))
        b.close()


def coeffs(src, dst):
    """PIL wants the INVERSE map: for each destination point, where to read the source."""
    m = []
    for (sx, sy), (dx, dy) in zip(src, dst):
        m.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        m.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    import numpy as np
    A = np.array(m, dtype=float)
    B = np.array([c for p in src for c in p], dtype=float)
    return np.linalg.solve(A, B).tolist()


def counter() -> Image.Image:
    """The shop's counter: a warm laminate, its grain, the light of one tube overhead."""
    import numpy as np
    rng = np.random.default_rng(20260920)
    base = np.zeros((H, W, 3), dtype=float)
    base[:, :] = (150, 124, 99)

    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    # the light: one warm source beyond the top-left, falling away to the bottom-right
    lit = 1.16 - 0.42 * ((x - 0.18) ** 2 + (y - 0.05) ** 2) ** 0.5
    base *= lit[:, :, None]
    # the grain of the laminate: long fibres along the counter
    fib = rng.normal(0, 1, (H, W // 6 + 1))
    fib = np.repeat(fib, 6, axis=1)[:, :W]
    fib = (fib + rng.normal(0, 1, (H, W))) * 0.5
    base += fib[:, :, None] * 11.0
    base += rng.normal(0, 4.4, (H, W, 1))
    # the counter's own marks: a joint across it and a few scratches the years left
    yy = np.arange(H)[:, None]
    xx = np.arange(W)[None, :]
    joint = np.exp(-((yy - 118 - 0.055 * xx) ** 2) / 26.0)
    base -= joint[:, :, None] * 26
    for x0, y0, dx, dy, w, a in ((210, 1410, 340, -40, 2.2, 13), (760, 1470, 260, 26, 1.6, 10),
                                 (60, 520, 180, 90, 1.4, 8), (930, 300, -220, 120, 1.8, 9)):
        tt = np.clip(((xx - x0) * dx + (yy - y0) * dy) / float(dx * dx + dy * dy), 0, 1)
        d2 = (xx - (x0 + tt * dx)) ** 2 + (yy - (y0 + tt * dy)) ** 2
        base += (np.exp(-d2 / (w * w)) * a)[:, :, None]
    return Image.fromarray(np.clip(base, 0, 255).astype("uint8"), "RGB")


def main() -> int:
    lang = "en"
    if "--lang" in sys.argv:
        lang = sys.argv[sys.argv.index("--lang") + 1]
    if lang not in ("en",) and lang not in WORDS:
        raise SystemExit(f"  no paper in {lang}")
    out = AV / ("invoice-counter.webp" if lang == "en" else f"invoice-counter-{lang}.webp")
    # `--keep` parks the rendered paper next to the tool so a re-run can skip the browser; without
    # it the paper is an intermediate and lives in a temp directory, because a 380 KB PNG left in
    # the repository is a file somebody has to decide about later.
    keep = "--keep" in sys.argv
    png = (HERE if keep else pathlib.Path(tempfile.mkdtemp(prefix="paper-"))) / f"paper-{lang}.png"
    if not (keep and png.exists()):
        render_paper(png, lang)
    paper = Image.open(png).convert("RGB")

    # a sheet of paper is never flat on a counter: bow it, so its light is not a plane's
    import numpy as np
    pa = np.asarray(paper).astype(float)
    ph, pw = pa.shape[:2]
    bow = 1.0 - 0.055 * np.sin(np.linspace(0, math.pi, pw))[None, :] \
              - 0.030 * np.sin(np.linspace(0, math.pi, ph))[:, None]
    pa *= bow[:, :, None]
    paper = Image.fromarray(np.clip(pa, 0, 255).astype("uint8"), "RGB")

    # THE FRAME. The phone is held over the counter and tipped a little: the top edge of the
    # sheet is further away, so it is shorter, and the sheet lies a few degrees off square.
    quad = [(186, 292), (1002, 226), (1064, 1324), (120, 1252)]
    src = [(0, 0), (pw, 0), (pw, ph), (0, ph)]
    c = coeffs(src, quad)

    sheet = paper.transform((W, H), Image.PERSPECTIVE, c, Image.BICUBIC)
    mask = Image.new("L", (pw, ph), 255).transform((W, H), Image.PERSPECTIVE, c, Image.BICUBIC)

    img = counter()

    # the shadow the sheet casts: soft, offset down and right of the light
    sh = mask.filter(ImageFilter.GaussianBlur(26))
    shadow = Image.new("RGB", (W, H), (26, 18, 12))
    img = Image.composite(Image.blend(img, shadow, 0.42), img, ImageChops.offset(sh, 16, 22))
    # and a tighter, darker one right under the edges, so the paper sits ON the counter
    tight = mask.filter(ImageFilter.GaussianBlur(7))
    img = Image.composite(Image.blend(img, shadow, 0.30), img, ImageChops.offset(tight, 5, 8))

    img.paste(sheet, (0, 0), mask.point(lambda v: 255 if v > 128 else v))

    # THE LIGHT OVER THE WHOLE FRAME, paper and counter alike: one sheen, one vignette
    g = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(g)
    d.polygon([(-200, -300), (W + 300, -700), (W + 700, 500), (300, 900)], fill=64)
    g = g.filter(ImageFilter.GaussianBlur(190))
    img = Image.composite(Image.blend(img, Image.new("RGB", (W, H), (255, 250, 238)), 0.20), img, g)

    vig = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * 0.34, -H * 0.30, W * 1.34, H * 1.30), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(150)).point(lambda v: 255 - v)
    img = Image.composite(Image.blend(img, Image.new("RGB", (W, H), (30, 22, 16)), 0.30), img, vig)

    # the lens: the far top edge is a touch out of focus, and the whole frame carries grain
    blur = img.filter(ImageFilter.GaussianBlur(2.1))
    ramp = Image.linear_gradient("L").resize((W, H)).point(lambda v: max(0, 150 - v * 1.5))
    img = Image.composite(blur, img, ramp)

    na = np.asarray(img).astype(float)
    na += np.random.default_rng(7).normal(0, 3.4, na.shape)
    img = Image.fromarray(np.clip(na, 0, 255).astype("uint8"), "RGB")

    raw = HERE / f"invoice-counter-{lang}.png"
    img.save(raw)
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["cwebp", "-quiet", "-q", "55", str(raw), "-o", str(out)], check=True)
    raw.unlink(missing_ok=True)
    print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
    return 0


sys.exit(main())
