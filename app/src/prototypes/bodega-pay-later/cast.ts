/* THE BODEGA WORLD, TYPED — `fixtures/cast-bodega.json` read into the shapes the areas ask for.
 *
 * One Lima bodega: eighteen customers, nine suppliers, thirty products, Friday's twelve orders,
 * ninety days of money, the record and the place in the list. `fixtures/README.md` is the prose;
 * this file is the contract, and it is the ONE reader of the JSON so a field that moves moves here.
 *
 * TWO BODIES OF DATA, ONE RULE EACH (DESIGN-SPEC.md the rig, item 7). The chat corpus states
 * quantities, days and names, so a price lives nowhere in it; the money seed holds every amount as
 * an integer in minor units, in a `*Minor` field, which is what keeps §8's currency grep clean.
 * A product therefore carries a name, a shelf and a face, and carries a figure nowhere.
 */
import file from './fixtures/cast-bodega.json';

/* ── the house ────────────────────────────────────────────────────────────────────────────── */

export type BodegaHouse = {
  name: string;
  legalName: string;
  legalPerson: string;
  taxId: string;
  address: string;
  district: string;
  barrio: string;
  bank: string;
  account: string;
  cci: string;
  phone: string;
  whatsapp: string;
  yape: string;
  /** Onboarding reaches her on her number alone, so the field stays empty. */
  email: string | null;
};

export type BodegaOwner = { id: string; name: string; role: string; age: number; phone: string; admin: boolean };

/* ── the people ───────────────────────────────────────────────────────────────────────────── */

export type Settles = 'fiado' | 'cash';

export type BodegaCustomer = {
  id: string;
  /** the shop's own WhatsApp contact name, which is what the read returns: `Rosa menú`, `Julia 2do piso` */
  name: string;
  phone: string;
  address: string;
  /** block words stand in for coordinates, so Prep groups by block and the map stays off the pane */
  block: string;
  settles: Settles;
  perWeek: number;
  bandMinor: [number, number];
  messages: number;
};

export type BodegaSupplier = {
  id: string;
  name: string;
  trade: string;
  phone: string;
  days: string[];
  bandMinor: [number, number];
  /** `cash` or `a week` — the four on a week's terms are the pay-later candidates */
  terms: string;
  messages: number;
  /** the orders the chat shows over the window, in this supplier's own rhythm: `Bought 22 times` */
  purchases: number;
  dropsAt?: string;
  perDropMinor?: number;
  settles?: string;
  payLaterCandidate?: boolean;
};

/* ── the catalogue, built from the orders ─────────────────────────────────────────────────── */

export type FaceHow = 'direct' | 'peru-map' | 'held out' | 'to paint';

export type BodegaProduct = {
  name: string;
  shelf: string;
  /** the resolved painting, or nothing while the `ProduceIcon` family mark draws */
  face: string | null;
  how: FaceHow;
  /** the whole-name Peru alias this row resolved through */
  binding?: string;
  why?: string;
};

/* ── the day in Prep ─────────────────────────────────────────────────────────────────────── */

/**
 * WHERE THE GOODS ARE, IN THREE WORDS A SHOPKEEPER OWNS.
 *
 * An order is `Asked for` while the goods are still on the shelf, `Prepared` once they are in a
 * bag with the customer's name on it, and `Handed over` when they have left the shop. One physical
 * question — where are the goods? — is the whole of what a row says about an order, which is why
 * the set is three words long and reads without a legend.
 *
 * `Request` and `Committed` used to stand in this column beside `Prepared`. They are the wholesale
 * statechart's own milestones — an order taken in, an order agreed — and a bodega keeps neither
 * book, so a list that printed «Flor Ccahuana · 4 lines · 10:16 · Committed» between two «Made»
 * rows was order-management jargon said to a shopkeeper, with nothing on the screen explaining it.
 *
 * CEDAR'S EIGHT STATES FOLD ONTO THESE THREE AT ONE SEAM, `PREP_STATE_OF` in `cast-cedar.ts`, so
 * the Prep row, the delivery note's head and the customer sheet read one set of words.
 */
export const PREP_STATES = ['Asked for', 'Prepared', 'Handed over'] as const;

export type PrepState = (typeof PREP_STATES)[number];

export type PrepOrder = {
  n: number;
  customer: string;
  street: string;
  block: string;
  /** the hour it arrived, which is what the `Time` order reads */
  received: string;
  lines: number;
  totalMinor: number;
  settles: Settles;
  /** where the goods are, in the shop's own words */
  state: PrepState;
  /**
   * IT WANTS JUDGING BEFORE IT CAN BE PACKED — the `To review` group (`prep-order.ts`), and its own
   * field because it is its own fact. `Request` used to carry it: a row said «Request» and a reader
   * had to know that the wholesale statechart's first milestone also meant «someone look at this».
   * Two facts in one word is what made the column need a legend, so the word says where the goods
   * are and this says what the order is waiting on.
   */
  review?: boolean;
};

export type PrepGroup = { block: string; sales: number; totalMinor: number };

export type PrepDay = {
  date: string;
  weekday: string;
  groupedBy: string;
  orders: PrepOrder[];
  groups: PrepGroup[];
  ordersTotalMinor: number;
  counterTakingsMinor: number;
  dayTotalMinor: number;
  averageDayMinor: number;
  monthMinor: number;
};

/* ── the money seed ──────────────────────────────────────────────────────────────────────── */

export type SeedWindow = { days: number; from: string; to: string };

export type MoneySeed = {
  windows: { chat: SeedWindow; money: SeedWindow; bank: SeedWindow };
  bank: {
    bank: string;
    kind: string;
    currency: string;
    openingMinor: number;
    closingMinor: number;
    averageDailyBalance90dMinor: number;
  };
  incoming30d: {
    credits: number;
    totalMinor: number;
    yape: { credits: number; totalMinor: number };
    plin: { credits: number; totalMinor: number };
    matchedToSale: number;
    cashTillMinor: number;
  };
  outgoing30d: { totalMinor: number; throughBank: { payments: number; totalMinor: number }; fromTillMinor: number };
  fiadoBook: {
    debtors: number;
    totalMinor: number;
    rows: { customer: string; amountMinor: number; since: string; sales: number }[];
  };
  payables: {
    due: number;
    totalMinor: number;
    rows: { supplier: string; amountMinor: number; delivered: string; due: string; state?: string }[];
    settled: { supplier: string; amountMinor: number; paid: string; grade: string; note: string }[];
  };
  record: {
    level: string;
    levels: string[];
    indicators: RecordIndicator[];
    levelRule: string;
  };
  queue: QueueSeed;
};

export type RecordIndicator = {
  id: string;
  count: number;
  of: number;
  windowDays: number;
  asOf: string;
  floor: number;
  bankGraded?: number;
  newestReason: string;
};

export type QueueSeed = {
  inLineSince: string;
  /** THE SAMPLE WORLD'S OWN PLACE, and the sample code its link carries. The rig reads both from
   *  `GET /api/bodega/waitlist`; these stand where no connection service answers, and the screen
   *  that prints them says `Sample waitlist` (ONBOARDING-SPEC.md §0, `start/joining.ts`). */
  place: number;
  referralCode: string;
  /** how many places one business is worth, and how many businesses cover one purchase */
  movesUpBy: number;
  perCoveredPurchase: number;
  suppliers: number;
  invited: string[];
  joined: string[];
  /** Peter's cleared line, verbatim, and the English source it was written from */
  clearedLine: string;
  clearedLineSource: string;
};

/* ── the chats ───────────────────────────────────────────────────────────────────────────── */

export type SampleText = { direction: 'in' | 'out'; text: string; image?: boolean };

export type ChatCorpus = {
  windowDays: number;
  from: string;
  to: string;
  threads: number;
  messages: number;
  imageMessages: number;
  sampleTexts: SampleText[];
  laughs: { byCustomer: Record<string, number> };
  whoOwesYou: {
    heading: string;
    rows: {
      customer: string;
      fiadoAsks: number;
      ordersAwaitingPayment: number;
      lastOrderDaysAgo: number;
      paymentsSeen: number;
      /** the reason in words, which every row carries */
      reason: string;
    }[];
  };
};

/* ── the file ────────────────────────────────────────────────────────────────────────────── */

export type CastFile = {
  version: number;
  world: string;
  referenceDay: string;
  timezone: string;
  currency: string;
  house: BodegaHouse;
  owner: BodegaOwner;
  customers: BodegaCustomer[];
  suppliers: BodegaSupplier[];
  products: BodegaProduct[];
  prepDay: PrepDay;
  money: MoneySeed;
  chatCorpus: ChatCorpus;
  faces: { tally: { direct: number; peruMap: number; heldOut: number; toPaint: number }; peruMapBindings: { key: string; slug: string }[]; toPaint: string[] };
};

export const CAST = file as unknown as CastFile;

export const REFERENCE_DAY = CAST.referenceDay;
export const TIMEZONE = CAST.timezone;
export const house = CAST.house;
export const owner = CAST.owner;
export const customers = CAST.customers;
export const suppliers = CAST.suppliers;
export const products = CAST.products;
export const prepDay = CAST.prepDay;
export const money = CAST.money;
export const queue = CAST.money.queue;
export const record = CAST.money.record;
export const corpus = CAST.chatCorpus;
export const faces = CAST.faces;

/** The likely list of DESIGN-SPEC.md §2, each row carrying its reason in words. */
export const likelyOwed = CAST.chatCorpus.whoOwesYou.rows;

/** THE RIG'S TEST RANKING RULE: «haha» and «jaja» per chat, until the debt read replaces it
 *  (WHATSAPP-HISTORY-SPEC.md §5). The screen prints the rule, so the switch stays visible. */
export const laughs: Record<string, number> = CAST.chatCorpus.laughs.byCustomer;

export const customerOf = (id: string): BodegaCustomer | undefined => customers.find((c) => c.id === id);
export const supplierOf = (id: string): BodegaSupplier | undefined => suppliers.find((s) => s.id === id);

/** The name a person reads, which is the shop's own contact name where there is one. */
export const nameOf = (id: string): string => customerOf(id)?.name ?? supplierOf(id)?.name ?? id;

/** The four suppliers on a week's terms, which are the pay-later candidates. */
export const payLaterSuppliers = (): BodegaSupplier[] => suppliers.filter((s) => s.terms === 'a week');

/** Prep's counts read `sales`, one day at a time. */
export const salesToday = (): number => prepDay.orders.length;
