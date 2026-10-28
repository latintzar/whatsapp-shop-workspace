#!/usr/bin/env python3
"""Bake the static frames from the SAME scene the live module renders.

  front.webp     the front pose at 1170 × 1500 (aspect .78), transparent background AND
                 transparent where the screen is, so a screen image can sit under the glass
  turn-NN.webp   0° → 90° in 91 poses (a 1° step) at 900 × 1154 — the whole turn, as it plays
  shadow.webp    the contact shadow on its own, so the page places and scales it under the
                 handset instead of carrying it baked into every frame
  handset.json   the screen slot — insets in % for the front frame, the four corners in % of the
                 box for every turn frame, so a `matrix3d` iframe can ride the static sequence too

EVERY FRAME IS SUPERSAMPLED. The band is a one- to two-pixel object at the size this ships at
(236–300 CSS px), and a hairline that samples once per pixel crawls and breaks as the handset
turns. So each pose is rendered about twice as wide as it is delivered and resolved down with a
Lanczos filter — including the alpha, and including the punched screen hole, whose edge is the
one place a jagged pixel would sit right next to live text.

Needs the repository served at http://127.0.0.1:8188 (python3 -m http.server 8188).

  python3 bake.py            # everything
  python3 bake.py front      # just the front frame
  python3 bake.py shadow     # just the contact shadow
  python3 bake.py turn       # just the turn sequence (BAKE_URL overrides the served address)
"""
import io
import json
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
import os
URL = os.environ.get("BAKE_URL", "http://127.0.0.1:8188/peru/handset/bake.html")
FLAGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
         "--ignore-gpu-blocklist", "--enable-webgl"]

# turn-00 … turn-90, a pose every DEGREE. Twenty-five poses was a 3.75° step, which is what
# «stuttery, low frame rate» looks like when the fallback carries the whole journey (Peter,
# 20 September); forty-six halved it, and at a slow scroll the 2° step could still be counted on
# the handset's edge, which moves up to 9 px a pose at the size a desk draws it. One degree is
# 4.5 px. The page fetches them coarse to fine — every eighth pose, then every fourth, every
# second, then the rest — so a turn is never waited for, and only a desk ever asks for them.
TURNS = 91
# The screen's corner, in the element's own 390×844 space. 13 % / 6.02 % is the corner the
# licensed model actually has — a 50.7 px circle on the 390-wide document, measured off a render
# of its display mesh alone. It is also what `.ph-screen` clips to and what `handset.js` gives the
# live glass, so the punched hole, the CSS corner and the model agree by construction.
RX, RY = 0.13 * 390, 0.0602 * 844
SS = 3                     # supersample for the corner punch

BOX = (390, 500)           # the render box in CSS px — aspect .78, the same one the page uses
FRONT_OUT, FRONT_DSF = (1170, 1500), 6     # 2340×3000 rendered → 1170×1500 delivered
# 900 × 1154 delivered, from 1560 × 2000 rendered. NEVER LARGER THAN A DESK DRAWS IT: the
# widest this page ever paints a handset is `--ph-w-page` at 300 px, which is a 516 px render box,
# which is 1032 device pixels at DPR 2 — so the delivered frame is already under the ceiling, and
# doubling the pose count buys smoothness rather than bytes.
TURN_OUT, TURN_DSF = (900, 1154), 4
SHADOW_OUT = (720, 208)    # the contact shadow, on its own file — a smooth blob, so
                           # the page scales it up without ever showing a pixel

Q, ALPHA_Q = 80, 90        # cwebp
TURN_Q = 74                # the turn frames run leaner than the front plate: a page that plays
                           # forty-six of them has a hard ceiling per frame, and a few points of
                           # chroma quality are invisible on a body this dark, where all the
                           # detail there is is a specular hairline


def homography(dst):
    """element (0,0)-(390,844) → image pixels, from the four projected corners."""
    src = [(0, 0), (390, 0), (390, 844), (0, 844)]
    A, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -x * v, -y * v]); b.append(v)
    h = np.linalg.solve(np.array(A, float), np.array(b, float))
    return np.array([[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1.0]])


def rounded_rect_points(n=48):
    """The screen's rounded rectangle, in element space."""
    w, h, rx, ry = 390.0, 844.0, RX, RY
    out = []
    for cx, cy, a0 in ((w - rx, h - ry, 0), (rx, h - ry, 90), (rx, ry, 180), (w - rx, ry, 270)):
        for i in range(n + 1):
            a = np.radians(a0 + 90 * i / n)
            out.append((cx + rx * np.cos(a), cy + ry * np.sin(a)))
    return out


def punch(img, quad):
    """Erase the screen quad — with its rounded corners — out of the alpha channel."""
    H = homography(quad)
    pts = []
    for x, y in rounded_rect_points():
        p = H @ np.array([x, y, 1.0])
        pts.append((p[0] / p[2] * SS, p[1] / p[2] * SS))
    mask = Image.new("L", (img.width * SS, img.height * SS), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    mask = mask.resize((img.width, img.height), Image.LANCZOS)
    a = np.asarray(img.getchannel("A")).astype(np.float32)
    a = a * (1.0 - np.asarray(mask).astype(np.float32) / 255.0)
    img.putalpha(Image.fromarray(a.astype(np.uint8), "L"))
    return img


def resolve(img, quad, out):
    """Resolve the supersampled render down to its delivered size, carrying the quad with it.

    The two axes are scaled independently and the quad is scaled by exactly the same pair, so the
    punched hole lands on the glass to well under a pixel however the numbers round."""
    sx, sy = out[0] / img.width, out[1] / img.height
    img = img.resize(out, Image.LANCZOS)
    return img, [[x * sx, y * sy] for x, y in quad]


def clean_alpha(img, snap=8):
    """Snap the alpha's near-flats to exactly 0 and 255, and blank the RGB under the holes.

    A Lanczos resolve rings: a run of 1s and 254s appears either side of every edge, invisible on
    screen and enormously expensive to encode, because WebP stores alpha as its own image and
    those wiggles are detail. Flattening them cut a turn frame from 19 KB to 14 KB at the SAME
    quality settings — the frames got lighter by removing something that was never visible."""
    arr = np.asarray(img).copy()
    a = arr[..., 3]
    a[a <= snap] = 0
    a[a >= 255 - snap] = 255
    arr[a == 0, :3] = 0
    return Image.fromarray(arr, "RGBA")


def webp(img, path, q=Q, alpha_q=ALPHA_Q):
    img = clean_alpha(img)
    png = path.with_suffix(".png")
    img.save(png)
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-alpha_q", str(alpha_q), "-m", "6",
                    str(png), "-o", str(path)], check=True)
    png.unlink()
    return path.stat().st_size


def shoot(page, deg, rotz=0.0):
    info = page.evaluate("([d,z])=>window.bake(d,z)", [deg, rotz])
    png = page.locator("#box").screenshot(omit_background=True)
    img = Image.open(io.BytesIO(png)).convert("RGBA")
    return img, info


def contact_shadow(path):
    """The soft elliptical contact shadow, on its own file.

    Two super-Gaussian ellipses stacked: a tight core that is the handset actually touching the
    surface, and a wide low halo that is the rest of the room getting blocked. Analytic rather
    than a blurred draw, because a blur leaves a visible banding ring at the sizes this is scaled
    to. Neutral and nearly black in RGB, so the page can drop the opacity on a dark band and it
    stays a shadow instead of turning into a grey smudge."""
    W, H = SHADOW_OUT
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    x = (x - (W - 1) / 2) / (W / 2)
    y = (y - (H - 1) / 2) / (H / 2)

    def blob(ax, ay, amp, power):
        r2 = (x / ax) ** 2 + (y / ay) ** 2
        return amp * np.exp(-(np.clip(r2, 0, 8) ** power))

    a = blob(0.32, 0.36, 0.47, 1.4) + blob(0.64, 0.62, 0.24, 0.95)
    a = np.clip(a, 0, 0.72)
    img = Image.new("RGBA", (W, H), (16, 15, 14, 0))
    img.putalpha(Image.fromarray((a * 255 + 0.5).astype(np.uint8), "L"))
    return {"file": path.name, "size": [W, H], "bytes": webp(img, path, q=72, alpha_q=100),
            # how the page places it: a width as a fraction of the handset's own width, and the
            # centre of the ellipse as a fraction of the render box's height
            "width_of_handset": 1.40, "center_y": 0.995, "opacity": 0.92}


def turn(page):
    frames, total = [], 0
    for i in range(TURNS):
        m = i / (TURNS - 1)
        deg = 90.0 * m                       # 0, 2, 4 … 90
        rotz = -1.6 * m                      # the same small roll the journey uses
        img, info = shoot(page, deg, rotz)
        img, q = resolve(img, [[x * TURN_DSF, y * TURN_DSF] for x, y in info["quad"]], TURN_OUT)
        rec = {"file": f"turn-{i:02d}.webp", "rotY": round(deg, 3), "rotZ": round(rotz, 3)}
        if info["visible"]:
            img = punch(img, q)
            rec["quad"] = [[round(x / img.width * 100, 4), round(y / img.height * 100, 4)]
                           for x, y in q]
        rec["bytes"] = webp(img, HERE / rec["file"], q=TURN_Q)
        total += rec["bytes"]
        frames.append(rec)
        print(rec["file"], rec["bytes"], "bytes")
    return {"turn": {"size": [img.width, img.height], "scale": round(img.width / BOX[0], 6),
                   "count": TURNS, "bytes": total, "frames": frames}}


def run(what):
    out = {"box": {"aspect": 0.78}, "screen": {"radius": "13% / 6.02%", "document": [390, 844]}}
    if what in ("all", "shadow"):
        out["shadow"] = contact_shadow(HERE / "shadow.webp")
        print("shadow.webp", out["shadow"]["bytes"], "bytes")
        if what == "shadow":
            merge(out)
            return

    with sync_playwright() as p:
        browser = p.chromium.launch(args=FLAGS)

        def open_at(dsf):
            ctx = browser.new_context(viewport={"width": BOX[0] + 130, "height": BOX[1] + 120},
                                      device_scale_factor=dsf)
            page = ctx.new_page()
            page.goto(f"{URL}?pr={dsf}", wait_until="load")
            page.wait_for_function("window.__ready === true", timeout=120000)
            page.wait_for_timeout(1200)
            return ctx, page

        if what == "turn":
            # the turn alone: front.webp, shadow.webp and their keys in handset.json stay as baked
            ctx, page = open_at(TURN_DSF)
            out.update(turn(page))
            ctx.close()
            browser.close()
            merge(out)
            return

        # ── the front frame ──────────────────────────────────────────────────────────────
        ctx, page = open_at(FRONT_DSF)
        img, info = shoot(page, 0)
        img, q = resolve(img, [[x * FRONT_DSF, y * FRONT_DSF] for x, y in info["quad"]], FRONT_OUT)
        W, Hh = img.width, img.height
        xs = [c[0] for c in q]; ys = [c[1] for c in q]
        out["front"] = {
            "file": "front.webp", "size": [W, Hh], "scale": round(W / BOX[0], 6),
            "inset": {
                "left": round(min(xs) / W * 100, 4), "right": round((W - max(xs)) / W * 100, 4),
                "top": round(min(ys) / Hh * 100, 4), "bottom": round((Hh - max(ys)) / Hh * 100, 4)
            }
        }
        # where the handset itself sits in the render box, and where the slot sits inside IT —
        # the second pair is what a `--ph-slot-*` plate needs
        al = np.asarray(img.getchannel("A")).astype(int)
        ys, xs = np.where(al > 8)
        hx0, hx1, hy0, hy1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
        hw_, hh_ = hx1 - hx0 + 1, hy1 - hy0 + 1
        out["handset"] = {
            "left": round(hx0 / W * 100, 4), "top": round(hy0 / Hh * 100, 4),
            "width": round(hw_ / W * 100, 4), "height": round(hh_ / Hh * 100, 4)
        }
        out["slot_in_handset"] = {
            "left": round((min(c[0] for c in q) - hx0) / hw_ * 100, 4),
            "top": round((min(c[1] for c in q) - hy0) / hh_ * 100, 4),
            "width": round((max(c[0] for c in q) - min(c[0] for c in q)) / hw_ * 100, 4),
            "height": round((max(c[1] for c in q) - min(c[1] for c in q)) / hh_ * 100, 4),
            "rx": 13.0, "ry": 6.02
        }
        img = punch(img, q)
        out["front"]["bytes"] = webp(img, HERE / "front.webp")
        ctx.close()
        if what == "front":
            browser.close()
            merge(out)
            return

        # ── the turn ────────────────────────────────────────────────────────────────────
        ctx, page = open_at(TURN_DSF)
        out.update(turn(page))
        ctx.close()
        browser.close()
    merge(out)


def merge(out):
    path = HERE / "handset.json"
    if path.exists():
        old = json.loads(path.read_text())
        old.update(out)
        out = old
    path.write_text(json.dumps(out, indent=1) + "\n")
    if "front" in out:
        print("front.webp", out["front"]["bytes"], "bytes  inset", out["front"]["inset"])
    if "turn" in out:
        print("turn total", out["turn"]["bytes"], "bytes over", out["turn"]["count"], "frames")


run(sys.argv[1] if len(sys.argv) > 1 else "all")
