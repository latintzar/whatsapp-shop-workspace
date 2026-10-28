# Messages — every message, the template set, the buddy's thread

This document holds every message the prototype sends on WhatsApp, the templates that go to
Meta now, and the script `#/chat` replays so the buddy's thread can be read on a desk. By the end
a reader knows who sends each message and when, which rail it rides — free-form inside the 24-hour
window, a template, or the shop's own WhatsApp app — the Spanish a Peruvian reads, the legal stage
that releases it, and what the live rig sends today. The master is [DESIGN-SPEC.md](DESIGN-SPEC.md); the screens are in [ONBOARDING-SPEC.md](ONBOARDING-SPEC.md), the read in [WHATSAPP-
HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md), the plumbing in [WIRING-SPEC.md](WIRING-SPEC.md). The
payloads are [messages/templates.json](messages/templates.json), the script [messages/chat-
script.json](messages/chat-script.json), the submitter
[messages/submit_templates.py](messages/submit_templates.py).

The user is a shop: a bodega, a produce stall or a fish stall. The examples name the bodega
fixture world — Bodega Yesenia, Rosa menú, Mayorista San Jorge; a stall reads the same messages
with its own names. Each message says one thing, names the source of any figure it states, and
reads at a counter.

## 1 · What decides a message

Meta's rules, read on 18 September 2026 at `developers.facebook.com`, decide the rail and the price.

- **Three categories.** **Utility** is non-promotional and specific to the person's own order, account
  or transaction. **Authentication** is the only one allowed a one-time code, and Meta writes its words:
  URLs, media and emoji are refused, and the code reaches the primary device. **Marketing** takes the
  rest. **This prototype sends no one-time code** — the WhatsApp connection is the sign-in
  ([ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §2) — so Authentication is a category it stays out of, and
  the rule is recorded here for the day another surface needs it.
- **Mixed content is marketing**, and so is content Meta reads as unclear. Meta's own App Promotion
  example is a referral notice ending in a link to the app. **So the connect link and the shop's own page
  link travel in free-form messages inside the window, and inside no template.** The buyer's payment page
  is the exception, and `payment_request` carries it on a URL button (§5 item 6): that link opens the
  customer's own transaction, which is what keeps the template Order Management rather than App Promotion.
- **Recategorisation has teeth.** Utility→marketing lands with one day's notice, and with none once a
  business has been warned; repeat misclassification ends in every utility template on the portfolio
  turned marketing for 30 days. The controls are the `template_category_update` and `account_update`
  webhooks, with a daily `fields=category,correct_category` GET behind them.
- **Opt-in first, in every category:** the number given, plus permission naming Rocoto.
- **Money, from 1 October 2026.** A free-form message bills as `category: service`: free for the first
  **1,000 delivered per business number per month**, charged after, reset monthly; utility templates
  inside the window stop being free. **Peru's rates are Meta's own card, in USD**, as the company source
  has them (`notes/peru-launch-2026-09/recommendation.md`): from 1 October 2026 marketing **$0.0703**,
  utility **$0.0300**, authentication **$0.0300**, service **$0.0300** per delivered message, and utility
  **$0.0200** on the card in force until 30 September 2026. A soles figure travels beside its exchange rate
  and that rate's date — $0.0300 is S/ 0.0998 at 3.327 PEN/USD on 18 September 2026. The build counts
  deliveries per number and reads `pricing.type`.
- **Names** are lowercase English with underscores. **Language `es`**: name plus language is the unique
  key, so `es_PE` joins later under it, and the Lima register lives in the words.

**Copy law.** Every string Rocoto writes says what is.

## 2 · The way in — the page, and WhatsApp after it

**The shop signs up in the browser.** It opens the page, presses `Continue`, and Meta's own connection
flow runs; the connection is the sign-in, and no message carries a code or a login link
([ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §2). **WhatsApp is where Rocoto stays with the shop
afterwards** (Peter: «whatsapp is the buddy for orientation»): the closing message introduces the buddy,
and §4 is everything it says from there.

**The rig.** On `demo.soyrocoto.com/bodega-pay-later/` Rocoto's own WABA `2033396113925190`, number
`+1 978 958 9459` on Meta's Cloud API and separate from the connected one, sends the closing message
free-form to the number the session holds from the connection, never to a literal. Meta delivers a
free-form message inside an open 24-hour window, and the shop opens that window by tapping
`Message Rocoto on WhatsApp` on the walk's last screen; an approved utility template through
`send_template` is the path that needs no act from the shop (§5, and the submission receipt below). The
module reads `WA_CLOUD_TOKEN` and `WA_CLOUD_PHONE_ID`, answers a named 503 while either is absent, and
takes the token from `deploy/development/provider-env.md`, which is Peter's to supply.

## 3 · Every message

Sender is the number the message leaves from. **Free-form** is a service message inside the window
the other party opened. **Legal**: `cleared` ships today · `lawyer` waits for the lawyer hour ·
`after the lender` waits for a signed entity.

**English is the source**, here as everywhere. The five messages Peter dictated carry theirs, the
first of them across two rows:

| Row | The English source |
|---|---|
| 2 | `Do you want to open your shop in Rocoto? Say yes and I send you the link.` |
| 3 | `Here is your shop in Rocoto: soyrocoto.com/e/a7f2k. The link is yours and it lasts 24 hours.` |
| 7 | `Done, {{1}}. I stay here: I tell you when a supplier of yours joins, when they pay you, and when a payment is due. Your shop in Rocoto is here: soyrocoto.com/e/a7f2k` |
| 8 | `Your supplier {{1}} joined. You now have {{2}} of your suppliers on Rocoto.` |
| §4, payments | `Do you want me to send the payment link to every customer who orders from you?` |
| 15 | `Your export is ready: your sales record by transaction and by customer, from {{1}} to {{2}}.` |
| 18 | `Hi {{1}} 👋 I'm Rocoto. Your business is #{{2}} on the waitlist. Your place and who joined through you are here: {{3}}` |
| 21 | `Below I'll send the message you can forward to other shops and distributors.` |
| 22 | `My business is on the Rocoto waitlist. Rocoto keeps your orders and your payments in WhatsApp. Join through my link and we both move up: {{1}}` |
| 23 | `Hi {{1}}, your business is on the Rocoto waitlist, at place {{2}}. Your place and who joined through you are here.` |

**Rows 18, 21, 22 and 23 ship in BOTH languages.** Spanish is what a shop reads, and the English
above is what a shop that opened the page from the English site reads — the walk keeps the choice on
the business's own row (`language`), so the buddy writes in the language the shop signed up in.

| # | From → to | When | Rail | The Spanish a Peruvian reads | Legal |
|---|---|---|---|---|---|
| 1 | Rocoto → shop | **retired 19 September 2026 (FEED-IA §268)** — the login code, when a code was asked for | `login_code`; free-form in the rig | Meta's own body with the code, its security line, the footer «Este código caduca en 10 minutos.» and «Copiar código» | retired |
| 2 | Rocoto → shop | the shop's first message arrives | free-form | «¿Quieres abrir tu negocio en Rocoto? Dime que sí y te mando el link.» | retired 19 September 2026 (FEED-IA §268) |
| 3 | Rocoto → shop | **retired 19 September 2026 (FEED-IA §268)** — the tokenised link, when a link signed the shop in | free-form | «Acá está tu negocio en Rocoto: soyrocoto.com/e/a7f2k. El link es tuyo y dura 24 horas.» | retired |
| 4 | Rocoto → shop | the read finishes | free-form | «Leí tus chats: {{1}} mensajes, {{2}} clientes, {{3}} proveedores. Acá están los que más probablemente te deben, según tus propios mensajes. Revísalos y me dices cuáles están bien.» | cleared |
| 5 | shop's own app → a supplier | the shop presses a supplier row | `wa.me` hand-off, outside the API | «Estoy usando Rocoto para llevar mis compras y mis pagos. Conecta tu WhatsApp acá: soyrocoto.com/connect?i={{1}}» · the queue clause «Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.» | the link sentences cleared; **lawyer** on the queue clause, which ships with the dated queue-policy file |
| 6 | Rocoto → shop | the shop confirms it sent them | free-form | «Listo. Te aviso cuando entre uno de tus proveedores.» | cleared |
| 7 | Rocoto → shop | the invitations are sent | free-form inside an opened window; `shop_ready`, the same message without the link, where none is open | «Listo, {{1}}. Acá me quedo: te aviso cuando entre un proveedor tuyo, cuando te paguen y cuando toque un pago. Tu negocio en Rocoto está acá: soyrocoto.com/e/a7f2k» · the template's own body: «Listo, {{1}}. Tu negocio ya está en Rocoto. Acá me quedo en WhatsApp: te aviso cuando entre un proveedor tuyo, cuando te paguen y cuando toque un pago.» | cleared |
| 8 | Rocoto → shop | an invited supplier connects | `supplier_connected`; free-form in the window | «Tu proveedor {{1}} ya entró. Ya son {{2}} proveedores tuyos en Rocoto.» | cleared |
| 9 | Rocoto → shop | Monday morning | `statement_ready` | «Tu resumen del {{1}}: {{2}} ventas por S/ {{3}}. En tus fiados confirmados te deben S/ {{4}}, y en tus compras anotadas debes S/ {{5}}. Revísalo y corrígeme.» | cleared |
| 10 | Rocoto → shop | a customer pays on the shop's page | `payment_received` | «Pago recibido: {{1}} pagó S/ {{2}} de la venta {{3}}. Ya quedó anotado.» | cleared |
| 11 | Rocoto → shop | a payment the shop owes falls due today | `payment_due_today` | «Hoy le toca el pago a {{1}}: S/ {{2}}. Cuando lo hagas, mándame el voucher y lo anoto.» | cleared |
| 12 | shop → its customer | a payment link on a sale | free-form; `payment_request` outside it | «Hola {{1}}. Tu pedido de {{2}} sale S/ {{3}}. Toca el botón y ahí tienes el monto exacto y la cuenta de {{4}} para pagar por Yape o transferencia.» · button «Pagar» | cleared |
| 13 | shop → its customer | a sale is recorded | free-form | «Anotado: {{1}}, S/ {{2}}. Gracias, {{3}}.» | cleared |
| 14 | shop → its customer | a fiado falls due | free-form; `payment_request`'s shape outside it | «Hola {{1}}, tu compra del {{2}} por S/ {{3}} sigue pendiente. Te dejo el link para pagar: {link}» | cleared |
| 15 | Rocoto → shop | the shop runs `Sales export` | free-form, the file as a document | «Tu exportación está lista: tu registro de ventas por transacción y por cliente, del {{1}} al {{2}}.» | cleared |
| 16 | Rocoto → shop | the shop asks about SUNAT | free-form, travelling alone | «Tu plata de Yape está en una cuenta del banco, y el banco le informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026.» | cleared |
| 18 | Rocoto → shop | **the first thing the buddy says** — the shop writes after joining, which is what opens the window; also the page's own `/notify` with the fixed kind `waitlist` | free-form | «Hola {{1}} 👋 Soy Rocoto. Tu negocio está en el puesto #{{2}} de la lista de espera. Aquí ves tu puesto y quién entró por ti: {{3}}» | cleared; it states a name, a place and a link, and no rate, fee, amount, term or approval |
| 21 | Rocoto → shop | the same turn as row 18, straight after it | free-form | «Aquí abajo te mando el mensaje para que lo reenvíes a otras bodegas y distribuidores. Cada negocio que entra con tu link te sube de puesto.» | cleared |
| 22 | Rocoto → shop | the same turn, last, **and it travels alone** so one long press forwards the whole of it | free-form | «Mi negocio está en la lista de espera de Rocoto. Rocoto guarda tus pedidos y tus pagos en WhatsApp. Entra con mi link y los dos subimos de puesto: {{1}}» | cleared; it names no amount and no approval |
| 23 | Rocoto → shop | five minutes after the walk's last screen with no message from the shop | `waitlist_hello`, the only rail to a shop that opened no window | «Hola {{1}}, tu negocio ya está en la lista de espera de Rocoto, en el puesto {{2}}. Aquí ves tu puesto y quién entró por ti.» · URL button «Ver mi puesto» | cleared; a place and a page, and no rate, fee, amount, term or approval |
| 19 | shop's own app → a business that owed it, or anyone | the shop presses `Share with them` or `Share my link` | `wa.me` hand-off · the system share sheet, outside the API | English while the design is reviewed: «{{1}} is on the Rocoto waitlist. Rocoto keeps your orders and your payments in WhatsApp. Join through my link and we both move up: {{2}}» | cleared; it names no amount and no approval |
| 20 | shop's own app → Rocoto | the shop presses `Say hi to Rocoto on WhatsApp` | `wa.me` hand-off to `+1 978 958 9459` | English while the design is reviewed: «Hi Rocoto, I just joined the waitlist. My reference is {{1}}.» | cleared |
| 17 | distributor → its shops | on the confirmation the shop's order opened | free-form, the distributor's door | «Conecta tu WhatsApp a Rocoto. Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad financiera supervisada por la SBS. Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.» + `soyrocoto.com/connect?d=<distributor>` | cleared as one block |

**Rows 18 to 23 are the walk of 20 September** ([ONBOARDING-SPEC.md](ONBOARDING-SPEC.md) §0).
Rows 18, 21, 22 and 23 are what Rocoto's own number sends, and the words are fixed in
`mock-api/app/bodega.py`: `/notify` takes a KIND and never a sentence, the webhook takes what the
shop wrote and answers with these three, and the destination is the session's own number or the
number that just wrote to Rocoto. Rows 19 and 20 leave the shop's OWN WhatsApp, so the walk adds no
path that can message a third party.

**The status link is `…/bodega-pay-later/?lista=<CODE>`** — a query rather than a fragment, because
a fragment never leaves the browser and this link arrives in WhatsApp. The referral link stays
`…/bodega-pay-later/#/r/<CODE>`. One is the shop's own place and who joined through it; the other is
the door a new shop comes in by.

**The invitation is one path:** Rocoto composes it, the shop presses send in its own WhatsApp
through `wa.me`. Rocoto writes the words, so Rocoto answers for them, which is why row 5's queue
clause is gated. Sending from the shop's own number is later production work on the two conditions
[WIRING-SPEC.md](WIRING-SPEC.md) §5 owns.

**The fiado reminder states the sale, the amount and the date, and it carries no fee.** Row 14's
body becomes the eighth template, created on the shop's own WABA the day Advanced access lands.

**What the messages say about debt.** Peter: «we wont have how much they're owed reliably. so like
it'll be based on messages history basically.» So row 4 ranks who is **likely** to owe, each row
carrying its reason in words, and it asserts no total; an amount appears where a message states
one, as what the message said. Row 9 adds up the fiados the shop **confirmed** and the purchases
it recorded, says so, and asks to be corrected. Before its confirmation a row is a candidate, and
a candidate reaches neither the record nor a lender.

**Credit law.** Ahead of a signed lender a message carries no credit amount, rate, term, date,
«pre-aprobado» or promise of approval; the queue line ships verbatim, the referral unit is
suppliers, and the lender is named once one signs.

**The SUNAT sentence** in row 16 is byte-exact from `notes/peru-launch-2026-09/facts-
checked-2026-09-18.md`, period and all; «SUNAT ya rastrea todas tus compras por Yape» is false and
appears nowhere. *Correction landed 18 September 2026:* one form stands in all six copies now —
this row, `DESIGN-SPEC.md` § 6, `ONBOARDING-SPEC.md`, [messages/chat-script.json](messages/chat-script.json)
step `export-sunat`, band 6 of `/peru` and the company note:
«…cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026.» The norm reports a balance that
REACHES 7 UIT, so `llega a` is the verb and `pasa de` understated the perimeter; Peru writes the
thousands separator as a comma; the figure leads because `7 UIT` is tax-office vocabulary. The six
copies were byte-compared after the edit, and the band 6 capture is taken only from a build that
renders this string. **No email is ever
asked.**

## 4 · Orientation — the buddy's messages

The critical path ends on row 5. Everything after is orientation, and the buddy is Rocoto on
WhatsApp. It offers one thing at a time, each carrying a link into the page. Every row travels
free-form inside a window the shop opened; where the window is closed a utility template goes
first and the offer follows the shop's reply.

**The buddy's own opening, in the order it happens** (Peter, 20 September 2026). The walk ends on
the page, and WhatsApp is where the shop's place lives afterwards.

| When | What the buddy says | Rail |
|---|---|---|
| the shop writes for the first time, which is what opens the window | row 18 — its place, and the page that holds its place and the businesses that joined through it | free-form |
| the same turn, straight after | row 21, which announces the message under it | free-form |
| the same turn, last | row 22, **alone**, so one long press forwards the whole of it to another shop or a distributor | free-form |
| a later message from the shop | row 18 again, and nothing else, at most once every ten minutes | free-form |
| five minutes after the walk's last screen with no message from the shop | row 23, the template, whose URL button opens the same page | `waitlist_hello` |

The template is the rail for a shop that wrote nothing, because a shop that wrote nothing opened no
window. A shop that writes first is already talking to the buddy, and the template is never sent to
it. Five attempts at most, each refusal backing the next one further off, every send spending the
same day's ceiling every other send spends (`mock-api/app/bodega.py` §7).

**The rest of the orientation**, once the shop is in:

| When | What the buddy says | Rail | Where the link lands |
|---|---|---|---|
| a supplier connects | row 8, then «Ya puedes ver tu lista acá: soyrocoto.com/e/a7f2k» | template, then free-form | `#/money/record` |
| the first sale is recorded, then on yes | «¿Quieres que le mande el link de pago a cada cliente que te hace un pedido?» · «Sí, actívalo» · «Después» · «Listo. Necesito tu número de Yape y el nombre de tu negocio para la página de cobro.» | free-form | `#/money/setup/payments` |
| money lands, or a payment falls due | rows 10 and 11 | template | `#/prep/:saleId` · `#/money/suppliers` |
| Monday, or the shop asks for its sales | row 9, then row 15 with the file | template, then free-form, the file as a document | `#/money/export` |
| the bank account is still empty | «Pon tu cuenta del banco y ahí te llega lo que te pagan.» | free-form | `#/money/bank` |
| a product still carries the family mark | «Ponle foto a tus productos y los reconoces de una.» | free-form | `#/stock/:id` |

## 5 · The template set for Meta

Eight templates, nine array elements in [messages/templates.json](messages/templates.json) —
`waitlist_hello` is submitted in `es` and in `en`, because name plus language is Meta's own unique
key — each posted to `POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates` with
uppercase enums. **`login_code` is retired with the code step it carried (19 September 2026, FEED-IA §268), and it
leaves `messages/templates.json` with it; `shop_ready` takes its place as the closing message's own
rail.** Seven go to Rocoto's own WABA; `payment_request` is created
on **each connected client's WABA** as Embedded Signup completes, which needs `whatsapp_business_management` at Advanced
access. [messages/submit_templates.py](messages/submit_templates.py) posts the file, one line
printed per template; it reads `META_WABA_ID` and `META_SYSTEM_USER_TOKEN`, holds every send while
either is absent, and `--dry-run` needs neither. It pins `v21.0`, `META_GRAPH_VERSION` overrides
it, and a later Graph version takes the same payloads.

1. **`shop_ready` · UTILITY.** `{{1}}` the shop's name; a body alone, no link. **This is the closing
   message's rail** — free-form reaches the shop only inside a window it opened, so the template is what
   arrives with no act from the shop. **Holds** as Account Alerts on the shop's own account. It waits on
   Meta's review and on the WhatsApp Business Account's payment method, and `send_template` in
   `mock-api/app/bodega.py` is the call already written for it.
2. **`supplier_connected` · UTILITY.** `{{1}}` supplier, `{{2}}` count. **Holds** as Account Alerts on
   the shop's own list. **Risk: the highest in the set** — Meta's App Promotion row covers messages
   whose purpose is to get a person acting in the app, which a referral notice meets by purpose alone.
   So it carries a body alone, and it is **submitted expecting MARKETING**: an approved
   marketing template is the one state Meta lets a business appeal. Until it clears as utility the
   notice rides free-form inside the window.
3. **`statement_ready` · UTILITY.** `{{1}}` period, `{{2}}` sales, `{{3}}` total, `{{4}}` owed to them,
   `{{5}}` owed by them. **Holds** because five figures are specific to that account. **Risk:** a period
   with no figures reads as unclear content, which is marketing.
4. **`payment_received` · UTILITY.** `{{1}}` customer, `{{2}}` amount, `{{3}}` sale. **Holds** as Order
   Management, the lowest risk in the set.
5. **`payment_due_today` · UTILITY.** `{{1}}` supplier, `{{2}}` amount. **Holds** as a time-sensitive
   alert on the recipient's own record. **Risk:** a cost or a term entering it turns it into credit copy.
6. **`payment_request` · UTILITY, on the client's WABA.** `{{1}}` customer, `{{2}}` items, `{{3}}`
   amount, `{{4}}` the payee; URL button «Pagar» → `https://soyrocoto.com/pago/{{1}}`, the shop's own
   page carrying the shop's own account, so the money visibly moves from the customer to the shop. The
   button's `{{1}}` is numbered inside its own component, its `example` the value `a7f2k9`.
7. **`connect_invite_peru` · MARKETING.** `{{1}}` the shop's name, `{{2}}` the lender; URL button «Ver
   cómo funciona» → `soyrocoto.com/peru`; the cleared opening, credit sentence and queue line verbatim.
   Submitted now so the day a lender signs there is somewhere to put the identity art. 8.2 requires;
   **sendable once `{{2}}` holds a real supervised entity**, with consent that is prior, express,
   informed and separate from the consent to use the service. Declaring it marketing keeps the utility
   five clean.

8. **`waitlist_hello` · UTILITY, in `es` and `en`.** `{{1}}` the shop's name, `{{2}}` its place;
   URL button «Ver mi puesto» · «See my place» →
   `https://demo.soyrocoto.com/bodega-pay-later/?lista={{1}}`, the button's own variable being this
   shop's referral code (`example` `K7M2QX`). **This is the five-minute hello** (row 23): a shop
   that finished the walk and wrote nothing opened no window, so a template is the one rail left.
   **Holds** as Account Alerts on the shop's own record — it states that shop's own place, which is
   specific to its account. **Risk:** a URL button onto a waitlist page can be read as App
   Promotion, the way `supplier_connected` can, so it is submitted UTILITY with
   `allow_category_change: true` and the recategorisation is survivable — the words stay the same
   and the send stays inside the same daily ceiling. Until it clears, a shop that wrote nothing is
   reached by nothing, and a shop that writes gets rows 18, 21 and 22 free-form.

`allow_category_change: true` sits on every utility submission, because the Graph reference still
says an omitted flag risks `REJECTED` at creation. `upsert_message_templates` with a `languages`
array replaces `language` when `es_PE` joins.

## 6 · The buddy's thread, replayed for design review

`#/chat`, titled `Rocoto on WhatsApp`, plays [messages/chat-script.json](messages/chat-script.json) turn
by turn in the WhatsApp theme, **so the buddy's thread can be read on a desk**: 393 px first, saffron
spent once on the read. Each bubble shows its `standsFor` on a tap, so the templates are visible. It is a
design-review surface, and the shop's own sign-up happens in the page.

**The script opens where the walk leaves off.** Step one is a system turn — «The shop connected its
WhatsApp in the browser. Rocoto writes first:» — and the first bubble is the closing message. The door
turn, the offer of a link, the six-digit code and the in-chat onboarding turns are removed with the code
step they belonged to (19 September 2026, FEED-IA §268).

**The thread the live rig plays is §4's opening**, in this order: the shop writes, the buddy answers
with row 18, then row 21, then row 22 alone; a later message gets row 18 again at most once every
ten minutes; and a shop that stays quiet five minutes gets row 23's template instead. The replay
script is the older opening until `#/chat` is next cut against §4 — the words above are the source,
and `mock-api/app/bodega.py` is what actually sends them.

The file is `{"version": 2, "steps": [...]}`. Each step carries `id`, `about` (what the turn is
about, in the reader's words — «The sign-in code», «A supplier joined» — which is the label the step
list and the line under the thread show, the id staying the address the script writes with), `from`
(`rocoto` · `shop` · `system`, where `system` is the page narrating rather than a bubble), `text`,
`standsFor` (a template name or `free-form`) and `next` — a step id, an array of `{label, to}`
choices the page offers, or `null` at a leaf. Optional: `buttons` (each `{label}`, with `to` where a press
branches), `footer`, `document`, `image`. **The closing message offers four branches**, which are the
four things the buddy does: `Supplier connected`, `Weekly statement`, `Payment links on` and
`Sales export`.

## 7 · What waits — the lender, Advanced access, the lawyer

**The lender.** Three messages wait for a signed entity, written now so the day arrives with copy
in hand.

| From → to | The Spanish, once a lender signs |
|---|---|
| distributor → its shops | «Cuando necesites plazo, págame por Rocoto: pagas a los 30 días el mismo monto, yo cubro el costo y a mí me pagan el mismo día.» then «El crédito lo otorga [entidad], supervisada por la SBS. Los costos después de los 30 días y la TCEA están en soyrocoto.com/peru/terminos.» |
| shop → a supplier | «Te pago por Rocoto: cobras hoy con un descuento de [x]% y yo pago a 30 días. Pon tu cuenta.» — the discount arrives with the ask |
| Rocoto → an approved shop | «Cada proveedor que traes es un proveedor más al que le pagas a los 30 días al mismo precio. El crédito lo otorga [entidad], supervisada por la SBS, y tú eres su deudor. Los costos después de los 30 días y la TCEA están en soyrocoto.com/peru/terminos.» |

Six obligations attach to those words: the lender named in every commercial communication, the shop
told it is the lender's debtor «en cualquier otra comunicación», a name and form leaving reserved
operations to the supervised entity, commissions and expenses wherever terms appear, the permanent
notice on Rocoto's own site (Res. SBS 01747-2026, arts. 4.3.2, 7.1, 8.2), and the TCEA with a worked
example on any quantitative claim (RS SBS 3274-2017). The date is fixed: **Friday 30 October 2026**
— with no term sheet the credit sentence comes off every surface here, row 17 and
`connect_invite_peru` included (`notes/peru-launch-2026-09/gtm.md`, kill criterion 1). Pay-later
stays per purchase at 30 days, so Cedar's advance dialog and term chooser have no message here.

**Advanced access, and the payment method first.** A payment method goes on the WABA before 30
September 2026, or service messages stop on 1 October: that is the closing message, the statement reply
and the export. The same payment method is what the closing message's own utility template waits on,
beside Meta's approval. Coexistence comes first — Tech Provider status, Embedded Signup with session logging,
WhatsApp Business 2.24.17 or higher, a webhook endpoint — and then
`payment_request` on a client's WABA needs `whatsapp_business_management` at Advanced access. Until
it lands the payment link rides free-form on orders that arrive after the shop connects; a customer
read out of history opened no window, so reaching one first needs that template.

**The lawyer hour.** The dated queue-policy file comes first — the rule that every business a shop
brings advances that shop, written in the company repository as INDECOPI's prior substantiation;
until it exists the queue clause stays off row 5. Then the three messages above. Then consent, on
three counts: Ley 29733 for reading a conversation into a record; a separate consent for
`connect_invite_peru`, prior, express, informed and separable from the consent to use the service,
which Meta's own opt-in leaves outside its scope, so it is **blocking**; and the third parties in
the thread, whose names Rocoto writes into rows 8 and 10.

## 8 · Open questions for Peter

1. **The weekly statement**, charged on every send from 1 October. Does row 9 go out from week one, or
   wait for the credit surface it feeds?
2. **Row 5's queue clause**, cleared for distributor-to-shop and the lawyer's first item for
   shop-to-supplier. Does the invitation ship with the two cleared sentences meanwhile?
3. **The closing message's rail.** Free-form once the shop taps `Message Rocoto on WhatsApp`, or a
   utility template submitted now so it arrives with no act from the shop?

## Submission receipt · 19 September 2026

Sent to Rocoto's WhatsApp account `2033396113925190` with the existing system-user token, through `messages/submit_templates.py`. Two payloads were corrected first, because Meta refuses a body that opens on a variable and a URL button whose variable sits mid-path: `payment_received` now opens «Pago recibido:», `payment_request`'s button is `https://soyrocoto.com/pago/{{1}}`, and `connect_invite_peru` opens «Hola {{1}}.» and carries the cleared sentence with "una entidad financiera supervisada por la SBS" in place of a lender variable, so it is the version that may be sent today.

| Template | Category | Meta's answer | Id |
|---|---|---|---|
| `supplier_connected` | UTILITY | PENDING | `1080707121535361` |
| `statement_ready` | UTILITY | PENDING | `1056543670692978` |
| `payment_received` | UTILITY | PENDING | `1567370747932815` |
| `payment_due_today` | UTILITY | PENDING | `1446224017484527` |
| `payment_request` | UTILITY | PENDING | `1791559805328736` |
| `connect_invite_peru` | MARKETING | PENDING | `2176091372937043` |
| `login_code` | AUTHENTICATION | refused: error 10, subcode 2388185, "This WhatsApp business account does not have permission to create message template" | — |

**`waitlist_hello` is written and unsent, in both languages** (20 September 2026). Its payloads are
in the file and `python3 messages/submit_templates.py --dry-run --only waitlist_hello` prints them;
the submission is a person's act, with `META_WABA_ID` and `META_SYSTEM_USER_TOKEN` in hand, and
[WIRING-SPEC.md](WIRING-SPEC.md) §16 holds that checklist beside the webhook's own two values.

The authentication template waits on the account itself (authentication messages are always charged, and the account's payment method is still to be added); until then the rig's code travels free-form inside the window the shop opens, as the door already does.
