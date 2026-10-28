# Onboarding — the critical path and the orientation

This document specifies how a shop gets from the first screen to a sent referral, screen by screen,
and what happens after. By the end a reader knows the way in, the six screens with their titles,
sentences, acts, states, fixture/real boundary and picture register, the voice the walk is written in,
every string with its legal status, the five cover seats, and what the live rig does on each screen. The
master is [DESIGN-SPEC.md](DESIGN-SPEC.md); the messages are [MESSAGES.md](MESSAGES.md), the read
[WHATSAPP-HISTORY-SPEC.md](WHATSAPP-HISTORY-SPEC.md), the plumbing
[WIRING-SPEC.md](WIRING-SPEC.md).

## 0 · THE WALK AS OF 20 SEPTEMBER (evening) — this section overrides everything below it

Peter's words are verbatim in `docs/FEED-IA.md` (§268, the entries of 20 September, evening). What
ships today is the WAITLIST: a place, a referral link, and the things that already work (the Yape link
sent in the chat, sales written down, who owes whom). Tabs that collect themselves, digital receipts
and paying the supplier later are PLANNED (October, November, December) and are only ever named as
planned. English for now. Phone only: every screen is designed at 390 × 844 and checked at 360 × 740.

**The pattern of every screen:** a STAGE in the upper part — a picture or a live visual, full-bleed
edge to edge and up to the top of the phone, never shorter than its floor and taking every pixel the
rest leaves — the title and at most
one sentence under it, and ONE primary act in a bar anchored at the foot (safe-area aware, full
width, 56 px, above the home indicator), with at most one quiet secondary («Skip for now») above or
beside it. Base Web components and tokens only. The energy is high from the first screen to the last:
it feels like joining something.

| # | Screen | Upper part | Title · sentence | Foot |
|---|---|---|---|---|
| 1 | **Join the waitlist** | THE COVER AS A STAGE — the bodeguera, full-bleed to the top of the phone | `Join the waitlist` · Peter's own paragraph, verbatim, as ONE paragraph: what the connection is for and what Rocoto learns from it | `Connect WhatsApp` (`Reset state` stands behind `?dev=1`) |
| 2 | WhatsApp connection | Cedar's walk while the account is still to link; once linked, a PAPER STAGE with the tick and the account on it | `WhatsApp connected` | `Continue` |
| 3 | **You're on the waitlist** | AN INK STAGE, and THE PASS LANDS on it carrying the place («#1,204»); confetti bursts over the stage alone | `You're on the waitlist!` · «Bring another business and you move up.» | `Confirm details` |
| 4 | Your business | THREE FULL-WIDTH PICTURE TILES sharing every pixel the words leave; then the name typed over the shop's own pass on an ink stage | `What is your business?` — `A bodega` · `I sell to bodegas` · `I sell to restaurants`; then its name (one field, prefilled from the WhatsApp Business profile when the connection reports it) | `Save my business` |
| 5 | Your address | autocomplete as you type (the API's `address_suggestions`, Peru, session-token'd), then THE MAP FULL SCREEN — Google's, muted to this theme, or a drawing of Lima where no key answers —  with the pin, a card at the top carrying the name and the address, and the act at the foot; the pin can be dragged | `Where is it?` | the arrow: `Confirm this address` |
| 6 | Your orders, in the app | A PAPER STAGE under a quiet accent wash, the handset taking its whole height and running off the bottom edge, with the delivery note animating in (the real order detail, lifted, never drawn) | `Your orders appear here` · «Every order from your chats becomes a delivery note you can prepare and print.» | `Next: your Yape` |
| 7 | Connect your Yape | A STAGE IN YAPE'S OWN PURPLE, full-bleed to the top, their name set large in white on it and the shop's QR on a white tile that lies at −4° until the number is one Yape would accept | `Connect your Yape` · «Rocoto sends your Yape link in the chat when a customer orders.» The shop gives its Yape number and a photo or screenshot of its Yape QR; both are stored with the business | `Connect my Yape` · quiet `Skip for now` |
| 8 | (only for «I sell to bodegas / restaurants») Who owed you | the read's likely list, as pictures of chats | `These businesses have owed you` · «Share Rocoto with them. The message goes from your WhatsApp when you say so.» | `Share with them` · quiet `Skip for now` |
| 9 | Bring businesses | AN INK STAGE: the pass, complete, and under it THREE SEATS («3 businesses = 1 more covered purchase»); the invitation drawn as an outgoing WhatsApp bubble | `Move up the list` · «Every three businesses that join through you cover one more of your purchases.» | `Share my link` (the system share sheet, the referral link with its code) |
| 10 | Done | AN INK STAGE: the pass, complete, and confetti again, smaller | `You're in` | `Say hi to Rocoto on WhatsApp` → `https://wa.me/19789589459?text=…` carrying the business's reference |

### THE PASS — the object the shop receives, and then completes

**What it is.** A dark card carrying this business's membership of the waitlist: `ROCOTO WAITLIST`,
the business's name, what kind of business it is, where it is, its place, its reference, and a Yape
chip once it has connected one. It is drawn by one component, `start/pass.tsx`, and it is the SAME
object on every screen that shows it.

**Why it exists.** Six screens were a small object floating in a white void, and the celebration was
a number on white: nothing was RECEIVED, so nothing felt joined. The pass is the thing the shop is
given at the waitlist moment, and `Confirm details` is literally the rest of its own card being
filled in. A person watches their own card get built — the dating-app profile mechanic — and every
answer appears on it before they have put the phone down.

**Which screens draw it, and what fills when.**

| Screen | The pass | What is filled by then |
|---|---|---|
| 3 · You're on the waitlist | LANDS — from 40 px above, rotateX 18°, at 92%, settling on `SPRING.land`, then an endless 2° tilt | the place (counting up on the card) and the reference; every other line is a dim BAR |
| 4 · Your business, the name pane | stands still, and the field MIRRORS onto it as the shop types | the trade, then the name as it is written; the keyboard shrinks it to name and place |
| 9 · Bring businesses | complete, smaller, with the three seats under it | the address and the Yape chip have joined it |
| 10 · You're in | complete, landing again under a smaller burst | everything the walk asked for |

**An unfilled line is a BAR, never a blank**, so the card visibly has things left to fill; the moment
a line is known it wipes in from the top with an 8 px rise on the walk's own springs. A long name
shrinks a step at a time to 18 px and then ellipses, so the name is always one line. Stillness draws
the card complete and keeps it still.

**THE STAGE** is the frame the pass stands in, and every screen with a visual has one
(`start/walk.tsx`): the upper part, full-bleed edge to edge and up to the top of the phone with the
progress row drawn OVER it in the stage's own ink, holding a floor of the screen's height — 44% at
390 × 844, 38% at 360 × 740 — and absorbing every pixel the words and the act leave, so there is no
white between the picture and the sentence to begin with. Four tones, asked for by name: `ink` (the
pass), `yape` (screen 7, and that screen alone), `paper` (a drawing of the product, screens 2 and 6)
and `picture` (a photograph, screen 1).

**MOTION AND EXCITEMENT ARE PART OF THE CONTRACT** (Peter: «has to be dating app level viral and
exciting process and have all the animations like we said. remember. super key»). The bar is the best
consumer onboarding on a phone: one question a screen, big friendly type, and every tap answered.

- *The frame.* A segmented progress bar at the top that fills with a spring as each step lands, so
  «the last steps» visibly shrink. Going on, the content moves along one shared axis, and BOTH
  HALVES OF IT ARE DRAWN: the screen being left slides 32 px the way the walk is going and fades
  over 130 ms, and only then does the address change and the next screen arrive from the other
  side on a 300 ms spring (`goTo`). Back reverses it. The bar at the foot STAYS and only its
  label changes. Buttons answer the press (scale to .97 on a spring; a 10 ms vibration where the
  phone allows it).
- *The waitlist moment.* A full-screen takeover: the place counts up to its number with an ease-out,
  confetti bursts from both lower corners (our own small canvas, the theme's colours, about 1.2 s,
  never over the button), a line says how many businesses are ahead, and the act breathes once.
- *Choices.* A picked row fills, its tick DRAWS itself, the others dim, and a single-choice screen
  goes on by itself after a beat.
- *The address.* Suggestions arrive staggered (30 ms apart); on a pick the search field rises to
  become the card at the top while the map fades in under it, the camera eases to the place, and the
  pin drops with a bounce and a shadow ripple. Dragging the pin lifts it.
- *Your orders.* The handset slides up and the delivery note writes itself line by line, then a tick.
- *Yape.* Yape's purple arrives as a circular reveal from the act; the QR thumbnail pops on a spring
  once added; connecting ends in a tick that morphs from the button.
- *Who owed you.* The faces fan out from a stack; a counter ticks as rows are picked.
- *Move up the list.* The place is the hero: it shows how many places one business is worth, three
  dots fill toward the next covered purchase, the message about to be shared is previewed as a chat
  bubble, and coming back from the share sheet the place visibly DROPS.
- *Done.* A membership card for the business (its name, its place, its reference) settles in with a
  smaller burst, above «Say hi to Rocoto on WhatsApp».
- *The rules of the motion.* Transform and opacity only, 60 fps on a cheap Android, nothing blocks a
  tap, nothing loops for ever except a gentle idle on the hero number, and `prefers-reduced-motion`
  turns every movement into a fade. No animation library is added: springs are small CSS
  `linear()` curves or the Web Animations API.
- *The share that spreads.* The invitation names the sender's business and says what the invited
  business gets and what both gain («join the waitlist through this link and we both move up»). It
  is English for now, short enough to read in a notification, and carries the sender's code.

**The place and the link.** `mock-api` gives every connected business a waitlist place and a referral
code; `#/r/<code>` on arrival attributes a new business to its referrer; every third attributed
business moves the counter of covered purchases. The numbers are the API's, never the page's.

**The buddy.** «Say hi» opens the business's own chat with Rocoto with a prefilled greeting and its
reference. That greeting is what opens WhatsApp's 24-hour window, so the buddy can answer there with
the place and the referral link through the API's existing, reviewed notice path to the session's own
number (a fixed notice type, never free text, never another number).

**What this walk never does:** it never sends a message to a third party by itself. Sharing with
businesses that owed you, and bringing businesses, both hand the message to the owner's own share
sheet or WhatsApp for them to send.

**Yape on the payment page** (`#/pay/<id>`): `Pay now` shows the shop's Yape QR and number, the exact
amount with `Copy the amount`, and `Open Yape`, which is enabled once the amount has been copied.
A QR that carries its amount is used if Yape offers one to this kind of account; otherwise the copy
step is the way.

**AS BUILT, 20 September 2026 (evening).** The ten screens are `start/*.tsx`, one file a screen, with
the shell and the motion in `start/walk.tsx`, the burst in `start/confetti.tsx` and the service calls in
`start/joining.ts` ([§6](#6--the-screens-in-order) is the table). Four things the build settled, each
recorded where it lives:

- **The place is the service's** (`GET /api/bodega/waitlist`). Where no connection service answers —
  local development, every drive, an offline review — the SAMPLE world's seeded place stands and the
  screen prints `Sample waitlist` beside it, the same rule the read follows with `Sample chats`.
- **The map** is Google's Maps JavaScript API through Cedar's own loader and `VITE_GOOGLE_MAPS_KEY`,
  styled from this theme's tokens. A build with no key draws a place-card ground — a quiet field ruled
  into blocks and streets, with the same card, the same pin and the same act — which is what every
  proof runs on ([WIRING-SPEC.md](WIRING-SPEC.md) §14).
- **The pin is the middle of the screen and the ground moves under it**, which is how every map that
  asks for an address works. The coordinate is saved; the WORDS stay the ones Places gave, because this
  runtime has no reverse-geocode road.
- **No published Yape address carries an amount**, so the payment page takes the copy-then-open path
  Peter described. The research and its sources are [WIRING-SPEC.md](WIRING-SPEC.md) §15.

**AND WHAT THE REVIEW ON A PHONE SETTLED, the same evening.** Seven things were wrong when the walk
was measured at 390 × 844 rather than read, and each is fixed where it lives:

- **The picture is the elastic part of the screen, the words take their own height under it**
  (`start/walk.tsx`, the surface grid). The rows were the other way round, so six of the ten screens
  carried a band of empty white between the picture and the title — 309 px of a 844 px phone on the
  waitlist celebration and on the Yape screen. A screen whose upper part is a number or a wash says
  `alignContent: center` for itself; a picture covers its room.
- **The walk's own shell adds nothing under a screen that is already one viewport tall**
  (`App.tsx`, `StartShell`). `scale900` of padding made every screen 32 px taller than the phone, so
  the page scrolled and the first field to take the caret put the progress row off the top of the
  screen. The customer's payment page is an ordinary column and keeps its room.
- **A tap never blanks the phone.** The route moves inside a `startTransition`, so the screen being
  left stays while the next step's chunk lands; `WalkScreen` warms the NEXT step's module on arrival
  at this one (`useWarmNext`); and where a fallback is drawn at all it is the walk's own three-row
  frame rather than the word `Loading…` on a white page.
- **Only a refusal the shop can act on holds the shop** (`start/yape.tsx`). Every `/api/bodega/*` path
  answers 401 where no connection service minted the session, and screen 7 read that as a refusal
  about the number: it printed «Connect your WhatsApp to continue.» under a WhatsApp the shop had
  just connected and stood there for ever. The service's own machine word tells the two apart
  (`start/session.ts` carries `code` on a refusal); `bodega_yape_number_unreadable` and
  `bodega_yape_qr_*` hold, everything else carries the walk on, which is what every other screen does.
- **The Yape seat shows what the shop has given.** It printed the field's own placeholder in the seat
  where the connected number stands; the room is the QR's seat now, and the number appears under it
  once it is typed. The mark is the chip alone.
- **Screen 8 prints the payment evidence of each chat** (`history/read.ts`, `owedReasonLine`): how
  often paying later was asked for, how recently they ordered, how many payments were seen. This is
  the screen a distributor is shown, and it said Rocoto had ranked the businesses that owe them by
  how much they laugh. The ranking rule and the sentence naming it stay with the Money surface.
- **Screen 9 has a door the moment the link is shared.** The act becomes `Finish joining`, sharing
  again is the quiet second way, and a tick acknowledges the share — the critical path ends here
  ([§1](#1--the-shape)), so it ends on an act rather than on `Skip for now`.

**AND WHAT THE DIRECTION PASS SETTLED, the same night.** The walk worked and looked like a
wireframe: six screens were a small object floating in a white void, the Yape step was a pale lilac
wash with a tiny chip on it, the business choices were three small thumbnails in big empty rows with
a crop of sky in the third, the keyless map was a field of grey rectangles, and the arrival was a
three-step list in small grey type. Seven things changed, each recorded where it lives:

- **The upper part is a STAGE** (`start/walk.tsx`): full-bleed, floored at 44% of a 390 × 844 phone
  and 38% of a 360 × 740 one, with the progress row drawn over it in the stage's own ink, in one of
  four tones a screen asks for by name. Nothing floats in white any more.
- **The pass is the walk's protagonist** (`start/pass.tsx`, the section above). The shop receives it
  and then completes it, which is what makes the walk read as joining rather than as a form.
- **The three business choices are full-width picture tiles**, each showing the trade it names, with
  the crop of each scene chosen by looking (`app/public/bodega-artwork/README.md`). The third one
  drew `hero-stock` — bananas and a band of sky; it draws the fish stall now, because Lima's
  pescaderos are who supply its cevicherías.
- **The arrival says why, in Peter's own words**, as one paragraph, and `Reset state` stands behind
  `?dev=1` (`start/walk.tsx`, `devRig`) rather than under the act a shopkeeper is looking at.
- **The shared axis has both halves.** `goTo` takes the exit before the address changes, so the
  screen being left is SEEN to leave.
- **The keyless map is a drawing of Lima** — the coast, the cliff road, two avenues, a park, blocks
  of unequal size — and the pin pulses. A key GOOGLE REFUSES now falls to it too: an auth failure
  reported after the map is built used to paint Google's own «Oops! Something went wrong.» panel in
  English under this screen's card (`start/address.tsx`).
- **The referral message is drawn as the message it will become** — an outgoing WhatsApp bubble with
  the address read the way a person reads one, over three seats that say what filling them is worth.
  What is handed to the share sheet is still the whole link.

**Still open on this walk:** `#/pay/<id>` names the shop by its REFERRAL CODE, because no order entity
exists in `bodega.py` yet and that is the only public per-shop key this walk builds — it wants
reconciling the day a real order id lands.

### SPANISH FIRST, AND THE STATUS LINK — 20 September 2026 (night)

Peter, verbatim (`docs/FEED-IA.md` §268):

> «it all haes to be in spanish the website and the onboarding. english only if they clicked fromt
> he english page.»

> «ok so the whole signup onboarding and their persistent waiting list position and referral
> tracker? should be a link the buddy sends as the first thing. if they didn tmessage the buddy for
> 5 minutes after they finished the las tonbaroding step, we should messages them with imeta
> template just giving them their waitlist status link and saying hello. and then also their
> referral link etc which they can forward. i'd say that when they reply we should message them
> saying below i'll send the message you can forward to other shops and distirbutors»

**THE RULE.** Spanish is what the walk is in. English is a thing a LINK asked for: `?lang=en`, which
is how the English site links to the sign-up. The choice is taken on the first load that carries one
and kept for the session (`sessionStorage`, `rocoto-bodega-lang`), so the nine screens after the
arrival stay in the language the arrival was opened in without the address carrying a flag. The
business's own row records it — `language` on `PUT /api/bodega/business`, `es` by default — so the
buddy writes to that shop the way the shop read the sign-up ([MESSAGES.md](MESSAGES.md)).

**WHERE THE WORDS LIVE.** One table, `start/words.ts`: every string the sign-up SHOWS, as a row with
an `en` and an `es` column — the ten screens, the pass, the invitation the owner forwards, the
greeting the shop sends the buddy, the status page, and the customer's own payment page, which is
customer-facing and follows the same rule. A screen holds no literal of its own; it reads
`useWords()` and prints a row. The English column is word for word what shipped before the table
existed, because `drives/drive-268-bodega-onboarding.py` asserts it and now opens the walk with
`?lang=en` to do so. Numbers keep one formatter in both columns, because Peru groups thousands with
a comma and marks decimals with a point — `#1,204`, `S/ 48.50`.

Three surfaces inside the walk keep English on purpose, and each says why where it stands: the rig's
own `Reset state` door behind `?dev=1` (a reviewer's control), Cedar's Embedded Signup walk on
screen 2 (`../cedar/connections/app.tsx`, another candidate's file), and the delivery day printed on
screen 6's note, which is the fixture cast's own field rather than a word of this walk's.

**THE STATUS PAGE** is `#/lista/<CODE>`, and the link the buddy sends is
`<page origin>/bodega-pay-later/?lista=<CODE>` — a QUERY on the way in, because a link in a WhatsApp
message is forwarded, shortened and previewed. `App.tsx` turns it into the route on the first render
and the page spends the query as it mounts, so a press that leaves for the walk stays away. It
stands on `GET /api/bodega/status/<code>`, the one PUBLIC read this service has: no cookie, no phone
number and no address in it. It is the walk's own idiom seen from outside the walk — the ink stage,
the pass (`start/pass.tsx`) with the name, the trade, the place and the reference on it, the three
seats under it (`start/seats.tsx`), «Compartir mi link» anchored at the foot and «Salúdale a Rocoto
en WhatsApp» quiet beside it — and NO progress row, because nobody standing there is part-way
through anything. The card is drawn `complete`: a line the public record carries none of is left out
rather than standing as a placeholder bar, which would promise a screen that fills it.

A code the service holds no row for answers `bodega_status_unknown`, and that screen names the thing
it IS — «La lista de espera de Rocoto» — says where a status link comes from, and offers «Únete a la
lista de espera». It says nothing about what the link failed to do: the copy law, and the reason the
title is not a sentence about a link that no longer opens anything. A service that has yet to answer
at all is the SAMPLE world, like every other screen of the walk, and the card says «Lista de
muestra» beside the figure.

**THE LAST STEP IS RECORDED.** Reaching `#/start/done` posts `POST /api/bodega/onboarded` once,
empty and idempotent, and the service writes `onboarded_at`. That is what starts the buddy's own
five-minute clock; the answer moves nothing on the screen, because a rig with no session behind it
refuses it and the shop is done either way. The greeting the last screen pre-fills carries the
business's NAME and its reference — «Hola Rocoto, soy {name}. Mi referencia es {CODE}.» — so the
buddy finds the row by the sender's number first and by the reference in the text second.

## 1 · The shape

The user is a shop: a bodega, a produce stall or a fish stall. Peter's words in `docs/FEED-IA.md` §268
fix the shape — «the critical path is getitng them to send a referral message, then it's like…
orientation. with a buddy.»

**The critical path is four beats and ends the moment the referral message is sent:** Get started,
WhatsApp, the read, the referrals — [DESIGN-SPEC.md](DESIGN-SPEC.md) §2's own four words, where Get
started is the way in and the read carries the likely list. **Everything after is orientation**, and the buddy is
Rocoto on WhatsApp: the closing message introduces it, and it then walks the shop through the rest one
thing at a time, each offered when it becomes useful, each carrying a link into the page. The covers
inside the app are that same orientation seen from inside the page.

Email, phone and product upload stay out of the path, and **no email is ever asked**. Both registers
hold at once, simple for a shopkeeper at a counter and precise about money: one title and one act per
screen, one sentence where the screen needs one, every figure carrying its source.

## 2 · The way in — the page, and the connection as the sign-in

**The shop opens the page and presses one act.** It reaches the page from the landing page, from a
distributor's message or from a link Rocoto hands it, and `Get started` is the first screen either way.
**The WhatsApp connection is what identifies the shop**: the connection service binds its state to the
browser's own session — `proof/service.py`'s `get_state` reads the browser's `__Host-cedar_session` and
asks `accounts.py` for that session's store, bound only after Meta verified the account — so a
connection this browser can see is proof that this browser authorised it, and the page mints its own
session from it ([WIRING-SPEC.md](WIRING-SPEC.md) §1).

| Turn | What travels | Channel |
|---|---|---|
| 1 | the shop opens the page and presses `Continue` | the browser |
| 2 | Meta's own connection flow: a message from Facebook, a link, Facebook's code inside the flow | Meta's screens, on the shop's phone |
| 3 | screens 1–6, this page, signed in by the connection | the browser |
| 4 | Rocoto as the shop's agent, with the link into the installed page | free-form inside an open 24-hour window |

**The «hola» and the six-digit code are deleted**, and with them the tokenised link,
`/api/bodega/session/code`, `/session/link` and `/session/verify`. Peter, 19 September 2026
(`docs/FEED-IA.md` §268): «the hola was for something else when we wanted to use whatsapp onboarding».
**No number is asked on any screen of the walk**: Meta's documentation, read 19 September 2026, offers
no field that carries the shop's number into the WhatsApp Business app connection, so the shop types it
on Meta's own screen.

**The rig.** On `demo.soyrocoto.com/bodega-pay-later/` Rocoto's own WABA (`2033396113925190`,
`+1 978 958 9459` on Meta's Cloud API, separate from the connected number) sends the closing message
free-form to the session's own number. Meta delivers a free-form message inside an open 24-hour window,
so screen 6 offers `Message Rocoto on WhatsApp`, which opens it; an approved utility template is the
path that needs no act from the shop ([MESSAGES.md](MESSAGES.md) §5).

**Rejected:** a contact picker in place of the WhatsApp connection — the connection builds the book
(§268).

## 3 · The screens

### Screen 1 · `Get started`

**The title names the step, and the brand stays out of it** (Peter, 19 September 2026: «rocoto is the
brand, this is get started»). The screen is a title, three rows and one button: no sentence stands under
the title, because the rows say what the walk is.

| | |
|---|---|
| **The three rows** | `Connect WhatsApp Business` · `Rocoto reads the last six months of chats with customers and suppliers.` — `See who owes you` · `A list from those chats, for you to confirm or correct.` — `Invite suppliers` · `Each supplier who joins moves you up the pay-later list.` |
| **Act** | `Continue`, straight to Meta's own connection (screen 2) |
| **States** | `Connected · {number}` once a connection answers · `Loading…` while the page reads it · `Mayorista San Jorge invited you` when a distributor's link opened it · `Reset state`, the rig's one control, here alone |
| **Real · fixture** | All real: `Reset state` posts `/api/proof/whatsapp/disconnect`, clears every `rocoto-bodega-*` key and the rig's server-side session and referral records, **stays on this screen** and prints what it cleared, `State cleared · {n} keys · WhatsApp disconnected` (the rig, once the disconnect resolved) · `State cleared · {n} keys · sample chats stay connected`. |
| **Picture** | **Cover**, seat `arrival`. |

### Screen 2 · The WhatsApp connection

Cedar's Embedded Signup and coexistence module mounted whole, Cedar's five setup titles kept verbatim.
**In the unconnected state the screen carries Cedar's own question as its one heading** —
`Do you use the WhatsApp Business app?` — with one line under it and nothing else above the walk.

| | |
|---|---|
| **Title, unconnected** | `Do you use the WhatsApp Business app?`, Cedar's own question, the screen's one heading |
| **The line under it** | `Rocoto reads your chats to list who owes you and who you owe. WhatsApp keeps working on your phone, and broadcast lists become read-only.` |
| **Title, connected** | `WhatsApp connected` |
| **Act** | `WhatsApp Business` · `WhatsApp`, Cedar's transfer walk behind the second; `Continue` once the account links |
| **States** | Cedar's five titles, one spinner, one instruction, `Pause setup` tertiary · `Setup paused`, a `Note` with the blockers under `Setup details` and `Check again` · `WhatsApp connected`, with the account's name and number |
| **No number is asked** | Meta's documentation, read 19 September 2026, offers no field that carries the shop's number into the WhatsApp Business app connection, so the shop types its number on Meta's own screen. |
| **The two codes, kept apart** | `POST /api/proof/whatsapp/code` is **Meta's connection code**, the one Facebook shows inside its own flow. Rocoto's own six-digit login code is deleted (§2), and nothing in this walk asks for one. |
| **Real · fixture** | Real through the same-origin bridge: `POST /api/proof/whatsapp/code`, then `POST /api/proof/whatsapp/connect {historyRequested: true}`; Peter connects his own number, ending 644. The history consent screen is Meta's own, so the UI states the result and asks once. On the connection the page posts `POST /api/bodega/session/connection` and holds `__Host-bodega_session`. Fixture only on the bridge's 503 in local development, named `Sample chats`. |
| **Picture** | **3D feature object**, the kit's telephone at 120 px; it leaves the moment the account links. |

**The phone path, the connection step as it runs.** On the stable v4 coexistence flow the customer types
their WhatsApp Business number, WhatsApp shows a verification code, a message from the official Facebook Business
Account arrives in their WhatsApp Business app, they tap **Connect** → **Connect to the Business
Platform** → **Confirm** (the chat-history choice), paste the code, and finish business info and time
zone. The refreshed flow shows a QR the customer scans from inside WhatsApp Business **and** delivers a
WhatsApp message with a link to that QR, so on a phone the path is the message rather than a scan.
Source: Meta's `onboarding-business-app-users` page and the archived 17 August research. Acceptance
carries **verify on a real phone with Peter's number**. A native shell that screenshots the QR and
decodes it stays the fallback, earned by a real phone run whose QR arrives with a linkless message.

### Screen 3 · The read — `Found in your chats`

The one wait, spent watching the book arrive: each row is a skeleton until its own count lands.
**The example is the live run of 9 September 2026 on Peter's own number**
(`app/src/prototypes/cedar/connections/deploy/verification-2026-09-09-48838752.json`), which read
`2,214 messages · 112 conversations · since 12 March`; the customer, supplier and sale rows carry that
account's own counts as the read produces them. **On the fixture path the screen prints the fixture's own
figures** — `2,960 messages · 27 conversations · since 22 March`, `18 customers`, `9 suppliers`
([fixtures/README.md](fixtures/README.md)). Saffron is spent once in the flow, on `Rocoto read your chats`,
**and that claim belongs to the proof source alone**: the fixture path prints `Sample chats` by itself, so the
acted colour stands for a read Rocoto really did.

| | |
|---|---|
| **Sentence** | `The last six months of chats from the account you connected.` |
| **Act** | `Continue`, live the moment the suppliers row exists; the read continues behind the next screens |
| **States** | `Your chats stay on your phone`, the declined end state, with `Rocoto reads the messages that arrive from today.` · `Still reading`, with `1,240 messages saved so far` and one `Continue` |
| **The rule above them** | **Every read state continues to screens 4 and 5.** A declined history leaves the contacts sync, so suppliers are proposed from names and numbers and screen 5 offers `Add a supplier`. |
| **Real · fixture** | Real: `GET /api/proof/conversations` and `/conversations/{id}/messages`, the analysis running in the browser over those pages. The order brain logs the orders it finds through `POST /api/cedar/orders/parse` under a bounded budget, and may mark one as needing a reply when the last message is the customer's; the shop unmarks it. Fixture only on the 503 fallback, `Sample chats`. |
| **Prices** | The chat corpus states quantities, days and names, so figures in money stay out of it and out of anything read from it; the money seed holds each amount as a minor-unit integer ([fixtures/README.md](fixtures/README.md)). A soles figure appears where a message states one, as what the message said. |
| **Picture** | **None.** The figures are the picture. |

### Screen 4 · Who owes the shop — `Who may owe you`

Peter: «show them, within our onboarding, "These are the people that owe you most."… we wont have how
much they're owed reliably. so like it'll be based on messages history basically.»

**The list is built from the messages alone.** Rows rank who is **likely** to owe on the chat's evidence
— fiado asked for, orders with no payment message after them, how recent, how often — each carrying its
reason in words: `Asked to pay later 4 times · last order 3 days ago · 2 payments seen`. An amount
appears where a message states one, as what the message said (`Said «te debo 12» on 4 Sep`). **No total
is asserted anywhere**, and the heading says `may` until the shop confirms.

**So the screen asks for the one thing the chats lack: the amount.** The sentence used to read `Confirm
each one that is right, or correct the amount.` over rows that carry no figure at all — the read states
an amount only where a message states one, and the sample chats state none — so `Confirm` had nothing to
judge and stored an empty amount (§268 QA items 10, 26, 27). Each row's act is `Add the amount`; the
keypad opens on the digits the chat stated where it stated any; the figure comes back through
`start/amount.ts` as minor units and prints in Money's own grammar, `S/ 12,345.67`; the answered rows
carry a tick and rise to the head of the list under a running count, `2 people · S/ 710.00`, the way
`#/money/owed` carries its own. **The confirmation reaches one book**: the walk's record and
`money-store.ts`, which Money, Customers and a customer's profile read.

| | |
|---|---|
| **Sentence** | `Add the amount you remember for each one.` |
| **Act** | per row `Add the amount` → the `Amount owed` keypad, then `Change the amount`; `Continue` under the list |
| **States** | `likely` · `confirmed`, dated, carrying the amount the shop typed and standing at the head of the list · a short list, which says how few chats hold a laugh · an empty list, where the act reads `Continue` |
| **The figure** | `parseAmount` takes `460`, `460,5`, `S/ 460`, `12,345.67` and `12.345,67`, and answers a negative, letters, more than two decimals and a keystroke above `S/ 99,999.99` with one sentence under the field |
| **The confirmation** | It is what the fiado book records. Before it the row is a candidate, and a candidate reaches neither the record nor a lender. |
| **Real · fixture** | Every row from the read, and the screen draws the top eight of them whichever rule ranked them — the heading claims the people who most likely owe, which is a shortlist the shop decides in one sitting rather than its whole book. Fixture only behind `Sample chats`, where each thread carries its own asks, its own last order and its own payments seen, so two people never read alike. |
| **The rig's rule** | Until the debt read exists **every chat that holds a laugh is a candidate** and the rows are the top eight by the «haha» and «jaja» they hold — the rig runs on Peter's own number, where a chat holds family rather than commerce. Each row reads those laughs in words, `31 laughs in your chat · last message 2 days ago`, with the fiado asks and the payments seen after them where the chat holds any. The rule stands directly under the sentence and above the list, where it is read: `Ranked by laughs in your chats for now; the debt read replaces this rule.` |
| **The floor under it** | His own account answered with 103 of 120 chats holding no laugh at all and eleven in the top one, so a chat with none is no candidate — `0 laughs in your chat` under this heading is the rule reporting its own silence. Where fewer than three chats hold a laugh the screen says so in one sentence, `2 chats hold a laugh, so this list stays short.`, and `Continue` stands as it always did. |
| **Picture** | **Faces and overlays**, `CustomerFace` initials discs at 28 px, each with its reason line; the faces are the picture. A chat the contacts sync named nowhere draws a person glyph beside its own number, because two digits in an initials disc are a phone number wearing a face. |

### Screen 5 · The referrals — `Invite suppliers`

Rocoto proposes, the shop unticks. A row is a face, the name from the shop's own contacts, the trade
under it and its reason in words. **The trade word is the shop's own** — one language, quoted out of
the contact name — **and it stands where the name leaves the trade unsaid**: «Elsa · puesto 214, Gran
Mercado Mayorista» reads `mercado` under it, «Distribuidora Aurora» and «Gas Santa Rosa» say it in the
name already, so their rows carry the reason alone. **While the rig's laughs rule stands the list holds every contact the
read produced** — the top five by laughs first and ticked, then the rest waiting for a tick of their own:
the named contacts A–Z, and after them the numbers the contacts sync named nowhere, newest activity
first. 65 of the 120 chats on Peter's own account are such numbers, and digits sort above `A` in every
collation, so one alphabetical list put eleven-digit strings on the first page and the people he was
looking for under them. Each number draws itself as a number, `+34 612 345 678`, with a person glyph
beside it. So Peter unticks all, ticks his mother and the message reaches her alone. Once the
debt read replaces that rule the list is the suppliers, the most purchases first, `Bought 6 times` as
each row's reason, every row ticked. **The unit is suppliers.** The cleared line
stands under the list, verbatim: «Los negocios que ya usan Rocoto entran primero, y cada negocio que
traes te adelanta en la lista.»

| | |
|---|---|
| **Sentence** | `Each supplier who joins moves you up the pay-later list.` |
| **The list** | the top rows first and ticked, then the names A–Z and the numbers after them newest first, a search field at the top matching as the shop types — letters match a name's words **from their start**, so `mam` finds Mama and passes over a name holding those letters mid-word, and digits typed with or without the `+`, spaces or dashes reach the E.164 number — every row tickable, `Deselect all` available, and a number the read holds no row for addable through `Add a supplier` beside the list |
| **Act** | `Write 9 invitations` → `Rocoto writes each message; you send it from your own WhatsApp.` → the row's own `Send` → `2 of 9 sent` → `I sent them`. **The act names the press**: `Send to 9 suppliers` sent nothing, because the send is the `wa.me` hand-off on each row (§268 QA item 9). |
| **The way on, always** | a shop is free to invite nobody, so with no tick left the act IS `Continue`, and the rest of the time a quiet `Continue` stands beside `Preview message` |
| **A search that matches nobody** | `Try another word. The read found 27 contacts.` |
| **States** | the screen: `ready`, then `sending`, the transient while a `wa.me` hand-off is open · per row the one set [WIRING-SPEC.md](WIRING-SPEC.md) §5 defines, `Ready` → `Sent` (the shop pressed send in its own WhatsApp) → `Invited` (the shop confirmed with `I sent them`) → `Connected` (that supplier's WhatsApp connected) · an empty list, whose act is `Add a supplier` with a number field |
| **Real · fixture** | Real: the names, the numbers, the search, the ticks and the send. **The send is one path**, the `wa.me` hand-off to the shop's own WhatsApp — Rocoto composes, the shop presses send; sending from the shop's own number under coexistence is later production work on the two conditions [WIRING-SPEC.md](WIRING-SPEC.md) §5 owns. Fixture: `invited → connected`, where production takes the connect webhook on each invited number, matched by the invitation token first, the E.164 number second. |
| **The rig's run** | Peter presses `Deselect all`, ticks his mother, and the message reaches her alone; he presses send in WhatsApp. |
| **Picture** | **Cover**, seat `referrals`, serving Money → `Suppliers you brought` as well. |

**The critical path ends here**, on the sent message.

### Screen 6 · Done — `You’re on the list`

The first orientation screen; its sentence is the cleared line, verbatim. Under it the invited faces
with `Invited` · `Connected` and `9 invitations sent · 2 connected` — Rocoto's own facts about its own
list, carrying no position number and no queue length. **Those two figures are this session's own**: nine
invitations went out a moment ago, and two of those suppliers were already on Rocoto. The seeded Money card
reads the seed instead, `Suppliers on Rocoto · 4 of 9 invited · 2 connected`
([fixtures/README.md](fixtures/README.md), `money.queue`).

| | |
|---|---|
| **Act** | `Add to Home Screen`, then `Open Rocoto` |
| **The install** | the browser's own prompt where it offers one; where it offers none — every iOS Safari, every iOS Chrome, any browser that has spent its prompt — the same act opens a sheet titled `Add to Home Screen` holding the three steps `Tap Share in Safari` · `Choose Add to Home Screen` · `Tap Add`. **`installed` is recorded from the browser alone**, on `appinstalled` or `display-mode: standalone`; the act used to record one that never happened (§268 QA item 1). |
| **States** | `installable` · `installed` · `open`, with the iPhone path one press away |
| **WhatsApp, and what the screen claims** | The screen prints `Rocoto is on WhatsApp at +1 978 958 9459.` and offers `Message Rocoto on WhatsApp`, a `wa.me` link. **It claims no delivery**: the server attempts the closing message free-form from Rocoto's number, which Meta delivers inside an open 24-hour window, and the shop's own message is what opens that window. The path to delivery with no act from the shop is an approved utility template through `send_template`, already written and tested in `mock-api/app/bodega.py`, which also needs a payment method on the WhatsApp Business Account ([MESSAGES.md](MESSAGES.md) §5 and its submission receipt). |
| **Real · fixture** | All real: the install over HTTPS with a manifest and icons at 192 and 512, and the attempted closing message from Rocoto's number to the session's own number. |
| **Picture** | **None.** The faces are the picture. |

## 4 · Orientation

`Open Rocoto` lands on **Prep**, which is home; the bottom nav holds `Prep · Money · Products ·
Customers` at 64 px, and free roam starts. Rocoto on WhatsApp is the buddy the closing message
introduces: it reports what happens and offers the next thing, one at a time, each with a link into the
page, in the order each becomes useful.

| When | What the buddy offers | Where the link lands | Channel |
|---|---|---|---|
| a supplier connects | the supplier joined, and how many of the shop's suppliers are on Rocoto | `#/money/record` | template, then free-form |
| the first sale is recorded | `Do you want me to send the payment link to every customer who orders from you?` | `#/money/setup/payments` | free-form |
| money lands, or a payment falls due | the payment naming its sale; today's payment on the shop's own record | `#/prep/:saleId` · `#/money/suppliers` | template |
| Monday, or the shop asks for its sales | the statement, then the export with its file | `#/money/export` | template, then free-form, the file as a document |
| the bank account is still empty | `Add your bank account and what they pay you lands there.` | `#/money/bank` | free-form |
| a product still carries the family mark | product photos | `#/stock/:id` | free-form |

Each row's Spanish is in [MESSAGES.md](MESSAGES.md), which owns the bodies, categories and template
names, beside `messages/templates.json` (the Graph payloads) and `messages/chat-script.json` (the script
`#/chat` replays for design review).

**Money opens on the bank account**, so the page's first offer is `Add your bank account`. **Printing
stays behind one persistent button** on Prep. Prep's counts read `sales`, the record is a `Sale`, the
export runs by transaction and by customer, and the fiado reminder states the sale, the amount and the
date only.

**The covers are this orientation seen from inside the page.** Money, Products and Customers each open once
on a cover dialog — image · title · body · one action. **Prep carries none**: it arrives one press after
a cover and a done screen, and the day's sales are its picture.

| Area | Title | Body | Act |
|---|---|---|---|
| Money | `See what you have and what you owe` | `Your bank account first, then supplier payments and customers who owe you.` | `Open Money` |
| Products | `See what you sell` | `A product list built from your supplier orders.` | `Open Products` |
| Customers | `See who buys from you` | `See who comes back, what they buy and what they owe.` | `Open Customers` |

## 5 · The voice of the walk

The rules below are the short form. [VOICE.md](VOICE.md) holds the long one: fourteen rules with each publisher's own words (Apple, Uber's Base, Shopify Polaris, Monzo and others), the real screens they were read from, and where they meet the house laws.

Every title, row and button in the walk is held to the guidelines the named companies publish for their
own interfaces: **Apple's Human Interface Guidelines, its Writing and Onboarding pages, and Apple's WWDC
writing sessions, read 19 September 2026.** The rules, as this walk applies them:

- **The first screen's title names the step, and the brand stays out of it.** `Get started`, rather than
  a screen named after Rocoto (Peter, 19 September 2026: «rocoto is the brand, this is get started»).
- **Titles and row headings drop «your» and «my» where the context already carries them.**
  `Connect WhatsApp Business`, `Invite suppliers`, `Amount owed`.
- **A row is a short heading plus one sentence that adds a fact.** The heading names what the person
  does or gets; the sentence says something the heading did not — `See who owes you` over `A list from
  those chats, for you to confirm or correct.`
- **A thing the person does takes a verb.** `Connect WhatsApp Business`, `Invite suppliers`,
  `Message Rocoto on WhatsApp`.
- **A button is a verb and its object, and one fixed vocabulary moves the walk.** `Continue` between
  steps, every time. The screen that stands in front of another company's permission flow carries one
  button, `Continue`.
- **No filler adverbs, no «we», and the body never restates the heading.** Rocoto is named where it is
  the actor, not as a chorus.
- **Sentence case throughout**, because the kit is Uber's Base.

## 6 · The screens, in order

**§0 IS WHAT IS BUILT.** The ten screens below are the walk as it stands in
`app/src/prototypes/bodega-pay-later/start/`, one file a screen, the file name the route
(`App.tsx`, `START_STEPS`). The six-screen list this section used to carry is the walk of
19 September; it is kept in Git and in §3 below, which §0 overrides.

| # | Route | File | Title | Foot |
|---|---|---|---|---|
| 1 | `#/start` · `#/start/arrival` | `start/arrival.tsx` | `Get started` | `Connect WhatsApp` · quiet `Reset state` |
| 2 | `#/start/connect` | `start/connect.tsx` | `Do you use the WhatsApp Business app?` → `WhatsApp connected` | `Continue` |
| 3 | `#/start/waitlist` | `start/waitlist.tsx` | `You’re on the waitlist!` | `Confirm details` |
| 4 | `#/start/business` | `start/business.tsx` | `What is your business?` → `What is it called?` | `Continue` → `Save my business` |
| 5 | `#/start/address` | `start/address.tsx` | `Where is it?` | `Confirm this address →` · quiet `Search again` |
| 6 | `#/start/orders` | `start/orders.tsx` | `Your orders appear here` | `Next: your Yape` |
| 7 | `#/start/yape` | `start/yape.tsx` | `Connect your Yape` | `Connect my Yape` · quiet `Skip for now` |
| 8 | `#/start/owed` | `start/owed.tsx` | `These businesses have owed you` | `Share with them` · quiet `Skip for now` |
| 9 | `#/start/referrals` | `start/referrals.tsx` | `Move up the list` | `Share my link` · quiet `Skip for now` |
| 10 | `#/start/done` | `start/done.tsx` | `You’re in` | `Say hi to Rocoto on WhatsApp` · quiet `Open Rocoto` |
| — | `#/r/<code>` | `App.tsx` | — | lands on screen 1, holding the code |
| — | `#/pay/<id>` | `pay/link.tsx` | the customer's own page | `Pay now` · `Pay later` |

**The shell and its motion are one module**, `start/walk.tsx`: the anatomy, the anchored foot, the
progress row, the springs, the count-up, the drawn tick and the `prefers-reduced-motion` rule.
`start/confetti.tsx` is the celebration; `start/joining.ts` is the place, the referral, the
business, the address and the Yape, read from `mock-api/app/bodega.py`.

**Screen 8 stands only for a business that sells to bodegas or to restaurants**
(`start/joining.ts`, `sellsOnward`), so the progress counts seven steps for them and six for a
bodega. **The shop is Prep**, with one cover on the first open of Money, Products and Customers.

## 7 · Strings

English is the source; the Spanish column holds what a Peruvian reads where the string is
customer-facing, pinned so the build emits Peter's words verbatim. **Legal**: `cleared` · `lawyer` ·
`after the lender`.

**One screen carries one language** (§268 QA item 2). This English review build prints the English
column throughout, including the English source each cleared Spanish sentence was written from
(`regulatory.ts`: `QUEUE_LINE_EN`, `SUNAT_EN`, `WORKING_CAPITAL_EN`); the Spanish build prints the
Spanish column, and the cleared sentences stand in it verbatim. Both strings live in the source, and
neither screen prints the pair.

**THE WALK'S OWN STRINGS, as of 20 September (§0).** Both columns now live in ONE typed table,
`start/words.ts`, and the page prints Spanish unless the address asked for English
([§0, «SPANISH FIRST, AND THE STATUS LINK»](#spanish-first-and-the-status-link--20-september-2026-night)).
The English below is that table's `en` column; its `es` column is the Spanish of the same rows, and
the greeting on screen 10 now carries the business's name as well as its reference.

| # | The strings of the screen | Legal |
|---|---|---|
| 1 | `Get started` · `Connect WhatsApp Business` · `Rocoto reads the last six months of chats with customers and suppliers.` · `Send your Yape link in the chat` · `A customer orders, and the link to pay goes out with the order.` · `Move up the waitlist` · `Every three businesses that join through you cover one more of your purchases.` · `Connect WhatsApp` · `A business invited you` · `Mayorista San Jorge invited you` · `Connected · {number}` · `Loading…` · `Reset state` · `Clearing…` · `State cleared · {n} keys · WhatsApp disconnected` | cleared |
| 3 | `You’re on the waitlist!` · `Bring another business and you move up.` · `Your place` · `#{place}` · `{n} businesses are ahead of you.` · `Sample waitlist` · `Confirm details` | cleared |
| 4 | `What is your business?` · `A bodega` · `I sell to bodegas` · `I sell to restaurants` · `Continue` · `What is it called?` · `This is the name your customers see on what Rocoto sends them.` · `Save my business` · `Change what my business is` | cleared |
| 5 | `Where is it?` · `Type the street and pick your address.` · `Recent` · `Try the street and its number.` · `Drag the map to put the pin on your door.` · `Confirm this address` · `Search again` · `Back to your business` | cleared |
| 6 | `Your orders appear here` · `Every order from your chats becomes a delivery note you can prepare and print.` · `Ready to prepare` · `Next: your Yape` | cleared |
| 7 | `Connect your Yape` · `Rocoto sends your Yape link in the chat when a customer orders.` · `Yape’s own colour and name` · `Add my Yape QR` · `Change my Yape QR` · `Connect my Yape` · `Yape connected` · `Skip for now` · `Type your nine-digit Yape number, such as 987 654 321` | cleared |
| 8 | `These businesses have owed you` · `Share Rocoto with them. The message goes from your own WhatsApp when you press send there.` · `{n} businesses picked` · `Shared` · `{n} of {n} shared` · `Share with them` · `Share with {name}` · `Next: move up the list` · `Skip for now` · `Ranked by laughs in your chats for now; the debt read replaces this rule.` · `2 chats hold a laugh, so this list stays short.` | cleared |
| 9 | `Move up the list` · `Every 3 businesses that join through you cover one more of your purchases.` · `Each business you bring moves you up 50 places.` · `{n} businesses joined through you` · `{n} of your purchases are covered.` · `Share my link` · `Your link is on the clipboard. Paste it into any chat.` · `Skip for now` | cleared; a rate, a fee, a figure in money, a term and an approval word wait for a signed lender |
| 9 | the invitation: `{business} is on the Rocoto waitlist. Rocoto keeps your orders and your payments in WhatsApp. Join through my link and we both move up: {url}` | cleared; it states no amount and no approval |
| 10 | `You’re in` · `Say hi and Rocoto answers there with your place and your link.` · `Rocoto waitlist` · `Reference {code}` · `Rocoto is on WhatsApp at +1 978 958 9459.` · `Say hi to Rocoto on WhatsApp` · the greeting: `Hi Rocoto, I just joined the waitlist. My reference is {code}.` · `Open Rocoto` · `Add to Home Screen` · `Tap Share in Safari` · `Choose Add to Home Screen` · `Tap Add` | cleared |
| `#/pay` | `Pay now` · `Pay later` · `Copy the amount` · `Open Yape` · `Copy the amount and Open Yape comes live.` · `Send {amount} to that number and write the reference above.` · `{amount} is on your clipboard. Paste it into Yape.` | cleared |

**The walk of 19 September, kept for its Spanish column and its legal status:**

| Screen | The string, English source | The Spanish a Peruvian reads | Legal |
|---|---|---|---|
| 1 | `Get started` · `Connect WhatsApp Business` · `Rocoto reads the last six months of chats with customers and suppliers.` · `See who owes you` · `A list from those chats, for you to confirm or correct.` · `Invite suppliers` · `Each supplier who joins moves you up the pay-later list.` · `Continue` · `Connected · {number}` · `Loading…` · `Mayorista San Jorge invited you` · `Reset state` · `State cleared · {n} keys · WhatsApp disconnected` (the rig, once the disconnect resolved) · `State cleared · {n} keys · sample chats stay connected` | — | cleared |
| 2 | `Do you use the WhatsApp Business app?` · `Rocoto reads your chats to list who owes you and who you owe. WhatsApp keeps working on your phone, and broadcast lists become read-only.` · `WhatsApp connected` · `Continue` · `WhatsApp Business` · `WhatsApp` · `Transfer your chats` · `My chats are in WhatsApp Business` · Cedar's five setup titles · `Keep this page open while your account connects.` · `Pause setup` · `Setup paused` · `Setup details` · `Check again` | — | cleared; the Ley 29733 consent wording is the lawyer's |
| 3 | `Found in your chats` · `The last six months of chats from the account you connected.` · the live run's `2,214 messages · 112 conversations · since 12 March` · the fixture's `2,960 messages · 27 conversations · since 22 March` · `18 customers` · `9 suppliers` · `224 pictures` · `9 voice notes` · `Rocoto read your chats` · `Sample chats` · `Your chats stay on your phone` · `Rocoto reads the messages that arrive from today.` · `Still reading` · `1,240 messages saved so far` · `Continue` | — | cleared |
| 4 | `Who may owe you` · `Add the amount you remember for each one.` · `Asked to pay later 4 times · last order 3 days ago · 2 payments seen` · `Said «te debo 12» on 4 Sep` · `Add the amount` · `Change the amount` · `Amount owed` · `Save the amount` · `Type an amount of zero or more` · `1 person · S/ 250.00` · `Ranked by laughs in your chats for now; the debt read replaces this rule.` · `2 chats hold a laugh, so this list stays short.` | «Quién te debe, según tus chats» · «Confirma los que estén bien.» | cleared |
| 5 | `Invite suppliers` · `Each supplier who joins moves you up the pay-later list.` · `Bought 6 times` · `Search` · `Deselect all` · `Try another word. The read found 27 contacts.` · `Write 9 invitations` · `Rocoto writes each message; you send it from your own WhatsApp.` · `Send` · `2 of 9 sent` · `I sent them` · `Continue` · `Add a supplier` · `Preview message` · `Ready` · `Sent` · `Invited` · `Connected` · the cleared line's English source: `Businesses already using Rocoto go first, and every business you bring moves you up.` | the cleared line, verbatim: «Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.» · the invitation, MESSAGES.md's own row | cleared |
| 5 | `Every supplier that joins is one more supplier you can pay later.` | — | **lawyer**; the cleared queue line above is the sentence that ships today, and this one takes the sentence slot once it clears |
| 6 | `You’re on the list` · `9 invitations sent · 2 connected` · `Rocoto is on WhatsApp at +1 978 958 9459.` · `Message Rocoto on WhatsApp` · `Add to Home Screen` · `Tap Share in Safari` · `Choose Add to Home Screen` · `Tap Add` · `Done` · `Open Rocoto` · the cleared line's English source | the cleared line, verbatim · the closing message, MESSAGES.md's own row | cleared |
| Orientation | `Prep` · `Money` · `Products` · `Customers` · the three cover dialogs · `Add your bank account` · `Send a payment link` · `Sales export` · `Export` · `Add photos` · `Suppliers you brought` · `Invite more suppliers` · `Your record` | the SUNAT sentence, verbatim: «Tu plata de Yape está en una cuenta del banco, y el banco le informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026.» | cleared |
| Orientation | the record's three indicators and its level words `Starting · Steady · Punctual` | — | cleared; a soles figure, a rate, a date or an approval arrives **after the lender** |

## 8 · The cover seats, five, with their subjects

**The style and the fit stand once**, in [DESIGN-SPEC.md](DESIGN-SPEC.md) §5: the anchor's own describe
verbatim, and each subject composed in the middle band so the phone frame and the desk band show the same
whole scene. The files sit at `app/public/bodega-artwork/` as `hero-<seat>.png` (16:9, a 219 px band at
393 px) and `hero-<seat>-wide.png` (a 3:1 cut for the desk), their provenance in that directory's
`README.md` and in `library/illustrations/README.md`. **No other seat carries a cover.**

| Seat | World | Subject |
|---|---|---|
| `arrival` — screen 1 | bodega | the bodeguera behind her glass counter of sweets, phone in hand; shelves to the ceiling, sachet strips, the drinks fridge, the grille door under a red awning |
| `referrals` — screen 5, and Money → `Suppliers you brought` | produce stall | a delivery man hands a crate across to the stallholder; bananas above, crates of tomatoes, mangoes and limes, sacks of potatoes |
| `money` — Money, first open | fish stall | a customer pays by phone across a counter of fish on ice, the fishmonger in a blue apron |
| `stock` — Products, first open | produce stall | the stallholder hangs a hand of bananas on the rail above her crates and sacks |
| `customers` — Customers, first open | bodega | three neighbours at the glass counter while the bodeguera greets them |

## 9 · Open questions for Peter

1. **The supplier invitation's wording.** Cleared for distributor-to-shop, so the shop-to-supplier body
   goes to the lawyer hour before it sends.
2. **The confirmation on screen 4.** One press per likely debtor, or a press plus the amount each time?
3. **Screen 4's place.** Before the referrals, as Peter dictated, or beside them on one screen?
4. **The sixth cover.** `Sales export` is a notice a person has to read, which the library's rule would
   give a cover. Does it take a sixth seat, or keep its envelope object?
