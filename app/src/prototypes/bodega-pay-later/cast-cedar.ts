/* THE BODEGA, IN CEDAR'S SHAPE — the adapter the copied surfaces read the Lima world through.
 *
 * ═══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════════════════════
 * `cast.ts` is the bodega world in the bodega's own words, and the surfaces THIS candidate wrote —
 * Products, Customers, Money, the four Administration seats — read it directly. The surfaces it
 * COPIED from Cedar speak `Cast` and `Sale`: `areas/prep.tsx`, `detail.tsx`, `print-queue.ts`,
 * `print-view.tsx`, `print-screen.tsx` and the copied shell. Handed Cedar's own config they draw
 * Cedar's seeded Barcelona house — 286 orders on Vallès, Litoral and Eixample — which is a
 * different shop in a different country on the same screen as this one.
 *
 * So the bodega is expressed ONCE in the shape those files already ask for, and every one of them
 * reads `BODEGA_CAST` where it used to read `useConfig().derived.cast`. Cedar's config keeps every
 * other answer it gives (the rails, the albarán's posture, the owner's name); only the WORLD moves.
 *
 * ═══ THE DAY IS THE FIXTURE'S TWELVE ═════════════════════════════════════════════════════════
 * `buildSales` folds one request per account that orders, and a bodega's Friday is twelve of its
 * eighteen customers (`fixtures/cast-bodega.json` · `prepDay`). `bodegaSales` is `buildSales`
 * bounded to those twelve for today; the horizon and record days keep the whole book, because a
 * different day is a different twelve.
 *
 * ═══ NO PRICES, AND WHAT THE FIGURES ARE FOR ═════════════════════════════════════════════════
 * The chat corpus states quantities and never money (`cast.ts`'s own note), so the catalogue here
 * carries no price a person reads. `SEED_RATE` exists for ONE mechanical reason: Cedar sizes a
 * generated line by dividing a band of money by the product's rate, so a catalogue with a rate of
 * zero yields a line of five hundred units. The rate is therefore a DIVISOR and never a display —
 * the copied surfaces answer `pricing: false` at their own seam (`detail.tsx`'s note), so every
 * money column, rate field and total on them is already absent.
 *
 * ═══ WHAT IS INVENTED, AND WHY IT IS THE NEUTRAL VALUE ═══════════════════════════════════════
 * `Cast` carries fields a wholesale house has and a bodega does not. Each one takes the emptiest
 * value the shape allows, and the README lists them:
 *   · `truck` is ABSENT on every customer, so `roundOf` answers null and no van chip is drawn —
 *     the shop's own family carries the crate down the street.
 *   · `slot` is absent: the bodega delivers when the order is packed.
 *   · `at` is absent: Peter took the map off the pane.
 *   · `batches` is empty: a bodega buys a crate and sells it, and keeps no lote book.
 *   · `runs` holds ONE walk, the barrio itself, so the paper that groups by run has a group.
 *   · `registry` is empty strings: `persona natural con negocio` stands in no mercantile registry.
 *   · `domain` is empty: onboarding reaches her on her number alone (`cast.ts` · `house.email`).
 *   · `unit` is the trade's own: weight for what is scooped and weighed, a unit for what is handed
 *     over whole.
 */
import * as React from 'react';
import type { Cast, Customer, Family, Order, OrderLine, Person, Product, Supplier } from '../../scenarios/data/cast';
import { useConfig, type Derived } from '../cedar/config';
import type { DayEdits } from '../cedar/day';
import { dayOrders } from '../cedar/day';
import { buildSales, type Sale, type SaleState } from '../cedar/sale';
import { cedarTodayId } from '../cedar/scenario-clock';
import {
  customers as shopCustomers, house as shopHouse, owner as shopOwner, prepDay,
  products as shopProducts, suppliers as shopSuppliers, type BodegaProduct, type PrepState,
} from './cast';

/* ── names into keys ──────────────────────────────────────────────────────────────────────── */

/** A Spanish name into the key Cedar's registries hold a row by: `plátano de seda` → `platano-de-seda`. */
export const keyOf = (name: string): string => name
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ── the catalogue ────────────────────────────────────────────────────────────────────────── */

/** WHAT IS SOLD BY WEIGHT. A bodega scoops rice, lentils and everything off the produce crates onto
 *  a scale; the rest is handed over whole, which is what the second unit says. */
const BY_WEIGHT = new Set([
  'arroz extra', 'azúcar rubia', 'lentejas',
  'pan francés', 'huevo de granja', 'pollo pierna', 'pollo pechuga', 'queso fresco',
  'papa blanca', 'cebolla roja', 'tomate', 'limón', 'palta', 'plátano de seda', 'papaya',
]);

/** The unit the catalogue sells in. `kg` is the scale; `unidad` is the hand. */
export const unitOf = (product: BodegaProduct): string => (BY_WEIGHT.has(product.name) ? 'kg' : 'unidad');

/**
 * THE DIVISOR, NEVER A PRICE. Cedar's `qtyFor` sizes a line as a band of money over the product's
 * rate, so this constant is what puts a bodega's line at one to eight rather than at five hundred.
 * It is read by the fold and by nothing a person sees.
 */
const SEED_RATE = 70;

/** The shelves, as the families the copied surfaces group and trace by. A bodega keeps no lote
 *  book, so every shelf carries the empty traceability profile and an empty field set. */
export const FAMILIES: Family[] = Array.from(new Set(shopProducts.map((p) => p.shelf))).map((shelf) => ({
  id: keyOf(shelf),
  name: shelf,
  traceability: 'none',
  recordFields: [],
  lineFields: [],
}));

export const PRODUCTS: Product[] = shopProducts.map((product) => ({
  id: keyOf(product.name),
  name: product.name,
  family: keyOf(product.shelf),
  unit: unitOf(product),
  variableWeight: false,
  trace: {},
}));

const productKeyed = (name: string): Product | undefined => PRODUCTS.find((p) => p.id === keyOf(name));

/* ── the people ───────────────────────────────────────────────────────────────────────────── */

/** THE BLOCK IS THE ZONE. A bodega's round is the street it is on, so the customer's own block word
 *  — `Jr. Los Amautas`, `Av. Gran Chimú` — lands in the field Prep groups by. */
const PEOPLE: Customer[] = shopCustomers.map((customer) => ({
  id: customer.id,
  name: customer.name,
  channel: 'WhatsApp',
  tier: 'tier 1',
  settles: customer.settles === 'fiado' ? 'credit' : 'cash on delivery',
  zone: customer.block,
  phone: customer.phone,
  address: customer.address,
}));

export const SUPPLIERS: Supplier[] = shopSuppliers.map((supplier): Supplier => ({
  id: supplier.id,
  name: supplier.name,
}));

const OWNER: Person = {
  id: shopOwner.id,
  name: shopOwner.name,
  role: 'gerente',
  phone: shopOwner.phone,
  zone: shopHouse.barrio,
  admin: true,
};

/* ── the day's own order, the one the capture surface holds ───────────────────────────────── */

/** The first row of the fixture's Friday, as the order the catalogue is drawn against. Three lines,
 *  because the surface that draws it is a card a person reads rather than a ledger. */
const ARRIVING = prepDay.orders[0];

const LINE_NAMES = ['arroz extra', 'aceite vegetal 1 L', 'papa blanca'];

const ARRIVING_LINES: OrderLine[] = LINE_NAMES.map((name, index): OrderLine => {
  const product = productKeyed(name);
  return {
    id: `l${index + 1}`,
    product: product?.id ?? keyOf(name),
    qty: index === 2 ? 3 : 2,
    unit: product?.unit ?? 'unidad',
    price: SEED_RATE,
  };
});

/** The delivery day, as the trade says it — the same reading `cedarCast` gives Cedar's own casts, so
 *  the toggler's word and the fold's day agree. */
const deliveryDayWord = (): string => {
  const today = new Date(`${cedarTodayId()}T00:00:00`);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${weekdays[today.getDay()]} ${day}.${month}`;
};

const asked = (lines: OrderLine[]): string =>
  lines.map((line) => `${line.qty} ${line.unit} ${PRODUCTS.find((p) => p.id === line.product)?.name ?? line.product}`).join(', ');

const ORDER: Order = {
  customer: ARRIVING.customer,
  deliveryDay: deliveryDayWord(),
  placedAt: ARRIVING.received,
  words: [`For today: ${asked(ARRIVING_LINES)}.`],
  utterances: [{ at: 0, text: `For today: ${asked(ARRIVING_LINES)}.` }],
  lines: ARRIVING_LINES,
};

/* ── the house ────────────────────────────────────────────────────────────────────────────── */

/** The shop's own door, which is also its counter and its back room. The coordinate is the block
 *  the address names, and it is read by nothing this candidate draws — the map is off the pane. */
const WAREHOUSE_AT = { lat: -12.0316, lng: -77.0043 };

/* ── the seating ──────────────────────────────────────────────────────────────────────────── */

const SHAPE = {
  sector: 'fruit',
  label: 'bodega',
  trade: 'Bodega',
  /** the hour the shop opens, which is where the morning's arrivals start */
  hour: '07:00',
  house: {
    domain: '',
    name: shopHouse.name,
    legalName: shopHouse.legalName,
    taxId: shopHouse.taxId,
    registry: { volume: '', folio: '', sheet: '', entry: '' },
    fiscalAddress: shopHouse.address,
    warehouse: { name: shopHouse.name, address: shopHouse.address, at: WAREHOUSE_AT },
    iban: shopHouse.cci,
    phone: shopHouse.phone,
    whatsapp: shopHouse.whatsapp,
    email: shopHouse.email ?? '',
  },
  owner: OWNER,
  team: [OWNER],
  /** ONE WALK, THE BARRIO ITSELF. The paper that groups by run has a group, and no customer stands
   *  on a van: `truck` is absent on all eighteen, so `roundOf` answers null and no chip is drawn. */
  runs: [{ truck: 1, zone: shopHouse.barrio, comercial: OWNER.id, holds: PEOPLE.length }],
  families: FAMILIES,
  products: PRODUCTS,
  comerciales: [{ id: OWNER.id, name: OWNER.name, phone: OWNER.phone }],
  suppliers: SUPPLIERS,
  batches: [],
} satisfies Omit<Cast, 'customers' | 'order'>;

/**
 * THE BOOK, SEATED SO THE FIXTURE'S FRIDAY LANDS WHOLE.
 *
 * Cedar decides whether an account orders this morning from its own PLACE in the book — a house
 * where all three hundred order every day is a house nobody believes — so the fixture's twelve
 * seated in the fixture's own order came out eleven: one of them sat in a seat the fold skips.
 *
 * The rule is Cedar's to change, so it is ASKED rather than restated. A provisional book is folded,
 * the seats it took are read back, and the twelve are seated in those while the six that stay home
 * take the seats it skipped. The probe's own arriving account is the FIRST seat, which the fold
 * takes for every book, so the reading it gives is the rule's answer and nothing else.
 */
function seatedBook(): Customer[] {
  const named = prepDay.orders.map((order) => order.customer);
  const ordering = named.flatMap((id) => { const person = PEOPLE.find((p) => p.id === id); return person ? [person] : []; });
  const staying = PEOPLE.filter((person) => !named.includes(person.id));
  const probe: Cast = { ...SHAPE, customers: PEOPLE, order: { ...ORDER, customer: PEOPLE[0].id } };
  const taken = new Set(dayOrders(probe).map((row) => row.id));
  const seated: Customer[] = [];
  let ordered = 0;
  let stayed = 0;
  for (const person of PEOPLE) {
    const takesToday = taken.has(person.id);
    if (takesToday && ordered < ordering.length) seated.push(ordering[ordered++]);
    else if (!takesToday && stayed < staying.length) seated.push(staying[stayed++]);
    else seated.push(ordered < ordering.length ? ordering[ordered++] : staying[stayed++]);
  }
  return seated;
}

export const CUSTOMERS: Customer[] = seatedBook();

/* ── the cast ─────────────────────────────────────────────────────────────────────────────── */

/**
 * THE ONE OBJECT THE COPIED SURFACES READ. It is a module constant because `buildSales` caches the
 * fold against the cast's own identity: a cast rebuilt on every render would re-fold the day on
 * every keystroke.
 */
export const BODEGA_CAST: Cast = {
  ...SHAPE,
  customers: CUSTOMERS,
  order: ORDER,
};

/**
 * THE HOUSE THE PAPER IS PRINTED UNDER, exported on its own because the letterhead asks for it
 * outside a component.
 *
 * Cedar takes both lines of that letterhead from `config.brand.name` and `company.ts`'s store: the
 * masthead read «Peix Vilalta» and the line under it «Peix Vilalta, S.L. · B-65 428 901», so a
 * bodega in Lima printed a Barcelona fish wholesaler's identity across the top of its prep list,
 * its packing list and its delivery note. That store's key is `rocoto-app-company`, which belongs
 * to Cedar on a shared origin (`store/keys.ts`), so the paper READS this shop rather than writing
 * over that one.
 */
export const BODEGA_HOUSE = SHAPE.house;

/** «Yesenia Quispe Huamán · 10419825764» — the legal person and her RUC, the way `fiscalLineOf`
 *  joins a company's two facts, off this shop's own cast. */
export const bodegaFiscalLine = (): string =>
  [BODEGA_HOUSE.legalName, BODEGA_HOUSE.taxId].filter(Boolean).join(' · ');

/** THE ONE WALK, NAMED — the barrio the shop stands in, which is the round every order is on. It
 *  is the word the paper's run divider carries in place of Cedar's van (`print-queue.ts`). */
export const BODEGA_WALK: string = SHAPE.runs[0].zone;

/* ── the state word ───────────────────────────────────────────────────────────────────────── */

/**
 * CEDAR'S EIGHT STATES, FOLDED ONTO THE SHOP'S THREE (`cast.ts` · `PREP_STATES`).
 *
 * The fold answers one physical question and the answer is the word: WHERE ARE THE GOODS? On the
 * shelf while the order is only `Asked for`; in a bag with the customer's name on it once it is
 * `Prepared`; out of the shop once it is `Handed over`. Read that way every one of the eight has
 * exactly one home, and a shopkeeper needs no legend to place a row.
 *
 * `made` LANDS ON `Asked for`, WHICH IS THE ONE LINE WORTH SAYING OUT LOUD. In Cedar, `made` means
 * the delivery note has been written up and locked — a document milestone. This shop keeps no
 * document (fiscal documents are off, DESIGN-SPEC.md §7), so writing the order up moves nothing:
 * the goods are still on the shelf, and the row says so. `Prepared` is reached by the pick alone,
 * which is `prepWordOf`'s own facet over this map.
 *
 * `disputed` is a complaint about goods the customer already has, so it stands with the delivered.
 */
export const PREP_STATE_OF: Record<SaleState, PrepState> = {
  request: 'Asked for',
  committed: 'Asked for',
  made: 'Asked for',
  scheduled: 'Prepared',
  sent: 'Handed over',
  delivered: 'Handed over',
  disputed: 'Handed over',
  settled: 'Handed over',
};

/* ── THE WORDS, FOLDED (QA item 4) ────────────────────────────────────────────────────────── */

/**
 * CEDAR'S ROUND, FOLDED ONTO THE SHOP'S WALK — the same move `PREP_STATE_OF` makes one paragraph
 * up, on the vocabulary instead of on the state.
 *
 * The copied Paper surface, the print screen and the library rows read their nouns out of Cedar's
 * shared modules (`cedar/print-measures.ts`, `cedar/output-templates.ts`), and those modules speak
 * a distributor's van round: «12 deliveries · 2 documents · 1 truck divider · By truck · Route
 * order», over the paper of a shop whose family carries the crate down the street. `truck` is
 * absent on all eighteen customers, so every one of those words names a thing this world has none
 * of — while Prep, two inches away, counts those same twelve things as «12 sales».
 *
 * ONE FOLD, HERE, so a noun is renamed once rather than in each of the four surfaces that print
 * it. A customer's order is a SALE, which is what Prep, the prep list and the packing list all
 * call it; the stack of paper is grouped by the WALK, which is the barrio (DESIGN-SPEC.md: «the
 * run divider says the barrio, because the walk is the barrio»).
 */
export const bodegaWords = (words: string): string => words
  .replace(/\bBy truck\b/g, 'Walk order')
  .replace(/\bRoute order\b/g, 'Walk order')
  .replace(/\bdelivery\b/g, 'sale').replace(/\bdeliveries\b/g, 'sales')
  .replace(/\bDelivery\b/g, 'Sale').replace(/\bDeliveries\b/g, 'Sales')
  .replace(/\btruck\b/g, 'walk').replace(/\btrucks\b/g, 'walks')
  .replace(/\bTruck\b/g, 'Walk').replace(/\bTrucks\b/g, 'Walks');

/**
 * FACTS THIS WORLD HAS NO MEANING FOR, DROPPED RATHER THAN RENAMED.
 *
 *   a walk divider   a fact about a van round. One shop walks one barrio, so a stack of paper
 *                    carries no divider worth counting — «1 walk divider» beside a count of one.
 *   a price column   the sheets carry quantities and units and no money at all (DESIGN-SPEC.md
 *                    §3, and `pricing: false` at each copied surface's own seam), so a template
 *                    row and a print head reading «Line total» named a column that never prints.
 */
export const bodegaDrops = (words: string): boolean =>
  /\bdivider/i.test(words) || /\b(?:unit price|line total)\b/i.test(words);

/* ── the day ──────────────────────────────────────────────────────────────────────────────── */

/** The twelve accounts the fixture's Friday names, in the order the fixture lists them. */
export const DAY_ACCOUNTS: readonly string[] = prepDay.orders.map((order) => order.customer);

const DAY_SET = new Set(DAY_ACCOUNTS);

/* ── THE MESSAGE AND THE LINE CARRY ONE QUANTITY (QA item 14) ─────────────────────────────────
 *
 * A unit is handed over whole: nobody sells six and a half gas cylinders. The fold sizes a line by
 * dividing a band of money by the product's rate (`qtyFor`, `cedar/day.ts`) and lands on halves,
 * so weight keeps them — a scale measures halves — and the hand rounds them away. That rule is
 * this world's and it lives here, because `qtyFor` is Cedar's and sizes a wholesale house's lines.
 *
 * ⚠ AND THE ROUND HAS TO REACH THE WORDS, WHICH IS THE WHOLE OF THE DEFECT. The conversation is
 * composed by `asked()` BEFORE this fold runs — «For Saturday 19.09: 6.5 unidad balón de gas 10
 * kg…» — so rounding the line alone left the bubble saying 6.5 and the line under it saying 7, on
 * six of the day's twelve orders, with nothing on the row saying a thing had been changed. A shop
 * reading the two together had no way to tell which one the customer said.
 *
 * So one pass rounds BOTH: the line's own numbers, and every quantity in the thread that is
 * measured in units. Weight is untouched in both, so «4.5 kg lentejas» stays 4.5 in the message
 * and 4.5 on the line. The match is the quantity SLOT — a number, a space, the word `unidad` —
 * which is the one place a quantity stands; a product's own name («aceite vegetal 1 L», «agua
 * mineral 625 ml», «papel higiénico ×4») carries its numbers next to other words entirely.
 *
 * IT IS EXPORTED because the conversation is folded TWICE from one ledger: `bodegaSales` below
 * builds the day the list and the document read, and `shell/threads.ts` folds `buildSales` again
 * by customer for the chats drawer. Both apply this, so one order says one quantity wherever it
 * is read.
 */

/** The quantity slot, as the conversation writes it: `6.5 unidad …`. */
const UNIT_QUANTITY = /(\d+(?:\.\d+)?)(\s+unidad\b)/g;

/** A unit is handed over whole, wherever it is written. */
const wholeUnitWords = (text: string): string =>
  text.replace(UNIT_QUANTITY, (_whole, qty: string, tail: string) => `${Math.max(1, Math.round(Number(qty)))}${tail}`);

export const wholeUnits = (sale: Sale): Sale => {
  const lines = sale.lines.map((line) => (line.unit === 'kg' ? line : {
    ...line,
    ordered: Math.max(1, Math.round(line.ordered)),
    given: Math.max(1, Math.round(line.given)),
  }));
  const thread = sale.thread.map((row) => {
    const said = wholeUnitWords(row.text);
    return said === row.text ? row : { ...row, text: said };
  });
  const movedLines = lines.some((line, i) => line !== sale.lines[i]);
  const movedThread = thread.some((row, i) => row !== sale.thread[i]);
  if (!movedLines && !movedThread) return sale;
  return {
    ...sale,
    ...(movedLines ? { lines } : null),
    ...(movedThread ? { thread } : null),
    /* The reading the AI printed quotes the same words, so it takes the same round. */
    ...(sale.reading ? { reading: wholeUnitWords(sale.reading) } : null),
  };
};

/** THE BINDING IS HELD AGAINST THE FOLD IT CAME OFF. `buildSales` answers the SAME array while its
 *  own cache stands, so the bound day is cached against that array's identity — a fresh array on
 *  every read would re-key every memo on every surface that holds one. */
const BOUND = new WeakMap<Sale[], Sale[]>();

/**
 * THE BOOK, AS THIS SHOP'S. `buildSales` over the bodega cast, with today bounded to the twelve
 * accounts the fixture's Friday names — every other day keeps the whole book.
 */
export function bodegaSales(edits: DayEdits, options: { includeArchived?: boolean } = {}): Sale[] {
  const folded = buildSales(BODEGA_CAST, edits, options);
  const held = BOUND.get(folded);
  if (held) return held;
  const today = cedarTodayId();
  const bound = folded
    .filter((sale) => sale.day !== today || DAY_SET.has(sale.customer.id))
    .map(wholeUnits);
  BOUND.set(folded, bound);
  return bound;
}

/* ── the derivation ───────────────────────────────────────────────────────────────────────── */

/**
 * CEDAR'S DERIVATION, WITH THIS SHOP'S WORLD IN IT. The copied panels take a whole `Derived` — the
 * albarán's posture, the capture door, the rails, the lots — and only two of its fields are facts
 * about the WORLD: the cast, and the line fields the families carry. Both come from the bodega, so
 * the note and the paper read a shelf that holds no lote book; everything else is the house's own
 * setup, exactly as Cedar answers it.
 */
export function useBodegaDerived(): Derived {
  const { derived } = useConfig();
  return React.useMemo(() => ({
    ...derived,
    cast: BODEGA_CAST,
    lineFields: FAMILIES.flatMap((family) => family.lineFields).filter((f, i, a) => a.indexOf(f) === i),
  }), [derived]);
}
