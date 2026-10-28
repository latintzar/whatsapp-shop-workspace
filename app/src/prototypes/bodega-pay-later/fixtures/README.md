# The bodega world

The seeded shop every screen draws: one Lima bodega, its people, six months of their chat, one day's
orders, ninety days of money, thirty products with their faces. Read this and you know each figure on
screen and what a live account replaces. The data is [cast-bodega.json](cast-bodega.json), and
`fixtures/whatsapp-history-v1.json` wraps the same world in Meta's envelope.

**Reference day: Friday 18 September 2026**, Lima; `scenario-clock.ts` walks these offsets onto the
current Peru day, and under the laws of `app/src/scenarios/data/cast.ts` each derived fact is a pure
function of its row's index, so the same morning returns on every reload.

**Two bodies of data, one rule each.** The chat corpus states quantities, days and names, so figures
in money stay out of it and the read reasons in words. The money seed holds each amount as an integer
in minor units, which keeps `DESIGN-SPEC.md` §8's price grep clean.

## The house

**Bodega Yesenia**, Av. Gran Chimú 1642, Zárate, San Juan de Lurigancho, the district with the most
bodegas in the country. Four facts change screens.

- **The owner is the legal person.** Yesenia Quispe Huamán, 43, sells as a *persona natural con
  negocio*, so the legal name is hers and the RUC opens with **10**.
- **The shop is the warehouse**, one counter and one back room. Block words stand in for
  coordinates, so Prep groups by block and the map stays off.
- **The bank is BCP**: *Yape con DNI* opens one, and her yapeos land there. The read uses the sample
  bank until a live BCP shop connects.
- **Her phone is the whole company** — shop number, WhatsApp and Yape are `+51 976 431 412`, and the
  email field is empty.

## The people

**Eighteen customers**: fifteen neighbours across five blocks, three businesses — `Rosa menú`,
`Nelly juguería`, `Maribel obra`. The names are the shop's own WhatsApp contact names, which is what
the read returns, and why half are labels. Nine settle fiado and nine in cash, six of the nine owing
today. A neighbour buys 1,500–8,000 minor units a visit; a business 12,000–40,000.

**Nine suppliers**, the bodega's week: Elsa at the mayorista, Marcos pollos, Don Aníbal's eggs,
Lácteos del Valle, La Espiga de Oro, Iván gaseosas, Distribuidora Aurora, Limpieza Brillo, Gas Santa
Rosa. The four on a week's terms — `pollo`, `lacteos`, `abarrotes`, `limpieza` — are the pay-later
candidates, Aurora the biggest, so its card carries the 30-day settlement. Bread drops daily and
settles on Saturdays.

**Each supplier declares the purchases its chat shows**, in that supplier's own rhythm: 22 for the
daily bread drop, 17 for the four chicken mornings, 13 at the mayorista, 11 from Aurora, down to 3
for the gas man on call. That figure is the referral row's reason, `Bought 22 times`, and both
renderings of this world stand on it — the composed threads and the envelope alike. A count taken as
a share of each group's message budget instead gave five suppliers `Bought 60 times` and four
`Bought 32 times`, which told the shop about the generator rather than about its week.

Phones come from each row's own index, by the rule the JSON prints.

## The chats

**2,960 messages across 27 threads, 22 March to 18 September** — the 180 days coexistence hands over,
groups excluded. About 530 are images, stored as captions while media custody waits. Twenty-eight
sample texts fix the Lima register — `casera`, `porfa`, `al cuaderno`, `ya te yapeé` — and three
carry «jaja», which is what the rig ranks the top people by until the debt read takes over; the
`laughs` block fixes that order.

**A thread is composed, person by person** (`source/index.ts`): the sample source picks each beat from
the lines above by what the read calls it, gives the six rows below the counts they declare and every
other person a last order of their own, and plants the laughs the `laughs` block seeds — so a chat
holding 34 «jaja» here holds 34, and two people never carry one sentence between them.

**Who owes the shop most comes from the messages alone.** Six rows rank on the chat's own evidence —
fiado asked for, orders with a payment message missing after them, how recent, how often — each
carrying its reason in words: `Asked to pay later 7 times · last order yesterday · 3 payments seen`.
The heading says *likely* until the shop confirms a row, an amount appears only where a message
states one, and a total is asserted nowhere. The confirmation is what the fiado book records
(`WHATSAPP-HISTORY-SPEC.md`).

## The day in Prep

**Friday, twelve orders**, grouped by block, `To review` first, then by arrival: Gran Chimú 4, Los
Amautas 3, Las Dalias 2, Chinchaysuyo 2, Próceres 1. They come to 96,900 minor units and the
counter adds 48,000 — a Friday peak of 144,900, against 98,000 on an average day. Counts read
`sales`, the record is a `Sale`, and the export runs by transaction and by customer.

## The money

Ninety days of money, thirty of bank. The BCP account opens at 318,000, closes today at 542,000, and
averages 406,000 a day — far under the 7 UIT monthly line, which is why her own export is her record.
Thirty days bring 1,046 credits worth 1,712,000 through Yape and Plin in the published Lima split;
284 match a recorded sale exactly and the rest are counter takings. Suppliers take 2,160,000, and
1,390,000 of it leaves the bank in 31 payments.

**The fiado book** holds six debtors and 100,200, Maribel and Rosa the big rows. **The payables**
hold four and 138,000, one a day late. A reminder states the sale, the amount and the date.

## The record and the place in the list

The record is qualitative: three counted indicators — `Paid on the day` 8 of 9, `Days with a sale`
26 of 28, `Sales with the payment recorded` 218 of 284 — under the printed level rule, which reads
this shop as `Steady`. The one late payable holds `Punctual` back, and each indicator reads the
shop's own behaviour. `Days with a sale` is declared over 28 days here and the shop connected on
3 September, so on the reference day the screen clamps it to the 16 days it has and reads the same
rate over them, `15 of 16 days` — a count stays inside the window printed beside it. The queue seed dates her place from 3 September, four suppliers invited and two
joined, beside the cleared line, verbatim: «Los negocios que ya usan Rocoto entran primero, y cada
negocio que traes te adelanta en la lista.» A figure in money, a rate, a date and an approval word
wait for a signed lender.

## The products and their faces

Thirty products across five shelves, in the words a bodeguera writes. Every name was run through
`paintingFor()` against the 794 tiles in `app/public/paintings/`, and each JSON row carries its own
result.

- **13 land as they stand**, `leche evaporada` among them: a jug that says milk and stops there.
- **10 take a Peru map line.** Five fill a miss: `aceite vegetal`, `fideo tallarín`, `palta`, both
  gaseosas. Five correct an answer that says something else — `atún en conserva` draws a raw tuna
  loin, `cebolla roja` a white onion, `tomate` another variety, both chicken cuts the whole bird.
- **1 is held out.** `papa blanca` through `patata` lands on `patata-kennebec`, a named variety and
  the sentence the library's own review refused; its drawn mark stands until its tile lands.
- **6 wait for paint** — the home shelf, plus the gas cylinder.

**Key the Peru map on whole names**, the way `KIND_STANDS_FOR` in
`app/src/prototypes/cedar/painting-map.ts` is keyed. A substring alias rewrites its neighbours:
`papa`→`patata` turns `papaya` into `patatya`, and the resolver hands papaya a red potato. That was
run, and it is why each binding in the JSON is a whole name.

## The other two worlds

The bodega is seeded; the other two follow in these same shapes. **The produce stall** trades from
crates and sacks at a puesto in a mercado, in the morning. **The fish stall** sells the day's catch,
off a dawn run to the terminal.

## Open questions for Peter

1. **The block words** are Zárate's own. Do Prep's groups read as districts instead, so a shop with
   two branches still groups?
2. **The counter.** Its takings are one figure here. Does a counter sale become a row she names a
   customer on, turning a walk-in into her own customer?
3. **Seven tiles** — the home shelf and `papa blanca` — before the first demo, or does that shelf
   ship on drawn marks?
