#!/usr/bin/env python3
"""§268 · THE SIGN-UP WALK — ten screens on a phone, read off the paint.

It walks ONBOARDING-SPEC.md §0 screen by screen at 390 × 844 and at 360 × 740 and reads what the
browser PAINTED — the titles, the acts, the place, the choices, the suggestions, the map, the note,
the Yape field, the hand-offs, the membership card — rather than what the source says. Each leg
reports itself GREEN or RED and the run ends RED if any did.

WHAT IT PROVES, against the specs that own each claim:

  0 THE FRAME     one anatomy for all ten: a visual above, a title and at most one sentence, and a
                  56 px act in a bar ANCHORED at the foot with the safe area under it; a slim
                  progress row that counts only the last steps; and the picture never laid over the
                  words on a short screen (§0 «the pattern of every screen»).
  1 ARRIVAL       `Get started`, the three things that ship TODAY, the rig's one `Reset state`, and
                  ONE way on. `#/r/<code>` lands here carrying its code (§0 screen 1).
  2 THE           one heading, and either the connected account or Meta's own walk — which is the
     CONNECTION   sign-in, so nothing here asks the shop for a number (WIRING-SPEC.md §1).
  3 THE WAITLIST  the place set large, counting up to the service's own number, confetti that takes
                  no press, how many businesses are ahead, and `Confirm details` (§0 screen 3).
  4 THE BUSINESS  three choices with a picture each, the pick draws its tick and dims the rest and
                  the screen goes on by itself, then the name field with the act still above the
                  room the keyboard leaves (§0 screen 4).
  5 THE ADDRESS   suggestions as it is typed, on one session token, the street bold and the district
                  quiet; the pick opens the MAP with the card at the TOP and the pin in the middle,
                  and the act is the arrow (§0 screen 5).
  6 THE ORDERS    a handset holding THIS SHOP'S OWN delivery note — the real lines, drawn by the
                  component every surface says a line through — writing itself in (§0 screen 6).
  7 THE YAPE      Yape's own purple, its mark named as Yape's, the Peruvian number, the QR chooser,
                  and a quiet `Skip for now` that is a real way on (§0 screen 7).
  8 WHO OWED YOU  the read's likely list as pickable rows, the ranking rule above them, and
                  `Share with them` handing ONE `wa.me` message to the owner's own WhatsApp with the
                  invitation and the owner's own code in it — the app sends nothing (§0 screen 8).
  9 MOVE UP       the place as the hero, what one business is worth, three dots toward the next
                  covered purchase, the message previewed as a chat bubble, and `Share my link`
                  falling back to the clipboard with a line that says so (§0 screen 9).
 10 DONE          the membership card with the name, the place and the reference; `Say hi to Rocoto
                  on WhatsApp` carrying that reference in its text; then the app's home (§0 screen 10).
 11 REAL SHAPES   the shapes a real account has, seeded into the stored reading and read off the
                  paint: a chat the contacts named nowhere draws its number and a person glyph, the
                  likely list holds the chats with a laugh alone, and a list of two says so
                  (WHATSAPP-HISTORY-SPEC.md §5).
 12 THE PAYMENT   `Pay now` shows the shop's Yape number and the exact amount, `Copy the amount`
     PAGE         copies it, and `Open Yape` comes live only after that (§0, WIRING-SPEC.md §15).
 13 RESET STATE   the one control posts `/api/proof/whatsapp/disconnect` and then
                  `/api/bodega/session/reset`, sweeps every `rocoto-bodega-*` key, keeps the
                  developer's own pin, and STAYS on the first screen (WIRING-SPEC.md §11).
 14 THE SPANISH   the walk a shop actually reads: Spanish from the first screen, with Peter's own
                  paragraph, the three trades and the fixed words of §0 read off the paint, down to
                  the WhatsApp connection screen — Cedar's own file, reading Spanish through its
                  own `lang` prop rather than a second copy of its strings.
 15 THE STATUS    `?lista=<CODE>` becomes `#/lista/<CODE>` and draws the place, the pass, the three
     PAGE         seats and the act, with no session at all; a code the service holds no row for
                  names the waitlist and offers the way in (§0).

⚠ EVERY LEG THAT ASSERTS ENGLISH OPENS THE WALK WITH `?lang=en`. Spanish is what a shop reads
(Peter, 20 September, night: «it all haes to be in spanish the website and the onboarding. english
only if they clicked fromt he english page.»), so the English assertions above are the ENGLISH
COLUMN of `start/words.ts` and they are read on the English page. `boot` carries the flag, and the
choice rides this browser's own session storage, so every `page.goto` after it stays in it.

RUN, against a built bundle:
  ROCOTO_DIST=app/dist-export-review .venv/bin/python drives/drive-268-bodega-onboarding.py
or against a dev server:
  ROCOTO_URL=http://127.0.0.1:8094/bodega-pay-later.html .venv/bin/python drives/drive-268-bodega-onboarding.py
"""
import asyncio
import functools
import http.server
import os
import pathlib
import re
import socketserver
import threading

from playwright.async_api import async_playwright

DIST = os.environ.get("ROCOTO_DIST")
URL = os.environ.get("ROCOTO_URL")
OUT = pathlib.Path(os.environ.get("ROCOTO_SHOTS", "/tmp/rocoto-268-bodega-onboarding"))
OUT.mkdir(parents=True, exist_ok=True)
# THE TWO PHONES THE WALK IS DESIGNED AND CHECKED AT (ONBOARDING-SPEC.md §0). The desk is out of
# scope for this walk on purpose: «it'll all be super mobile. they wont use desktop» (§268).
WIDTHS = [(390, 844), (360, 740)]
OK: list[str] = []
BAD: list[str] = []


def check(value, label):
    (OK if value else BAD).append(label)
    print(("GREEN " if value else "RED ") + label, flush=True)


def serve():
    """The built bundle over loopback, or the dev server the environment names."""
    if URL:
        return None, URL.split("#", 1)[0]
    if not DIST:
        raise RuntimeError("Set ROCOTO_DIST to a built bundle, or ROCOTO_URL to a running server.")
    handler = functools.partial(
        type("Quiet", (http.server.SimpleHTTPRequestHandler,), {"log_message": lambda *args: None}),
        directory=DIST,
    )
    server = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}/bodega-pay-later.html"


def english(route):
    """THE SAME ADDRESS, ON THE ENGLISH PAGE. `?lang=en` is what the English site links with, and it
    goes ahead of whatever query the leg already carries (`?dev=1`)."""
    head, _, hash_ = route.partition("#")
    query = head.lstrip("?")
    return f"?lang=en{'&' + query if query else ''}{'#' + hash_ if hash_ else ''}"


async def boot(browser, origin, width, height, route, reduced=False, lang="en"):
    context = await browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=2, is_mobile=True, has_touch=True,
        reduced_motion="reduce" if reduced else "no-preference")
    page = await context.new_page()
    page.set_default_timeout(15000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    # THE HAND-OFF IS RECORDED RATHER THAN OPENED: `wa.me` is the shop's own WhatsApp, and a drive
    # reaches nobody. The page's own call is kept, so what the drive reads is the real address.
    await page.add_init_script("""
      window.__handoffs = [];
      window.open = (href) => { window.__handoffs.push(String(href)); return null; };
    """)
    await page.goto(origin + (english(route) if lang == "en" else route), wait_until="networkidle")
    await page.wait_for_timeout(700)
    return context, page, errors


async def shot(page, name, width):
    await page.screenshot(path=str(OUT / f"{width}-{name}.png"), full_page=True)


async def text_of(page, selector):
    node = page.locator(selector).first
    return (await node.inner_text()).strip() if await node.count() else ""


async def tall(page, selector):
    """Every pressable clears the touch floor — 44 px, the house's own (DESIGN-SPEC.md §8)."""
    return await page.locator(selector).evaluate_all(
        "nodes => nodes.every(node => node.getBoundingClientRect().height >= 43.5)")


async def walk_to_business(page, origin, kind="sells_to_bodegas", name="Distribuidora Aurora"):
    """The walk up to the address, taken the way a shop takes it: the celebration, the choice, the
    name. Every leg after screen 4 needs the draft those two screens write, so it is one helper."""
    await page.goto(origin + "#/start/waitlist", wait_until="networkidle")
    await page.wait_for_selector('[data-testid="waitlist-confirm"]')
    await page.click('[data-testid="waitlist-confirm"]')
    await page.wait_for_selector(f'[data-testid="business-kind-{kind}"]')
    await page.click(f'[data-testid="business-kind-{kind}"]')
    await page.wait_for_selector('[data-testid="business-name"]', timeout=10000)
    await page.fill('[data-testid="business-name"]', name)
    await page.click('[data-testid="business-save"]')
    await page.wait_for_selector('[data-testid="start-address"]', timeout=10000)


# ── 0 · THE FRAME EVERY SCREEN STANDS IN ─────────────────────────────────────────────────────────

async def frame(browser, origin, width, height):
    """ONE ANATOMY, TEN SCREENS (ONBOARDING-SPEC.md §0, «the pattern of every screen»).

    The bar is the thing a thumb reaches for, so it is measured rather than described: 56 px tall,
    full width, anchored at the foot of the room the browser actually has, with the safe area under
    it. The progress counts the LAST steps alone, so a shop watches a short row fill rather than a
    long one start. And on a short screen — which is what a keyboard leaves — the picture clips
    instead of laying itself over the title.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start/waitlist")
    try:
        await page.wait_for_selector('[data-testid="waitlist-confirm"]')
        box = await page.locator('[data-testid="waitlist-confirm"]').bounding_box()
        check(box and box["height"] >= 55.5, f"{width} · the act is 56 px tall · {box and round(box['height'])}")
        check(box and box["width"] >= width - 40,
              f"{width} · and full width · {box and round(box['width'])} of {width}")
        foot = await page.locator('[data-testid="start-waitlist-foot"]').bounding_box()
        check(foot and foot["y"] + foot["height"] >= height - 2,
              f"{width} · the bar is anchored at the foot · {foot and round(foot['y'] + foot['height'])} of {height}")
        inset = await page.evaluate("""() => {
          const foot = document.querySelector('[data-testid="start-waitlist-foot"]');
          return getComputedStyle(foot).paddingBottom;
        }""")
        check(inset and inset != "0px", f"{width} · with room under it for the home indicator · {inset}")

        # ⚠ THE WALK IS EXACTLY ONE VIEWPORT TALL. The shell once added 32 px of padding under a
        # screen that already drew itself to the phone’s own height, so the page scrolled and the
        # first field to take the caret put the progress row off the top of the screen.
        room = await page.evaluate("""() => ({
          doc: document.documentElement.scrollHeight, inner: window.innerHeight,
        })""")
        check(room["doc"] <= room["inner"] + 1,
              f"{width} · the walk is one viewport tall and the page stands still · "
              f"{room['doc']} of {room['inner']}")

        # — AND EVERY VISUAL IS A STAGE: full-bleed edge to edge, up to the top of the phone, never
        #   shorter than its own floor — 44% of a 390 x 844 screen, 38% of a 360 x 740 one
        #   (`start/walk.tsx`, `stageFloor`) — and the words start where it ends.
        floor = round(height * (0.44 if height >= 800 else 0.38))
        for step in ("arrival", "waitlist", "orders", "yape", "referrals", "done"):
            await page.goto(origin + f"#/start/{step}", wait_until="networkidle")
            await page.wait_for_selector(f'[data-testid="start-{step}-visual"]', timeout=20000)
            await page.wait_for_timeout(500)
            stage = await page.evaluate("""() => {
              const picture = document.querySelector('[data-testid$="-visual"]');
              const title = document.querySelector('section[data-walk-step] h1');
              const box = picture.getBoundingClientRect();
              return {
                top: Math.round(box.top), left: Math.round(box.left),
                width: Math.round(box.width), height: Math.round(box.height),
                void: title ? Math.round(title.getBoundingClientRect().top - box.bottom) : 0,
                tone: picture.getAttribute('data-stage'),
              };
            }""")
            check(stage["void"] <= 40,
                  f"{width} · {step}: the stage reaches the words · {stage['void']} px between them")
            check(stage["top"] == 0 and stage["left"] == 0 and stage["width"] == width,
                  f"{width} · {step}: and it is full-bleed to the top of the phone · {stage['top']},{stage['left']},{stage['width']}")
            check(stage["height"] >= floor,
                  f"{width} · {step}: and it holds its floor · {stage['height']} of {floor}")
            check(stage["tone"] in ("ink", "yape", "paper", "picture"),
                  f"{width} · {step}: drawn in a tone it asked for by name · {stage['tone']}")
            scrolled = await page.evaluate(
                "() => document.documentElement.scrollHeight - window.innerHeight")
            check(scrolled <= 1, f"{width} · {step}: and the page itself does not scroll · {scrolled}")

        # — THE PROGRESS ROW IS DRAWN OVER A STAGE, IN THE STAGE'S OWN INK. On the celebration there
        #   is no row at all; on the Yape step the row rides Yape's purple and has to be legible on it.
        # YAPE LEFT THE WALK (Peter, 20 September, night), so it carries no row of its own; the proof
        # stands on the orders step, whose stage the row rides the same way.
        await page.goto(origin + "#/start/yape", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="yape-field"]', timeout=20000)
        check(await page.locator('[data-testid="walk-progress"]').count() == 0,
              f"{width} · the Yape screen stands outside the walk and carries no progress row")
        await page.goto(origin + "#/start/orders", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="orders-next"]', timeout=20000)
        await page.wait_for_timeout(400)
        over = await page.evaluate("""() => {
          const bar = document.querySelector('[data-testid="walk-progress"]');
          const picture = document.querySelector('[data-testid="start-orders-visual"]');
          if (!bar || !picture) return null;
          const a = bar.getBoundingClientRect(), b = picture.getBoundingClientRect();
          const segment = bar.querySelector('[data-segment]');
          return {
            onStage: a.top >= b.top - 1 && a.bottom <= b.bottom + 1,
            track: getComputedStyle(segment).backgroundColor,
            ground: getComputedStyle(bar).backgroundColor,
          };
        }""")
        check(over and over["onStage"],
              f"{width} · the progress row is drawn over the stage rather than above it")
        check(over and "rgba(0, 0, 0, 0)" in over["ground"],
              f"{width} · on the stage's own ground · {over and over['ground']}")
        await page.goto(origin + "#/start/waitlist", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="waitlist-confirm"]')

        # THE PROGRESS COUNTS THE LAST STEPS ALONE, and the celebration carries none at all.
        check(await page.locator('[data-testid="walk-progress"]').count() == 0,
              f"{width} · the celebration carries no progress row of its own")
        await walk_to_business(page, origin)
        bar = page.locator('[data-testid="walk-progress"]').first
        check(await bar.count() == 1, f"{width} · the last steps carry the slim row")
        of = await bar.get_attribute("data-of")
        at = await bar.get_attribute("data-at")
        check(of == "6" and at == "2",   # six since Yape left the walk (20 September, night)
              f"{width} · which counts this shop's own walk and where it stands · {at} of {of}")
        filled = await page.locator('[data-testid="walk-progress"] [data-filled="yes"]').count()
        check(filled == 2, f"{width} · and the walked segments are full · {filled}")

        # A SHORT SCREEN — the keyboard is up — CLIPS THE PICTURE rather than covering the title.
        await page.goto(origin + "#/start/business", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="business-name"]')
        await page.set_viewport_size({"width": width, "height": 430})
        await page.wait_for_timeout(500)
        clear = await page.evaluate("""() => {
          const picture = document.querySelector('[data-testid="start-business-visual"]');
          const title = document.querySelector('[data-testid="start-business"] h1');
          if (!picture || !title) return true;
          const a = picture.getBoundingClientRect(), b = title.getBoundingClientRect();
          return a.bottom <= b.top + 1;
        }""")
        check(clear, f"{width} · on a short screen the picture stays clear of the title")
        act = await page.locator('[data-testid="business-save"]').bounding_box()
        check(act and act["y"] + act["height"] <= 430 + 1,
              f"{width} · and the act stays inside the room that is left · {act and round(act['y'] + act['height'])}")
        await page.click('[data-testid="business-name"]')
        await page.wait_for_timeout(600)
        bar = await page.locator('[data-testid="walk-progress"]').bounding_box()
        check(bar and bar["y"] >= -1,
              f"{width} · and the progress row stays on the screen with the caret in the field · "
              f"{bar and round(bar['y'])}")
        await shot(page, "frame-keyboard", width)
        await page.set_viewport_size({"width": width, "height": height})
        check(not errors, f"{width} · the frame paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def stillness(browser, origin, width, height):
    """`prefers-reduced-motion` TURNS EVERY MOVEMENT INTO A FADE (ONBOARDING-SPEC.md §0).

    The confetti draws nothing at all, the number is printed rather than counted, and the screen
    still says everything it said — which is the test: stillness removes movement, never meaning.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start/waitlist", reduced=True)
    try:
        await page.wait_for_selector('[data-testid="waitlist-number"]')
        check(await page.locator('[data-testid="waitlist-confetti"]').count() == 0,
              f"{width} · stillness draws no confetti at all")
        shown = (await text_of(page, '[data-testid="waitlist-number"]')).replace("#", "")
        value = await page.locator('[data-testid="waitlist-number"]').get_attribute("data-value")
        check(shown.replace(",", "") == value,
              f"{width} · and the place is printed rather than counted · {shown} · {value}")
        check(await text_of(page, '[data-testid="start-waitlist"] h1') == "You’re on the waitlist!",
              f"{width} · the screen still says what it says")
        await shot(page, "stillness", width)
        check(not errors, f"{width} · stillness paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 1 · ARRIVAL ──────────────────────────────────────────────────────────────────────────────────

# PETER'S OWN PARAGRAPH, VERBATIM (FEED-IA §268, 20 September evening). It replaced three numbered
# rows in small grey type. The apostrophes are the walk's own typographic ones, as everywhere else in
# it; every word is his, and a paraphrase reads RED here.
ARRIVAL_BODY = (
    "To join the waitlist, you need to connect your WhatsApp to Rocoto. This will give you the"
    " chance to show us the reality of your business and your relationships. This is how we\u2019ll"
    " be able to understand you when you need the cash to buy stock or when you need credit to buy"
    " stock. Don\u2019t worry, we won\u2019t do anything unauthorized on your account. This is purely"
    " for us to learn about your business."
)


async def arrival(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        check(await text_of(page, '[data-testid="start-arrival"] h1') == "Join the waitlist",
              f"{width} · arrival names the thing the shop is doing")
        body = await text_of(page, '[data-testid="start-arrival"]')
        check(ARRIVAL_BODY in body,
              f"{width} · and says why, in Peter's own words, as one paragraph")
        # ⚠ THE THREE NUMBERED ROWS ARE ASSERTED ABSENT, so a revert to the list reads red here.
        check("Send your Yape link in the chat" not in body,
              f"{width} · the numbered list of steps is gone")
        check("pay-later list" not in body and "Your shop in Rocoto" not in body,
              f"{width} · and no screen of the walk promises credit")
        # A SHOP ALREADY CONNECTED IS ASKED TO CARRY ON; a fresh one is asked to connect. The rig
        # this drive runs on may hold a connection, so the act is read against the note beside it.
        signed = await page.locator('[data-testid="arrival-signed"]').count() == 1
        check(await text_of(page, '[data-testid="arrival-connect"]') == ("Continue" if signed else "Connect WhatsApp"),
              f"{width} · one act moves on, and it agrees with the line above it (connected: {signed})")
        # THE RIG'S OWN DOOR BELONGS TO WHOEVER IS REVIEWING, so a shop never sees it.
        check(await page.locator('[data-testid="arrival-reset"]').count() == 0,
              f"{width} · `Reset state` stays off the shop's own screen")
        check(await tall(page, '[data-testid="start-arrival"] button'), f"{width} · arrival's presses clear 44 px")
        # AND THE PICTURE IS A STAGE: full-bleed, reaching the top of the phone.
        stage = await page.evaluate("""() => {
          const picture = document.querySelector('[data-testid="start-arrival-visual"]');
          const box = picture.getBoundingClientRect();
          return {top: Math.round(box.top), height: Math.round(box.height), width: Math.round(box.width)};
        }""")
        check(stage["top"] == 0 and stage["width"] == width,
              f"{width} · the cover is a stage, edge to edge and up to the top · {stage}")
        await shot(page, "arrival", width)
        check(not errors, f"{width} · arrival paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def arrival_rig(browser, origin, width, height):
    """`?dev=1` IS THE RIG'S OWN DOOR (`start/walk.tsx`, `devRig`)."""
    context, page, errors = await boot(browser, origin, width, height, "?dev=1#/start")
    try:
        check(await page.locator('[data-testid="arrival-reset"]').count() == 1,
              f"{width} · `Reset state` stands behind the dev flag, here and here alone")
        check(not errors, f"{width} · the rig's door paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def referral_door(browser, origin, width, height):
    """`#/r/<code>` LANDS ON THE ARRIVAL CARRYING ITS CODE (ONBOARDING-SPEC.md §0).

    The address is rewritten to the walk's first screen so everybody sees the same walk and a reload
    attributes nothing twice; the code rides this browser's own session storage until a session
    exists to attach it to, which is the connection (`start/joining.ts`).
    """
    context, page, errors = await boot(browser, origin, width, height, "#/r/K7M2QX")
    try:
        check(page.url.endswith("#/start"), f"{width} · a shared link lands on the arrival · {page.url[-14:]}")
        held = await page.evaluate("() => sessionStorage.getItem('rocoto-bodega-referred-by')")
        check(held == "K7M2QX", f"{width} · and the code is held for the connection · {held}")
        check(await page.locator('[data-testid="arrival-distributor"]').count() == 1,
              f"{width} · the screen says a business invited this one")
        await shot(page, "referral-door", width)
        check(not errors, f"{width} · the referral door paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 2 · THE CONNECTION ───────────────────────────────────────────────────────────────────────────

async def connection(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start/connect")
    try:
        body = await text_of(page, '[data-testid="start-connect"]')
        # ONE HEADING TO A SCREEN: the account's fact once linked, Cedar's own question while Meta's
        # walk is still to run. Two headings stood here before (FEED-IA §268, 19 September).
        heads = await page.locator('[data-testid="start-connect"] h1').count()
        check(heads == 1, f"{width} · the connection screen carries one heading · {heads}")
        linked = await page.locator('[data-testid="connect-account"]').count() == 1
        walk = await page.locator('[data-testid="whatsapp-walk"]').count() == 1
        check(linked or walk, f"{width} · the screen shows the account or Meta's own walk")
        if not linked:
            check("broadcast lists become read-only" in body and "to list who owes you" in body,
                  f"{width} · why Rocoto asks and what it costs are stated once, under the walk")
        await shot(page, "connect", width)
        check(not errors, f"{width} · the connection paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 3 · THE WAITLIST ─────────────────────────────────────────────────────────────────────────────

async def waitlist(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start/waitlist")
    try:
        check(await text_of(page, '[data-testid="start-waitlist"] h1') == "You’re on the waitlist!",
              f"{width} · the celebration names the moment, Peter's own words")
        check(await text_of(page, '[data-testid="start-waitlist"] p') == "Bring another business and you move up.",
              f"{width} · with the one sentence under it")
        await page.wait_for_selector('[data-testid="waitlist-number"]')
        place = await page.locator('[data-testid="waitlist-number"]').get_attribute("data-value")
        check(place and place.isdigit() and int(place) > 0, f"{width} · the place landed · {place}")
        # THE FIGURE IS THE SERVICE'S, AND THE SCREEN SAYS SO WHERE IT IS THE SAMPLE WORLD'S.
        sample = await page.locator('[data-testid="waitlist-sample"]').count()
        check(sample in (0, 1), f"{width} · and a seeded place says `Sample waitlist` · {sample}")
        ahead = await page.locator('[data-testid="waitlist-ahead"]').get_attribute("data-ahead")
        check(ahead == str(max(0, int(place) - 1)),
              f"{width} · how many businesses are ahead is the service's own arithmetic · {ahead}")
        # THE COUNT-UP: the figure starts short of its own value and arrives at it.
        started = (await text_of(page, '[data-testid="waitlist-number"]')).replace("#", "").replace(",", "")
        await page.wait_for_timeout(1400)
        landed = (await text_of(page, '[data-testid="waitlist-number"]')).replace("#", "").replace(",", "")
        check(landed == place, f"{width} · and the number counts up to it · {started} → {landed}")
        # THE BURST TAKES NO PRESS: the act under it is pressable from the first frame.
        canvas = page.locator('[data-testid="waitlist-confetti"]')
        check(await canvas.count() == 1, f"{width} · the confetti draws on its own canvas")
        events = await canvas.evaluate("node => getComputedStyle(node).pointerEvents")
        check(events == "none", f"{width} · which takes no press · {events}")
        over = await page.evaluate("""() => {
          const act = document.querySelector('[data-testid="waitlist-confirm"]');
          const box = act.getBoundingClientRect();
          const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return act.contains(at) || at === act;
        }""")
        check(over, f"{width} · so `Confirm details` is what a finger on it reaches")
        check(await text_of(page, '[data-testid="waitlist-confirm"]') == "Confirm details",
              f"{width} · and the act reads `Confirm details`, Peter's own words")
        # ⚠ THE SHOP RECEIVES AN OBJECT HERE (ONBOARDING-SPEC.md §0, «THE PASS»). The celebration was
        # a number on white: nothing was received, so nothing felt joined. The place is ON the card
        # now, and every line the walk has yet to ask for stands on it as a dim BAR.
        card = page.locator('[data-testid="waitlist-pass"]')
        check(await card.count() == 1, f"{width} · the pass is what lands")
        check(await card.get_attribute("data-place") == place,
              f"{width} · carrying the place the service gave · {await card.get_attribute('data-place')}")
        bars = await page.locator('[data-testid="waitlist-pass"] [data-pass-line="open"]').count()
        check(bars >= 3,
              f"{width} · with the name, the trade and the address still to fill · {bars} bars")
        # AND THE BURST IS THE STAGE'S, so nothing falls over the words or the act.
        inside = await page.evaluate("""() => {
          const canvas = document.querySelector('[data-testid="waitlist-confetti"]');
          const stage = document.querySelector('[data-testid="start-waitlist-visual"]');
          if (!canvas || !stage) return false;
          const a = canvas.getBoundingClientRect(), b = stage.getBoundingClientRect();
          return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
        }""")
        check(inside, f"{width} · and the confetti falls on the stage alone")
        await shot(page, "waitlist", width)
        check(not errors, f"{width} · the celebration paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 4 · THE BUSINESS ─────────────────────────────────────────────────────────────────────────────

async def business(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start/business")
    try:
        check(await text_of(page, '[data-testid="start-business"] h1') == "What is your business?",
              f"{width} · the choice names the question")
        rows = page.locator('[data-testid="business-kinds"] button')
        check(await rows.count() == 3, f"{width} · three choices · {await rows.count()}")
        says = await rows.evaluate_all("nodes => nodes.map(n => n.innerText.trim())")
        check(says == ["A bodega", "I sell to bodegas", "I sell to restaurants"],
              f"{width} · in Peter's own words · {says}")
        pictures = await page.locator('[data-testid="business-kinds"] img').count()
        check(pictures == 3, f"{width} · each carrying a picture of the trade it names · {pictures}")
        check(await tall(page, '[data-testid="business-kinds"] button'), f"{width} · and each clears 44 px")
        # ⚠ THEY WERE THREE SMALL THUMBNAILS IN BIG EMPTY ROWS. Each choice is a FULL-WIDTH picture
        # tile now, and the three of them share every pixel the words and the act leave.
        tiles = await page.evaluate("""() => {
          const all = [...document.querySelectorAll('[data-testid="business-kinds"] button')];
          return all.map((node) => {
            const box = node.getBoundingClientRect();
            const picture = node.querySelector('img');
            const inside = picture.getBoundingClientRect();
            return {
              width: Math.round(box.width), height: Math.round(box.height),
              covers: Math.round(inside.width) >= Math.round(box.width) - 4
                && Math.round(inside.height) >= Math.round(box.height) - 4,
              file: (picture.getAttribute('src') || '').split('/').pop(),
            };
          });
        }""")
        check(all(tile["height"] >= 132 for tile in tiles),
              f"{width} · a tile is never shorter than 132 px · {[t['height'] for t in tiles]}")
        check(all(tile["covers"] for tile in tiles),
              f"{width} · and the picture IS the tile rather than a thumbnail inside it")
        check(len({tile["height"] for tile in tiles}) == 1,
              f"{width} · the three share the room equally · {[t['height'] for t in tiles]}")
        # THE THIRD TILE DREW A BAND OF SKY. `hero-stock` is the bananas on the rail; the trade that
        # supplies Lima's restaurants is the fish stall (`app/public/bodega-artwork/README.md`).
        check([tile["file"] for tile in tiles]
              == ["hero-arrival.png", "hero-referrals.png", "hero-money.png"],
              f"{width} · each tile draws the scene of its own trade · {[t['file'] for t in tiles]}")

        await page.click('[data-testid="business-kind-sells_to_bodegas"]')
        await page.wait_for_timeout(180)
        picked = await rows.evaluate_all("nodes => nodes.map(n => n.dataset.picked)")
        check(picked == ["open", "yes", "open"], f"{width} · the pick fills its own row · {picked}")
        dimmed = await page.evaluate("""() => {
          const all = [...document.querySelectorAll('[data-testid="business-kinds"] button')];
          const open = all.filter((n) => n.dataset.picked === 'open');
          return open.every((n) => Number(getComputedStyle(n).opacity) < 0.9);
        }""")
        check(dimmed, f"{width} · and dims the others")
        check(await page.locator('[data-testid="business-kinds"] [data-testid="drawn-tick"]').count() == 1,
              f"{width} · with a tick that draws itself on the row that was picked")
        # A SINGLE CHOICE GOES ON BY ITSELF — Peter's «auto-advance on single choices».
        await page.wait_for_selector('[data-testid="business-name"]', timeout=4000)
        check(await text_of(page, '[data-testid="start-business"] h1') == "What is it called?",
              f"{width} · and the screen goes on by itself, to the name")
        check(await text_of(page, '[data-testid="business-save"]') == "Save my business",
              f"{width} · where the foot's label changes to `Save my business`")
        disabled = await page.locator('[data-testid="business-save"]').is_disabled()
        check(disabled, f"{width} · which waits for a name")
        # ⚠ THE NAME IS WRITTEN ONTO THE SHOP'S OWN PASS as it is typed (ONBOARDING-SPEC.md §0).
        check(await page.locator('[data-testid="business-pass"] [data-pass-line="open"]').count() >= 1,
              f"{width} · the pass stands with its name line still open")
        await page.fill('[data-testid="business-name"]', "Distribuidora Aurora")
        await page.wait_for_timeout(300)
        check(not await page.locator('[data-testid="business-save"]').is_disabled(),
              f"{width} · and comes live on one")
        mirrored = await text_of(page, '[data-testid="business-pass"]')
        check("Distribuidora Aurora" in mirrored and "Sells to bodegas" in mirrored,
              f"{width} · and the card gains the name and the trade as they are given · {mirrored[:48]!r}")
        await shot(page, "business", width)
        await page.click('[data-testid="business-save"]')
        await page.wait_for_selector('[data-testid="start-address"]', timeout=10000)
        held = await page.evaluate("() => sessionStorage.getItem('rocoto-bodega-joining')")
        check(held and "sells_to_bodegas" in held and "Distribuidora Aurora" in held,
              f"{width} · the walk holds what the shop answered · {held and held[:60]}")
        check(not errors, f"{width} · the business paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 5 · THE ADDRESS ──────────────────────────────────────────────────────────────────────────────

async def address(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    asked: list[str] = []
    page.on("request", lambda request: asked.append(request.url)
            if "/api/bodega/address/" in request.url else None)
    try:
        await walk_to_business(page, origin)
        check(await text_of(page, '[data-testid="start-address"] h1') == "Where is it?",
              f"{width} · the address names the question")
        await page.fill('[data-testid="address-query"]', "Av")
        await page.wait_for_timeout(400)
        check(await page.locator('[data-testid="address-suggestion"]').count() == 0,
              f"{width} · two letters ask for nothing")
        await page.fill('[data-testid="address-query"]', "Av. Larco")
        await page.wait_for_selector('[data-testid="address-suggestion"]', timeout=10000)
        rows = page.locator('[data-testid="address-suggestion"]')
        count = await rows.count()
        check(count >= 1, f"{width} · and a street answers with rows · {count}")
        first = await text_of(page, '[data-testid="address-suggestion"]')
        check("\n" in first, f"{width} · each row carries the street and its district · {first[:40]!r}")
        check(await tall(page, '[data-testid="address-suggestion"]'), f"{width} · and clears 44 px")
        # ONE SEARCH, ONE SESSION TOKEN — which is what Google bills (WIRING-SPEC.md §6).
        tokens = {url.split("sessionToken=")[1].split("&")[0] for url in asked if "sessionToken=" in url}
        check(len(tokens) == 1, f"{width} · every keystroke of one search carries one token · {len(tokens)}")

        await rows.first.click()
        await page.wait_for_selector('[data-testid="address-map"]', timeout=10000)
        await page.wait_for_timeout(900)
        ground = await page.locator('[data-testid="address-map"]').get_attribute("data-ground")
        check(ground in ("google", "card"), f"{width} · the map draws a ground · {ground}")
        card = page.locator('[data-testid="address-card"]')
        check(await card.count() == 1, f"{width} · with the card at the top")
        name = await text_of(page, '[data-testid="address-card-name"]')
        check(name == "Distribuidora Aurora", f"{width} · carrying the business's own name · {name}")
        text = await text_of(page, '[data-testid="address-card-text"]')
        check("Lima" in text, f"{width} · and the address it picked · {text[:40]}")
        above = await page.evaluate("""() => {
          const card = document.querySelector('[data-testid="address-card"]');
          const pin = document.querySelector('[data-testid="address-pin"]');
          return card.getBoundingClientRect().bottom <= pin.getBoundingClientRect().top;
        }""")
        check(above, f"{width} · the card stands above the pin")
        dropped = await page.locator('[data-testid="address-pin"]').get_attribute("data-pin")
        check(dropped == "dropped", f"{width} · and the pin has landed · {dropped}")
        act = await text_of(page, '[data-testid="address-confirm"]')
        check(act.startswith("Confirm this address"), f"{width} · the act is the arrow · {act}")
        await shot(page, "address", width)
        await page.click('[data-testid="address-confirm"]')
        await page.wait_for_selector('[data-testid="start-orders"]', timeout=10000)
        check(not errors, f"{width} · the address paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 6 · THE ORDERS ───────────────────────────────────────────────────────────────────────────────

async def orders(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start/orders")
    try:
        check(await text_of(page, '[data-testid="start-orders"] h1') == "Your orders appear here",
              f"{width} · the orders name the screen")
        check(await page.locator('[data-testid="orders-handset"]').count() == 1,
              f"{width} · the note is drawn inside a handset")
        await page.wait_for_timeout(1400)
        lines = page.locator('[data-testid="orders-note-line"]')
        count = await lines.count()
        check(count >= 3, f"{width} · the note carries this shop's own lines · {count}")
        # THE NOTE IS THE REAL ONE: the customer and the lines come from the shop's own book, so the
        # names are the fixture's goods rather than words written for this screen.
        who = await text_of(page, '[data-testid="orders-note-customer"]')
        check(who, f"{width} · and names the customer it is for · {who}")
        words = await lines.evaluate_all("nodes => nodes.map(n => n.innerText.trim())")
        check(all(word for word in words), f"{width} · every line says what it is and how much · {words[:1]}")
        # AND THE NOTE FINISHES ITSELF: a tick draws under the last line once they have all landed.
        check(await page.locator('[data-testid="orders-handset"] [data-testid="drawn-tick"]').count() == 1,
              f"{width} · and a tick draws under it once the note has written itself")
        check(await text_of(page, '[data-testid="orders-next"]') == "Continue",
              f"{width} · and the act names the next step")
        await shot(page, "orders", width)
        check(not errors, f"{width} · the orders paint with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 7 · THE YAPE ─────────────────────────────────────────────────────────────────────────────────

async def yape(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start/yape")
    try:
        check(await text_of(page, '[data-testid="start-yape"] h1') == "Connect your Yape",
              f"{width} · the Yape step names the thing")
        body = await text_of(page, '[data-testid="start-yape"]')
        check("Rocoto sends your Yape link in the chat when a customer orders." in body,
              f"{width} · with the one sentence that says why")
        # THE MARK IS YAPE'S OWN APP ICON, and nothing is printed beside it. A name set in this app's
        # type stood here while the repository held only a favicon; Peter: «You shouldn't make up
        # other stuff».
        mark = page.locator('[data-testid="yape-mark"]')
        mark_is = await mark.evaluate("n => [n.tagName, n.getAttribute('alt'), n.naturalWidth, (n.getAttribute('src')||'').split('/').pop()]")
        check(mark_is[0] == "IMG" and mark_is[1] == "Yape" and mark_is[2] >= 120 and mark_is[3] == "yape-icon.webp",
              f"{width} · Yape's mark is Yape's own icon, loaded · {mark_is!r}")
        # THE STAGE IS DRAWN IN YAPE'S OWN PURPLE, which is a named exception in the theme.
        # ⚠ IT WAS A PALE LILAC WASH WITH A TINY CHIP ON IT, and nobody looking at it would have
        # said the word Yape. The purple is the whole upper part of the phone now.
        purple = await page.evaluate("""() => {
          const field = document.querySelector('[data-testid="yape-field"]');
          const stage = document.querySelector('[data-testid="start-yape-visual"]');
          return {
            lift: getComputedStyle(field).backgroundImage,
            ground: getComputedStyle(stage).backgroundColor,
            tone: stage.getAttribute('data-stage'),
          };
        }""")
        check("gradient" in purple["lift"], f"{width} · and the field carries Yape's own lift")
        check(purple["tone"] == "yape" and purple["ground"] == "rgb(116, 35, 132)",
              f"{width} · on Yape's own purple, edge to edge · {purple['ground']}")
        # THE QR TILE LIES AT AN ANGLE until the number is one Yape would accept.
        check(await page.locator('[data-testid="yape-qr-seat"]').get_attribute("data-square") == "tilted",
              f"{width} · the QR tile lies at an angle while the number is open")
        # A NUMBER IS A PERUVIAN MOBILE, and the field takes the numeric keypad.
        mode = await page.locator('[data-testid="yape-number"]').get_attribute("inputmode")
        check(mode == "numeric", f"{width} · the number field opens the numeric keypad · {mode}")
        # THE SEAT SHOWS WHAT THE SHOP HAS GIVEN. It once printed the field's own placeholder in
        # HeadingMedium, in the seat where the connected number stands, so the example and the real
        # thing were the same picture.
        empty = await text_of(page, '[data-testid="yape-shown"]')
        check(empty.strip() == "",
              f"{width} · the number's seat stands empty until a number is typed · {empty!r}")
        check(await page.locator('[data-testid="yape-qr-seat"]').count() == 1,
              f"{width} · and the room is the QR's own seat")
        await page.fill('[data-testid="yape-number"]', "987654321")
        await page.wait_for_timeout(200)
        shown = await text_of(page, '[data-testid="yape-shown"]')
        check(shown == "+51 987 654 321", f"{width} · and the number prints in Peru's own grouping · {shown}")
        check(await page.locator('[data-testid="yape-qr-seat"]').get_attribute("data-square") == "yes",
              f"{width} · and the tile squares up on a number Yape would accept")
        check(await page.locator('[data-testid="yape-qr-add"]').count() == 1,
              f"{width} · the QR comes off the phone through its own act")
        accepts = await page.locator('[data-testid="yape-qr-input"]').get_attribute("accept")
        check(accepts and "image/png" in accepts, f"{width} · which takes a photo or a screenshot · {accepts}")
        check(await text_of(page, '[data-testid="yape-connect"]') == "Connect my Yape",
              f"{width} · the act is a verb and its object")
        check(await text_of(page, '[data-testid="yape-skip"]') == "Skip for now",
              f"{width} · and skipping is a real way on")
        await shot(page, "yape", width)
        await page.click('[data-testid="yape-skip"]')
        await page.wait_for_timeout(600)
        check(page.url.endswith("#/start/referrals") or page.url.endswith("#/start/owed"),
              f"{width} · which reaches the next screen of this shop's own walk · {page.url[-18:]}")
        check(not errors, f"{width} · the Yape step paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 8 · WHO OWED YOU ─────────────────────────────────────────────────────────────────────────────

async def owed(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        await walk_to_business(page, origin)
        await page.goto(origin + "#/start/owed", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="owed-row"], [data-testid="owed-empty"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-owed"] h1') == "These businesses have owed you",
              f"{width} · the screen names what the rows are")
        body = await text_of(page, '[data-testid="start-owed"]')
        check("from your own WhatsApp when you press send there" in body,
              f"{width} · and says whose WhatsApp the message goes from")
        rows = page.locator('[data-testid="owed-row"]')
        await page.wait_for_timeout(300)
        body = await text_of(page, '[data-testid="start-owed"]')
        count = await rows.count()
        if count:
            # ⚠ THIS IS THE SCREEN A DISTRIBUTOR IS SHOWN. It once told them Rocoto had ranked the
            # businesses that owe them by HOW MUCH THEY LAUGH, and named the engineering plan that
            # would replace the rule. Every row now reads the payment evidence of that chat, and
            # neither the rows nor the screen says the word (`history/read.ts`, `owedReasonLine`).
            check(await page.locator('[data-testid="owed-rule"]').count() == 0,
                  f"{width} · the sign-up prints no rule of its own")
            check("laugh" not in body.lower(), f"{width} · and nothing on this screen says laughs")
            reason = await text_of(page, '[data-testid="owed-reason"]')
            check(("Asked to pay later" in reason or "Last order" in reason or "Last message" in reason)
                  and "laugh" not in reason.lower(),
                  f"{width} · a row's reason is the payment evidence of that chat · {reason!r}")
            check(count <= 8, f"{width} · the likely list is the top rows, not the whole book · {count}")
            picked = await rows.evaluate_all("nodes => nodes.map(n => n.dataset.rowPicked)")
            check(set(picked) == {"yes"}, f"{width} · every row arrives picked, and the owner unticks · {set(picked)}")
            said = await page.locator('[data-testid="owed-picked"]').get_attribute("data-picked")
            check(said == str(count), f"{width} · with the count above them · {said}")
            # UNTICKING MOVES THE COUNT, which is what makes the list feel answered.
            await rows.first.locator('[data-testid="owed-tick"] label, [data-testid="owed-tick"]').first.click()
            await page.wait_for_timeout(250)
            fewer = await page.locator('[data-testid="owed-picked"]').get_attribute("data-picked")
            check(fewer == str(count - 1), f"{width} · and the count ticks as rows are picked · {fewer}")
            await shot(page, "owed", width)
            # THE HAND-OFF: one press, one chat, from the owner's own WhatsApp, and nothing sent.
            await page.click('[data-testid="owed-share"]')
            await page.wait_for_timeout(400)
            handoffs = await page.evaluate("window.__handoffs")
            check(len(handoffs) == 1 and handoffs[0].startswith("https://wa.me/"),
                  f"{width} · `Share with them` hands off exactly one message · {len(handoffs)}")
            check("Rocoto%20waitlist" in handoffs[0] or "Rocoto waitlist" in handoffs[0],
                  f"{width} · the invitation names the waitlist · {handoffs[0][:70]}")
            check("%23%2Fr%2F" in handoffs[0] or "#/r/" in handoffs[0],
                  f"{width} · and carries the owner's own link")
            shared = await rows.first.get_attribute("data-row-shared")
            marked = await page.locator('[data-testid="owed-row"][data-row-shared="yes"]').count()
            check(marked == 1, f"{width} · the row that was handed off carries its tick · {marked} · {shared}")
            counted = await text_of(page, '[data-testid="owed-count"]')
            check("1 of" in counted, f"{width} · and the foot counts the hand-offs · {counted}")
        else:
            check(await page.locator('[data-testid="owed-empty"]').count() == 1,
                  f"{width} · an empty list says so and continues")
        check(not errors, f"{width} · the likely list paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def yape_connect(browser, origin, width, height):
    """`Connect my Yape` CARRIES THE WALK ON (ONBOARDING-SPEC.md §0, screen 7).

    ⚠ THIS LEG EXISTS BECAUSE THE ACT WAS NEVER PRESSED. Every `/api/bodega/*` call answers 401
    where no connection service minted the session — local development, this drive, every review
    build — and the screen read that refusal as one the shop could act on: it printed «Connect your
    WhatsApp to continue.» under a WhatsApp the shop had just connected and stood there for ever,
    with `Skip for now` the only way out. Only a refusal about the NUMBER or the QR holds the shop
    now; every other answer carries the walk on, which is the rule every other screen follows.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        await walk_to_business(page, origin, kind="bodega", name="Bodega Yesenia")
        await page.goto(origin + "#/start/yape", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="yape-number"]')
        # A NUMBER THE SERVICE REFUSES HOLDS THE SHOP, because it is the shop's own to fix.
        await page.fill('[data-testid="yape-number"]', "12345")
        await page.click('[data-testid="yape-connect"]')
        await page.wait_for_timeout(600)
        held = await page.locator('section[data-walk-step]').get_attribute("data-walk-step")
        says = await text_of(page, '[data-testid="yape-says"]')
        check(held == "yape" and "nine-digit" in says,
              f"{width} · a number the shop can fix holds the shop, and says what to fix · {says!r}")
        # AND A VALID ONE GOES ON, whatever the rig answered.
        await page.fill('[data-testid="yape-number"]', "987654321")
        await page.click('[data-testid="yape-connect"]')
        await page.wait_for_timeout(1600)
        step = await page.locator('section[data-walk-step]').get_attribute("data-walk-step")
        check(step in ("owed", "referrals"),
              f"{width} · and `Connect my Yape` reaches the next screen of this shop's walk · {step}")
        await shot(page, "yape-connected", width)
        check(not errors, f"{width} · connecting the Yape paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 9 · MOVE UP THE LIST ─────────────────────────────────────────────────────────────────────────

async def referrals(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        await walk_to_business(page, origin)
        await page.goto(origin + "#/start/referrals", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="referrals-number"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-referrals"] h1') == "Move up the list",
              f"{width} · the referral step names the thing")
        body = await text_of(page, '[data-testid="start-referrals"]')
        # THE REWARD'S OWN WORDING, and no other (the credit law, DESIGN-SPEC.md §6).
        check("cover one more of your purchases" in body,
              f"{width} · the reward is worded as a covered purchase")
        for banned in ("free credit", "interest", "% ", "approved", "limit of"):
            check(banned not in body.lower(), f"{width} · and never as credit · {banned!r}")
        place = await page.locator('[data-testid="referrals-number"]').get_attribute("data-value")
        check(place and int(place) > 0, f"{width} · the place is the hero · {place}")
        worth = await text_of(page, '[data-testid="referrals-worth"]')
        check("moves you up" in worth and any(ch.isdigit() for ch in worth),
              f"{width} · which says what one business is worth · {worth}")
        dots = page.locator('[data-testid="referrals-dots"] [data-dot]')
        check(await dots.count() == 3, f"{width} · three seats toward the next covered purchase · {await dots.count()}")
        check(await tall(page, '[data-testid="referrals-dots"] [data-dot]'),
              f"{width} · and a seat is a 44 px ring rather than a dot")
        seats = await text_of(page, '[data-testid="referrals-seats-says"]')
        check("1 more covered purchase" in seats,
              f"{width} · labelled with what filling them is worth · {seats!r}")
        # THE PASS IS ON THIS STAGE TOO, complete, so the shop sees the card it is trying to move up.
        held = await text_of(page, '[data-testid="referrals-pass"]')
        check("Distribuidora Aurora" in held,
              f"{width} · with the shop's own pass above them · {held[:40]!r}")
        # ⚠ THE MESSAGE WAS A GREY BOX WITH A RAW URL IN IT. It is drawn as the outgoing WhatsApp
        # bubble it will become, with the address read the way a person reads one — and what is
        # HANDED OVER is still the whole link, which the bubble carries on `data-url`.
        preview = await text_of(page, '[data-testid="referrals-preview"]')
        code = await page.locator('[data-testid="referrals-pass"]').get_attribute("data-reference")
        shared_url = await page.locator('[data-testid="referrals-preview"]').get_attribute("data-url")
        check("Distribuidora Aurora" in preview and f"/r/{code}" in preview,
              f"{width} · the message is previewed as a chat bubble, with the code in it · {preview[:50]}")
        check(shared_url and "#/r/" in shared_url and code in shared_url,
              f"{width} · and the whole address is what the share hands over · {shared_url}")
        check(".html" not in preview,
              f"{width} · the bubble shows the host and the code rather than the page's own file name")
        bubble = await page.evaluate("""() => {
          const node = document.querySelector('[data-testid="referrals-preview"] span');
          return getComputedStyle(node).backgroundColor;
        }""")
        # THE GREEN IS WHATSAPP'S OWN, mixed over this theme's paper (`rocoto-theme.ts`), so the
        # computed value is a `color(srgb …)` rather than an `rgb()`. What is asserted is the FACT:
        # the bubble is painted, and the green channel is the one that leads.
        channels = [float(n) for n in re.findall(r"[\d.]+", bubble)][:3]
        check(len(channels) == 3 and channels[1] > channels[0] and channels[1] > channels[2],
              f"{width} · drawn in WhatsApp's own outgoing green · {bubble}")
        check(await text_of(page, '[data-testid="referrals-share"]') == "Share my link",
              f"{width} · and the act is `Share my link`")
        await shot(page, "referrals", width)
        # THE FALLBACK: a browser with no share sheet copies the link and says so.
        await page.click('[data-testid="referrals-share"]')
        await page.wait_for_timeout(600)
        says = await text_of(page, '[data-testid="referrals-shared"]') \
            or await text_of(page, '[data-testid="referrals-says"]')
        await page.wait_for_timeout(300)
        check("clipboard" in says or "Copy your link" in says,
              f"{width} · a browser with no sheet copies it and says so · {says[:60]}")
        # ⚠ AND THE WALK HAS A DOOR THE MOMENT THE LINK IS SHARED. The act read `Share my link`
        # for ever and the only way to `You’re in` was a quiet `Skip for now` — a false label
        # for somebody who had just shared (ONBOARDING-SPEC.md §1: the critical path ends here).
        check(await text_of(page, '[data-testid="referrals-done"]') == "Finish joining",
              f"{width} · the act carries the walk on once the link is shared")
        check(await text_of(page, '[data-testid="referrals-share-again"]') == "Share my link again",
              f"{width} · and sharing again is the quiet second way")
        await shot(page, "referrals-shared", width)
        await page.click('[data-testid="referrals-done"]')
        await page.wait_for_timeout(700)
        check(page.url.endswith("#/start/done"),
              f"{width} · which reaches `You’re in` · {page.url[-16:]}")
        check(not errors, f"{width} · the referral step paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 10 · DONE ────────────────────────────────────────────────────────────────────────────────────

async def done(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        # THE WHOLE WALK, INCLUDING THE ADDRESS, because the card this screen shows is the pass with
        # every line filled in and the address is one of them (ONBOARDING-SPEC.md §0, «THE PASS»).
        await walk_to_business(page, origin)
        await page.fill('[data-testid="address-query"]', "Av. Larco")
        await page.wait_for_selector('[data-testid="address-suggestion"]', timeout=20000)
        await page.click('[data-testid="address-suggestion"]')
        await page.wait_for_selector('[data-testid="address-confirm"]', timeout=20000)
        await page.click('[data-testid="address-confirm"]')
        await page.wait_for_selector('[data-testid="orders-handset"]', timeout=20000)
        await page.goto(origin + "#/start/done", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="done-card"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-done"] h1') == "You’re in",
              f"{width} · the last screen names the moment")
        name = await text_of(page, '[data-testid="done-name"]')
        check(name == "Distribuidora Aurora", f"{width} · the card carries the business's name · {name}")
        card = page.locator('[data-testid="done-card"]')
        place = await card.get_attribute("data-place")
        reference = await card.get_attribute("data-reference")
        check(place and int(place) > 0, f"{width} · its place · {place}")
        check(reference and len(reference) >= 4, f"{width} · and its reference · {reference}")
        check(await page.locator('[data-testid="done-confetti"]').count() == 1,
              f"{width} · with a smaller burst over it")
        # THE CARD IS THE PASS, COMPLETE: every line the walk asked for is filled in, and none of
        # them is still a bar (ONBOARDING-SPEC.md §0, «THE PASS»).
        held = await text_of(page, '[data-testid="done-card"]')
        check("Sells to bodegas" in held and "Av. Larco" in held,
              f"{width} · the pass carries the trade and the address it was given · {held[:60]!r}")
        open_lines = await page.locator('[data-testid="done-card"] [data-pass-line="open"]').count()
        check(open_lines == 0, f"{width} · and nothing on it is still a bar · {open_lines}")
        # THE BUDDY: the greeting carries the reference, which is how Rocoto knows who said hi.
        href = await page.locator('[data-testid="done-whatsapp"]').first.get_attribute("href")
        check(href and href.startswith("https://wa.me/19789589459?text="),
              f"{width} · `Say hi` opens Rocoto's own number · {href and href[:44]}")
        check(href and reference in href.replace("%20", " ").replace("%2E", "."),
              f"{width} · with the reference inside the greeting")
        check(await text_of(page, '[data-testid="done-whatsapp"]') == "Say hi to Rocoto on WhatsApp",
              f"{width} · and the act is Peter's own line")
        stands = await text_of(page, '[data-testid="done-stands"]')
        check("+1 978 958 9459" in stands, f"{width} · the screen states where Rocoto is · {stands[:60]}")
        check(await page.locator('[data-testid="done-open-later"]').count() == 1,
              f"{width} · with the app's home one quiet press away")
        await shot(page, "done", width)
        await page.click('[data-testid="done-open-later"]')
        await page.wait_for_timeout(800)
        check("#/prep" in page.url, f"{width} · which opens the shop · {page.url[-12:]}")
        check(not errors, f"{width} · the last screen paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 11 · THE MOVEMENT BETWEEN SCREENS ────────────────────────────────────────────────────────────

async def moving_on(browser, origin, width, height):
    """THE SHARED AXIS HAS BOTH HALVES (ONBOARDING-SPEC.md §0, «the frame»).

    ⚠ THE OUTGOING SCREEN USED TO VANISH ON THE SAME FRAME the next one arrived, because the route
    swap unmounts it — so the movement read as a cut with a slide stuck on the end of it. `goTo`
    takes the exit FIRST: the live surface slides 32 px the way the walk is going and fades, and the
    address follows `MS.leave` later. The drive presses the act and reads the surface being left
    before the hash has changed at all.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start/waitlist")
    try:
        await page.wait_for_selector('[data-testid="waitlist-confirm"]')
        await page.wait_for_timeout(600)
        before = page.url
        await page.click('[data-testid="waitlist-confirm"]')
        await page.wait_for_timeout(60)
        leaving = await page.evaluate("""() => {
          const surface = document.querySelector('[data-walk-surface]');
          if (!surface) return null;
          const style = getComputedStyle(surface);
          return {transform: style.transform, opacity: Number(style.opacity)};
        }""")
        check(page.url == before,
              f"{width} · the address waits while the screen being left leaves · {page.url[-16:]}")
        check(leaving and leaving["transform"] != "none" and "matrix" in leaving["transform"],
              f"{width} · and that screen is moving · {leaving and leaving['transform']}")
        check(leaving and leaving["opacity"] < 1,
              f"{width} · and fading as it goes · {leaving and leaving['opacity']}")
        await page.wait_for_selector('[data-testid="business-kinds"]', timeout=10000)
        check(page.url.endswith("#/start/business"),
              f"{width} · then the next screen arrives · {page.url[-20:]}")
        check(not errors, f"{width} · the movement paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 12 · THE CUSTOMER'S PAYMENT PAGE ─────────────────────────────────────────────────────────────

async def payment(browser, origin, width, height):
    """`Pay now` SHOWS THE NUMBER AND THE AMOUNT, AND `Open Yape` WAITS FOR THE COPY.

    No published Yape address carries an amount (WIRING-SPEC.md §15), so the page takes the path
    Peter described: the exact figure goes on the clipboard with one press, and only then does the
    act that opens the app come live — a customer pasting a figure is a customer who pays the right
    one.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        await page.evaluate("""() => {
          const key = 'rocoto-bodega-money-v1:bodega';
          const held = JSON.parse(localStorage.getItem(key) || 'null') || {
            version: 1, scope: 'bodega', invoices: [], links: [], receipts: [], fiado: [], events: [],
            setup: { sellerName: '', ruc: '', invoiceSeries: 'F001', bank: 'bbva',
                     bankAccountLabel: '', payments: 'pending', invoicing: 'pending' } };
          held.links = [{ id: 'K7M2QX', amountMinor: 4850, currency: 'PEN',
            description: '2 kg arroz extra, 1 aceite vegetal', customerName: 'Nelly juguería',
            reference: 'ROC-K7M2QX', url: '#/pay/K7M2QX', status: 'created',
            createdAt: new Date().toISOString() }];
          localStorage.setItem(key, JSON.stringify(held));
        }""")
        await page.goto(origin + "#/pay/K7M2QX", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="payment-page-amount"]', timeout=10000)
        minor = await page.locator('[data-testid="payment-page-amount"]').get_attribute("data-amount-minor")
        check(minor == "4850", f"{width} · the page states the exact amount · {minor}")
        await page.click('[data-testid="payment-page-pay-now"]')
        await page.wait_for_selector('[data-testid="payment-page-yape"]', timeout=10000)
        number = await text_of(page, '[data-testid="payment-page-yape-number"]')
        check(number.startswith("+51") or number.startswith("9"),
              f"{width} · `Pay now` shows the shop's Yape number · {number}")
        check(await page.locator('[data-testid="payment-page-yape-mark"]').count() == 1,
              f"{width} · under Yape's own mark")
        open_yape = page.locator('[data-testid="payment-page-open-yape"]')
        check(await open_yape.is_disabled(), f"{width} · `Open Yape` waits for the copy")
        first = await text_of(page, '[data-testid="payment-page-copy-first"]')
        check(first.startswith("Copy the amount"),
              f"{width} · and the screen says what comes first · {first}")
        await page.click('[data-testid="payment-page-copy"]')
        await page.wait_for_timeout(400)
        check(not await open_yape.is_disabled(), f"{width} · one press, and it comes live")
        href = await open_yape.get_attribute("href")
        check(href and ("intent://" in href or "apps.apple.com" in href),
              f"{width} · which opens the app that is installed · {href and href[:40]}")
        said = await text_of(page, '[data-testid="payment-page-says"]')
        check("clipboard" in said or "type it into Yape" in said,
              f"{width} · and the page says where the figure went · {said[:60]}")
        await shot(page, "payment", width)
        check(not errors, f"{width} · the payment page paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 11 · WHAT A REAL ACCOUNT LOOKS LIKE ──────────────────────────────────────────────────────────
# The sample world is a bodega: every contact has a name, every chat has a laugh. Peter's own number
# is not — 65 of the 120 chats the read fetched carry no contact name and 103 hold no laugh at all
# (WHATSAPP-HISTORY-SPEC.md §5). So this leg seeds the stored reading with rows of THAT shape and
# reads what the browser painted. The key and the version are `history/read.ts`'s own; a version
# bump lands here.
READING_KEY = "rocoto-bodega-history-reading:bodega"
READING_VERSION = 3


def reading_row(name, number, laughs, days, named=True):
    """One row of a stored reading, in the shape `history/read.ts` writes it."""
    at = f"2026-09-{19 - days:02d}T15:00:00-05:00"
    return {
        "id": f"seed-{number}", "name": name, "number": number, "named": named,
        "role": "other", "roleWhy": "A neighbour, on the words alone", "trade": None,
        "messages": laughs + 2, "ordersIn": 0, "ordersOut": 0, "fiadoAsks": 0,
        "receiptsIn": 0, "receiptsOut": 0, "prices": 0, "pictures": 0, "voiceNotes": 0,
        "laughs": laughs, "ordersAwaitingPayment": 0, "lastOrderAt": None,
        "lastOrderDaysAgo": 999, "lastMessageDaysAgo": days,
        "oldestAt": at, "newestAt": at, "said": None,
    }


async def seed_reading(page, rows):
    await page.evaluate(
        "([key, held]) => localStorage.setItem(key, JSON.stringify(held))",
        [READING_KEY, {"version": READING_VERSION, "readings": rows}])


async def shapes(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        crowd = [reading_row(name, f"+5198700{seat}11", 5 - seat, 2 + seat)
                 for seat, name in enumerate(["Rosa", "Tito", "Ursula", "Vera", "Willy"])]
        crowd += [
            reading_row("Ana", "+51987000888", 0, 4),
            reading_row("34600333444", "+34600333444", 0, 3, named=False),
        ]
        await seed_reading(page, crowd)
        await page.goto(origin + "#/start/owed", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="owed-row"]', timeout=20000)
        laughs = await page.locator('[data-testid="owed-row"]').evaluate_all(
            "nodes => nodes.map(node => Number(node.dataset.rowLaughs || 0))")
        names = await page.locator('[data-testid="owed-row"]').evaluate_all(
            "nodes => nodes.map(node => node.dataset.rowName)")
        check(names == ["Rosa", "Tito", "Ursula", "Vera", "Willy"],
              f"{width} · the likely list holds the chats with a laugh alone · {names}")
        check(await page.locator('[data-testid="owed-thin"]').count() == 0,
              f"{width} · and five of them is list enough to say nothing about it · {laughs}")
        await shot(page, "shapes-owed", width)
        check(not errors, f"{width} · the seeded shapes paint with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def floor(browser, origin, width, height):
    """A SHORT LIST IS STILL A LIST, and the walk carries on from it."""
    context, page, errors = await boot(browser, origin, width, height, "#/start")
    try:
        await seed_reading(page, [
            reading_row("Mama", "+359888555012", 31, 2),
            reading_row("Papa", "+359888000222", 24, 1),
            reading_row("Rita", "+51987000999", 0, 5),
            reading_row("34600111222", "+34600111222", 0, 9, named=False),
        ])
        await page.goto(origin + "#/start/owed", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="owed-row"]', timeout=20000)
        names = await page.locator('[data-testid="owed-row"]').evaluate_all(
            "nodes => nodes.map(node => node.dataset.rowName)")
        check(names == ["Mama", "Papa"], f"{width} · two chats hold a laugh, so the list is two rows · {names}")
        short = await text_of(page, '[data-testid="start-owed"]')
        check("laugh" not in short.lower(),
              f"{width} · and a short list says nothing about the rule that made it short")
        check(await page.locator('[data-testid="owed-empty"]').count() == 0,
              f"{width} · a list that has rows draws no empty state")
        check(await page.locator('[data-testid="owed-share"]').is_enabled(),
              f"{width} · and the walk carries on from it")
        # A CONTACT THE SYNC NAMED NOWHERE DRAWS ITS NUMBER AND A PERSON GLYPH, never two digits in
        # an initials disc (WHATSAPP-HISTORY-SPEC.md §5).
        glyphs = await page.locator('[data-testid="owed-row"] [data-face="number"]').count()
        check(glyphs == 0, f"{width} · a list of named chats draws no number glyph · {glyphs}")
        await shot(page, "shapes-floor", width)
        check(not errors, f"{width} · the short list paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def reset(browser, origin, width, height):
    """`Reset state` IS ONE CONTROL AND THREE CALLS, IN ORDER (WIRING-SPEC.md §11, §279).

    The browser half is checkable here: the page must ask the bridge to disconnect, ask the rig to
    clear its own session and referral records, sweep every `rocoto-bodega-*` key, and STAY on the
    first screen with its cleared line standing. The two posts are recorded rather than believed —
    the drive watches the network — and the keys are counted before and after, so a sweep that
    silently does nothing reports RED.

    AND THE DAY LEDGER IT SHARES WITH CEDAR, BOTH WAYS. `cedar/sale.ts` appends this shop's acts to
    `rocoto-app-day` — outside the prefix, so outside the sweep — and that key holds Cedar's own
    houses beside this shop's row. So the walk below makes a real day on Prep, puts a fish house's row
    in the same key, and reads both after the press: this shop's row gone, the other house standing.
    """
    context, page, errors = await boot(browser, origin, width, height, "?dev=1#/start")
    posted: list[str] = []
    page.on("request", lambda request: posted.append(request.url)
            if request.method == "POST" else None)
    # WHICH SOURCE ANSWERED. The seam picks its world by probing `GET /api/proof/state` at boot
    # (`source/index.ts`), so the drive learns the same way, and the disconnect is asserted against
    # the world the page is actually in.
    bridge: list[int] = []
    page.on("response", lambda response: bridge.append(response.status)
            if response.url.endswith("/api/proof/state") else None)
    try:
        # a key of each family, so the sweep has something of this shop's to remove
        await page.evaluate("""() => {
          localStorage.setItem('rocoto-bodega-stage-v1:bodega', '{"scope":"bodega"}');
          localStorage.setItem('rocoto-bodega-covers-v1', '["money"]');
          localStorage.setItem('rocoto-runtime-base', 'http://127.0.0.1:8090');
        }""")
        before = await page.evaluate(
            "() => Object.keys(localStorage).filter((k) => k.startsWith('rocoto-bodega-')).length")
        check(before >= 2, f"{width} · this shop holds keys before the reset · {before}")

        # A REAL DAY, THEN A NEIGHBOUR IN THE SAME KEY. Opening a sale on Prep is an act, so
        # `cedar/sale.ts` writes this shop's row of `rocoto-app-day` with the app's own version
        # against it; the fish row is added beside it and the page reloaded, so the live ledger holds
        # both before the control is pressed.
        await page.goto(origin + "#/prep/sonia", wait_until="networkidle")
        await page.wait_for_timeout(900)
        made = await page.evaluate("""() => {
          const held = JSON.parse(localStorage.getItem('rocoto-app-day') || 'null');
          if (!held || !held.sectors) return '';
          held.sectors.fish = { sector: 'fish', surfaced: [], confirmed: ['c1'], answered: {}, always: [],
                                released: [], notice: {},
                                events: [{ kind: 'read', sale: 'c1', at: '07:10', by: 'Cedar' }] };
          localStorage.setItem('rocoto-app-day', JSON.stringify(held));
          return Object.keys(held.sectors).sort().join(',');
        }""")
        check(made == "fish,fruit", f"{width} · this shop's day stands beside a fish house's · {made}")
        # THE RELOAD IS THE POINT, because `cedar/day.ts` holds the ledger in memory and writes what it
        # holds: a fish row added behind its back is a row it has yet to read. A developer arriving on
        # this page with Cedar state in the key is the case that matters, so the page reads both rows
        # the way that developer's browser does, and the reset is measured against them.
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(700)
        await page.goto(origin + "?dev=1#/start", wait_until="networkidle")
        await page.wait_for_timeout(700)

        await page.click('[data-testid="arrival-reset"]')
        # THE CONTROL STAYS ON THIS SCREEN, so the cleared line is what the drive waits on: the
        # address no longer moves, and the sweep is measured against the line the control printed.
        await page.wait_for_selector('[data-testid="arrival-cleared"]', timeout=8000)

        said = await text_of(page, '[data-testid="arrival-cleared"]')
        check(said.startswith("State cleared"), f"{width} · the control says what it cleared · {said}")
        proof = any(200 <= status < 300 for status in bridge)
        if proof:
            check(any(u.endswith("/api/proof/whatsapp/disconnect") for u in posted),
                  f"{width} · it asks the bridge to disconnect · {posted}")
        else:
            # Local development: the bridge answered 503, the seam is `sample`, and a sample
            # account's disconnect has a subscription of its own to drop, which is nothing. The
            # page still asks the SOURCE first — that call is the seam's, so it is the seam that
            # decides whether it reaches the network (WIRING-SPEC.md §9).
            check(all("/api/proof/whatsapp/disconnect" not in u for u in posted),
                  f"{width} · on the sample source the reset asks the seam and reaches no bridge")
        check(any(u.endswith("/api/bodega/session/reset") for u in posted),
              f"{width} · then the rig's own session and referral records · {posted}")
        after = await page.evaluate(
            "() => Object.keys(localStorage).filter((k) => k.startsWith('rocoto-bodega-')).length")
        check(after == 0, f"{width} · every `rocoto-bodega-*` key is gone · {after}")
        kept = await page.evaluate("() => localStorage.getItem('rocoto-runtime-base')")
        check(kept == "http://127.0.0.1:8090",
              f"{width} · the developer's runtime pin is kept · {kept}")
        rows = await page.evaluate("""() => {
          const held = JSON.parse(localStorage.getItem('rocoto-app-day') || 'null');
          return held && held.sectors ? Object.keys(held.sectors).sort().join(',') : '';
        }""")
        check(rows == "fish", f"{width} · this shop's day is cleared and the fish house stands · {rows}")

        # AND IT STAYS WHERE IT IS, with the line it printed still on screen: there is no second door
        # to return to, so a redirect here would take the shop away from what it just read.
        await page.wait_for_timeout(1500)
        check(page.url.endswith("#/start") or page.url.endswith("#/start/arrival"),
              f"{width} · and it stays on the first screen · {page.url}")
        check(await text_of(page, '[data-testid="arrival-cleared"]') == said,
              f"{width} · with its cleared line still standing")
        await shot(page, "reset", width)
        check(not errors, f"{width} · the reset runs with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 14 · THE WALK A SHOP ACTUALLY READS ─────────────────────────────────────────────

# PETER'S OWN PARAGRAPH IN SPANISH, verbatim (FEED-IA §268, 20 September, night). It is the twin of
# `ARRIVAL_BODY` above and it ships as ONE paragraph; a paraphrase reads RED here.
ARRIVAL_BODY_ES = (
    "Para unirte a la lista de espera, conecta tu WhatsApp a Rocoto. Así nos muestras la realidad"
    " de tu negocio y de tus relaciones. Con eso te vamos a entender cuando necesites plata para"
    " comprar mercadería, o crédito para comprarla. Tranquilo: en tu cuenta solo pasa lo que tú"
    " autorizas. Esto es solo para que conozcamos tu negocio."
)


async def spanish(browser, origin, width, height):
    """SPANISH IS THE DEFAULT, AND IT IS THE WHOLE WALK (ONBOARDING-SPEC.md §0).

    Peter, 20 September 2026, night: «it all haes to be in spanish the website and the onboarding.
    english only if they clicked fromt he english page.» So a page opened with NO flag reads
    Spanish — the title, the paragraph, the celebration, the three trades, the card — and the choice
    is kept for the session, which is why the walk below never carries the flag again.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start", lang="es")
    try:
        check(await text_of(page, '[data-testid="start-arrival"] h1') == "Únete a la lista de espera",
              f"{width} · the arrival names the thing in Spanish")
        body = await text_of(page, '[data-testid="start-arrival"]')
        check(ARRIVAL_BODY_ES in body,
              f"{width} · and says why, in Peter's own Spanish, as one paragraph")
        check("Join the waitlist" not in body and "To join the waitlist" not in body,
              f"{width} · the English column stays on the English page")
        signed = await page.locator('[data-testid="arrival-signed"]').count() == 1
        check(await text_of(page, '[data-testid="arrival-connect"]') == ("Continuar" if signed else "Conectar WhatsApp"),
              f"{width} · one act moves on, in Spanish (connected: {signed})")
        await shot(page, "spanish-arrival", width)

        # THE CELEBRATION, AND THE CARD THE SHOP RECEIVES.
        await page.goto(origin + "#/start/waitlist", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="waitlist-number"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-waitlist"] h1') == "¡Ya estás en la lista de espera!",
              f"{width} · the celebration names the moment in Spanish")
        check(await text_of(page, '[data-testid="start-waitlist"] p') == "Trae otro negocio y subes de puesto.",
              f"{width} · with the one sentence under it")
        ahead = await text_of(page, '[data-testid="waitlist-ahead"]')
        check(ahead.endswith("van delante de ti.") or ahead.endswith("va delante de ti."),
              f"{width} · and how many businesses are ahead, in Spanish · {ahead}")
        card = await text_of(page, '[data-testid="waitlist-pass"]')
        check("LISTA DE ESPERA ROCOTO" in card,
              f"{width} · the pass is labelled in Spanish · {card[:40]!r}")
        check("Referencia" in card, f"{width} · and its reference is named in Spanish")
        sample = page.locator('[data-testid="waitlist-sample"]')
        if await sample.count():
            check((await sample.inner_text()).strip() == "Lista de muestra",
                  f"{width} · a seeded place says «Lista de muestra»")
        check(await text_of(page, '[data-testid="waitlist-confirm"]') == "Confirma tus datos",
              f"{width} · and the act reads «Confirma tus datos»")
        await shot(page, "spanish-waitlist", width)

        # THE THREE TRADES, IN THE WORDS A BODEGUERA USES.
        await page.click('[data-testid="waitlist-confirm"]')
        await page.wait_for_selector('[data-testid="business-kinds"]', timeout=10000)
        check(await text_of(page, '[data-testid="start-business"] h1') == "¿Qué es tu negocio?",
              f"{width} · the choice names the question in Spanish")
        says = await page.locator('[data-testid="business-kinds"] button').evaluate_all(
            "nodes => nodes.map(n => n.innerText.trim())")
        check(says == ["Una bodega", "Le vendo a bodegas", "Le vendo a restaurantes"],
              f"{width} · in the words a bodeguera uses · {says}")
        await shot(page, "spanish-kinds", width)

        # AND THE NAME, ON THE SHOP'S OWN CARD.
        await page.click('[data-testid="business-kind-bodega"]')
        await page.wait_for_selector('[data-testid="business-name"]', timeout=10000)
        check(await text_of(page, '[data-testid="start-business"] h1') == "¿Cómo se llama?",
              f"{width} · then the name, in Spanish")
        check(await text_of(page, '[data-testid="business-save"]') == "Guardar mi negocio",
              f"{width} · where the foot's label changes to «Guardar mi negocio»")
        await page.fill('[data-testid="business-name"]', "Bodega Yesenia")
        await page.wait_for_timeout(300)
        mirrored = await text_of(page, '[data-testid="business-pass"]')
        check("Bodega Yesenia" in mirrored,
              f"{width} · and the card gains the name as it is typed · {mirrored[:40]!r}")
        await shot(page, "spanish-name", width)
        # THE LANGUAGE RIDES THE SESSION rather than the address, which is why none of the presses
        # above carried a flag.
        held = await page.evaluate("() => sessionStorage.getItem('rocoto-bodega-lang')")
        check(held in (None, "es"), f"{width} · an unasked page keeps no flag of its own · {held}")

        # THE WHATSAPP CONNECTION SCREEN, IN SPANISH TOO (`connections/app.tsx`'s own `lang` prop,
        # forwarded from this same Spanish session through `WhatsAppWalk`, FEED-IA §268). This rig's
        # source is the sample world, whose WhatsApp is seeded already connected (`14 THE RESET STATE`
        # above finds the same thing), so screen 2 draws the connected account rather than Meta's own
        # walk — the leg reads whichever of the two pictures it is actually shown.
        await page.goto(origin + "#/start/connect", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="start-connect"]', timeout=10000)
        linked = await page.locator('[data-testid="connect-account"]').count() == 1
        if linked:
            check(await text_of(page, '[data-testid="start-connect"] h1') == "WhatsApp conectado",
                  f"{width} · the connected account names itself in Spanish")
            check(await text_of(page, '[data-testid="connect-continue"]') == "Continuar",
                  f"{width} · and its act reads «Continuar»")
        else:
            check(await text_of(page, '[data-testid="start-connect"] h1') == "¿Usas la app WhatsApp Business?",
                  f"{width} · not yet linked, Meta's own walk reads Spanish too")
            body_connect = await text_of(page, '[data-testid="start-connect"]')
            check("Elige la app que usas en tu celular." in body_connect,
                  f"{width} · down to the sentence under the question")
        await shot(page, "spanish-connect", width)
        check(not errors, f"{width} · the Spanish walk paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 15 · THE STATUS PAGE THE BUDDY LINKS TO ────────────────────────────────────────

async def status_page(browser, origin, width, height):
    """`?lista=<CODE>` IS THE FIRST THING THE BUDDY SENDS (ONBOARDING-SPEC.md §0).

    Peter, 20 September 2026, night: «the whole signup onboarding and their persistent waiting list
    position and referral tracker? should be a link the buddy sends as the first thing.» So the
    query becomes the route, the page stands with NO session, and it draws the walk's own anatomy:
    the pass, the three seats, and one act that hands the link to the owner's own share sheet.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start", lang="es")
    asked: list[str] = []
    page.on("request", lambda request: asked.append(request.url)
            if "/api/bodega/status/" in request.url else None)
    try:
        await page.goto(origin + "?lista=K7M2QX", wait_until="networkidle")
        check(page.url.endswith("#/lista/K7M2QX"),
              f"{width} · the buddy's link becomes the status route · {page.url[-18:]}")
        check("lista=" not in page.url,
              f"{width} · and the query is spent, so a press away stays away · {page.url[-30:]}")
        await page.wait_for_selector('[data-testid="lista-pass"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-lista"] h1') == "Tu puesto en la lista",
              f"{width} · the page names what it is showing")
        card = page.locator('[data-testid="lista-pass"]')
        check(await card.get_attribute("data-reference") == "K7M2QX",
              f"{width} · the pass carries the code the link named · {await card.get_attribute('data-reference')}")
        place = await page.locator('[data-testid="lista-number"]').get_attribute("data-value")
        check(place and int(place) > 0, f"{width} · and the place it stands at · {place}")
        # ⚠ A FINISHED CARD DRAWS NO PLACEHOLDER BARS. The public record carries no address, and a
        # bar there would promise a screen that fills it — there is none (`start/pass.tsx`).
        bars = await page.locator('[data-testid="lista-pass"] [data-pass-line="open"]').count()
        check(bars == 0, f"{width} · and nothing on it is a placeholder bar · {bars}")
        seats = page.locator('[data-testid="referrals-dots"] [data-dot]')
        check(await seats.count() == 3, f"{width} · three seats toward the next covered purchase · {await seats.count()}")
        check(await text_of(page, '[data-testid="referrals-seats-says"]') == "3 negocios = 1 compra cubierta más",
              f"{width} · labelled with what filling them is worth, in Spanish")
        body = await text_of(page, '[data-testid="start-lista"]')
        for banned in ("free credit", "crédito gratis", "sin intereses", "% "):
            check(banned not in body.lower(), f"{width} · and the page never names credit · {banned!r}")
        check(await text_of(page, '[data-testid="lista-share"]') == "Compartir mi link",
              f"{width} · the act is «Compartir mi link»")
        check(await text_of(page, '[data-testid="lista-say-hi"]') == "Salúdale a Rocoto en WhatsApp",
              f"{width} · and the quiet second act opens the chat with Rocoto")
        href = await page.locator('[data-testid="lista-say-hi"]').first.get_attribute("href")
        check(href and href.startswith("https://wa.me/19789589459?text=") and "K7M2QX" in href.replace("%20", " "),
              f"{width} · carrying this business's own reference · {href and href[:48]}")
        # NOBODY STANDING HERE IS PART-WAY THROUGH ANYTHING, so there is no progress row.
        check(await page.locator('[data-testid="walk-progress"]').count() == 0,
              f"{width} · the status page carries no progress row")
        # AND WHAT IT STANDS ON IS THE PUBLIC READ, by code: no session path answers this page, so a
        # shop opening the link on another phone reads the same screen (`start/joining.ts`).
        check(any(url.endswith("/api/bodega/status/K7M2QX") for url in asked),
              f"{width} · and it stands on the public read, by code · {asked[:1]}")
        await shot(page, "lista", width)
        check(not errors, f"{width} · the status page paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def status_english(browser, origin, width, height):
    """THE SAME PAGE ON THE ENGLISH SIDE, because a link is opened by whoever it reaches."""
    context, page, errors = await boot(browser, origin, width, height, "?lista=K7M2QX")
    try:
        await page.wait_for_selector('[data-testid="lista-pass"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-lista"] h1') == "Your place in the queue",
              f"{width} · the status page reads English where the address asked for it")
        check(await text_of(page, '[data-testid="lista-share"]') == "Share my link",
              f"{width} · with its act in English too")
        await shot(page, "lista-english", width)
        check(not errors, f"{width} · the English status page paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def status_unknown(browser, origin, width, height):
    """A CODE THE SERVICE HOLDS NO ROW FOR names the waitlist and offers the way in (§0).

    The refusal is the service's own `bodega_status_unknown`, which is what tells this case apart
    from a service that has yet to answer — that one is the SAMPLE world, like every other screen
    of the walk. The drive fulfils the refusal itself, so the screen is read off the paint rather
    than off a rig that happens to be running.
    """
    context, page, errors = await boot(browser, origin, width, height, "#/start", lang="es")
    try:
        async def unknown(route):
            await route.fulfill(status=404, content_type="application/json",
                                body='{"error":{"code":"bodega_status_unknown","message":"no row"}}')
        await page.route("**/api/bodega/status/**", unknown)
        await page.goto(origin + "?lista=ZZZZZZ", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="lista-unknown"]', timeout=20000)
        check(await text_of(page, '[data-testid="start-lista"] h1') == "La lista de espera de Rocoto",
              f"{width} · a code with no row names the thing it IS")
        said = await text_of(page, '[data-testid="start-lista"]')
        check("Tu link de estado llega en el mensaje de Rocoto en WhatsApp." in said,
              f"{width} · and says where a status link comes from · {said[:60]!r}")
        check(await text_of(page, '[data-testid="lista-join"]') == "Únete a la lista de espera",
              f"{width} · with the one way in under it")
        await shot(page, "lista-unknown", width)
        await page.click('[data-testid="lista-join"]')
        await page.wait_for_selector('[data-testid="start-arrival"]', timeout=10000)
        check(page.url.endswith("#/start"), f"{width} · which reaches the arrival · {page.url[-12:]}")
        check("lista=" not in page.url,
              f"{width} · and the spent link never pulls it back · {page.url[-24:]}")
        check(not errors, f"{width} · the unknown code paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


async def main():
    server, origin = serve()
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True, args=["--no-sandbox", "--disable-gpu"])

            async def leg(name, run, *args):
                try:
                    await run(*args)
                except Exception as error:  # a leg that throws reports itself RED and the rest still measure
                    check(False, f"{name} completed · {str(error).splitlines()[0][:160]}")

            for width, height in WIDTHS:
                await leg(f"{width} the frame", frame, browser, origin, width, height)
                await leg(f"{width} stillness", stillness, browser, origin, width, height)
                await leg(f"{width} arrival", arrival, browser, origin, width, height)
                await leg(f"{width} the rig's door", arrival_rig, browser, origin, width, height)
                await leg(f"{width} the referral door", referral_door, browser, origin, width, height)
                await leg(f"{width} connection", connection, browser, origin, width, height)
                await leg(f"{width} the waitlist", waitlist, browser, origin, width, height)
                await leg(f"{width} the business", business, browser, origin, width, height)
                await leg(f"{width} the address", address, browser, origin, width, height)
                await leg(f"{width} the orders", orders, browser, origin, width, height)
                await leg(f"{width} the Yape", yape, browser, origin, width, height)
                await leg(f"{width} connecting the Yape", yape_connect, browser, origin, width, height)
                await leg(f"{width} who owed you", owed, browser, origin, width, height)
                await leg(f"{width} move up the list", referrals, browser, origin, width, height)
                await leg(f"{width} done", done, browser, origin, width, height)
                await leg(f"{width} moving on", moving_on, browser, origin, width, height)
                await leg(f"{width} real shapes", shapes, browser, origin, width, height)
                await leg(f"{width} the laughs floor", floor, browser, origin, width, height)
                await leg(f"{width} the payment page", payment, browser, origin, width, height)
                await leg(f"{width} reset state", reset, browser, origin, width, height)
                await leg(f"{width} the Spanish walk", spanish, browser, origin, width, height)
                await leg(f"{width} the status page", status_page, browser, origin, width, height)
                await leg(f"{width} the status page in English", status_english, browser, origin, width, height)
                await leg(f"{width} the unknown code", status_unknown, browser, origin, width, height)
            await browser.close()
    finally:
        if server:
            server.shutdown()
    print(f"TOTAL {len(OK)} GREEN / {len(BAD)} RED · shots in {OUT}")
    if BAD:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
