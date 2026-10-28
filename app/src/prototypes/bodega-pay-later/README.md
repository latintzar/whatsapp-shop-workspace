# bodega pay later

Rocoto for one Peruvian shop — a bodega, a produce stall or a fish stall — the candidate Peter named
«bodega pay later» in `docs/FEED-IA.md` §268. It is Cedar's layout and areas for one shop: **Prep**
replaces Sales and is HOME, Money opens on the bank account, then Products and Customers. What this
prototype adds is the WhatsApp connection, the read of the shop's own chat history, the referral step,
Rocoto on WhatsApp as the buddy that orients the shop afterwards, its place in the credit waiting list,
a qualitative record of how it pays, and pay-later as one record per purchase. The pay-later purchase
surface itself is a placeholder, because no lender is signed.

**Entry file:** `main.tsx`, mounted by `app/bodega-pay-later.html`.

**Run it:** `make dev UI_PORT=8094`, then open
`http://127.0.0.1:8094/bodega-pay-later.html`. That target runs the app beside the checkout's own
`mock-api`, which is the process that serves `/api/proof/*`. Local wiring takes two conditions
([WIRING-SPEC.md](WIRING-SPEC.md) §12): `CEDAR_WHATSAPP_BRIDGE_ENABLED=true`, and
`http://127.0.0.1:8094` in copper's `CEDAR_ALLOWED_ORIGINS`. `make dev-ui` is the fixtures-only path
— the app alone, where the page reads `Sample chats`.

## The documents

- [ASSISTANCE-PILOT-SPEC.md](ASSISTANCE-PILOT-SPEC.md) — the supervised one-week operator case,
  merchant consent, literal evidence and its local review and retention boundary.
- [MOBILE-SPEC.md](MOBILE-SPEC.md) — bundled Android tester, local draft persistence and the existing public waitlist. [Build and signing](../../../android/README.md) and Play commissioning (historical reference outside this export) retain their own release evidence.
- [CONNECTION-EXPERIMENT.md](CONNECTION-EXPERIMENT.md) — real Meta setup and live lifecycle diagnostics inside WhatsApp Business.

- [DESIGN-SPEC.md](DESIGN-SPEC.md) — the master. What it is, the shop's journey, the rig, each area at
  393 px and at the desk, the pictures, the strings with their legal status, the files to build, the
  check that proves each claim, and the open questions.
- [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) — the critical path and the orientation after it, screen by
  screen.
- [WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md) — how the chat history becomes the book.
- [WIRING-SPEC.md](WIRING-SPEC.md) — end to end: what runs, on whose permission, and what it survives.
- [MESSAGES.md](MESSAGES.md) — every message, the template set for Meta, and the buddy's thread as
  `#/chat` replays it for design review, beside `messages/templates.json` and
  `messages/chat-script.json`.
- [fixtures/README.md](fixtures/README.md) — the bodega world, beside `fixtures/cast-bodega.json`.

## What is real, and what is seeded

1. **Real:** the WhatsApp connection and the read of the history, through the same-origin bridge
   `/api/proof/*` to Cedar's connection service; Peter connects his own number.
2. **Real:** the messages Rocoto's own number sends to the connected number, the `wa.me` hand-off that
   carries an invitation, the bank read where an account is connected, the payment page and its
   matching, the export files, and the record's arithmetic.
3. **Seeded:** the shop, its eighteen customers, its nine suppliers, the day's orders, the payables,
   the fiado book and the 90 days of money — replaced per account by a live read's own names and
   threads.
4. **Fixture:** only the fallback where the bridge answers 503, which is local development; the UI
   names it `Sample chats` then.
5. **Absent:** a price in the chat corpus or in anything read from it — the money seed holds each
   amount as a minor-unit integer instead — every credit figure while the lender name is empty, and
   every fiscal document: a sale is a sale, under a generic name.

Storage keys are namespaced `rocoto-bodega-*`, so Cedar's own demo state stays its own. **This is a
design prototype, rather than a release:** nothing here is deployed to production.

## The rig — what Peter does, in order

On `demo.soyrocoto.com/bodega-pay-later/`, with his own phone. Each step is a real call.
**The sign-up is ten screens on a phone** ([ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §0, which
overrides the six-screen walk below it): `Get started` → the WhatsApp connection → `You’re on the
waitlist!` → the business and its name → its address on a map → the orders in the app → the Yape →
the businesses that owed it → `Move up the list` → `You’re in`.

1. **Open the page** at `demo.soyrocoto.com/bodega-pay-later/`. It lands on `Get started`, which names
   the three things that ship today — `Connect WhatsApp Business`, `Send your Yape link in the chat`,
   `Move up the waitlist` — and holds the rig's one `Reset state`. Its one act is `Connect WhatsApp`.
2. **Connect WhatsApp through Meta's own walk.** `Continue` opens Embedded Signup: a message arrives
   from Facebook, it carries a link, and the code is shown inside the flow itself. This is Meta's
   screen sequence, run by Meta, and the page waits on its answer. **The page asks for no number**:
   Meta's flow offers no field that carries one in, so Peter types his number on Meta's own screen
   (Meta's documentation, read 19 September 2026).
3. **The connection is the sign-in.** The moment Meta reports the account, the page posts
   `POST /api/bodega/session/connection`, the server reads the connection state of this browser's own
   session, and the page holds a `__Host-bodega_session` cookie bound to that number.
4. **The celebration.** `You’re on the waitlist!` — the place the service minted for his number,
   counting up, confetti from both lower corners, and `Confirm details` under it.
5. **The business.** Three choices with a picture each; the pick draws its tick and the screen goes on
   by itself to the name, which arrives prefilled from the WhatsApp Business profile where it reports
   one.
6. **The address.** Google Places as he types, through the runtime's own key; the pick opens the map
   full screen with the card at the top, the pin in the middle and the ground moving under it.
7. **The orders, and the Yape.** A handset holding this shop's own delivery note writing itself in;
   then Yape's own purple, the number and the QR, with `Skip for now` beside it.
8. **Who owed him, and the link.** The read's likely list as pickable rows, `Share with them` handing
   ONE `wa.me` message to his own WhatsApp with the invitation and his own code in it — he presses
   send there. Then `Move up the list`, the place as the hero, and `Share my link`.
9. **`You’re in`.** The membership card with the name, the place and the reference, and
   `Say hi to Rocoto on WhatsApp`, which opens the chat with the greeting and that reference — the
   message that opens the 24-hour window the buddy answers inside.
10. **The closing message.** Rocoto's number attempts the last message of the walk to the session's own
   number, read from the connection rather than typed anywhere. Meta delivers a free-form message
   inside an open 24-hour window, so `You’re in` prints `Rocoto is on WhatsApp at +1 978 958 9459.`
   and offers `Say hi to Rocoto on WhatsApp`, a `wa.me` link that opens the window with the
   business's own reference in it. The path to delivery with no act from the shop is an approved
   utility template through `send_template` ([MESSAGES.md](MESSAGES.md) §5).
11. **`Reset state`** on the first screen: it asks the bridge to disconnect, clears the rig's own
   session and referral records, sweeps every `rocoto-bodega-*` key, says how many it removed, and
   stays on `Get started`. He can then walk it again from step 1.

### The gate on the desk

The desk and Administration stand behind a session, and **the WhatsApp connection is the evidence that
opens them** (`start/session.ts`, [WIRING-SPEC.md](WIRING-SPEC.md) §1 and §4). The connection service
binds its state to the browser's own session — `proof/service.py`'s `get_state` reads the browser's
`__Host-cedar_session` and asks `accounts.py` for that session's store, which is bound only after Meta
verified the account — so a connection this browser can see is proof that this browser authorised it.
The gate takes that connection, or `GET /api/bodega/session` for the cookie minted from it, and the
sample source passes on its own connected sample account, so local development walks the whole app with
the service still to answer.

**Two limits, stated plainly.** The connection service's bound session lasts 8 hours
(`accounts.py` `BOUND_TTL`) while the bodega cookie lasts 30 days (`bodega.py` `SESSION_TTL`), so the
two clocks differ. And one origin serves `/cedar/` and `/bodega-pay-later/`, so both surfaces share the
one connection-service cookie: a browser that connected through Cedar's page is signed in here, and the
reverse.

### The two keys the demo runtime needs

| Name | What it buys | Where its absence shows |
| --- | --- | --- |
| `WA_CLOUD_TOKEN` + `WA_CLOUD_PHONE_ID` | Rocoto's own number, sending the closing message as free-form text inside an open 24-hour window | `mock-api/app/bodega.py` answers a named 503, and the screen that waits on that send — the done screen, which hands the shop to the buddy — says what comes next: «Rocoto writes to you on WhatsApp as soon as its number is live; your shop is ready here.» |
| `ANTHROPIC_API_KEY` **or** `GEMINI_API_KEY` | the order brain behind `POST /api/cedar/orders/parse`, which turns a chat message into lines | the parse answers its own awaiting state and the order keeps the words it arrived with |

Both live in `.env.example` and belong in the demo runtime's own environment file
(`/srv/rocoto/demo.env`, [WIRING-SPEC.md](WIRING-SPEC.md) §12). The rig also takes
`CEDAR_WHATSAPP_BRIDGE_ENABLED=true` and the page's origin in `CEDAR_ALLOWED_ORIGINS`.

### Run it, and check it

```
make dev UI_PORT=8094                      # the app beside the checkout's own mock-api
cd app && npx tsc --noEmit -p tsconfig.app.json
make gates                                 # types · theme · copy · artwork · links · env · bundle budget
.venv/bin/python -m pytest -q mock-api     # the server module, bodega.py included
node app/tools/test-bodega-history.mjs     # and -export, -money, -prep-order, -referrals
ROCOTO_URL=http://127.0.0.1:8094/bodega-pay-later.html \
  .venv/bin/python drives/drive-268-bodega-onboarding.py
ROCOTO_URL=http://127.0.0.1:8094/bodega-pay-later.html \
  .venv/bin/python drives/drive-268-bodega-money.py
```

Each drive also runs against a built bundle with `ROCOTO_DIST=app/dist-export-review` in place of
`ROCOTO_URL`; both headers say so.

### What the build did differently from the specs

Three deviations, recorded where they happened rather than smoothed over:

1. **One server module, and the session is minted from the connection.** The session plumbing is a
   single `mock-api/app/bodega.py` rather than the `bodega_access.py` beside `cedar_access.py` that
   [WIRING-SPEC.md](WIRING-SPEC.md) §1 drew, and it carries two routes the spec left out:
   `POST /api/bodega/session/connection`, which reads the WhatsApp connection of this browser's own
   session and mints the cookie from it, and `GET /api/bodega/session`, which answers who this browser
   is signed in as from that cookie alone. The pair is what lets a second phone and a browser whose
   storage throws both reach the same answer, and it is the rig half of the gate above.
2. **The covers keep their own key.** `rocoto-bodega-covers-v1` holds which area covers this shop has
   met, so the book is one key rather than a flag per area (`covers.tsx`, `store/keys.ts`).
3. **The sample path is the local posture.** `make dev-ui`, and any run with the bridge answering 503,
   selects the seeded bodega world through the one source seam, and every screen that names a source
   says `Sample chats`.
