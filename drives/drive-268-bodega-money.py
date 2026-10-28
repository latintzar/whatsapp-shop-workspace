#!/usr/bin/env python3
"""§268 · Money: the five cards, the purchases, the fiado book, the record and the place in the list.

It walks DESIGN-SPEC.md §3 Money at 393 px and at 1280 px and reads what the browser PAINTED — the
headings, the state words, the counts, the printed level rule, the cleared Spanish line — rather
than what the source says. Each leg reports itself GREEN or RED and the run ends RED if any did.

WHAT IT PROVES, against the specs that own each claim:

  1 THE COLUMN     five cards in the order §3 names, one column at 393 and two inside the 1200 px
                   container at 1280, and every press clearing the 44 px touch floor.
  2 THE BANK       `useBankCapability` decides the card: with copper unreachable it draws ONE
                   posture — the shop's own account of record, the sentence saying what the read
                   adds to it, `Manage the connection`, and the seven banks Rocoto reads named in
                   ONE line, BCP among them — and `Money in` is labelled by source and dated either
                   way (WIRING-SPEC.md §8, DESIGN-SPEC.md §3 card 1, the QA pass items 19 and 43).
  3 THE PURCHASES  one row per purchase; the state word is one of the five, in INK rather than in
                   colour; an amount rides a row only where the fixtures declare one; pay-later's
                   own seat is a declared placeholder, `data-placeholder="pay-later"`, saying in
                   WORDS what lands in it rather than in skeleton bars, with
                   `Offered` and `Used` drawn nowhere while the lender name is empty; and `Pay`
                   hands the amount as a `Figure` with `Copy the amount` and that supplier's
                   account (DESIGN-SPEC.md §3 card 2).
  4 WHO OWES YOU   ONE BOOK (the QA pass, item 7): the money seed's six rows open it, each with
                   its amount and the word saying the shop has still to answer for it, and a
                   confirmation replaces the row and turns the heading from `Who may owe you` to
                   `Who owes you`; a row opens `#/customers/<id>`; the reminder is in SPANISH,
                   greets her by her name and carries NO FEE; and `Make the page` ends on the page
                   it made, whose address opens `#/pay/<id>` (§3 card 3, WIRING-SPEC.md §9).
  5 THE RECORD     one level word from the closed set of three over three counted indicators, each
                   printing its count, its denominator, its window and its newest reason, the floor
                   riding the indicator that sits under it;
                   the LEVEL RULE printed on the screen; points and weights absent (§3 card 4).
  6 THE PLACE      the cleared line in the ONE language this build reads, `In line since
                   3 September`, `Suppliers on Rocoto · 4 of 9 invited · 2 connected` over the four
                   rows those counts are about, and NO position number and NO queue length anywhere
                   on the surface (§3 card 5, the QA pass items 2 and 22).

FAIL CLOSED (drives/README). Every leg asserts it FOUND its surface before it measures it, asserts a
clean console, and asserts the page never scrolls sideways.

RUN, against a built bundle:
  ROCOTO_DIST=app/dist-export-review .venv/bin/python drives/drive-268-bodega-money.py
or against a dev server:
  ROCOTO_URL=http://127.0.0.1:8094/bodega-pay-later.html .venv/bin/python drives/drive-268-bodega-money.py
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
OUT = pathlib.Path(os.environ.get("ROCOTO_SHOTS", "/tmp/rocoto-268-bodega-money"))
OUT.mkdir(parents=True, exist_ok=True)
WIDTHS = [(393, 852), (1280, 800)]
OK: list[str] = []
BAD: list[str] = []

# ONE LANGUAGE ON ONE SCREEN (the QA pass, item 2). This is the English review build, so the
# cleared line prints the English it was written from; the Spanish stands byte-exact in
# `regulatory.ts` and in the fixture for the Spanish build, and the two never share a screen.
QUEUE_LINE = ("Businesses already using Rocoto go first, "
              "and every business you bring moves you up.")
QUEUE_LINE_ES = ("Los negocios que ya usan Rocoto entran primero, "
                 "y cada negocio que traes te adelanta en la lista.")

# The five words a purchase row may print, and nothing else (DESIGN-SPEC.md §3 card 2).
FIVE_WORDS = re.compile(r"^(Offered|Used|Due \d{1,2} [A-Z][a-z]{2}|Settled \d{1,2} [A-Z][a-z]{2}"
                        r"|Late · \d+ days?)$")

# The three level words, and no other register shares them.
LEVELS = {"Starting", "Steady", "Punctual"}

# Pay-later's seat, in the words `paylater.ts` gives it (DESIGN-SPEC.md §3 card 2).
PAY_LATER_LABEL = "Pay later"
PAY_LATER_LINE = "Thirty days on a purchase lands here, one record per purchase, once a lender signs."

# The floor rides the indicator that sits UNDER it, in record.ts's own words; a measured indicator
# prints its count, its denominator and its window, and leaves the floor to the rows that need it.
FLOOR_WORDS = re.compile(r"Counts from \d+ (payments|days|sales)")


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


async def boot(browser, origin, width, height, route):
    context = await browser.new_context(viewport={"width": width, "height": height},
                                        device_scale_factor=2, is_mobile=width < 560,
                                        has_touch=width < 560)
    page = await context.new_page()
    page.set_default_timeout(15000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    # The clipboard is recorded rather than written: a drive touches no system pasteboard, and what
    # it reads back is the exact string the screen handed over.
    await page.add_init_script("""
      window.__copied = [];
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: (text) => { window.__copied.push(String(text)); return Promise.resolve(); } },
        });
      } catch (error) { /* a browser that refuses the redefinition still paints */ }
    """)
    await page.goto(origin + route, wait_until="networkidle")
    await page.wait_for_timeout(800)
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


async def sideways(page):
    """Nothing scrolls sideways at any width (viewport.ts's own law)."""
    return await page.evaluate(
        "() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")


async def close_cover(page):
    """Money's cover opens once on its first open. The drive reads the cards under it."""
    close = page.locator('[data-testid="workflow-close"]')
    if await close.count() and await close.first.is_visible():
        await close.first.click()
        await page.wait_for_timeout(400)


# ── 1 · THE COLUMN ─────────────────────────────────────────────────────────────────────────────

async def column(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/money")
    try:
        await close_cover(page)
        check(await page.locator('[data-testid="area-money"]').count() == 1,
              f"{width} · Money opens on its own column")
        # THE AREA IS NAMED ONCE (item 53): the frame draws `Money` centred in the header, so the
        # column carries no H1 repeating it in a third wording.
        check(await page.locator('[data-testid="area-money"] h1').count() == 0,
              f"{width} · and leaves its own name to the header, said once")
        order = []
        for card, heading in (("money-bank-card", "Bank account"),
                              ("money-suppliers-card", "What you owe suppliers"),
                              ("money-owed-card", None),
                              ("money-record-card", "Record"),
                              ("money-place-card", "Place in the list"),
                              ("money-links-card", "Payment links")):
            found = await page.locator(f'[data-testid="{card}"]').count() == 1
            order.append(found)
            if heading and found:
                check(await text_of(page, f'[data-testid="{card}"] h2') == heading,
                      f"{width} · {card} names itself `{heading}`")
        check(all(order), f"{width} · the six cards stand, in §3's order")
        # THE BOARD IS A TWO-COLUMN FLOW AT THE DESK (item 20), so a card packs under the one
        # above it and neither column ends in a rectangle of white.
        columns = await page.evaluate(
            "() => Number(getComputedStyle(document.querySelector('[data-testid=%smoney-overview%s]'))"
            ".columnCount)" % (chr(34), chr(34)))
        check(columns == (1 if width < 900 else 2),
              f"{width} · one column on the phone and two at the desk · {columns}")
        check(await tall(page, '[data-testid="money-overview"] button'),
              f"{width} · every press on the column clears 44 px")
        check(await sideways(page), f"{width} · the column never scrolls sideways")
        await shot(page, "money", width)
        check(not errors, f"{width} · the column paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 2 · THE BANK ACCOUNT ───────────────────────────────────────────────────────────────────────

async def bank(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/money")
    try:
        await close_cover(page)
        card = '[data-testid="money-bank-card"]'
        posture = await page.locator(card).first.get_attribute("data-bank-posture")
        check(posture in {"checking", "unavailable", "setup", "ready"},
              f"{width} · the card reads one polled posture · {posture}")
        if posture == "ready":
            check(await page.locator('[data-testid="money-bank-balance"]').count() == 1,
                  f"{width} · a connected account states its balance")
        else:
            check(await page.locator('[data-testid="money-bank-on-file"]').count() == 1,
                  f"{width} · the account of record is the one posture")
            check(await page.locator(f'{card} img[data-artwork="money"]').count() == 1,
                  f"{width} · the wallet object marks the read yet to open")
            account = await text_of(page, '[data-testid="money-bank-account"]')
            check(account.startswith("BCP · "),
                  f"{width} · and the account named is the shop's own · {account[:60]}")
            check(await text_of(page, '[data-testid="money-bank-manage"]') == "Manage the connection",
                  f"{width} · so its one act is `Manage the connection`")
            body = await text_of(page, card)
            check("Add your bank account" not in body,
                  f"{width} · and the card asks for no account it already holds")
            gap = await text_of(page, '[data-testid="money-bank-reach"]')
            check(gap == ("Rocoto reads BCP, BBVA, Interbank, Scotiabank, BanBif, "
                          "Banco Pichincha and Mibanco."),
                  f"{width} · the banks Rocoto reads are named in one line, BCP first · {gap[:80]}")
        rows = await page.locator(f'{card} [data-testid^="money-in-"]').all_inner_texts()
        check(len(rows) >= 2, f"{width} · `Money in` is labelled by source · {len(rows)} sources")
        check(all("S/" in row for row in rows), f"{width} · and each source carries its own figure")
        window = await text_of(page, card)
        check("Sample money ·" in window, f"{width} · and the seed says which window it covers")
        check(await page.locator('[data-testid="money-bank-open"]').count() == 1,
              f"{width} · both directions open at #/money/bank")
        await page.goto(origin + "#/money/bank", wait_until="networkidle")
        await page.wait_for_timeout(700)
        check(await page.locator('[data-testid="money-bank-page"]').count() == 1,
              f"{width} · #/money/bank draws money in and money out")
        page_text = await text_of(page, '[data-testid="money-bank-page"]')
        check("Money in" in page_text and "Money out" in page_text,
              f"{width} · both directions are named on it")
        await shot(page, "bank", width)
        check(await sideways(page), f"{width} · the bank page never scrolls sideways")
        check(not errors, f"{width} · the bank leg paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 3 · WHAT YOU OWE YOUR SUPPLIERS ────────────────────────────────────────────────────────────

async def purchases(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/money/suppliers")
    try:
        check(await page.locator('[data-testid="money-suppliers-page"]').count() == 1,
              f"{width} · the full list stands at #/money/suppliers")
        summary = await text_of(page, '[data-testid="money-suppliers-summary"]')
        check(summary == "4 purchases to pay · 1 late",
              f"{width} · the card prints its own rows over its own window · {summary}")
        states = await page.locator('[data-testid^="purchase-state-"]').all_inner_texts()
        check(len(states) >= 5, f"{width} · one row per purchase · {len(states)} rows")
        stray = [word for word in states if not FIVE_WORDS.match(word.strip())]
        check(not stray, f"{width} · every state word is one of the five · {stray[:2]}")
        check(any(word.startswith("Late · ") for word in states), f"{width} · a late purchase says so")
        check(any(word.startswith("Settled ") for word in states),
              f"{width} · a settled purchase carries the day it settled")
        check(all(word not in {"Offered", "Used"} for word in states),
              f"{width} · `Offered` and `Used` wait for a signed lender")
        # The state words are INK, never a traffic light: this product has no red and no green.
        inks = await page.locator('[data-testid^="purchase-state-"]').evaluate_all(
            "nodes => nodes.map(node => getComputedStyle(node).color)")
        check(len(set(inks)) == 1, f"{width} · every state word takes one ink · {sorted(set(inks))[:2]}")
        # Pay-later's seat is a DECLARED placeholder rather than a region somebody forgot.
        seat = page.locator('[data-placeholder="pay-later"]')
        check(await seat.count() == 1, f"{width} · pay-later's seat is declared")
        check(await seat.first.get_attribute("data-pay-later-visible") == "no",
              f"{width} · and it states that the lender is outstanding")
        # And it stands there in WORDS: a grey skeleton means loading, so the seat says what will
        # land in it instead of drawing bars that read as a card stuck mid-read.
        seat_words = " ".join((await seat.first.inner_text()).split())
        check(PAY_LATER_LABEL in seat_words and PAY_LATER_LINE in seat_words,
              f"{width} · the seat says in words what lands there · {seat_words[:72]}")
        check(await seat.locator('[data-baseweb^="ghost-"]').count() == 0,
              f"{width} · and it draws its region in words rather than in skeleton bars")
        # `Pay` hands the amount as a Figure, with `Copy the amount` and that supplier's account.
        await page.locator('[data-testid^="purchase-pay-"]').first.dispatch_event("click")
        await page.wait_for_timeout(600)
        check(await page.locator('[data-testid="pay-dialog"]').count() == 1, f"{width} · `Pay` opens its dialog")
        figure = page.locator('[data-testid="pay-amount"] [data-baseweb="figure"]')
        check(await figure.count() == 1, f"{width} · the amount is handed over as a Figure")
        one_line = await page.locator('[data-testid="pay-amount"]').evaluate(
            "node => { const box = node.getBoundingClientRect();"
            " const figure = node.querySelector('[data-baseweb=%sfigure%s]');"
            " return box.height < 80 && !!figure && getComputedStyle(figure).whiteSpace === 'nowrap'; }"
            % (chr(34), chr(34)))
        check(one_line, f"{width} · the unit keeps the number's own line")
        dialog = await text_of(page, '[data-testid="pay-dialog"]')
        check("Their account" in dialog and "Yape · +51" in dialog,
              f"{width} · that supplier's account stands beside it")
        await page.locator('[data-testid="pay-copy"]').dispatch_event("click")
        await page.wait_for_timeout(400)
        copied = await page.evaluate("() => window.__copied")
        check(len(copied) == 1 and re.fullmatch(r"\d+\.\d{2}", copied[0]),
              f"{width} · `Copy the amount` hands over the amount · {copied}")
        await shot(page, "pay-dialog", width)
        await page.locator('[data-testid="pay-confirm"]').dispatch_event("click")
        await page.wait_for_timeout(600)
        settled = await page.locator('[data-testid^="purchase-state-"]').all_inner_texts()
        check(sum(1 for word in settled if word.startswith("Settled ")) >= 2,
              f"{width} · her dated `I paid it` settles the row")
        check(await sideways(page), f"{width} · the purchases never scroll sideways")
        check(not errors, f"{width} · the purchases paint with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 4 · WHO OWES YOU ───────────────────────────────────────────────────────────────────────────

async def owed(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/money")
    try:
        await close_cover(page)
        card = '[data-testid="money-owed-card"]'
        check(await page.locator(card).first.get_attribute("data-confirmed") == "no",
              f"{width} · a fresh book holds no confirmation yet")
        check(await text_of(page, '[data-testid="money-owed-heading"]') == "Who may owe you",
              f"{width} · so the card holds `Who may owe you`")
        # ONE BOOK, SEEDED, EVERY ROW CARRYING ITS AMOUNT AND ITS STANDING (item 7). The card used
        # to read the confirmations alone and paint names with no figures, while Customers two taps
        # away printed the same six people with exact amounts off the same fixture.
        rows = page.locator(f'{card} a[data-testid^="money-owed-row-"]')
        seeded = await rows.all_inner_texts()
        check(len(seeded) >= 5, f"{width} · the book opens on the seed's own rows · {len(seeded)} rows")
        check(all("S/" in row for row in seeded),
              f"{width} · and every row states the amount the chats give it")
        check(all("Likely, from your messages" in row for row in seeded),
              f"{width} · each one saying the shop has still to answer for it")
        total = await text_of(page, '[data-testid="money-owed-total"]')
        check("S/" in total, f"{width} · and the card totals the book beside its heading · {total}")
        check(await text_of(page, '[data-testid="money-owed-open-all"]') == "Open the fiado book",
              f"{width} · the door names what it opens")
        check(await text_of(page, '[data-testid="money-owed-payment-link"]') == "Send a payment link",
              f"{width} · and a payment link opens on any amount")

        # THE PRESS ENDS ON SOMETHING (item 8): the page it made, its address, and the acts on it.
        await page.locator('[data-testid="money-owed-payment-link"]').dispatch_event("click")
        await page.wait_for_timeout(600)
        composer = await text_of(page, '[data-testid="payment-link-composer"]')
        check("What this is for" in composer, f"{width} · the composer asks what the page is for")
        check(await page.locator('[data-testid="payment-link-what-for"]').count() == 1,
              f"{width} · and gives that description its own field")
        await page.locator('[data-testid="payment-link-customer"]').fill("Rosa menú")
        await page.locator('[data-testid="payment-link-amount"]').fill("48.00")
        await page.locator('[data-testid="payment-link-what-for"]').fill("Fiado of 2 September")
        await page.wait_for_timeout(200)
        await page.locator('[data-testid="payment-link-make"]').dispatch_event("click")
        await page.wait_for_timeout(900)
        made = page.locator('[data-testid="payment-link-made"]')
        check(await made.count() == 1, f"{width} · `Make the page` ends on the page it made")
        address = await text_of(page, '[data-testid="payment-link-address"]')
        check("#/pay/" in address, f"{width} · which carries its own address · {address[-40:]}")
        check(await page.locator('[data-testid="payment-link-copy-made"]').count() == 1,
              f"{width} · with `Copy the link`")
        check(await page.locator('[data-testid="payment-link-whatsapp"]').count() == 1,
              f"{width} · and `Send it on WhatsApp`")
        await shot(page, "payment-link", width)
        await page.locator('[data-testid="payment-link-done"]').dispatch_event("click")
        await page.wait_for_timeout(400)

        # AND THE ADDRESS PAINTS THE CUSTOMER'S PAGE, not the shop's Money (item 8).
        await page.goto(origin + address[address.index("#/"):], wait_until="networkidle")
        await page.wait_for_timeout(700)
        check(await page.locator('[data-testid="payment-page"]').count() == 1,
              f"{width} · the link opens the customer's own payment page")
        check(await text_of(page, '[data-testid="payment-page-shop"]') == "Bodega Yesenia",
              f"{width} · which names the shop")
        check("S/" in await text_of(page, '[data-testid="payment-page-amount"]'),
              f"{width} · states the exact amount")
        check(await text_of(page, '[data-testid="payment-page-pay-now"]') == "Pay now",
              f"{width} · and offers `Pay now`")
        check(await text_of(page, '[data-testid="payment-page-pay-later"]') == "Pay later",
              f"{width} · beside `Pay later`")
        buyer = await text_of(page, '[data-testid="payment-page"]')
        check(not re.search(r"\brate\b|\bterm\b|\binstal?lment\b|\bTCEA\b|\bapproved\b", buyer, re.I),
              f"{width} · saying nothing about a rate, a term or an instalment")
        check(await page.locator('[data-testid="area-money"]').count() == 0,
              f"{width} · and carrying none of the shop's own Money")
        await shot(page, "payment-page", width)
        check(await sideways(page), f"{width} · the payment page never scrolls sideways")
        await page.goto(origin + "#/money", wait_until="networkidle")
        await page.wait_for_timeout(700)
        await close_cover(page)
        links = await page.locator('[data-testid^="money-link-row-"]').count()
        check(links >= 1, f"{width} · and the page it made stands on Money's `Payment links` · {links}")

        # One confirmation, and the heading and the source both change.
        await page.goto(origin + "#/money/owed", wait_until="networkidle")
        await page.wait_for_timeout(700)
        check(await page.locator('[data-testid="money-owed-page"]').count() == 1,
              f"{width} · #/money/owed holds the whole list")
        first = page.locator('[data-testid^="likely-confirm-"]').first
        check(await first.count() == 1, f"{width} · a row the shop has still to answer for offers one act")
        # THE FIELD OPENS ON THE FIGURE THE BOOK HOLDS, so the press books an amount she can read
        # rather than a silent fallback (items 10, 18 and 27).
        typed = await page.locator('[data-testid^="likely-amount-"]').first.input_value()
        check(bool(typed) and typed.replace(".", "").isdigit(),
              f"{width} · with the seeded figure already in its field · {typed}")
        await first.dispatch_event("click")
        await page.wait_for_timeout(600)
        rows = await page.locator('[data-testid^="fiado-card-"]').count()
        check(rows == 1, f"{width} · the confirmation is what the fiado book records · {rows}")
        await page.goto(origin + "#/money", wait_until="networkidle")
        await page.wait_for_timeout(700)
        await close_cover(page)
        check(await text_of(page, '[data-testid="money-owed-heading"]') == "Who owes you",
              f"{width} · and from the first confirmation the card reads `Who owes you`")
        opens = await page.locator(f'{card} a[data-testid^="money-owed-row-"]').first.get_attribute("href")
        check(bool(opens) and opens.startswith("#/customers/"),
              f"{width} · a confirmed row opens that customer's sheet · {opens}")

        # `Chase now` states the sale, the amount and the date — and carries no fee.
        await page.locator('[data-testid="money-owed-chase"]').dispatch_event("click")
        await page.wait_for_timeout(600)
        message = await page.locator('[data-testid="chase-message"]').input_value()
        # IT GOES TO A NEIGHBOUR IN LIMA (item 39): Spanish, and her name rather than the shop's tag.
        check(message.startswith("Hola ") and "sigue pendiente" in message,
              f"{width} · the reminder states the sale, in Spanish · {message[:60]}")
        check(re.match(r"^Hola [^ ,]+,", message) is not None,
              f"{width} · greeting her by her name alone · {message[:24]}")
        check("S/" in message, f"{width} · and the amount")
        check(re.search(r"del \d{1,2} de [a-z]+", message) is not None, f"{width} · and the date")
        check(not re.search(r"fee|recargo|mora|interest", message, re.I),
              f"{width} · and it carries no fee, which is Cedar's rung dropped")
        await shot(page, "chase", width)
        check(await sideways(page), f"{width} · the owed surfaces never scroll sideways")
        check(not errors, f"{width} · the owed leg paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 5 · YOUR RECORD ────────────────────────────────────────────────────────────────────────────

async def record(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/money/record")
    try:
        check(await page.locator('[data-testid="record-block"]').count() == 1,
              f"{width} · the record holds its own block on #/money/record")
        level = await text_of(page, '[data-testid="record-level"]')
        check(level in LEVELS, f"{width} · one word from the closed set of three · {level}")
        reason = await text_of(page, '[data-testid="record-reason"]')
        check(bool(reason), f"{width} · and that word resolves to a reason line · {reason[:60]}")
        for indicator in ("paid-on-the-day", "days-with-a-sale", "sales-with-the-payment-recorded"):
            block = f'[data-testid="record-indicator-{indicator}"]'
            found = await page.locator(block).count() == 1
            check(found, f"{width} · {indicator} prints its own line")
            if not found:
                continue
            body = await text_of(page, block)
            check(re.search(r"\d+ of \d+ |Unknown · Counts from \d+", body) is not None,
                  f"{width} · {indicator} states its count and its denominator")
            check(re.search(r"Last \d+ days to \d{1,2} [A-Z][a-z]{2}", body) is not None,
                  f"{width} · {indicator} states its window and its date")
            measured = await page.locator(block).get_attribute("data-measured")
            if measured == "no":
                check(FLOOR_WORDS.search(body) is not None,
                      f"{width} · {indicator} sits under its floor and says what it counts from")
            else:
                check(re.search(r"(?i)counts from", body) is None,
                      f"{width} · {indicator} is measured, so its lines carry counts and a window alone")
            check(await page.locator(f'{block} [data-testid="record-newest-{indicator}"]').count() == 1,
                  f"{width} · {indicator} carries its newest reason")
        check(await page.locator('[data-testid="record-grade-paid-on-the-day"]').count() == 1,
              f"{width} · the payment row prints what the bank graded")
        rule = await text_of(page, '[data-testid="record-rule"]')
        for line in ("Starting · while an indicator sits under its floor",
                     "Steady · every indicator at 80 / 60 / 70 per cent or better",
                     "Punctual · every supplier payment in the 90 days paid on or before the day"):
            check(line in rule, f"{width} · the level rule is printed on the screen · {line[:32]}…")
        surface = await text_of(page, '[data-testid="money-record-page"]')
        check(not re.search(r"\bpoints?\b|\bweighted\b|\bscore\b", surface, re.I),
              f"{width} · points and weights are absent — a shop can recount every figure")
        # THE REASONS STAND ONCE (item 21). The trail repeated all three and then the level
        # sentence a third time, under a chip labelled `Memory` — an internal log's own name.
        check(await page.locator('[data-testid="record-trail"]').count() == 0,
              f"{width} · every reason is printed once, on the row it belongs to")
        check("Memory" not in surface, f"{width} · and the `Memory` chip is off the shop's screen")
        check(re.search(r"\d+%", surface) is None,
              f"{width} · a per-row percentage stands nowhere · VOICE §3")
        check(await text_of(page, '[data-testid="record-save"]') == "Save as a document",
              f"{width} · and the record's own act is `Save as a document`")
        await shot(page, "record", width)
        check(await sideways(page), f"{width} · the record never scrolls sideways")
        check(not errors, f"{width} · the record paints with a clean console · {errors[:1]}")
    finally:
        await context.close()


# ── 6 · YOUR PLACE IN THE LIST ─────────────────────────────────────────────────────────────────

async def place(browser, origin, width, height):
    context, page, errors = await boot(browser, origin, width, height, "#/money/record")
    try:
        check(await page.locator('[data-testid="place-block"]').count() == 1,
              f"{width} · the place in the list holds its own block")
        line = await text_of(page, '[data-testid="place-queue-line"]')
        check(line == QUEUE_LINE, f"{width} · the cleared line ships in this build's one language · {line[:48]}")
        page_text = await text_of(page, '[data-testid="money-record-page"]')
        check(QUEUE_LINE_ES not in page_text,
              f"{width} · and the two languages never share a screen")
        check(await text_of(page, '[data-testid="place-since"]') == "In line since 3 September",
              f"{width} · her dated fact stands with it")
        suppliers = await text_of(page, '[data-testid="place-suppliers"]')
        check(suppliers == "Suppliers on Rocoto · 4 of 9 invited · 2 connected",
              f"{width} · and the supplier count she can recount · {suppliers}")
        surface = await text_of(page, '[data-testid="money-record-page"]')
        check("Your place moves when a supplier you brought joins." in surface,
              f"{width} · what moves her place is said as what is")
        check(not re.search(r"\bposition\b|\b(?:number|place) \d+\b|\b\d+(?:st|nd|rd|th) in line\b",
                            surface, re.I),
              f"{width} · no position number and no queue length stand anywhere on it")
        check(await page.locator('[data-testid="brought-block"]').count() == 1,
              f"{width} · `Suppliers you brought` stands under the referral cover")
        # THE ROWS AND THE COUNTS ARE ONE LIST (item 22): four invitations, two of them connected.
        brought = await page.locator('[data-testid^="brought-row-"]').count()
        check(brought == 4, f"{width} · and paints the four rows its counts are about · {brought}")
        await page.goto(origin + "#/money", wait_until="networkidle")
        await page.wait_for_timeout(700)
        await close_cover(page)
        cards = await page.locator('[data-testid="money-overview"] > *').count()
        check(cards == 6, f"{width} · the column is six cards, and the export is card 5's own door · {cards}")
        check(await page.locator('[data-testid="money-export-door"]').count() == 1,
              f"{width} · `Sales export` opens from the place card")
        await page.goto(origin + "#/money/export", wait_until="networkidle")
        await page.wait_for_timeout(700)
        # `Sales export` IS A DOOR RATHER THAN A PAGE (`areas/money.tsx`): it opens the house's own
        # task frame over the five cards, so the surface is the frame's `money-export` and the
        # sentence its `sunat-notice`, rather than a `money-export-page` column with a `‹ Money`
        # link behind a dialog.
        export_text = await text_of(page, '[data-testid="money-export"]')
        check("By transaction" in export_text and "By customer" in export_text,
              f"{width} · the export runs by transaction and by customer")
        check(await page.locator('[data-testid="sunat-notice"]').count() == 1,
              f"{width} · under the true SUNAT sentence")
        await page.goto(origin + "#/money/record", wait_until="networkidle")
        await page.wait_for_timeout(700)
        check(await text_of(page, '[data-testid="brought-invite-more"]') == "Invite more suppliers",
              f"{width} · and its act is `Invite more suppliers`")
        # The credit law: no soles figure, rate, term, date or approval word in the credit blocks.
        credit = await text_of(page, '[data-testid="place-block"]')
        check(not re.search(r"S/\s?\d|\brate\b|\bTCEA\b|\bpre-?approved\b|\bpre-?aprobado\b",
                            credit, re.I),
              f"{width} · the credit block states no figure, rate or approval while the lender is unnamed")
        await shot(page, "place", width)
        check(await sideways(page), f"{width} · the place block never scrolls sideways")
        check(not errors, f"{width} · the place block paints with a clean console · {errors[:1]}")
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
                except Exception as error:  # a leg that throws reports itself RED; the rest still measure
                    check(False, f"{name} completed · {str(error).splitlines()[0][:160]}")

            for width, height in WIDTHS:
                await leg(f"{width} column", column, browser, origin, width, height)
                await leg(f"{width} bank", bank, browser, origin, width, height)
                await leg(f"{width} purchases", purchases, browser, origin, width, height)
                await leg(f"{width} owed", owed, browser, origin, width, height)
                await leg(f"{width} record", record, browser, origin, width, height)
                await leg(f"{width} place", place, browser, origin, width, height)
            await browser.close()
    finally:
        if server:
            server.shutdown()
    print(f"TOTAL {len(OK)} GREEN / {len(BAD)} RED · shots in {OUT}")
    if BAD:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
