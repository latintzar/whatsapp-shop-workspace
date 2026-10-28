# Bodega pay later — the design record

**18 September 2026** · Peter's words: `docs/FEED-IA.md` §268 · Benchmark: `app/src/prototypes/cedar/` ·
The loop: `notes/peru-launch-2026-09/the-loop.md` in the company repository.

The master record: what the prototype is, the journey one shop walks, each area at 393 px and at the desk, the
pictures, the strings, the files to build, the check that proves each claim. A reader who finishes it can build
it and knows what runs live on `demo.soyrocoto.com/bodega-pay-later/` and what is seeded. Screen detail is in the
siblings: [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md), [WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md),
[WIRING-SPEC.md](WIRING-SPEC.md), [MESSAGES.md](MESSAGES.md), [fixtures/README.md](fixtures/README.md).

## 1 · What it is

**The loop, six lines.**

1. A distributor connects its WhatsApp. Rocoto builds its book — which shop owes what, since when — which is
   its list of shops.
2. It tells each shop: pay me through Rocoto. The shop takes 30 days; the distributor is paid the same day.
3. The shop connects and gets its own book, its reminders, its export, its place in the list.
4. It brings its other suppliers: each one that joins is one more it can pay later. The referral unit is
   suppliers.
5. A supplier joins with one field, a bank account, at the shop's first pay-later.
6. The lender funds the 30 days and decides each shop on its own payment record.

**The shop is the user:** a bodega, a produce stall or a fish stall, the three worlds Peter's photographs of
18 September fixed. Her phone is the shop number, the WhatsApp and the Yape, and an email is asked nowhere. The
seeded world is the bodega, Bodega Yesenia in Zárate, San Juan de Lurigancho (`fixtures/README.md`); the
produce stall and the fish stall seed after it (§9 item 7).

**Cedar is the source** of the layout, the four areas, the sheet-plus-conversation pane, the money model, the
bank card, the debtor list, the chase rungs, the payment page. Added: the WhatsApp connection, the read,
the referrals, the place in the list, the record, pay-later.

**What is off, once.** Fiscal documents: a sale is a `Sale` under a generic name, and NubeFact, invoices and
boletas appear nowhere. Cedar's revolving advance — `money-finance.ts`, `AdvanceDialog`,
`#/money/advance/<minor>` — stays out of the bundle, pay-later being per purchase at 30 days. Prep replaces
Sales and is HOME, printing behind its one persistent button. The landing page ships from the site repository,
outside this set. **One shop sells at one price**, so the tarifa chips, the tier registry door and
Administration's price rows leave, and the copied customer sheet drops `customer-profile.tsx`'s `TheirTarifa`
beat and `tiers.ts` (§3 Customers, §7 items 5, 8 and 13).

**The audience rule is a constraint** (Peter: «super simple but still fintech-precise»): one idea and one act
per screen, every figure a count she can recount with its window and its date.

**The kit is the only source** (Peter: «design only with our kit design system. we have it.»): every component
and every token comes from the shared kit and Base under `BaseProvider(RocotoTheme)`, and
`app/tools/theme-gate.mjs` holds that line.

**Credit law, above every surface.** Before a lender signs: no soles figure, rate, term, date, «pre-aprobado» or
approval promise. The cleared sentence ships verbatim: «Los negocios que ya usan Rocoto entran primero, y cada
negocio que traes te adelanta en la lista.» The record reads the shop's own behaviour only; third parties in her
chats are never profiled. The lender is named once it signs.

## 2 · The shop's journey

**The way in is the page, and the WhatsApp connection is the sign-in.** The shop opens the page and presses
one act; Meta's own connection flow runs from there, and a connection this browser can see is what identifies
the shop (the way in is in [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §2, the plumbing in
[WIRING-SPEC.md](WIRING-SPEC.md) §1). A contact picker in place of the connection is rejected. **A
phone-number-and-code sign-in is deleted** (Peter, 19 September 2026, `docs/FEED-IA.md` §268: «the hola was
for something else when we wanted to use whatsapp onboarding»).

Six beats, the first four the critical path, screen by screen in [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md):

1. **Get started**: three rows name the walk, and one act opens the connection.
2. **WhatsApp**: Meta's own flow runs — a message from Facebook, a link, and Facebook's code shown inside
   the flow itself; Rocoto runs Embedded Signup coexistence and asks for the history. **The page asks for no
   number**: Meta's documentation, read 19 September 2026, offers no field that carries the shop's number
   into the WhatsApp Business app connection, so the shop types it on Meta's own screen.
3. **The read**: the book arrives, then who is **likely** to owe it most.
4. **The referrals**: Rocoto proposes the suppliers and composes the message; the shop ticks and presses send
   in its own WhatsApp. **The critical path ends here.**
5. **Orientation**: Rocoto writes once as the shop's agent, then offers one thing at a time.
6. **Free roam**: the four areas, a cover on each first open.

**The connection step on a phone is settled**, and it is a message rather than a scan, step by step in
[ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §3 — **which is the whole of beat 2**. A native shell that
screenshots the QR is the fallback only if §8's phone run shows a QR with no link.

**The buddy.** Peter: «the critical path is getting them to send a referral message, then it's like…
orientation. with a buddy.» The buddy is Rocoto on WhatsApp: the closing message says what it now is, and it
then reports what happens and offers the next thing, each with a link into the page
([MESSAGES.md](MESSAGES.md) §4).

**The debtor rule** (Peter: «we wont have how much they're owed reliably. so like it'll be based on messages
history basically»). Who owes the shop most comes from the messages alone, ranked on the chat's own evidence,
each row carrying its reason in words and an amount only where a message states one, as the message said it;
the evidence rule and its words are in [WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md) §4. One act
confirms or corrects a row, and that confirmation is what the fiado book records.

## The rig

A live rig on `demo.soyrocoto.com/bodega-pay-later/` after merge. Wiring in `WIRING-SPEC.md`, screens in
[ONBOARDING-SPEC.md](ONBOARDING-SPEC.md). Each fact carries its check, and the nine together are §8's rig gate.

1. **The WhatsApp connection is real** through Cedar's connection service: the browser calls the same-origin
   bridge `/api/proof/*` (`mock-api/app/cedar_whatsapp.py`, on `CEDAR_WHATSAPP_BRIDGE_ENABLED` and the allowed
   origin), and Peter connects his own number ending 644. *Check:* `/whatsapp/connect` answers 200 and
   `GET /state` reports it.
2. **The history read is real** — `GET /api/proof/conversations` and `/conversations/{id}/messages`, the
   analysis in the browser. *Check:* the read's counts equal the service's own.
3. **The test ranking rule.** Until the debt read exists the top people are the contacts whose chats hold the
   most «haha» / «jaja», and the screen says so: `Ranked by laughs in your chats for now; the debt read replaces
   this rule.` *Check:* the line is on screen and the top rows hold the most «haha».
4. **The referral list:** top rows first, the rest alphabetical, a search field matching instantly on name and
   number, every row tickable, `Deselect all` available. *Check:* it leaves zero ticked, and ticking
   his mother's row alone opens one `wa.me` hand-off.
5. **Rocoto's own number** — WABA `2033396113925190`, `+1 978 958 9459` on Meta's Cloud API, separate from the
   connected one — messages **the connected number**, read from the connection state, through a new `mock-api`
   module on `WA_CLOUD_TOKEN` and `WA_CLOUD_PHONE_ID` (`WIRING-SPEC.md` §4, the token Peter's to supply).
   **One message travels this way, the closing one**, free-form, which Meta delivers inside an open 24-hour
   window; the shop opens that window from `Message Rocoto on WhatsApp` on the last screen, and an approved
   utility template through `send_template` is the path that needs no act from the shop. *Check:* the send
   leaves for the session's own number; absent the token it answers a named 503.
6. **Reset state.** One control, on the first screen: `POST /api/proof/whatsapp/disconnect`, then every
   `rocoto-bodega-*` key and the rig's server-side session and referral records cleared. *Check:* connection
   and keys gone, `Get started` on screen with the count it removed.
7. **Two bodies of data, one rule each** (`fixtures/README.md`): the chat corpus states quantities, days and
   names, and the money seed holds each amount as a minor-unit integer. *Check:* a grep of the corpus and of
   the read finds no currency token, and every seeded amount is an integer in a `*Minor` field.
8. **The order brain** logs the orders it finds through `POST /api/cedar/orders/parse` on a bounded budget, and
   may mark one as needing a reply where the last message is the customer's. *Check:* they reach `To review`
   with their quotes, a marked one reads `Needs a reply`, a press unmarks it.
9. **The one fixture** is the 503 fallback, local development. *Check:* it is reachable only through that 503
   and draws as `Sample chats`.

## 3 · The areas

`RAIL_ORDER = ['prep','money','stock','customers']`, `HOME = 'prep'`, `AREA_TITLE.stock = 'Products'`, four
seats on the phone rail at 64 px plus Cedar's Administration door. `shell/area.ts` is copied: its `AreaId` union
holds no `prep`. Mobile-first: 393 px first, 361 px of content in 16 px gutters, rows and act bars at 48 px,
`TOUCH_FLOOR` 44, `PHONE_MAX` 559; the desk is Cedar's 1200 px container. Routes: `#/prep`, `#/prep/:saleId`,
`#/money` with `/bank`, `/suppliers`, `/owed`, `/record` (the record and the place in the list, one route for
cards 4 and 5), `/sales/:id`, `/export`, `/setup/payments`, then
`#/stock` and `#/stock/:id`, `#/customers` and `#/customers/:id`, `#/enter`, `#/chat`, and Administration's
**four seats at Cedar's own routes** — `#/admin/business` (this set's `#/admin/shop`), `#/admin/connections`,
`#/admin/app-settings`, `#/admin/data` — the other six seats and the `account` foot leaving (§7 item 5).

**The conversation is a seat in the navigation, and the palette lists only what exists** (19 September).
The chats widget's door was a 56 px accent disc fixed in the viewport's bottom-right corner; a floating
control reserves no room, and it was measured over a row's amount, over a Stock row's only chevron, over the
composer's own send disc at 1440 and over «Open chat» at 1024. §42's law is untouched — the conversation is
still ONLY the widget — and its door moved into the chrome: a `Chats` seat after the places in both rails
(`shell/rail.tsx`) and a sixth seat in the phone's row (`shell/bottom-nav.tsx`), each carrying
`replyOwedCount`, each pressing `openChats()` (`shell/chats.tsx`). The panel's header reads that same count,
so the door and the list can never state different numbers. **Find** is this prototype's own
(`shell/find.tsx`) on Cedar's `PickList`: Cedar's modal builds its groups from Cedar's registry, so it offered
six administration seats this shop has none of and called the home area «Sales». An `#/admin/<seat>` outside
the four rewrites to `#/admin` (`App.tsx`), so the address and the screen agree. **Products and Customers
hold two panes at the desk** — list left, sheet right, the page itself not scrolling — the grammar Prep
already keeps (`areas/stock.tsx`, `areas/customers.tsx`); the phone and the stacked rung keep the push model.
**One connection posture, one source:** `shell/connection.ts` reads the source seam's own `connection()`, and
the Connections seat and the conversation's head both state it.

### Prep — the home

One list of the day's orders under a left-right day toggler, `Today · Saturday 19.09` — the word and the
figures are the clock's, `Today · <weekday> <dd.mm>`, so the seeded Friday lands on whatever day the demo is
opened (`cast-cedar.ts`) — then a full-width
`Location` / `Time` control at 48 px. **Location is the default and the marked one**, in ink. Groups: `To
review` first, then blocks with their counts, `To assign` last, arrival order inside a group; `Time` is one flat
list, oldest first. The row is Cedar's `RiverRow`, and **its state word is the shop's own three** — `Asked
for` while the goods are on the shelf, `Prepared` once they are in a bag with the customer's name on it,
`Handed over` once they have left — which is Cedar's eight states folded at `PREP_STATE_OF`
(`cast-cedar.ts`), with `Re-check` over them where the pick went stale. **One size, one colour, on every
row**: the ⎙ beside the word is the whole of the printed/unprinted distinction, and it carries `Printed` as
its own word. And **counts read `sales`**. The right pane keeps the delivery note with the conversation under it on the dot grid;
**the map leaves that pane** and the row, and on the phone a tap pushes that detail. **One persistent `Print`**,
a 48 px bar above the nav and sticky on the desk, opens `Prep list` in the order shown, `Packing list`,
`Delivery note`; the export
door is renamed `Paper`. **Real:** the sheets, the pane, the brain's orders in `To review`; **seeded:** the day
and its counts.

**The delivery note is a list, at one line per line** (§268, Peter: «the delivery note looks so shit, one item
in it»). A row is 48 px — face, name, quantity, unit, and one `⋯` seat at the right edge holding the note and
the removal, at 44 px, its ink arriving under a pointer and standing at rest on touch. Six lines, `Add line`
and the count all stand at 1440 × 900 and at 393 × 852 without scrolling, with the conversation under them.
**Cedar's paper check is off this pane**: this shop prints ONE list for the day from Prep's own persistent
`Print` and walks it, so a per-order `Check the paper` has no paper to compare. **The conversation widget
states its channel once**, in its own header — the mark, `WhatsApp`, the connection's own word where the
number is still to connect, `Open chat` — and the composer under it carries the writing surface and nothing
else.

### Money — the bank account first

Peter: «We would actually see their bank account to begin with because that's the whole point.» One column at
393 px, five cards. No hero band above the cards: Money's own cover is the dialog on its first open, and the
`referrals` cover bands `Suppliers you brought` alone, its second and last seat.

1. **Your bank account.** Cedar's balance card lifted whole on `useBankCapability`, then `Money in`, labelled by
   source and dated. Both directions — Peter's debits — open at `#/money/bank`, a matched outgoing movement
   being how a supplier payment settles. Unconnected is honest for a Yape-con-DNI seller: the wallet object and
   `Add your bank account`.
2. **What you owe your suppliers.** One row per purchase — supplier, amount, due date, state — the state five
   words in ink rather than colour: `Offered`, `Used`, `Due 24 Sep`, `Settled 12 Sep`, `Late · 3 days`. Before a
   lender only the last three render; the first two unlock with it, over a named seat that says in
   words what will stand there, `data-placeholder="pay-later"` — a grey skeleton means loading here,
   so a seat that waits on a signature carries a sentence instead. A row's `Pay` hands the amount as a `Figure`,
   `Copy the amount` and that supplier's account; settlement is the matched bank debit or her dated `I paid it`.
   The card prints its own rows over its own window, `4 purchases to pay · 1 late`, and the bank-graded figure
   belongs to the record's 90-day indicator. The
   full list is `#/money/suppliers`.
3. **Who may owe you.** The card holds that heading until the first confirmation, and reads
   `Who owes you` from then on. Before confirmation it shows the likely list of §2 — **the same
   `likelyList` over the same reading screen 4 draws**, so a name carries one reason and one printed rule on
   both screens, with the fixture's `whoOwesYou` rows as the seed it falls back to while a read is still to
   run; after it, the fiado book —
   `customerBalances(state)`, top five, each row opening `#/customers/<id>`, Peter's «also linked inside their
   customer sheets» — with `Open all` reaching `#/money/owed` and `Chase now`. **The fiado reminder states the
   sale, the amount and the date, and nothing else**; Cedar's fee rung is dropped. **A payment link is Rocoto's
   own checkout page**, copper at `GET /collect/{request_id}/{token}`, printing the exact amount and her own
   account, one reserved cent per request so a credit matches its sale. `Send a payment link` opens one on
   any amount, and the shop types **what it is for**: that description rides the request, the buyer page, the
   message and the export row (Peter: «you can generate new payment links with the description of everything so
   that you keep stuff logged»), the mechanics in [WIRING-SPEC.md](WIRING-SPEC.md) §9.
4. **Your record.** One word, three counted lines, one act: the level word from a closed set of three shared
   with no other register — `Starting`, `Steady`, `Punctual` — over indicators that each print their count,
   denominator, window and newest reason.

   | Indicator | Definition | Evidence | Window | Floor |
   |---|---|---|---|---|
   | `Paid on the day` | supplier payments settled on or before the day agreed | a matched bank debit, or her dated confirmation | 90 days | 3 graded payments |
   | `Days with a sale` | days carrying at least one recorded sale | `MoneyState` | 28 days, clamped to the connection | 7 days |
   | `Sales with the payment recorded` | sales whose payment is recorded | `MoneyState.receipts` | 28 days | 10 sales |

   **The level rule, printed on the screen.** `Starting` while any indicator sits below its floor. `Steady` with
   all three measured at 80 / 60 / 70 per cent or better. `Punctual` with every supplier payment in the 90 days
   paid on or before the day, plus 80 and 85 per cent. Thirty days with no measured payment steps the band down
   and writes its own line, and an indicator under its floor reads `Unknown · Counts from 3 payments`. Grades
   print per row, `7 of 9 payments confirmed by your bank`, and a floor counts bank-graded events alone, so the
   record stays earnable by a shop Prometeo cannot reach. Points and weights are gone: a weighted total is the
   one part she could not recount. Every level word resolves to a reason line, the trail one `rocoto/memory-log`
   chain; `#/money/record` holds all of it and `Save as a document`, at the record's own block.
5. **Your place in the list.** The cleared line verbatim, her dated facts — `In line since 3 September`,
   `Suppliers on Rocoto · 4 of 9 invited · 2 connected` — and `Your place moves when a supplier you brought joins.` No position
   number, no queue length. Under it `Suppliers you brought` beneath the referral cover: a face, a name, its
   state word from the one set `WIRING-SPEC.md` §5 defines — `Sent`, `Invited`, `Connected` — and its date.
   **Both blocks live on `#/money/record`, which cards 4 and 5 open at their own block**, which is where the
   buddy's supplier message lands (`MESSAGES.md` §4). `Sales export` opens `#/money/export`, **by transaction
   and by customer**, under the true SUNAT sentence.

**Real:** the bank read through copper, the payment page and its matching, the export files, the record's
arithmetic, the `wa.me` invitation. **Seeded:** the payables, the fiado book, the 90 days. **Absent:** `Offered`
and `Used`, the lender name being empty. Desk: bank beside `Money in`, payables beside the list of who owes the shop, the record
wide beside the supplier list.

### Products — made from the orders

Peter: «inventory would be made smartly based on their orders». The catalogue is built from the order lines the
read produced and the shop reviewed; a level is the last count plus or minus the movement since — arrivals off
supplier lines, departures off sales — declared by `StockAnnouncement`, drawn by `StockLevel` with its date and
unit. A face resolves `paintingFor(name)` → `ProductFace` → the `ProduceIcon` family mark. **Every surface
that draws goods climbs that one ladder** — Products, the customer sheet, and the delivery note, whose copied
`detail.tsx` overrides Cedar's exact-binding `ProductFace` at the head of the file, beside the pricing
override, so `plátano de seda` wears the painted banana on the note it wears on the shelf. The tally is
`fixtures/cast-bodega.json` `faces.tally`, run over all thirty names on 18 September: **13 land in the
794-tile library as they stand**, **10 take a Peru alias line** (`palta`→`aguacate`,
`cebolla roja`→`cebolla-morada`, `aceite vegetal`→`aceite-de-girasol`, `tomate`→`tomate-rama`, and six more
in `faces.peruMapBindings`), **1 is held out** — `papa blanca`, because `papa`→`patata` rewrites `papaya` to
`patatya` and hands papaya a red potato, which is why the map is keyed on whole names — and **6 wait for
paint**, the family mark drawing until a tile lands.

**On-the-spot painting** (Peter: «on the spot illustraion matchingn and ideogram generayion»). A product that
resolves to the family mark asks for its own tile through `POST /api/artwork` (`mock-api/app/artwork.py`),
which describes a library tile of the same family, takes that description verbatim, swaps the subject substring
and generates; absent `IDEOGRAM_API_KEY` or `ARTWORK_SHARED_SECRET` it answers by name and the mark stands.
**Real:** the faces, the map and the request. **Seeded:** the products.

### Customers — the book and the sheet

Cedar's book and sheet, less the tarifa beat: the copied `customer-profile.tsx` drops `TheirTarifa` and
`tiers.ts`, one shop selling at one price. What a customer owes is **fiado**, never «credit»: rows read the name,
`3 fiados`, the amount, `Since 2 Sep`, and document numbers leave every string she reads. `CustomerCredit` draws
that customer's fiado block inside the sheet, and Money's rows open it. The names are the shop's own WhatsApp
names, `Rosa menú`, `Elmer taxi`, `Julia 2do piso`. **Seeded:** eighteen customers, replaced per account by a
live read's own names.

## 4 · Rocoto on WhatsApp

**WhatsApp is where Rocoto stays with the shop after sign-up** (Peter: «whatsapp is the buddy for
orientation»). The shop signs up in this page, and from the closing message on, Rocoto's own number reports
what happens and offers the next thing, one at a time, each carrying a link into this build. The page is
where the shop sees its sales, its place in the list, its referrals and its export, and makes a payment
link. Every message — sender, trigger, channel, Meta category, Spanish — and the template set for Meta are in
[MESSAGES.md](MESSAGES.md), the payloads in `messages/templates.json`.

**`#/chat` is a design-review simulation**, titled `Rocoto on WhatsApp`: it plays
`messages/chat-script.json` turn by turn in the WhatsApp theme so the buddy's thread can be read on a desk.
The script is version 2 and opens on the browser sign-up as a system turn, then the closing message
([MESSAGES.md](MESSAGES.md) §6).

## 5 · Pictures

**The rule.** A full-bleed cover belongs where a flow starts, where a feature introduces itself, or on a notice
a person has to read — once, and rare on purpose; lists, sheets, steps and ledgers carry none. The subject is
the surface's own, in a Spanish-speaking place with no lettering. Ornament is banned; icons are linework.

**The five seats, installed** at `app/public/bodega-artwork/hero-{arrival,referrals,money,stock,customers}.png`
(16:9, the phone band) and `hero-<seat>-wide.png` (3:1, the desk band). The hero slot copies Cedar's
`HeroArtwork`, root `/bodega-artwork/`, 3:1 on the desk.

**And three of them serve the sign-up's own choice rows** (ONBOARDING-SPEC.md §0, screen 4): `arrival`
for `A bodega`, `referrals` for `I sell to bodegas`, `stock` for `I sell to restaurants`. A row shows
the trade it names, so a shopkeeper recognises their own before they read a word. No sixth file: the
three seats already drawn carry it.

**YAPE'S PURPLE IS THE THIRD NAMED EXCEPTION** (`rocoto-theme.ts`, `YAPE` and `yapeWash`), on the same
licence WhatsApp's green holds. It reaches ONE surface — the `Connect your Yape` step and the Yape block
of the customer's payment page — and it is a GROUND and a MARK, never a status: a connected Yape and a
Yape still to connect differ by what the screen says. Painting that field saffron would say «Rocoto did
this», which is the opposite of what it means; the shop connects its own Yape.

Each seat's surface, world and subject stand in [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §8: `arrival` the
first screen after the link, `referrals` the referral step and Money → `Suppliers you brought`, and `money`,
`stock` and `customers` each area's first open.

**The style, stated once**, the anchor's own `describe` verbatim with the subject sentences alone changed: a
modern minimalist digital illustration, clean lines, bold flat colours, geometric pale-yellow clouds on a
vibrant blue sky, faces in profile with a calm upward gaze, warm mood.

**The fit.** Each subject is the dialog's own and is composed in the middle band, so the 16:9 phone frame and
the 3:1 desk band show the same whole scene, and the title and body under the picture name what it shows.

**Provenance, in two READMEs:** `app/public/bodega-artwork/README.md` holds the installed seats, their
subjects, the prompts as sent and the lettering-free box each desk band is cut from;
`library/illustrations/README.md` holds the system — which surface earns a picture, the anchor, the
candidates and the receipts.

**Prep carries no cover**: the day's sales are its picture. Each area's cover opens once, in the anatomy image,
title, body, one action. **The objects:** Cedar's 3D set at 88–184 px marks a capability yet to be connected —
the wallet on `Your bank account`, the telephone on the WhatsApp step, the envelope on the export — and leaves
when its data arrives.

## 6 · Strings

English is the source, inline in the TSX and clear of the copy gate's banned list; Spanish is the build-time
transform and a **later** pass (§7 item 20), and its column holds what a Peruvian reads where the string is
customer-facing, pinned verbatim. The legal column is the stage gate: **cleared** ships today, **lawyer** waits
for the lawyer hour, **after the lender** waits for a signed entity.

**Peru writes the thousands separator as a comma**, so every Spanish string and every figure drawn on screen
reads `S/ 38,500` and `2,960`, in this set and in the chat script alike.

| Surface | English source | The Spanish a Peruvian reads | Legal |
|---|---|---|---|
| Get started | `Get started`, `Connect WhatsApp Business`, `See who owes you`, `Invite suppliers`, `Continue` | — | cleared |
| The WhatsApp connection | `Do you use the WhatsApp Business app?`, `Rocoto reads your chats to list who owes you and who you owe. WhatsApp keeps working on your phone, and broadcast lists become read-only.`, `WhatsApp connected`, `Continue` | — | cleared; the Ley 29733 consent wording is the lawyer's |
| The read | `Who may owe you`, `Asked to pay later 4 times · last order 3 days ago · 2 payments seen`, `Ranked by laughs in your chats for now; the debt read replaces this rule.` | «Quién te debe, según tus chats» | cleared |
| The referrals | `Invite suppliers`, `Deselect all`, `Write 5 invitations` | «Estoy usando Rocoto para llevar mis compras y mis pagos. Conecta tu WhatsApp acá: soyrocoto.com/connect?i={{1}}» · the queue clause «Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.» — `MESSAGES.md` row 5, verbatim | the link sentences **cleared**; the queue clause **lawyer**, shipping with the dated queue-policy file |
| The referrals, the promise | `Every supplier that joins is one more supplier you can pay later.` | — | **lawyer**; the sentence that ships today stands beside it: «Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.» |
| Orientation | `You’re on the list` (screen 6), `Your place in the list` (Money's own card), `Add to Home Screen` | the closing agent message, the supplier notice, the payments question, the export offer — each beside its English source in `MESSAGES.md` §3 | cleared |
| Prep, the home | `Today · <weekday> <dd.mm>`, `Location`, `Time`, `To review`, `To assign`, `Needs a reply`, `Asked for`, `Prepared`, `Handed over`, `Re-check`, `Printed`, `12 sales`, `Print`, `Prep list`, `Packing list`, `Delivery note`, `Paper` | «Hoy · <día> <dd.mm>» · «Zona» · «Hora» · «Por revisar» · «Por asignar» · «Por responder» · «Pedido» · «Preparado» · «Entregado» · «Revisar otra vez» · «Impreso» · «12 ventas» · «Imprimir» · «Lista de preparación» · «Lista de empaque» · «Nota de entrega» · «Papel» | cleared |
| Money, the record | `Your money` (the area), `See what you have and what you owe` and `Open Money` (the cover dialog on Money's first open), `Your bank account`, `What you owe your suppliers`, `Who may owe you` (until the first confirmation), `Who owes you` (after it), `Copy the amount`, `I paid it`, `Chase now`, `Your record`, `Starting`, `Save as a document` | the reminder, the sale and the amount and the date with no fee: «Hola Rosa, tu compra del 2 de setiembre por S/ 48.00 sigue pendiente. Te dejo el link para pagar: {link}» | cleared |
| Money, the list, working capital | `In line since 3 September`, `Your place moves when a supplier you brought joins.`, `Working capital`, `Invite more suppliers` (the act on `Suppliers you brought`), the queue line's English source `Businesses already using Rocoto go first, and every business you bring moves you up.` (`fixtures/cast-bodega.json` `money.queue.clearedLineSource`) | the queue line byte-exact, and «Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad financiera supervisada por la SBS.» | cleared |
| Money, the export | `Sales export`, `By transaction`, `By customer` | «Tu plata de Yape está en una cuenta del banco, y el banco le informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026.» | cleared |
| Products | `Products`, `What you sell` (the area), `See what you sell` and `A product list built from your supplier orders.` and `Open Products` (the cover), `Last count 14 Sep`, `24 units`, `Add photos` | «Productos» · «Lo que vendes» · «Se arma con lo que compras.» · «Abrir Productos» · «Último conteo 14 set» · «24 unidades» · «Ponle foto» | cleared |
| Customers | `Customers`, `The people who buy from you` (the area), `See who buys from you` and `See who comes back, what they buy and what they owe.` and `Open Customers` (the cover), `3 fiados`, `Since 2 Sep` | «Clientes» · «Los que te compran» · «Quién vuelve, qué se lleva y qué te debe.» · «Abrir Clientes» · «3 fiados» · «Desde el 2 de set» · the names stay the shop's own, «Rosa menú» | cleared |
| Pay-later, once a lender signs | `Offered`, `Used`, the lender named, the shop told it is its debtor, the SBS notice, the TCEA with its example | — | **after the lender** |

**Every string here says what is**, so this surface adds no entry to `tools/copy-gate-allow.txt`, whose
matching is on whole strings. The set now holds Meta's own words nowhere: the authentication body left
with the code step it carried ([MESSAGES.md](MESSAGES.md) §1).

## 7 · Build plan

Ordered: path · purpose · mode · origin. **copy** renames its storage key; **import** is a relative path from
`../cedar/`. One origin serves `/cedar/` and `/bodega-pay-later/`, so every live store is copied rather than
shared and every browser key is `rocoto-bodega-*`. **`store/keys.ts` is the list, and it is the list
`WIRING-SPEC.md` §11 carries:** what shipped holds nineteen entries rather than the twelve drawn here, because
the copied print queue, the copied export centre, the packing output, the declared stock, the output templates
and the covers each brought their own —
`-money-v1:`, `-supplier-payments-v1:`, `-invites-v1:`, `-stage-v1:`, `-history-*`,
`-whatsapp-selected-v1`, `-money-api-v1:`, `-chase-v1:`, `-prep-order`, `-print`, `-print-journal`,
`-covers-v1`, `-rail-open`, `-export-output-schedules`, `-export-email-provider-receipts`,
`-packing-output-v1`, `-packing-marks-v1`, `-stock-declared-v1:`, `-output-templates-v1:`. `Reset state`
sweeps BY PREFIX rather than by that list, so a store added later is cleared the day it lands. **The runtime pin stays shared with Cedar**: `runtime-client.ts` is imported as it
stands, reads `rocoto-runtime-base`, and `Reset state` keeps it ([WIRING-SPEC.md](WIRING-SPEC.md) §11).

1. `app/bodega-pay-later.html` · the entry page · new · `app/app.html`.
2. `app/vite.config.ts` and `app/tools/build-english-app.mjs` · the rollup input, a `prototype.json`
   emitter · edit.
3. `main.tsx` · Styletron → `BaseProvider(RocotoTheme)` → `App` · new · `app/src/main.tsx`.
4. `App.tsx` · the router, the gate on the desk, the session · copy.
5. `shell/` — `area.ts`, `frame`, `rail`, `day-bar`, `chats`, `threads`, `glyphs`, `printing` · `HOME='prep'`,
   `SEAT.prep='packing'`, `Paper` · copy; `viewport`, `bottom-nav` and `page` imported. `area.ts`'s
   `ADMIN_ORDER` keeps **four seats** — business · connections · app-settings · data, at the §3 routes — and
   drops team, geography, operations, agent, units, plan and the `account` foot, `app-settings`'s and `data`'s
   price rows going with the tarifa.
6. `onboarding/` — `arrival` (screen 1, `Get started`, the rig's one `Reset state`), `connect` (screen 2,
   Meta's own connection, `WIRING-SPEC.md` §1 and §2), `read`, `owed` (screen 4, `Who may owe you`),
   `referrals`, `done` (screen 6, `You’re on the list`), `orientation` · the critical path, then
   orientation · new,
   mounting the connection UI as it stands · `cedar/connections/*`; beside that mount
   `whatsapp-connection.tsx` · the connection screen itself · **copy**, its key renamed
   `rocoto-bodega-whatsapp-selected-v1` · `cedar/whatsapp-connection.tsx` (`WIRING-SPEC.md` §2).
7. `history/read.ts`, `rank.ts` · the analysis, the evidence rule, the laughs rule behind a flag · new.
8. `areas/prep.tsx`, `day-toggler`, `prep-order`, `print-sheet` · the home area, two orders, one print button ·
   new · `cedar/areas/sales.tsx`; `sale` (its `Sale` and `SaleLine`, which is where the record lives), `day`,
   `truck-chip`, `red-flag`, `anchors` and `company` imported as they stand, and `tiers` dropped with the
   tarifa.
9. `detail.tsx`, `source-thread`, `print-queue`, `print-view`, `print-screen` · the note with the conversation
   under it, three sheets · copy. `document-parts.tsx` · the panel's head, a line's name, the print flush and
   the LAYER step · **split out of the copy**, because the paper draws them too: taken off `detail.tsx` they
   chained the whole panel onto every desk route the paper is reached from, which is the half of §8's «detail
   route lazy» a `React.lazy` call alone leaves open.
10. `areas/money.tsx`, `money-overview`, `money-credit`, `payment-settings`, `payment-link-actions`,
    `chase-dialog` · the five cards, the owed list, the rungs with the fee dropped · copy.
11. `sale` (`Sale`, `SaleLine`, `exportState`), `day`, `money-model`, `money-bank-api`,
    `money-bank-capability`, `currency`, `scenario-clock`, `workspace-capabilities`, `export-period`,
    `export-files` · the sale record, the money engine, the bank read, the export · import, and
    `money-model.ts`'s invoice fields — `InvoiceSale`, `state.invoices`, `invoiceForSale` — stay unwritten and
    unrendered under fiscal-off; `money-store`, `money-api` and `chase` each hold a ledger or a bearer, so all
    three are **copied** with their keys renamed — one origin serves both prototypes, and a
    shared key means one editing the other's ledger (`WIRING-SPEC.md` §11). **The copied `money-api`'s import
    repoints to `../cedar/money-runtime.json`**, which already lists this origin, so the copy adds no binding
    file of its own (`WIRING-SPEC.md` §8). **`cedar-channel-api` is copied nowhere**: this shop opens no channel
    workspace, so the copy stood dead while Cedar's own module held the bearer for the onboarding card in the
    rail foot — the card and the copy both left, and the sweep in `tools/test-bodega-money.mjs` keeps them out
    (`WIRING-SPEC.md` §11).
12. `record.ts`, `supplier-payments`, `paylater`, `referrals`, `queue`, `stage`, `regulatory` · pure and
    node-tested: the indicators and the level rule, settled payments, the per-purchase record, invitations with
    tokens, a standing with no `position` · new.
13. `areas/stock.tsx`, `painting-peru.ts`, `product-face-request.ts`, `areas/customers.tsx` · the catalogue,
    the ten whole-name Peru aliases, the on-the-spot painting through `POST /api/artwork`, the book and the
    sheet · copy and new · `cedar/areas/*`, `painting-map.ts`, `mock-api/app/artwork.py`; `customer-profile`
    and `workflow-dialog` come with the sheet, the copy dropping `TheirTarifa` and `tiers.ts`.
14. `hero-artwork.tsx` · the five cover seats, root `/bodega-artwork/`, 3:1 desk source · copy ·
    `feature-artwork.tsx`.
15. `chat.tsx`, `messages/chat-script.json`, `messages/templates.json`, `messages/submit_templates.py` ·
    `#/chat`, the design-review simulation of the buddy's thread, the payloads, the submitter that posts
    them to the Graph · new.
16. `fixtures/cast-bodega.json`, `fixtures/whatsapp-history-v1.json`, `fixtures/README.md` · the bodega world,
    Meta's envelope through the real capture, the world read in words · new · `scenarios/data/cast.ts`.
17. `mock-api/app/bodega.py` · the session minted from the connection, Rocoto's number sending to the
    session's own number · new · `cedar_access.py`. **What shipped is ONE module rather than two**, and it
    carries two routes this plan left out: `POST /api/bodega/session/connection`, which reads the WhatsApp
    connection of this browser's own session and mints the cookie bound to `connection.number`, and
    `GET /api/bodega/session`, which answers who this browser is signed in as from that cookie alone. The pair
    is the rig half of the gate: the desk opens for a connection this browser authorised, because the
    connection service binds its state to the browser's own session (`start/session.ts`, `WIRING-SPEC.md` §1
    and §4).
18. `app/public/bodega/manifest.webmanifest` with `icon-192.png` and `icon-512.png` beside it, `statement-pdf.ts` · the installable
    page, the record as A4 · new.
19. `README.md` · the run command and the document map · new, required by the repository gate.
20. **Spanish: later** — this pass ships English only; when it comes, the table
    `app/src/prototypes/cedar/snapshot/es-bodega.json` and the two edits (the source-root test in
    `app/vite.config.ts`, `SOURCE_ROOTS`/`SNAPSHOT_DIR` in `app/tools/snapshot-coverage.mjs`).

## 8 · Acceptance

**Geometry and paint.** 393 px is the first screen and every claim is read there; 320 px stays usable, a supplier
row taking two lines, an order line putting its quantity on a line of its own under a name that reads whole —
the identity column never ends up narrower than the two figures it yields to, so a product name breaks at a
space and never inside a word — and every `Figure` keeping its unit on its number's line; 1280 px shows Money's two columns
inside the 1200 px container; every pressable is 44 px or more. The first screen paints inside 1.5 s and Prep's list
inside 2 s on a mid-range Android over 4G, the list bounded to one day and the detail route lazy, the artifact
inside `app/tools/bundle-budget.json`'s ceiling, **re-measured for the second entry** on 19 September 2026:
7,782,787 bytes over 118 files under a ceiling of 8,126,464 (`WIRING-SPEC.md` §12 asks the pull request adding
this surface to record the number, and that file is where it is recorded). **«Lazy» is read off a network
trace of the built artifact, never off the `React.lazy` call:** the panel's own chunk stands outside every
route's first paint and arrives with the first order a person opens. Two static edges used to defeat it —
`print-view.tsx` took the head and the line's name off `detail.tsx`, and the export centre took the panel
itself — so both now go through `document-parts.tsx` and the same lazy door.

**Gates,** each proved red on purpose once: `tsc -p app/tsconfig.app.json`, `tools/copy-gate.py`,
`app/tools/theme-gate.mjs`, `tools/repo-gate.py` (a tracked `README.md` from the first commit),
`tools/link-gate.py`, `tools/artwork-gate.py`, `app/tools/bundle-budget.mjs`. This folder joins `snapshot-coverage.mjs` with the Spanish pass (§7 item
20), which is a later pass: this one is English only.

**The paper is this shop's.** Every sheet — the day's sheet, the packing list, the delivery note — heads
with `Bodega Yesenia` over `Yesenia Quispe Huamán · 10419825764`, off `cast-cedar.ts` rather than off Cedar's
`rocoto-app-company` store, whose default is the Barcelona house; the TIME column carries the hour the order
came in rather than a delivery window; and the run divider says the barrio, because the walk is the barrio.

**Tests.** The bundle reaches no `ADVANCE_*` constant, `advanceLimitOf` call or NubeFact route. No string states a credit amount, limit, rate, term or date
while the lender name is empty. The indicators reproduce a worked day-14 reading and the level rule. A new
payment link carries the description the shop typed into its request, its buyer page, its message and its
export row. A product on the family mark asks `POST /api/artwork` once and reads its named refusal while the
key or the house secret is absent.

**The rig gate:** the nine checks above, from a clean state, then `Reset state` and again. **On a real phone
with Peter's number:** the Facebook message, the link, the code, the time zone, and whether the refreshed flow
shows a QR with a message beside it.

**Drives,** Playwright at 393 and 1280: `drives/drive-268-bodega-onboarding.py` walks `Get started`, the
connection, the read, the tick list and the orientation message; `drive-268-bodega-money.py` the cards, the
record and the export.

**Screenshots at 393 px:** `Get started`, the connection, the read with its ranking line, the referral list with
one row ticked, orientation, Prep, a sale's note, Money's five cards, `#/money/record`, `#/chat`, and the five
covers at 393 and 1280.

## 9 · Open questions for Peter

1. **The lawyer hour.** The invitation wording; `Every supplier that joins is one more supplier you can pay
   later.`; the Ley 29733 consent for reading a shop's WhatsApp into credit sizing; the chase rungs and their
   hours; the dated queue-policy file that releases the queue clause on a shop-to-supplier invitation
   (`MESSAGES.md` §7).
2. **The lender.** Its name, the cohort rule, and whether it accepts a confirmation the shop dated beside a
   bank-matched debit. Until it signs, the thresholds are Rocoto's own.
3. **The record.** One level word over three counted lines, the rule printed. Enough of a score?
4. **The likely list.** How many rows, and does a corrected row keep its reason line?
5. **Prep's walking sequence.** Blocks and arrival order as designed here, or the route solver from
   `feat/cedar-prep-routes`, which needs a depot and mapped addresses.
6. **The tick.** Does a shop mark an order prepared, or does the row read the paper?
7. **The three worlds.** The bodega seeds first; which stall seeds second?
8. **The chat disc's corner on a phone.** It is fixed to the viewport's bottom-right (Peter: «why is the
   chat thing not bottom corner of the viewport»), so at 393 px it stands over whatever the scroll puts at
   x 313–369, y 708–764 — on Customers one row's amount, on Prep one row's archive control, at rest. Two
   remedies were built and photographed: a right lane on the phone column (the page gives up 56 px, Prep's
   status wraps under its own row and the day title truncates to «Today · Saturd…»), and a 44 px disc with a
   64 px lane (the same break, 40 px of it). Both cost more than they buy, so the corner stands as designed
   and the disc keeps passing over the rows. The forks, for Peter: the phone page keeps a right lane for the
   disc · the disc takes a seat in the day bar · the corner stays as it is.

## Rejected, one line each

**A contact picker in place of the WhatsApp connection** — Peter's own rejection: it looks referralistic and
yields no book. **Points and weights in the record** — a weighted total is the one part a shop cannot recount.
**A fourth `setup` indicator** — connecting things is setup, and buyable. **A position number or queue length** —
dropped on Peter's read of 18 September. **A soles reward for an invitation** — the referral unit is suppliers.
**`Share with lender`** — no consent basis exists yet. **A Play Store tester email** — the page installs itself. **A right lane for the chat disc on the phone** —
measured at 393: the page gives up 56 px and Prep's rows break in two (§9.8).

