# The wiring, end to end

The plumbing behind every surface of this prototype: what each part does, which module it is, whose
permission it runs on, what runs live on `demo.soyrocoto.com/bodega-pay-later/` after merge, what
production still needs, and the failure each part survives. A reader who finishes it can wire the
build and say, for any screen, which call answers it and which switch turns it on. The surfaces
belong to siblings: [DESIGN-SPEC.md](DESIGN-SPEC.md) the areas and the record,
[ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) the screens, [WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md)
the read, [MESSAGES.md](MESSAGES.md) every message. Every Cedar path named below exists in this
checkout today.

**Laws that bind every line.** Fiscal documents are switched off: a sale is a `Sale` under a generic
name, and NubeFact, invoices and boletas appear nowhere. Working capital is pay-later per purchase at
30 days, so Cedar's revolving advance stays out of the bundle. Before a lender signs, a string
carries no soles figure, rate, term, date or approval promise. An email address is asked nowhere.

## The shape, five parts

| Part | What runs | Where |
|---|---|---|
| The page | `app/bodega-pay-later.html` → `main.tsx` (Styletron → `BaseProvider(RocotoTheme)` → glob router) | one origin, installable |
| Same-origin API | `mock-api/app/main.py`, host-only cookies, `credentials: same-origin`, uncached | the page's own origin |
| WhatsApp | `app/src/prototypes/cedar/connections/proof/service.py`, reached through the fixed-route bridge `mock-api/app/cedar_whatsapp.py`; Rocoto's own sends through a new `mock-api` module | loopback 8793 |
| Money | `copper/runtime/cedar_service.py`, Prometeo inside it | loopback 8795 |
| State | `rocoto-bodega-*` in the browser; each service's own store keyed to the shop's number | browser + service |

**The runtime base.** `__RUNTIME_BASE__` is always defined (`app/tools/build-constants.mjs`): the
loopback runtime under `make dev`, an empty string in a published build, which means same-origin.
`cedar/runtime-client.ts` is imported as it stands and reads it, with a `rocoto-runtime-base` pin behind it.
**That pin is shared with Cedar** — it is a developer's own choice of runtime under `make dev`, it sits
outside the `rocoto-bodega-*` prefix, and `Reset state` keeps it, the way `cedar/workspace-reset.ts` already
marks it `kept`.

## The rig — what runs live

Nine facts about the published prototype. Each carries its switch here and its check in
[DESIGN-SPEC.md](DESIGN-SPEC.md) §8.

1. **The WhatsApp connection is real.** The browser calls `/api/proof/*` on its own origin;
   `mock-api/app/cedar_whatsapp.py` forwards to `http://127.0.0.1:8793`. The bridge permits five POST
   paths (`session`, `whatsapp/code`, `whatsapp/connect`, `whatsapp/diagnostics`,
   `whatsapp/disconnect`) and four GET shapes (`state`, `intake`, `conversations`,
   `conversations/{id}/messages`), forwards `after`, `before` and `limit` alone, requires an `Origin`
   on POST that `cedar_access.allowed_origin` accepts (`https://demo.soyrocoto.com`, its own origin or
   loopback), and answers 503 while `CEDAR_WHATSAPP_BRIDGE_ENABLED` is unset. It carries the host-only
   cookie `__Host-cedar_session`, caps a request at 128 KiB and a page at 8 MiB, and answers
   `no-store`. **Both surfaces share this bridge and this cookie**, so the flag and the origin are the
   two switches. Peter connects his own number ending 644.
2. **The history read is real:** `GET /api/proof/conversations` and
   `GET /api/proof/conversations/{id}/messages`, the analysis running in the browser over those pages
   ([WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md)).
3. **The test ranking rule** lives in `history/rank.ts` behind one flag: the top rows are the chats
   holding the most «haha» / «jaja», and the screen prints the rule so it is switched later.
4. **The referral list** is one client-side list over the conversations — top rows first, the rest
   alphabetical, instant matching on name and number, every row tickable, `Deselect all` — and one send
   path, the `wa.me` hand-off to the shop's own WhatsApp.
5. **Rocoto's own number** messages the connected one through §4 below.
6. **Reset state** is one control on the first screen: `POST /api/proof/whatsapp/disconnect`, then the
   rig's own session and referral records, then every `rocoto-bodega-*` key — and it stays on
   `Get started`, printing the count it removed.
7. **Two bodies of data, one rule each.** The chat corpus states quantities, days and names, so figures in
   money stay out of it and out of anything read from it; the money seed holds each amount as a minor-unit
   integer, which is what keeps the currency-token grep clean.
8. **The order brain** is `POST /api/cedar/orders/parse` (mock-api, `cedar_order_intake.py`) on a
   bounded budget (`cedar_source_budget.py`), and may mark an order as needing a reply where the last
   message is the customer's. The shop unmarks it.
9. **A fixture is the fallback alone**, reached only where the bridge answers 503, which is local
   development. The UI names it `Sample chats` then.

## 1 · The session, minted from the connection

### Native waitlist contact and connected-business capability

The signed inbound webhook sender creates the waitlist contact and secures its place immediately.
An optional `Referencia: CODE` / `Referral: CODE` attributes that new sender to an inviter; the code
never supplies account identity. The deterministic intake stores `personName`, business `name` and
the Google Play account email. Tester state is `requested` until a commissioned Play membership
transport proves eligibility; only that proof may return `eligible` or an opt-in URL.

Phone OTP mints a native bearer only for an existing waitlist contact. The 0.6 app presents that
bearer before starting Meta, which binds the handoff to `expected_phone`. Published 0.5.1 clients
retain the anonymous PKCE start: their browser approval still requires current Meta proof, an
explicit approval and the one-use callback code, so the empty start grants no identity. The bearer may read the
waitlist and save its own profile incrementally through `PATCH /api/bodega/business`; the complete
`PUT` remains compatible. Meta connection is the final, separate capability: the PKCE handoff
matches `expected_phone`, when present, to the number Meta verifies. Connected-only
routes (`/notify`, `/referrals`, `/referral/attribute`, Yape and `/onboarded`) check that capability.
`GET|POST /api/bodega/mobile/testing` reads or records the Play-account email and returns an
enrollment URL only after provider proof.

The signed webhook accepts messages only for Rocoto's configured `phone_number_id`. It records
Meta's message timestamp before acknowledging the webhook and sends free-form replies only during
the 24-hour window opened by that message. A tester-link send stores its separate WhatsApp state:
provider refusals retry on a later signed inbound, accepted sends retain the `wamid`, and an
ambiguous response stays `attempting` until the person explicitly asks to send the link again.
This is at-most-once across ambiguous Graph responses; Graph offers no idempotency key for message
sends, so the stored uncertainty avoids an automatic duplicate.

`connection_verified_at` records the most recent successful Meta handoff. It is historical proof,
rather than a live provider-health signal. A provider lifecycle webhook must clear or refresh that
capability when Meta reports a disconnection; this repository does not yet contain that bridge.

| | |
|---|---|
| **Does** | the shop opens the page and presses `Continue`; Meta's own connection flow runs (§2), and **the connection is the sign-in** — the page asks the server to read the WhatsApp connection of this browser's own session and mint a session cookie from it |
| **Module** | `mock-api/app/bodega.py`, registered in `main.py`, serving `POST /api/bodega/session/connection`, `GET /api/bodega/session`, `POST /api/bodega/session/reset`, `POST /api/bodega/referrals`, `GET /api/bodega/referrals`, `POST /api/bodega/notify`, the walk's own six (§14), the buddy's `POST /api/bodega/onboarded`, the public `GET /api/bodega/status/{code}` and Meta's own `GET|POST /api/bodega/wa/webhook` (§16), cookie `__Host-bodega_session`, Secure, HttpOnly, host-only |
| **Why the connection stands as identity** | the connection service binds its state to the browser: `proof/service.py`'s `get_state` looks the browser's `__Host-cedar_session` up in `proof_sessions`, then asks `accounts.py`'s `store_for_session` for that session's store, which answers only for a session bound by `grant()` — and the one call site of `grant()` is inside the Meta connect handler, after the exchanged token verified the exact account and phone. A fresh browser's session is unbound and reports `connection: null`, so a connection this browser can see is proof that this browser authorised it |
| **Today** | real: the browser's connection-service cookie rides the same origin as `/api/bodega/*`, so the server forwards it to the service and reads `connection.number` |
| **Production** | the session refreshed against the service's own clock (see the two limits below), opt-in recorded first |
| **Survives** | a browser where storage throws, the page rendering from the cookie and the service alone; a second phone, which connects and is signed in on its own; a press on `Continue` with no connection yet, which is a named refusal rather than a session |

**What is deleted, and why.** The six-digit login code, the tokenised link, `POST /session/code`,
`POST /session/link` and `POST /session/verify` all go. Peter, 19 September 2026 (`docs/FEED-IA.md`
§268): «the hola was for something else when we wanted to use whatsapp onboarding». Meta's
documentation, read 19 September 2026, offers no field that carries the shop's number into the WhatsApp
Business app connection, so **no number is asked anywhere in the walk** and the shop types it on Meta's
own screen.

**Two limits, stated rather than smoothed over.** The connection service's bound session lasts **8
hours** (`proof/accounts.py` `BOUND_TTL`, and `begin()` returns a valid cookie unchanged rather than
extending it) while the bodega cookie lasts **30 days** (`bodega.py` `SESSION_TTL`), so the two clocks
differ and a shop can hold a session the service no longer recognises. And `__Host-cedar_session` is
`Path=/` on **one origin that serves both `/cedar/` and `/bodega-pay-later/`**, so the two prototypes
share one connection-service cookie: a browser that connected through Cedar's page is signed in here,
and the reverse.

**Installability.** `app/public/bodega/manifest.webmanifest`, linked from the entry page, with
`icon-192.png` and `icon-512.png` beside it drawn from `public/brand/rocoto-mark.svg` in the theme's
paper on the theme's ink, `display: standalone`, `start_url` on the built entry `/bodega-pay-later/`,
and `theme_color` the same ink the page's own `<meta name="theme-color">` carries. The manifest and
both icons are the installability check's three files.

**What the server half ships.** One module, `mock-api/app/bodega.py`, carries both this section and §4 —
the session and the mouth are one story, and §4's Graph client is written inside it — so the two file
names this section and §4 predicted (`bodega_access.py`, `bodega_whatsapp.py`) are one file registered on
one line in `mock-api/app/main.py`. Every request and every answer is JSON, `no-store`.

**`POST /api/bodega/session/connection`** is the sign-in. It forwards the browser's own
`__Host-cedar_session` to the connection service's `GET /api/proof/state` with the bridge's own
`Origin`, takes `connection.number` from the answer, and sets `__Host-bodega_session` (Secure, HttpOnly,
`Path=/`, SameSite Strict, no `Domain`) bound to that number, answering `{signedIn, phone}`. A browser
whose proof session carries no connection is refused by name, **401 `bodega_connection_absent`,
«Connect your WhatsApp to continue.»**; the service unreachable answers 503
`bodega_whatsapp_unreachable`. A number that is not E.164 answers 400 `bodega_number_unreadable`, and
nine digits alone are read as Peru's.

**`GET /api/bodega/session`** answers `{signedIn, phone}`, signed out included, so the first screen
renders from the cookie and the service alone. **`POST /api/bodega/session/reset {}`** answers 200
`{cleared}` **with or without the cookie** — a reset that finds no session has nothing to clear and says
so — dropping this session and its referral rows.

**`POST /referrals {invited:[{name, phone}]}`** and **`GET /referrals`** both answer
`{invited:[{name, phone}]}`, each number normalised to E.164 and the list in number order, one row per
number. **`POST /notify {kind, name, count?, text?}`** sends the closing message or the
supplier-connected notice free-form from Rocoto's own number and answers `{sent, kind, to, wamid}`.
**The request can no longer name a destination**: `/notify` writes only to the session's own number, read
from the session the connection minted, so the page chooses the message and the server chooses who reads
it. The service writes MESSAGES.md's own Spanish from `name` and `count`, refusing 400
`bodega_notice_needs_name` or `bodega_notice_needs_count` rather than sending half a sentence, and `text`
is the page's own filled body where it holds one.

**Every send out of Rocoto's mouth takes one of that destination's `DAILY_SENDS` (40) messages for the
day**, answering 429 `bodega_send_ceiling` above it. A message that never left gives its place back, so a
number awaiting the key stays reachable the moment it lands, and the ceiling's own row outlives
`Reset state`, a ceiling a press clears being no ceiling. A write needs an `Origin`
`cedar_access.allowed_origin` accepts (`bodega_origin_required` · `bodega_origin_refused`), and
`/referrals` and `/notify` need the session (`bodega_session_required`). §4's two environment names are
declared in `mock-api/app/config.py` with **no default**, so an absent value answers 503
`bodega_whatsapp_unconfigured`.

## 2 · The WhatsApp connection

| | |
|---|---|
| **Does** | Embedded Signup v4 in a popup, coexistence feature type, history requested in the same call, the number resolved server-side, callbacks routed to that account |
| **Module** | `cedar/connections/app.tsx` (`WhatsAppSetup`), `meta.ts`, `hooks.ts`, `api.ts` imported as they stand; `POST /api/proof/whatsapp/code`, then `POST /api/proof/whatsapp/connect {authorizationId, event, wabaId, phoneNumberId, historyRequested: true}`; the `whatsapp-capability.ts` posture (`checking · unavailable · setup · partial · ready`) drives the UI; `whatsapp-connection.tsx` copied, its key renamed |
| **Permission** | Facebook Login for Business `config_id`; `featureType: "whatsapp_business_app_onboarding"`, `sessionInfoVersion: "3"` — v4 writes both spellings, so both are tested. Console, once: subscribe the WABA fields `history`, `smb_app_state_sync`, `smb_message_echoes`. **Advanced Access** on `whatsapp_business_messaging` and `whatsapp_business_management` gates every client-WABA call, behind Business Verification, App Review and Access Verification in that order |
| **Today** | real, proven once: 9 September 2026, Peter's own number, 2,214 messages across 112 conversations, receipt `app/src/prototypes/cedar/connections/deploy/verification-2026-09-09-48838752.json` |
| **Production** | the coexistence finish event carries `waba_id` alone, so the phone comes from `GET /{WABA_ID}/phone_numbers`; `register` is skipped, the number being registered already; `is_on_biz_app` and `platform_type` are stored as the coexistence flag; both sync calls run inside the 24-hour clock or the shop redoes the flow |
| **Survives** | the popup lost or Meta's tab refreshed (the ordinary flow is repeated, which is what worked on 9 September); a 401 during setup, which renews the unbound session above a remounted controller; `BUSINESS_DOWNGRADE` if the number later joins consumer WhatsApp; the 20 mps cap and groups staying unsynced |

**The phone path** is settled and stated in [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §3: a message
from the official Facebook Business Account, a link, a code shown in the flow. The run on a real
phone with Peter's number is acceptance, and the native shell that screenshots a QR is the fallback
only if that run shows a QR with no link beside it.

**The shop's number is not carried in.** `beginSignup` (`cedar/connections/app.tsx`) passes the
`configId` and `historyRequested`, and `cedar/connections/meta.ts` holds no prefill field; Meta's
documentation, read 19 September 2026, offers no field that carries the shop's number into the WhatsApp
Business app connection either. So this step asks for no number and the shop types it on Meta's own
screen — which is also why the screen in front of it holds one button and no field.

## 3 · The history read

Owned by [WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md). Its wiring: `historyRequested: true`
travels on the connect call, Meta's own screen takes the consent, and inside the `connect` handler the
service fires `smb_app_state_sync` then `history`. `GET /api/proof/state` reports `history.status`
with its counts and date range; live inbound text arrives at `GET /api/proof/intake?after=<cursor>`.
Extraction is bounded model work behind `POST /api/cedar/orders/parse` with a review step; historical
messages are never replayed as new customer actions, and the analysis cursor is held apart from the
raw messages. It survives the case the proof already met: Meta reporting `progress 100` while a
projection failed reads `interrupted`, repaired by local replay rather than a second sync request.

## 4 · Rocoto's own number

| | |
|---|---|
| **Does** | sends the closing message, and the buddy's notices after it, from Rocoto's own WABA to the number the session holds from the connection state |
| **Module** | new `mock-api/app/bodega_whatsapp.py`, registered in `mock-api/app/main.py`. **`mock-api` imports nothing from `backend/`**, so its Graph client is modelled on `backend/whatsapp_cloud.py` — `_post_messages`, `send_text`, `send_template`, `sender_scope` — and written inside `mock-api` |
| **Permission** | Rocoto's WABA `2033396113925190`, number `+1 978 958 9459`, a system-user token with `whatsapp_business_messaging` and `whatsapp_business_management`. Rocoto's own asset, so standard access carries it |
| **The environment** | `WA_CLOUD_TOKEN` and `WA_CLOUD_PHONE_ID`, declared in `mock-api/app/config.py`. **The module requires its own values and falls back to nothing**: `backend/config.py` defaults `WA_CLOUD_PHONE_ID` to `1144962938711312`, another company's number, so a silent fallback would message from the wrong mouth. Absent values answer a named 503. `python3 tools/env-gate.py --write` regenerates `.env.example` and `deploy/staging/demo.env.example` from the new readers, and `make gates` runs `env-gate`. The value reaches the demo runtime at `/srv/rocoto/demo.env` (`deploy/product/development.json`) through the 1Password route in `deploy/development/provider-env.md`; the token is Peter's |
| **Today** | the destination is the session's own number, minted from `connection.number` (§1), never a literal, and the closing message travels free-form |
| **The window, and the path through it** | Meta delivers a free-form message inside an open 24-hour window, and **nobody writes «hola» first any more**, so the walk's last screen offers `Message Rocoto on WhatsApp` — a `wa.me` link the shop taps, which opens the window — and claims no delivery. The path that needs no act from the shop is an approved utility template through `send_template`, **already written and tested in `mock-api/app/bodega.py`** and called by nothing yet; it needs the WhatsApp Business Account's payment method as well as Meta's approval ([MESSAGES.md](MESSAGES.md) §5 and its submission receipt) |
| **Survives** | `EGRESS_SANDBOX`, which returns an explicit synthetic marker; a 2xx with no `wamid`, which raises rather than inventing an id; a closed window, which answers `bodega_whatsapp_refused` and leaves the screen saying what comes next |

## 5 · The referral record

| | |
|---|---|
| **Does** | proposes suppliers from the history, composes the invitation, records that it was sent, watches for the connection, reports one back |
| **Module** | new `referrals.ts` — `SupplierInvite { id, scope, supplierId, name, phone, token, state: 'ready' \| 'sent' \| 'invited' \| 'connected' }`; numbers normalised to E.164 (digits only, `51` implied for nine-digit mobiles, stored `+51#########`); the match runs server-side when `POST /api/proof/whatsapp/connect` verifies a new account, comparing the invitation token carried in the link first and the normalised number second |
| **Permission** | the invitation leaves the shop's own phone through `wa.me`, so no template category and no Meta permission apply to it. The notice back leaves Rocoto's WABA: free-form inside the window, else a utility template carrying no link |
| **Today** | fixture: three suppliers in three states. The connect webhook is real; the match is new work |
| **Later production work, two conditions** | **this pair is owned here**, and [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) screen 5 and [MESSAGES.md](MESSAGES.md) §3 point at it rather than restating it: sending the invitation from the shop's own number needs **Advanced Access on `whatsapp_business_messaging`** and **a template approved on that shop's WABA**. Until both land, today's send is the `wa.me` hand-off, the one path |
| **Survives** | a supplier connecting with no invitation (it joins as its own shop, the row unchanged); two shops inviting one supplier (the first token wins, both rows read the connection); an ambiguous match, which stays a review item |

**The four states, and the act that moves each.** This set is the one every surface prints —
[ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) screen 5 and [DESIGN-SPEC.md](DESIGN-SPEC.md) §3 card 5 read it from
here.

| State | The act that moves it | Word on screen |
|---|---|---|
| `ready` | Rocoto proposed the supplier and the row arrived ticked | `Ready` |
| `sent` | the shop pressed send on that row and its own WhatsApp opened with the message | `Sent` |
| `invited` | the shop confirmed with `I sent them`, which is what makes the invitation a claim Rocoto watches | `Invited` |
| `connected` | that supplier's WhatsApp connected, matched by the invitation token first and the normalised number second | `Connected` |

`sending` belongs to the referral screen alone: it is the transient while a `wa.me` hand-off is open, so it
lives on the screen and the record keeps the four states above. `Suppliers you brought` lists the rows from
`sent` on.

**The picture question, answered.** The Cloud API hands a business the *name* a contact set on their
own phone: the inbound webhook carries `contacts[].profile.name` with `wa_id`, which is what
`app/src/prototypes/cedar/connections/proof/storage.py` already stores (a captured payload sits in
`docs/archive/predecessor-product/docs/whatsapp/RESEARCH-RAW-2026-08-17.md`). A picture comes from
`GET /{PHONE_NUMBER_ID}/whatsapp_business_profile?fields=profile_picture_url,about,address`, whose
subject is the business's own profile on a number the token already reaches — so a supplier's picture
exists the day that supplier connects, and until then the stand-ins are two initials on Base `Avatar`
at 28 px, then the trade's painting where the trade is known.

## 6 · Whose number, and which window

| | |
|---|---|
| **Module** | `sender_scope(from_id)` pins the sending number for one task, so one turn leaves one mouth |
| **The shop's own number, through Rocoto** | `POST /{PHONE_NUMBER_ID}/messages` on its coexistence phone id, which needs Advanced Access on `whatsapp_business_messaging`. What a customer reads as the shop's — the fiado reminder, the payment page, the order confirmation — leaves that number, and thumb-typed replies arrive as `smb_message_echoes` |
| **The window rule, load-bearing** | **imported history opens no window.** A customer read out of the history has none, so the first Cloud-API message to that customer is a template; a customer who writes after the connection opens a window as normal, and the payment link travels free-form inside it |
| **`wa.me`** | the shop's own app sends it; Rocoto composes the text and opens the chat. Invitations go this way, because a connect link inside a template is app promotion and recategorises the template |
| **Survives** | Advanced Access still pending, which answers error `200` on every send from the shop's number: the capability posture hides those acts and `wa.me` carries the product alone |

## 7 · Prep, the sale record and the export

| | |
|---|---|
| **Does** | the day's orders to prepare, the note and the conversation beside them, the whole record out as a file |
| **Permission** | none: the shop's own data, in its own browser |
| **Module** | the surfaces are in [DESIGN-SPEC.md](DESIGN-SPEC.md) §3. The record is `sale.ts`'s `Sale`, `SaleLine` beside it, under a generic reference, and `exportState` is `sale.ts`'s too; `money-model.ts`'s invoice fields — `InvoiceSale`, `state.invoices`, `invoiceForSale` — stay unwritten and unrendered under fiscal-off, `prepareOrderFiscal`, `FiscalActions` and `FiscalPreparation` are left behind, and copper's `/billing-draft`, `/commercial-document`, `/invoice` and `/invoice/query` are never called. Export: `export-period.ts prepareExport`, `export-files.ts sheetOf('orders' \| 'customers')`, the `customers` sheet dropping its `tarifa` column with the tarifa, `csvOf` (CRLF) and `saveCsv` (`CSV_BOM`); the statement is a new `statement-pdf.ts` on `pdf-lib` and the checked-in Inter subset, the way `dossier-pdf.ts` draws A4 — both made in the browser |
| **Today** | fixture over the seeded bodega cast: 90 days, 20 June to 18 September 2026. **The file holds the period it names**: `paper/back-run.ts` writes those 90 days as the transactions the record already asserts — its own `sales-with-the-payment-recorded` denominator over the days it counts, `days-with-a-sale` as a shop that shuts one day a fortnight, each customer's `perWeek` and `bandMinor` for whose sale and how much, and the fiado book placed on the sales it is the debt of — so the walk's `90 days · 915 sales · 18 customers` and `#/money/record`'s `218 of 284 sales` are one shop. It is derived from the world file alone, so the same book comes back on every reload |
| **Production** | the export names its own period and says whose record it is, by transaction and by customer, under the true SUNAT sentence held byte-exact in [DESIGN-SPEC.md](DESIGN-SPEC.md) §6 |
| **Survives** | a phone where a download is awkward (the statement also opens in a tab); accents in Excel (the BOM); a 90-day book on a mid-range Android, which is why the list is bounded to one day |

## 8 · Money: the bank, the payables, pay-later, the record

| | |
|---|---|
| **Does** | opens on the bank account, then what the shop owes, then its record, then its place in the list |
| **The copper origin** | `money-api.ts` imports `./money-runtime.json` and returns its `apiOrigin` only where `window.location.origin` is one of its `uiOrigins`. `https://demo.soyrocoto.com` is listed, and **the copy in this folder imports `../cedar/money-runtime.json`** — the one table both surfaces read — so this surface resolves copper with no new binding file ([DESIGN-SPEC.md](DESIGN-SPEC.md) §7 item 11); a surface with its own origin adds itself there |
| **Provider · permission** | Prometeo reads the bank with the seller's consent, behind copper's operator routes (`POST /api/operator/workspaces/{id}/bank/login` and `/bank/select-account`, operator credentials outside the browser); the browser reads `GET /api/cedar/bank` and `GET /api/cedar/bank/movements`. The monitor's interval floor is 300 s and a read window over 31 days answers `bank_date_range_invalid`. The login pattern `^(bbva\|interbank\|scotia\|telebanking)_[a-z_]+_pe$` resolves to three receiving banks, `bbva`, `interbank`, `scotiabank`. **BCP sits outside it**, and Yape con DNI opens a BCP savings account, so this shop usually connects no bank today: the gap is named on the screen |
| **Module** | `money-bank-api.ts`, `money-bank-capability.ts`, `money-model.ts` imported; `money-store.ts`, `money-api.ts` and `chase.ts` copied with their prefixes renamed. **`cedar-channel-api.ts` is copied nowhere**: this shop opens no channel workspace, so the copy stood dead while Cedar's own module — reached through the onboarding card that used to stand in the rail foot — allocated and held the bearer under `rocoto-cedar-channel-access-v1:`. The card left with the walk it counted (`shell/rail.tsx`, `shell/day-bar.tsx`), and `tools/test-bodega-money.mjs` sweeps the directory for `cedar/setup-progress`, `cedar/phone-runtime`, `channelApi(` and `channelWorkspace(`. New and pure: `supplier-payments.ts`, `paylater.ts`, `record.ts`, `queue.ts`, `stage.ts`. **One shop sells at one price**, so `tiers.ts` is copied nowhere: the copied `customer-profile.tsx` drops `TheirTarifa`, the copied Prep area drops `useTiers`, and Administration's price rows leave `app-settings` and `data` |
| **Today** | sample: `copper/runtime/providers/sample_bank.py` with `runtime/sample_bank_v1.json` answers the balance and the incoming chart under `CEDAR_SAMPLE_BANK`; the card reads `Add your bank account` where nothing is commissioned |
| **Production** | one consenting seller with a supported account, read-only scope, credential custody and renewal proven. **Pay-later is per purchase**: `offered · used · due` at 30 days `· settled · late`, one record each, no limit field, no revolving arithmetic, and `money-finance.ts`, `AdvanceDialog` and `#/money/advance/<minor>` stay out of the bundle under test. **The record** reads the shop's own acts alone, each indicator earning on bank-graded evidence or the shop's own dated confirmation, so a shop Prometeo cannot reach is still scorable. **The place in the list** has no number: `QueueStanding` holds no `position` field. **The lender hand-off** is a document the shop sends itself |
| **Survives** | a bank that cannot be connected (the honest unconnected state, and a record that still moves); a provider session lost mid-read (last attempt, last error and next due time retained, an authorisation failure pausing for reconnection); thirty days with no measured payment, which steps the level down |

## 9 · The payment page per sale

| | |
|---|---|
| **Does** | turns one sale, or any amount the shop names, into a page the customer pays, and matches the money back to it |
| **Permission** | direct Yape or Plin into the shop's own account. Yape publishes no prefilled link and no request-to-pay, so the link is Rocoto's own page; the workspace bearer from `POST /api/cedar/workspaces` authorises creation, and the buyer URL is itself the capability |
| **Module** | `money-api.ts createCollection` → `POST /api/cedar/requests`. **Its `description` field carries the shop's own words**: Cedar fills that field from a document number, and here the shop types what the link is for, so one string prints on the buyer page, in the message and in the export row (Peter: «you can generate new payment links with the description of everything so that you keep stuff logged»). The amount is reserved by `cedar_amounts.py` as `principal + rounding` (0–99 c), every issued quote staying reserved; the buyer page is `GET /collect/{request_id}/{token}` (`runtime/web/cedar-buyer.html\|js\|css`) with `/status`, `/approve` and `/qr`; matching is `POST /api/cedar/bank/match` — exact account and currency, then the reference, then the exact amount. `payment-link-actions.tsx` is copied, its strings reading `Open the payment page` |
| **Today** | real against the local service and its SQLite |
| **Production** | the message carrying the link leaves the shop's number, free-form inside the window, with a utility template as the fallback; the receiving account is bound once; access logging stays off, because a buyer URL carries a capability |
| **Survives** | two customers owing one amount (the unique cents separate them); a transfer arriving days late (old quotes stay reserved, so it pays its own request); an ambiguous credit, which stays in Review |

## 10 · The Meta template set

Every message, with its Spanish and its legal status, is in [MESSAGES.md](MESSAGES.md); the Graph
payloads are in [messages/templates.json](messages/templates.json). The rails, in one table:

| Message | Leaves | Category | Access |
|---|---|---|---|
| the closing agent message with the link | Rocoto's WABA | free-form inside the window — the only place a connect or page link may travel; a utility template is the path that needs no act from the shop | standard: Rocoto's own asset |
| a supplier joined · a payment landed · the statement is ready | Rocoto's WABA | free-form in window; utility template with no link when it is closed | standard |
| the fiado reminder · the payment-page message · the order confirmation | the shop's WABA, claimed at Embedded Signup | free-form in window; utility template as the fallback, and the one rail to a customer read out of history | **Advanced Access** on messaging, and on management to create them |
| the invitation to a supplier | the shop's own app, by `wa.me` | a personal message, no category | none |

Templates live per WABA, so each shop's set is created at connect time and reviewed separately, and
the build survives a pending or rejected set by carrying the product on free-form messages inside the
window. Two costs are stated rather than assumed: utility messages are free inside the service window
until 30 September 2026 and charged from 1 October at Peru's own rates, which [MESSAGES.md](MESSAGES.md) §1
prints in USD off Meta's own card; and as a Tech
Provider Rocoto fronts nothing, so each client adds its own payment method after onboarding.

**The design-review simulation** needs no network: `#/chat`, titled `Rocoto on WhatsApp`, plays
[messages/chat-script.json](messages/chat-script.json) turn by turn in the WhatsApp theme so the buddy's
thread can be read on a desk ([MESSAGES.md](MESSAGES.md) §6).

## 11 · Storage, namespaces and reset

One origin serves `/cedar/` and `/bodega-pay-later/`, which fixes the copy-or-import line: **a module
that stores a bearer or a ledger is copied and its prefix renamed; a pure module is imported.** The
keys that force a copy are `money-store.ts` (`rocoto-cedar-money-v1:`), `money-api.ts`
(`rocoto-cedar-money-api-v1:`), `chase.ts` (`rocoto-cedar-chase-v1:`), `whatsapp-connection.tsx`
(`rocoto-cedar-whatsapp-selected-v1`) and `print-queue.ts` (`rocoto-app-print`); a shared key means
one prototype editing the other's ledger. [DESIGN-SPEC.md](DESIGN-SPEC.md) §7 item 11 lists the same
three money modules as copies; the storage key is the reason.

**TWO MORE STORES SIT INSIDE OTHERWISE PURE CEDAR FILES, and the cast seats this shop on the `fruit`
catalogue, so they landed in Cedar's fruit house.** `incoming.ts` holds the declared-stock book under
`rocoto-stock-declared-v1:<sector>`, reached from the detail through `lot-allocation-book.ts`, so the
lots behind an albarán were another house's arrivals and every sector switch wrote that house's row
back; `output-templates.ts` holds the paper and file templates under
`rocoto:outputs:templates:<sector>`, so a template the shopkeeper edited on the Print screen WAS
Cedar's albarán template. Both are split the way this section's rule says: the vocabulary — every
fold, every act that returns the next template — is imported from Cedar and stays one definition,
while the browser half is copied as `store/declared-stock.ts` and `store/output-templates-store.ts`
against `rocoto-bodega-stock-declared-v1:<sector>` and `rocoto-bodega-output-templates-v1:<sector>`.
`lot-allocation-book.ts` is copied beside them for its one line of store, and `detail.tsx` and
`shell/printing.tsx` are the two call sites that move. **Reading a book is not declaring one**, so the
copied declared store reads and holds: this shop announces no landing and codes none, so it writes
nothing until a surface does, and the verb lands there when one arrives.

**THE DAY'S EVENT LEDGER STAYS CEDAR'S, AND `Reset state` CLEARS THIS SHOP'S ROW OF IT.** `cedar/day.ts`
keeps the day under `rocoto-app-day`, one row per sector, and `cedar/sale.ts` — five thousand lines,
imported live by the detail, Prep, the print queue and the chats — appends to it through `setDay` on
every act, so re-keying it means copying `sale.ts` itself and this shop's acts land in the `fruit` row.
The prefix sweep is the wrong tool for that key both ways: it holds Cedar's fish and meat days beside
this shop's row, and removing bytes leaves the LIVE ledger in memory to re-persist the same events on
the next act. So the reset asks Cedar's own verb, `resetDay(sector)` — this shop's row emptied, the
other houses kept, the live ledger told, and the whole key dropped when no house is left in it.
`store/keys.ts` names the key with the reason beside it.

**A COPY EARNS ITS PLACE BY BEING CALLED, AND `cedar-channel-api.ts` was called from nowhere.** The
rule above put the copy in this folder for its bearer; the surface that opened a channel workspace was
Cedar's `setup-progress.tsx` — mounted by the onboarding card in the rail foot, reading the phone
posture through `cedar/phone-runtime.ts` — so `#/prep` on a desk issued `POST /api/cedar/access/workspaces`
and stored the bearer under `rocoto-cedar-channel-access-v1:<base>`, spending Cedar's connection
authority from this page. The card counted Cedar's own two steps and this shop's onboarding is the six
screens of [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md), so the card left the rail and the day bar, and the
copy and its key left with it. `tools/test-bodega-money.mjs` sweeps the directory for
`cedar/setup-progress`, `cedar/phone-runtime`, `channelApi(` and `channelWorkspace(`, red on Cedar's own
provider on purpose. A door here that needs `/api/cedar/access/*` brings the copy back out of Git with
`KEYS.channelAccess` beside it.

**`store/keys.ts` is this list, in one file, with a line of purpose against each key.** What shipped holds
nineteen rather than the twelve this section and [DESIGN-SPEC.md](DESIGN-SPEC.md) §7 first drew, because the
copied print queue, the copied export centre, the packing output, the declared stock, the output templates,
the desk rail and the covers each brought one: `rocoto-bodega-money-v1:`, `-supplier-payments-v1:`,
`-invites-v1:`, `-stage-v1:`, `-history-*`, `-whatsapp-selected-v1`, `-money-api-v1:`, `-chase-v1:`,
`-prep-order`, `-print`, `-print-journal`, `-covers-v1`, `-rail-open`, `-export-output-schedules`,
`-export-email-provider-receipts`, `-packing-output-v1`, `-packing-marks-v1`, `-stock-declared-v1:`,
`-output-templates-v1:`. `resetLocal()` sweeps BY THE
PREFIX rather than by the list, so a store added later is cleared the day it lands and the list stays what a
reader checks the sweep against. **`rocoto-runtime-base` and `rocoto-bodega-collections-base` sit outside the
sweep**: the first is `runtime-client.ts`'s developer pin, shared with Cedar, the second `money-api.ts`'s pin
for a loopback collection service, and `Reset state` keeps both because they belong to the developer rather
than to this shop. `localStorage` holds conveniences alone — the remembered sort, the open tab.

**The services.** The proof service keeps an encrypted store partitioned by the exact
`WABA ID:phone ID` pair, mapped to a workspace by `CEDAR_PROOF_WORKSPACE_BINDINGS`, and reconnecting
the same identity reopens it with its ledger intact. Copper keeps SQLite under its state directory
with its Fernet key in its own configuration at mode `0600`, preserved with the database — locally
`~/.local/state/rocoto/copper` and `~/.config/rocoto/copper.env`. Standing, invitations and record
movements belong to the service keyed to the shop's number, so a new phone shows the same record.

**Reset state**, in the order it runs (`start/arrival.tsx`): the SOURCE is asked to disconnect — on the
rig `POST /api/proof/whatsapp/disconnect`, which drops the subscription and the active authority while keeping
the encrypted identity, and on the sample source a subscription of its own, which is none — then
`POST /api/bodega/session/reset` for the rig's session and referral records, then the four in-memory forgets
(the read, the covers, the session's own record, the connection snapshot), then `resetDay(BODEGA_CAST.sector)`
for this shop's row of the day ledger it shares with Cedar, then `resetLocal()`. **The address does not move**:
the control stays on `Get started`, which is where it lives, and prints what it cleared. Cedar's day
module is asked for at the press rather than imported at the top of the screen, so the first chunk a
shopkeeper loads stays the light one.

**THE SWEEP GOES LAST, and the order is load-bearing.** Three of those forgets WRITE on the way out:
`forgetCovers` publishes an empty book, `signOut` publishes a signed-out stage, and the reset event
republishes the connection. Sweeping before them put three keys straight back, so `Reset state` left the
shop's stage, its covers and its connection exactly where they were while reporting success. The control
prints the count `resetLocal()` actually removed, and `drives/drive-268-bodega-onboarding.py` reads that
count, the two posts and an empty `rocoto-bodega-*` namespace on the screen the press left it on — the
first screen's own `markReached('arrival')` writes the stage again, which is the walk starting over rather
than a sweep that missed.

It survives a second phone and a service restart, because nothing that matters lives only in the page.

## 12 · Environments and publication

`make dev UI_PORT=8094` runs the app with the checkout's own runtime on loopback and opens
`http://127.0.0.1:8094/bodega-pay-later.html`, once `bodegaPayLater` joins the rollup inputs in
`app/vite.config.ts` beside `main`, `scenarios` and `app`. Local wiring needs `http://127.0.0.1:8094`
in copper's `CEDAR_ALLOWED_ORIGINS` and `CEDAR_WHATSAPP_BRIDGE_ENABLED=true`; `make dev-ui` serves
fixtures alone on 8080.

Publication is automatic: any `app/**` path outside operator, kit and dist marks the development
target (`deploy/product/changed-targets.py`), CI runs `npm run build:app-en` and ships
`app/dist-export-review` to `demo.soyrocoto.com` — so this surface needs its own `prototype.json`
emitter in `app/tools/build-english-app.mjs` and answers `make verify-publication SOURCE=<commit>`.
Copper and the proof service keep their own systemd units, origins and environment files on the
physical `rocoto-staging` host (8795 behind `copper-demo.soyrocoto.com` with
`/etc/rocoto/copper-preview.env`; 8793 behind `cedar-demo.soyrocoto.com` with
`/etc/rocoto/cedar-demo.env`), each with a tracked `deploy.preview.json` beside its source, and the
mock-api demo runtime reads `/srv/rocoto/demo.env`. Production is out of scope, and `rocoto-prod` is
never opened from a session.

**The gates this wiring answers to**, each proved red on purpose once: `env-gate` (a new reader is
declared, or the gate names it), `repo-gate` (a tracked `README.md` from the first commit),
`link-gate`, `copy-gate`, `theme-gate`, `artwork-gate`, and `bundle-budget` against
`app/tools/bundle-budget.json` — ceiling 7,701,504 bytes, measured 7,027,837 on 15 September 2026, so
the pull request adding this surface re-measures and records the number.

**The covers** are installed at `app/public/bodega-artwork/hero-{arrival,referrals,money,stock,customers}.png`
with a `-wide.png` beside each. The hero slot is a copy of `cedar/feature-artwork.tsx`'s `HeroArtwork`,
which already draws 3:1 above 560 px and 16:9 below and claims its band once the picture has decoded;
the copy changes the file root to `/bodega-artwork/` and the kind union to the five seats.

## 14 · The last steps of the walk — the place, the business, the address, the Yape

Added 20 September 2026 (`docs/FEED-IA.md` §268, evening; [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md)
§0). Six calls, all same-origin on the page's own host, all behind the `__Host-bodega_session`
cookie §1 mints from the WhatsApp connection, all served by `mock-api/app/bodega.py`. The page's
side is one module, `start/joining.ts`.

| Call | What it is | What it survives |
|---|---|---|
| `GET /api/bodega/waitlist` | the place, how many are ahead, the referral code and its link, the covered purchases, how many joined through this business. The place is minted once per connected number, inside `open_from_connection` | a browser holding no session reads the named `awaiting` state, and the walk carries on the SAMPLE world's seeded place (`fixtures/cast-bodega.json`, `money.queue`), printed under `Sample waitlist` |
| `POST /api/bodega/referral/attribute` | `#/r/<code>` on arrival, attributed once the connection exists. Idempotent; a business's own code and an unknown code both answer a plain `false` | a code nobody holds never confirms whose it was |
| `PUT` · `GET /api/bodega/business` | what the business is, its name, and the address it picked. `extra="forbid"` throughout | the walk keeps its own draft in session storage, so a refused write costs the shop no typing |
| `GET /api/bodega/address/suggestions` · `/address/place` | Google Places (New), Peru-biased, session-token'd, through `mock-api/app/places.py` — **the key stays in the runtime and the page never holds one** | with no Places key configured the runtime answers three real Lima addresses of its own, and the page's own sample set matches them, so the walk is whole with a key, without one, and with no runtime at all |
| `PUT` · `GET /api/bodega/yape` · `GET /yape/qr` | the shop's Yape number — a Peruvian mobile, validated by the service — and a photo of its QR, sniffed for a real PNG/JPEG/WebP under 2 MB | a number given again with no fresh photo keeps the photo on file; the QR is served back to that session alone |
| `GET /api/bodega/pay/{code}/yape` · `/yape/qr` | the public read the CUSTOMER's payment page makes, keyed by the shop's own referral code — the one public name a business on the waitlist has | a link naming no shop this service holds answers 404 and the page keeps the seeded shop's number |

**The map's ground.** Google's Maps JavaScript API, loaded through Cedar's own loader
(`cedar/google-ground.ts`) with `VITE_GOOGLE_MAPS_KEY` — one load per page, on demand, with a
timeout, and the whole quota posture is that module's. The style is composed from this theme's own
tokens. A build with no key draws the place-card ground, which is what every drive and every
offline review runs on.

**The pin is the middle of the screen and the ground moves under it**, which is how every map that
asks for an address works: the coordinate the shop leaves it on is saved, and the WORDS stay the
ones Places gave, because this runtime has no reverse-geocode road. Adding one is a `places.py`
call and a `bodega.py` handler, and it is not built.

**The walk's last screen calls `POST /api/bodega/onboarded`**, which is what starts §16's five-minute clock, and `PUT /api/bodega/business` carries the walk's own `language`.

**Nothing in the walk can message a third party.** Sharing with the businesses that owed this one,
and bringing businesses, both hand the message to the owner's own `wa.me` chat or system share
sheet. `/notify` still writes only to the session's own number, with the fixed kinds `closing`,
`supplier-connected` and `waitlist`, and `extra="forbid"` refuses a body that names a destination.

**The dev proxy.** `mock-api` answers CORS with `allow_credentials=False` on purpose, so a
cross-origin call from the dev server could never carry the session cookie and every one of these
paths would read `awaiting` under `make dev`. `app/vite.config.ts` puts `/api` back on the page's
own origin while `vite` is serving, from the runtime `make dev` started
(`VITE_ROCOTO_RUNTIME_BASE`). A published build is same-origin already and carries no proxy.

## 15 · Yape and the amount — what was looked up, and what the page does

Looked up 20 September 2026, for the `Pay now` block of `pay/link.tsx`.

**What is documented.** Yape's own help centre documents the QR and the app. **No published Yape
URL scheme, deep link or web API carries an amount into a personal or business Yape account.**
Charging an exact amount on the web is documented only through a PROVIDER — Culqi (CulqiLink,
CulqiOnline), Izipay, Mercado Pago, Niubiz — each of which needs a registered company and an
approved affiliation. Sources: Websy's provider comparison of 2 September 2026, written against
Culqi's and Izipay's own published pages, and Mercado Pago's and Izipay's own Yape integration
documentation. That is the road Peter named: «i need to register a company to access culqi which
will give me the yape on file» (§268).

**So the page takes the copy-then-open path, exactly as he described it.** `Pay now` shows the
shop's QR where it gave one, its number, and the exact amount; `Copy the amount` puts the figure on
the clipboard with one press; and `Open Yape` comes live only after that — a customer pasting a
figure pays the right one, and a customer typing it is where a wrong one starts. `Open Yape` opens
the app that is installed: on Android through the store's own package name (`intent:` with a
store-listing fallback), elsewhere through the App Store page. Neither carries an amount.

**What would replace it.** A Culqi or Izipay checkout under a registered company, which is the
October item on Peter's own roadmap. When it lands, the amount travels in the charge and the copy
step leaves the page.

## 16 · The buddy — Meta's own door, the status link, and the five-minute hello

Added 20 September 2026 (`docs/FEED-IA.md`, Peter's own words that night). The walk ends on the
page; WhatsApp is where the shop's place lives afterwards. Three calls and one loop, all in
`mock-api/app/bodega.py` §7, all proved in `mock-api/tests/test_bodega_buddy.py`.

| Call | What it is | What it survives |
|---|---|---|
| `POST /api/bodega/onboarded` | the walk's last screen, recorded once. Session cookie, empty body, idempotent: a reload keeps the first moment, so the five-minute clock never restarts | a browser with no session reads the named 401 and the walk's own state carries on |
| `GET /api/bodega/status/{code}` | **PUBLIC**, keyed by the referral code: the name, the trade, the place, how many joined through this business and what that covers, the referral link and the language. **No phone and no address** | whoever holds the link opens it — a reinstalled phone, a second phone, the shop's partner. A code nobody holds is 404 `bodega_status_unknown`; a caller asking too often is 429 `bodega_status_recent` |
| `PUT` · `GET /api/bodega/business` | now carries `language` (`es` default, `en` where the English site sent the shop over). `GET /waitlist` answers it too, beside `statusUrl` and `onboarded` | a body naming no language is Spanish, which is what the page is everywhere |
| `GET` · `POST /api/bodega/wa/webhook` | Meta's own door: the verification, and the shop's inbound messages | see the two refusals below |
| the hello loop | one task started with the app, period 30 s, `BODEGA_BUDDY_LOOP=off` leaves it unstarted | a tick that throws is journalled and the loop lives; a box with no records file does nothing |

**THE WEBHOOK FAILS CLOSED, BOTH WAYS.** `_origin` reads a header any client sets and Meta sets
none, so the signature is the door. `GET` answers `hub.challenge` as plain text only where
`hub.mode=subscribe` and `hub.verify_token` equals **`BODEGA_WA_VERIFY_TOKEN`**, compared in
constant time; `POST` verifies `X-Hub-Signature-256` over the RAW body against
**`BODEGA_WA_APP_SECRET`**. An absent value is 503 `bodega_webhook_unconfigured` and a wrong one is
403 `bodega_webhook_refused` — never an open door. A message id is answered once (`wa_inbound`, kept
three days, which covers Meta's retries), a delivery status is read and dropped, and anything that
is not a person writing is left alone.

**What the buddy answers.** The business is found by the number that wrote, and then by a reference
code in the text («Mi referencia es K7M2QX» · «My reference is K7M2QX»), which is the greeting the
page pre-fills; a number no business here holds is answered with silence. The first message gets
three sends in one order — the place and its page, the line that announces the next message, and the
forwardable message ALONE so one long press forwards the whole of it. A later message gets the place
again, at most once every ten minutes. Every send is free-form inside the window the shop just
opened, spends one of that destination's `DAILY_SENDS` messages for the day, and is journalled by
kind and outcome and never by a word of what was said. The sends run in a background task, so Meta
reads its 200 immediately.

**The five-minute hello.** A business whose `onboarded_at` is five minutes old with no inbound
message and no hello yet is sent the `waitlist_hello` TEMPLATE in its own language, to its own
number, its body naming the shop and its place and its URL button carrying its code. A shop that
wrote nothing opened no window, so a template is the one rail left. Five attempts at most; a Graph
refusal records the attempt and backs the next one off 5 min, 15 min, 1 h, then 6 h. The links in
both paths come from `ROCOTO_RUNTIME_PUBLIC_BASE`, because neither has a browser's `Origin` to read.

**The status link is a query, not a fragment:** `…/bodega-pay-later/?lista=<CODE>`. A fragment never
leaves the browser, and this link arrives in WhatsApp. The referral link stays `#/r/<CODE>`.

### WHAT A HUMAN DOES BEFORE THIS IS LIVE

None of the three is a session's act, and until all three are done the rig answers its own named
refusals rather than pretending.

1. **Submit the template.** `META_WABA_ID=… META_SYSTEM_USER_TOKEN=… python3
   app/src/prototypes/bodega-pay-later/messages/submit_templates.py --only waitlist_hello` — both
   languages go in one run, and `--dry-run` prints the payloads with no credentials. Meta's answer
   per template is one printed line; record it in [MESSAGES.md](MESSAGES.md)'s submission receipt.
2. **Point the WABA's webhook at `https://demo.soyrocoto.com/api/bodega/wa/webhook`**, with the
   verify token from step 3, and subscribe the `messages` field. ⚠ **This moves ALL inbound for that
   number to the demo API**, so check first what receives that number's messages today — Rocoto's
   own WABA `2033396113925190` is the one the rig sends from, and a callback URL already set there
   belongs to whatever was using it. Meta allows one callback URL per app, so this is a change to
   the app's own configuration, not an addition.
3. **Set the two values on the demo host**, in `/srv/rocoto/demo.env`:
   `BODEGA_WA_VERIFY_TOKEN` (any long random string, the same one typed into Meta's screen) and
   `BODEGA_WA_APP_SECRET` (the Meta app's own App Secret, from App settings → Basic). Both are in
   `.env.example` and `deploy/staging/demo.env.example`; `BODEGA_BUDDY_LOOP` is there too, unset,
   meaning the hello loop runs. Restart the runtime and the door opens.

## 13 · What is a stub, and the order it becomes real

1. **The closing message on an approved template**, sent through `send_template` from Rocoto's WABA, so
   it reaches a shop that tapped nothing: the payload is written and tested, and it waits on Meta's
   approval and the account's payment method. Free-form inside an opened window is what runs today.
2. **The installable page** — manifest, both icons, standalone, the home-screen act.
3. **Embedded Signup and coexistence** on a second real number beyond Peter's, the 24-hour sync clock
   alarmed.
4. **The history read**, its proposed customers and suppliers reviewed rather than applied.
5. **The referral match**: invitation tokens, E.164 normalisation, the notice back inside the window.
6. **Prep, the record and the export** on the seeded cast: fixture data, real arithmetic, real files.
7. **The payment page per sale** through copper, matched by its reserved amount.
8. **Prometeo** on one consenting seller, which turns `Add your bank account` into a masked account
   and a read time, and leaves the BCP gap named.
9. **Sends from the shop's own number**, the day Advanced Access lands: the fiado reminder and the
   payment message move off `wa.me`, and a customer read out of history becomes reachable.
10. **The pay-later purchase**, the day a lender signs: until then the card carries
    `data-placeholder="pay-later"`, which means undecided, and that is what it is.
