#!/usr/bin/env python
"""What the page checks before it believes a demo (SPEC, «The demos»).

For each of `peru/demos/*.html`, at 390 x 844 and DPR 3, against the worktree's own server:

  · the console is clean over six played seconds — errors, warnings and any 4xx;
  · a PAUSED phone is a still photograph: zero running animations, zero rAF, the clock frozen,
    and two screenshots a second and a half apart identical to the byte;
  · `?t=` paints the same pixels twice over;
  · the thread is bounded: eight cycles appended and the DOM is still the size of one
    conversation;
  · the protocol is intact: `{state:'ready', duration}` out, `play` / `pause` / `restart` /
    `progress` in, driven from a parent page exactly as `peru/peru.js` drives it.

    /home/peter/wt/bodega-pay-later/.venv/bin/python peru/tools/check_demos.py
    …/python peru/tools/check_demos.py --only cobro --base http://127.0.0.1:8188

A static server must already serve the repository root (default http://127.0.0.1:8188).
Contact sheets are a separate act, and a person has to LOOK at them: this proves the mechanics.
"""
import argparse, hashlib, sys

DEMOS = ["compras", "cobro", "entrega", "tienda"]
W, H, SCALE = 390, 844, 3
ROW_CEILING = 40          # one conversation; beyond this the thread is growing for ever

HARNESS = """
<!doctype html><meta charset=utf-8><style>html,body{margin:0}iframe{border:0;width:390px;height:844px}</style>
<iframe id=f src="%s/peru/demos/%s.html"></iframe>
<script>
window.LOG = [];
addEventListener('message', function (e) { if (e.data && e.data.type === 'rocoto-demo') LOG.push(e.data); });
window.cmd = function (c, extra) {
  var m = Object.assign({ type: 'rocoto-demo', cmd: c }, extra || {});
  document.getElementById('f').contentWindow.postMessage(m, '*');
};
</script>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8188")
    ap.add_argument("--only", default=None, help="one demo name")
    args = ap.parse_args()

    from playwright.sync_api import sync_playwright
    bad = []
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--force-color-profile=srgb", "--font-render-hinting=none"])
        ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=SCALE)
        page = ctx.new_page()

        for name in ([args.only] if args.only else DEMOS):
            print(f"\n══ {name}")
            msgs = []
            on_console = lambda m: msgs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None
            on_error = lambda e: msgs.append(f"pageerror: {e}")
            on_response = lambda r: msgs.append(f"HTTP {r.status} {r.url}") if r.status >= 400 else None
            page.on("console", on_console)
            page.on("pageerror", on_error)
            page.on("response", on_response)

            # ── the console, over six played seconds ───────────────────────────────────────
            page.goto(f"{args.base}/peru/demos/{name}.html?auto", wait_until="load")
            page.wait_for_selector("html[data-ready]", timeout=15000)
            page.wait_for_timeout(6000)
            print(f"  console: {len(msgs)} lines" + ("  " + " | ".join(dict.fromkeys(msgs)) if msgs else "  CLEAN"))
            if msgs:
                bad.append(f"{name}: console {msgs[:3]}")

            # ── a paused phone is a still photograph ──────────────────────────────────────
            page.evaluate("() => { window.__raf = 0; const r = requestAnimationFrame;"
                          " window.requestAnimationFrame = function (f) { window.__raf++; return r(f); }; }")
            page.evaluate("() => window.WA.demo.pause()")
            t0 = page.evaluate("() => window.WA.demo.t")
            page.evaluate("() => { window.__raf = 0; }")
            shot_a = hashlib.sha1(page.screenshot()).hexdigest()
            page.wait_for_timeout(1500)
            running = page.evaluate(
                "() => document.getAnimations().filter(a => a.playState === 'running').length")
            raf = page.evaluate("() => window.__raf")
            t1 = page.evaluate("() => window.WA.demo.t")
            still = shot_a == hashlib.sha1(page.screenshot()).hexdigest()
            print(f"  paused: animations={running} rAF={raf} clock {t0}→{t1}"
                  f" pixels {'identical' if still else 'MOVED'}")
            if running or raf or t0 != t1 or not still:
                bad.append(f"{name}: paused phone is not still")

            # ── ?t= paints the same pixels twice over ─────────────────────────────────────
            marks = [0, 1500, 3400, 5600]
            same = True
            for t in marks:
                seen = set()
                for _ in range(2):
                    page.goto(f"{args.base}/peru/demos/{name}.html?t={t}", wait_until="load")
                    page.wait_for_selector("html[data-ready]", timeout=15000)
                    page.wait_for_timeout(320)
                    seen.add(hashlib.sha1(page.screenshot()).hexdigest())
                if len(seen) != 1:
                    same = False
                    bad.append(f"{name}: ?t={t} painted two different frames")
            print(f"  ?t= deterministic at {marks}: {'yes' if same else 'NO'}")

            # ── eight cycles, and the thread is the size of one conversation ──────────────
            page.goto(f"{args.base}/peru/demos/{name}.html?t=0", wait_until="load")
            page.wait_for_selector("html[data-ready]", timeout=15000)
            grew = page.evaluate("""() => {
                const d = window.WA.demo; const seen = [];
                for (let i = 0; i < 8; i++) { d.rebase(); d.seek(d.s.duration); seen.push(d.rows.length); }
                return { rows: seen, nodes: d.root.querySelectorAll('*').length,
                         items: d.s.items.length, bans: d.bans.length };
            }""")
            print(f"  eight cycles: rows {grew['rows']} · items {grew['items']}"
                  f" · banners {grew['bans']} · nodes {grew['nodes']}")
            if grew["rows"] and grew["rows"][-1] > ROW_CEILING:
                bad.append(f"{name}: thread unbounded ({grew['rows']})")

            # ── the protocol, driven the way the page drives it ───────────────────────────
            page.goto(f"{args.base}/", wait_until="load")
            page.set_content(HARNESS % (args.base, name))
            page.wait_for_function("() => window.LOG.length > 0", timeout=15000)
            ready = page.evaluate("() => window.LOG.find(m => m.state === 'ready')")
            frame = "() => document.getElementById('f').contentWindow.WA.demo"
            page.evaluate("() => window.cmd('pause')")
            page.wait_for_timeout(200)
            paused = page.evaluate(f"{frame}.playing")
            page.evaluate("() => window.cmd('progress', { p: 0.5 })")
            page.wait_for_timeout(200)
            half = page.evaluate(f"{frame}.t")
            page.evaluate("() => window.cmd('restart')")
            page.wait_for_timeout(300)
            after = page.evaluate(
                "() => { const d = document.getElementById('f').contentWindow.WA.demo;"
                " return { t: d.t, cycle: d.cycle }; }")
            page.evaluate("() => window.cmd('play')")
            page.wait_for_timeout(200)
            playing = page.evaluate(f"{frame}.playing")
            ok = bool(ready and ready.get("duration")) and paused is False \
                and playing is True and after["cycle"] == 0
            print(f"  protocol: ready duration={ready and ready.get('duration')} · pause→{paused}"
                  f" · progress .5→{round(half)} ms · restart→t={round(after['t'])} cycle={after['cycle']}"
                  f" · play→{playing}   {'OK' if ok else 'BROKEN'}")
            if not ok:
                bad.append(f"{name}: protocol")

            page.remove_listener("console", on_console)
            page.remove_listener("pageerror", on_error)
            page.remove_listener("response", on_response)

        b.close()

    print("\n" + ("ALL GREEN" if not bad else "FAILURES:\n  " + "\n  ".join(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
