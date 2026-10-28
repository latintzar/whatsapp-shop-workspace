# The WhatsApp history read

**18 September 2026** · Peter's words: `docs/FEED-IA.md` §268 · The master: [DESIGN-SPEC.md](DESIGN-SPEC.md) ·
The screens: [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md)

One sentence holds it: **Meta hands over the shop's one-to-one chats once, Cedar's connection service keeps them
encrypted in that account's own store, the browser reads the conversations and messages into counterparties,
orders and money, and every figure that reaches the record or a lender is either a provider fact or a candidate
the shop confirmed.** A reader who finishes this knows which endpoint and field carries each part, how the
likely list is built from messages alone, what the rig ranks by today, and the check that proves each claim. The
files are `history/read.ts` and `rank.ts`.

---

## 1 · What arrives from Meta

**The request is one-time and Meta owns its outcome.** Inside `POST /api/proof/whatsapp/connect`, on the
documented coexistence finish event alone, the server fires the contacts sync and then the history sync —
`POST {number_id}/smb_app_data` with `sync_type: smb_app_state_sync`, then `sync_type: history`
(`app/src/prototypes/cedar/connections/proof/service.py`, the `connect` handler) — the second only where the
browser sent `historyRequested: true`. The consent screen is Meta's own, so the UI states the result and asks
once. An
accepted operation persists, an uncertain one is held for reconciliation, and a retry press replays the local
projection.

**What the payload carries.** One-to-one chats, up to 180 days, groups excluded — Meta's rule, checked against
the one real run's range, 12 March to 9 September. It arrives in chunks under `field: 'history'` —
`value.history[]`, each carrying `metadata.progress`, `errors[]` and `threads[].messages[]` — plus loose
`value.messages[]` as assets. A thread names its counterparty by `context.user_id`, an opaque provider id rather
than a phone; the contacts sync carries `contact.user_id`, `phone_number` and `full_name` (or `first_name`), and
the two join by exact opaque identity, by digits nowhere.

**A picture arrives as a placeholder.** The projected row carries `kind: "media_placeholder"`, and
`mediaAvailable` stands in `app/src/prototypes/cedar/connections/types.ts` while the projector writes `false` on
every row: media retrieval and custody are separate work. A Yape screenshot is a picture whose amount comes from
the words beside it, and **the read counts media as what it is** — the pictures and the voice notes the chats
hold, which screen 3 prints. A placeholder carries no words at all, so a count that asked its words whether they
read as a receipt counted none of the 224 pictures on the one real account.

## 2 · The endpoints, the fields, and where each layer lives

Every path below exists now, reached same-origin through the bridge (`mock-api/app/cedar_whatsapp.py`,
[WIRING-SPEC.md](WIRING-SPEC.md)), which permits these routes alone and forwards `after`, `before` and `limit`
alone.

| Call | What it returns, field by field |
|---|---|
| `GET /api/proof/state` | `history.status` in `idle · waiting · syncing · complete · declined · interrupted`, `history.progress`, `history.messages`, `history.conversations`, `history.oldestAt`, `history.newestAt`, and `connection{wabaId, phoneId, number, name, workspace?}` — polled for the counts and the range |
| `GET /api/proof/conversations` | `conversations[{id, name, number, lastMessage, lastAt, count}]`, newest activity first, the complete list — the ledger and the ranking input |
| `GET /api/proof/conversations/{id}/messages` | `messages[{id, direction, text, kind, timestamp, historical, mediaAvailable}]` and an opaque `nextCursor`; `limit` up to 100, older pages through `before` |
| `POST /api/cedar/orders/parse` | `{text, sourceEvent, referenceDay, customerId?, products[{id,name,unit}]}` → `{isOrder, needsReply, deliveryDay, lines[{rawText, item, qty, unit, productId, confidence}], mode, evidence{model, ms, tokens}}`; a workspace bearer, separate from the WhatsApp cookie |
| `POST /api/proof/whatsapp/disconnect` | drops the subscription and active authority, keeps the encrypted identity, workspace and history — `Reset state` |

`progress` is Meta's view of its own sync, and local projection is a separate fact: a chunk landing after
`progress 100` holds the status at `syncing`, and a failed projection reads `interrupted` even where Meta
reported 100.

**The layers.** The server holds Meta's envelope, the messages and the contacts in four sealed tables — `inbox`,
`messages`, `contacts`, `operations` — one SQLite store per connected account
(`app/src/prototypes/cedar/connections/proof/storage.py`), every row Fernet-sealed. The browser holds the
reading — meanings, roles, candidate lines and amounts, the ranking — under
`rocoto-bodega-history-*`, and the book under `rocoto-bodega-*`. **The analysis cursor is held apart from the
raw messages**, so a re-read is idempotent.

## 3 · The read, conversation by conversation

### The counterparty

Four roles: **customer · supplier · both · other**, each proposed with its evidence until the shop confirms.
Goods direction ranks first — who asks and who confirms. Money direction is next: a receipt the shop received
against one the shop sent. The contact name is third: a trade word in `full_name` (`distribuidora`, `mayorista`,
`abarrotes`) proposes a supplier. The word is read in the shop's own language, because it is quoted out of a name
the shop wrote; it is EVIDENCE for the role always, and a row PRINTS it only where the name leaves the trade
unsaid — «Elsa · puesto 214» reads `mercado`, «Distribuidora Aurora» says it already. Rhythm is last: few large weekly amounts read as supply, many small ones as
counter trade. `both` stays both; `other` holds family and neighbours. The confirmed suppliers feed the referral
step, whose unit is suppliers. Third parties are profiled nowhere: the role sorts the shop's own book, and what
it learns stays in that account.

### The kinds a real account writes

`kind` is the provider's own `type`, written through by `upsert_message` (`connections/proof/storage.py`), which
also takes the words out of `incoming[type]` — `body`, `caption`, `filename`. Peter's own connected number, read
on 19 September, answered with `text` · `media_placeholder` · `edit` · `errors` · `audio` · `location` ·
`contacts` · `unsupported` · `document` · `reaction` · `interactive` · `image` · `sticker`, so the read knows
that set by name and gives three of them their own rule:

| Kind | What the read does with it |
|---|---|
| `media_placeholder` · `image` · `video` · `sticker` | counted as a picture whose bytes stayed at Meta; its words, where it has any, read as any other message's |
| `audio` | counted as a voice note, the same way |
| `errors` | passed over entirely — the row holds a provider error rather than a message, so it swells no count |
| `edit` | the corrected text of an earlier message: it lands ON the newest earlier message from the same side of the chat and is a message nowhere, so a laugh or an order is counted once. A correction with no message before it is read once, as itself |

### The meaning of a message

The meaning is Rocoto's reading, held beside the message id, one of six.

| Meaning | What it is | What it yields |
|---|---|---|
| `order-received` | a customer places or changes an order | lines: item, quantity, unit, delivery day |
| `order-placed` | the shop orders from a supplier | a purchase, and that supplier's trade |
| `receipt` | a Yape, Plin or transfer voucher | a method, a time, an amount where the words carry one |
| `fiado-note` | «te debo 12», «mañana te pago» | an amount owed, with its date |
| `price` | a supplier's price or list | a dated price on a product |
| `noise` | a greeting, a sticker, a finished exchange | the count alone |

### Amounts, dates and items

The extractor is the order brain already built (`mock-api/app/cedar_order_intake.py`), whose prompt allows only
words present in the message, a `productId` from the supplied catalogue, and `confidence: low | medium | high`.
**Then the server distrusts the model.** `read()` drops any line whose `rawText` is absent from the text, nulls
a `qty` other than a finite positive number, nulls a `productId` outside the supplied set, defaults an unknown
confidence to `low`, and drops `deliveryDay` where `deliveryRaw` is absent. An order whose every line is dropped
returns `isOrder: false`, so a hallucinated order disappears by construction; an order that keeps a line returns
`needsReply: true`, and the shop unmarks it.

- **Amounts.** `S/ 12`, `12 soles`, `12.50`, `s/12`: the quote carries the digits, cents ride `roundingMinor` in
  `money-model.ts`, and the row keeps its quote beside the figure.
- **Dates.** Relative words resolve against `referenceDay`, the current Peru day from `scenario-clock.ts`.
- **Items.** The catalogue is made from the orders themselves: the first pass is sent an empty `products` list
  and returns `productId: null` with the customer's words intact, the reviewed lines become the catalogue, and a
  second pass grounds against it. Faces come from `painting-peru.ts`.
- **The budget.** `cedar_source_budget.charge` allows 20 reads per workspace per clock hour and 100 across all,
  answering 429 beyond that, so a browser prefilter picks what reaches the model: a numeral, a currency token, a
  unit word, a quantity pattern, or a reply to one, in bounded batches per conversation, oldest first.
  Historical analysis proposes; it replays an old order as a new customer action nowhere.

## 4 · Who owes the shop — the likely list

Peter fixed the rule: «we wont have how much they're owed reliably. so like it'll be based on messages history
basically.» **The list is built from the messages alone.**

- Rows rank who is **likely** to owe, on the evidence in the chat: fiado asked for, orders with no payment
  message after them, how recent the last order is, how often it repeats. **While the rig's test rule stands
  the field is every chat that holds a laugh** rather than the customers that evidence names (§5).
- Every row carries its reason in words — `Asked to pay later 4 times · last order 3 days ago · 2 payments seen`
  — and one act confirms or corrects it. An amount appears where a message states one, as what the message said:
  `Said «te debo 12» on 4 Sep`.
- **No total is asserted anywhere.** The heading says `may` until the shop confirms.
- **The screen draws the top eight, whichever rule ranked them** (`OWED_ROWS` in `rank.ts`). The heading claims
  the people who most likely owe, so the list is a shortlist the shop reads and decides in one sitting; a caller
  that wants the whole field asks `likelyList` for its own row count. Every row's reason therefore has to read as
  its own person — a sentence two rows share is a list that reads as written rather than as read, so the sample
  world scripts each thread's asks, last order and payments seen separately (`source/index.ts`).
- **The confirmation is what the fiado book records.** Before it the row is a candidate, and a candidate reaches
  neither the record nor a lender. A corrected row keeps its reason line as the record of where the figure came
  from.

It appears twice: screen 4 of [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md), before the suppliers step, as faces with
overlays; and in Money, where the card reads `Who may owe you` until the first confirmation and
`Who owes you` after it — the likely list before, the fiado book from then on.

## 5 · The test ranking rule

Until the debt read exists, the rig ranks by laughs: the top people are the contacts whose chats hold the most
«haha» and «jaja» in the fetched pages, and the screen says so in one line, directly under its sentence and
above the list, so the switch stays visible — `Ranked by laughs in your chats for now; the debt read replaces
this rule.` It lives behind one flag in `rank.ts`, beside the evidence rule that replaces it.

**The rule reaches the candidates, not only their order.** Peter tests the live rig with his own personal
number — «the numbers it will show in this case as my biggest debtors would be my mom and my dad — mama and
papa… if you wanna derive the "top" numbers you can make the script analyse the ones with the most "haha"'s
and serve those?… then we'd send JUST my mom's number though the referral. Maybe we can sort the rest
alphabetically and put a search at the top with elastic so that i can tick other numbers too» — and a chat of
family holds fiado notes and purchases nowhere. So while this flag stands, **every chat that holds a laugh is a
candidate**: screen 4 draws the top eight and each row reads its laughs in words,
`31 laughs in your chat · last message 2 days ago`, with the fiado asks and the payments seen after them where
the chat holds any; screen 5 lists every contact the read produced, the top five ticked and the rest under them.
The evidence rule's own narrow field — the customers whose chats show fiado asked for or an order with the payment
message missing after it — returns the moment the flag flips, and both paths are tested.

**The laugh is the candidate's own evidence, so a chat with none is no candidate.** That account holds 103 chats
with no laugh at all out of the 120 the read fetched, and eleven laughs in the top one: rows reading `0 laughs in
your chat` under a heading claiming the people who most likely owe are the rule printing its own silence. Screen
4 therefore draws the chats that hold a laugh, up to eight, and where fewer than three do it says so in one
sentence — `2 chats hold a laugh, so this list stays short.` — and `Continue` stands as it always did
(`LAUGHS_FLOOR` in `rank.ts`). A referral row with no laugh reads when its chat last spoke instead.

**And the list's own order puts the people first.** 68 of the 129 chats on that account carry no contact name, so
`storage.py` falls back to the digits (`name or data["number"]`) — and digits sort above `A` in every collation,
which put eleven-digit strings on the first page of screen 5. A reading therefore carries `named`, every
alphabetical list holds the named contacts A–Z and then the numbers newest activity first, a tie in the laughs
ranking puts a name before a number, and an unnamed row draws its number in international form — `+34 612 345
678`, the country code and then groups of three — with a person glyph in place of initials.

**The pages the laughs are counted over, bounded:** three pages per chat and the bridge caps a page at 100
messages, so at most 300 messages from each chat and at most 120 chats — a personal history of years finishes
in a minute, and the screens draw what has landed after every chat.

## 6 · The book that comes out

| The book | Built from |
|---|---|
| Sales per customer | `order-received` lines, with counter receipts matched |
| Purchases per supplier | `order-placed` lines |
| Owed to the shop, since when | confirmed fiados, and sales with the payment still to record |
| Owed by the shop, since when | purchases still to pay, as pay-later per purchase at 30 days |
| The suppliers list | confirmed supplier roles: name, the trade word where the name leaves it unsaid, purchases in the window, last order, face |

A sale is a `Sale` under a generic name: fiscal documents are off, and NubeFact, invoices and boletas appear
nowhere. A voucher becomes a `Receipt{method, source, reference, status}`, `matched` where the sale is
collectible and the currency agrees, `review` with its reason otherwise. Faces are `CustomerFace` initials
discs: the contacts sync carries the id, the number and the name.

**The record reads the shop's own behaviour only** — the three indicators, their windows, their floors and the
printed level rule of [DESIGN-SPEC.md](DESIGN-SPEC.md) §3. Before a lender signs: no soles figure, no rate, no
term, no date, no «pre-aprobado», no approval promise. The queue line ships verbatim: «Los negocios que ya usan
Rocoto entran primero, y cada negocio que traes te adelanta en la lista.»

## 7 · Confidence and review

- **Asserted** — provider facts and arithmetic over them: the message and conversation counts, the date range, a
  counterparty's number and name, a message's timestamp, a bank-read payment.
- **Candidate** — everything the model read: lines, amounts in text, fiado notes, prices, a role, a trade. Each
  carries its quote, its conversation and message ids, and its confidence, and sits in `To review`, the first
  group of Prep, until the shop presses.
- **Left out** — pictures and voice notes whose bytes stayed at Meta, group messages, rows the provider recorded
  an error for, and anything a message left unsaid. Each is counted where the shop reads the count, so a gap is a
  stated fact.

**The gate:** a figure that reaches the record or a lender's document is asserted, or is a candidate the shop
confirmed.

## 8 · Sample chats

The fixture is the fallback where the bridge answers 503 in local development, and the UI names it
`Sample chats` then. `fixtures/whatsapp-history-v1.json` is Meta's own envelope — `entry[].changes[].value`,
`field: 'history'`, `value.history[]` chunks with `threads[].messages[]` and `metadata.progress`, plus
`smb_app_state_sync` contact items — so it replays through the real capture and projection: the read under
demonstration is the shipped one. **2,960 messages across 27 threads, 22 March to 18 September** — the fixture's own figures, the 180 days
coexistence hands over, the bodega world of [fixtures/README.md](fixtures/README.md), **carrying no price
anywhere**. The live run's `2,214 messages · 112 conversations · since 12 March` belongs to Peter's own
number on 9 September ([WIRING-SPEC.md](WIRING-SPEC.md) §2), and each path prints the counts of the account
it read. The three states come from the data
rather than a UI flag: rising `metadata.progress` gives `syncing`; error code `2593109` in a chunk gives
`declined`; a thread whose `context.user_id` has no contact event parks in `identity_waits` and gives
`interrupted`, with the saved messages standing.

**Every read state continues** to the likely list and the suppliers step: a declined history leaves the contacts
sync, so suppliers are proposed from names and numbers.

## 9 · Privacy

**Consent at the moment of connection.** One screen before Meta's own, in Spanish, naming the purpose, what is
read (one-to-one chats, up to 180 days), who sees it (the shop's account), how long it is held, and the act that
ends it. Ley 29733 wants consent that is prior, informed, express and purpose-specific; the wording is an item
for the lawyer hour.

**Held encrypted, server-side.** Fernet over every row, in that account's own store. Tokens and
message text stay out of browser storage; the browser holds the reading and the book. `Reset state` disconnects,
clears every `rocoto-bodega-*` key and the rig's session and referral records, and stays on the first screen,
`Get started`, printing what it cleared. Disconnect
keeps the encrypted identity, workspace and history, so a reconnect reopens the same store — **erasing the
history is a separate act**.

## 10 · Strings

English is the source; the Spanish column holds what a Peruvian reads; the legal column is the stage gate. The
read screen's own state strings stand in [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) screen 3.

| Surface | English | Spanish | Legal |
|---|---|---|---|
| The read | `Found in your chats` · the live run's `2,214 messages · 112 conversations · since 12 March`, the fixture's `2,960 messages · 27 conversations · since 22 March` | «Encontrado en tus chats» · «2,214 mensajes · 112 conversaciones · desde el 12 de marzo» · «2,960 mensajes · 27 conversaciones · desde el 22 de marzo» | cleared |
| Media | `224 pictures` · `9 voice notes`, the counts the account read holds | «224 fotos» · «9 notas de voz» | cleared |
| The likely list | `Who may owe you` · `Add the amount you remember for each one.` · `Add the amount` · `Change the amount` | «Quién te debe, según tus chats» · «Confirma los que estén bien.» · «Confirmar» · «Corregir el monto» | cleared |
| A row's evidence | `Asked to pay later 4 times · last order 3 days ago · 2 payments seen` · `Said «te debo 12» on 4 Sep` | «Pidió fiado 4 veces · último pedido hace 3 días · 2 pagos vistos» · «Dijo «te debo 12» el 4 de setiembre» | cleared |
| The rig's rule | `Ranked by laughs in your chats for now; the debt read replaces this rule.` | «Por ahora ordenado por las risas en tus chats; la lectura de deudas reemplaza esta regla.» | cleared |
| A short list | `2 chats hold a laugh, so this list stays short.` | «2 chats tienen una risa, así que esta lista es corta.» | cleared |
| A row with no laugh | `last message 3 days ago` | «último mensaje hace 3 días» | cleared |
| The fallback | `Sample chats` | «Chats de ejemplo» | cleared |
| The queue | «Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.» | ships as written | cleared |
| The promise | `Every supplier that joins is one more supplier you can pay later.` | held | lawyer — the queue line ships today |
| The lender | a lender name, a rate, a term, a figure | held | after the lender |

## 11 · Measures, and the check for each

| Measure | Target | Check |
|---|---|---|
| The counts on screen | equal to the service's own | the read screen against `GET /api/proof/state` `history.messages` and `history.conversations` |
| Role, and amounts in receipts | 95 and 98 per cent | 100 conversations hand-labelled before the read, then diffed |
| The likely list | a reason on every row, no total on screen | the rendered list at 393 px; grep the stored reading for an asserted total |
| Projection integrity | zero pending, zero failed | the service's own counts after replay |

Acceptance also carries **the real run: Peter's own number ending 644, verified on a real phone**, the history
consented on Meta's screen, with the counts and the likely list read off that account
([DESIGN-SPEC.md](DESIGN-SPEC.md) §8).

## Open questions for Peter

1. **The consent wording** under Ley 29733 for chat content that feeds credit sizing — the lawyer hour.
2. **Media custody:** retrieving a Yape screenshot's bytes and reading its amount. While it waits, receipt
   amounts come from text and the screen prints how many stayed as pictures.
3. **The confirmation act** on the likely list: one press per row, or a press plus the amount each time.
4. **The reason line after a correction:** keep it beside the shop's figure, or retire it.
5. **The roles on a personal account.** Read against Peter's own number the classifier proposed 42 suppliers and
   9 customers out of 120 chats, because an outbound ask in ordinary conversation reads as an order placed and a
   name naming a trade is decisive. The rules stay as §3 states them for a bodega's own chats, and nothing under
   the laughs rule reads a role — both screens take every chat — so the question is whether the shop's own
   confirmation is the only cure or the classifier needs a bodega-only signal before it proposes anything.
