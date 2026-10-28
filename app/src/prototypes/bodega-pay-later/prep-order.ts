/* PREP'S TWO ORDERS — the whole of what «Location» and «Time» mean, as arithmetic.
 *
 * Peter, FEED-IA §268: «sales shouldn't really be there. Sales should actually be turned into prep…
 * It's like a merging of both instead of some long list for sales.» The merging is the grouping in
 * this file: what ARRIVED and needs judging stands above what is ready to pack, and under it the
 * day's orders sit in the blocks they go out to.
 *
 * IT IS PURE AND IT KNOWS NOTHING ABOUT A SALE. Every function here reads the six facts a row
 * actually sorts on (`PrepRow`), so `app/tools/test-bodega-prep-order.mjs` can hold the grouping to
 * a worked day in Node with no React, no cast and no browser — and the surface hands it Cedar's own
 * `Sale` objects wearing those six facts, which is the only place the two vocabularies meet.
 */

/* ── THE TWO ORDERS ───────────────────────────────────────────────────────────────────────── */

import { KEYS } from './store/keys';

export type PrepOrderId = 'location' | 'time';

export const PREP_ORDERS: PrepOrderId[] = ['location', 'time'];

/** THE SEGMENT'S OWN WORDS, SHORT ON PURPOSE. At 393 px the gutter leaves 361 px, and
 *  `By location` + `By time received` costs about 261 of it beside a day row that already wants
 *  ~240 — two rows of 48 px, each `nowrap`, is what fits at 320. The heading above the control is
 *  what says these are orders: `Sort orders`. */
export const PREP_ORDER_WORD: Record<PrepOrderId, string> = {
  location: 'Location',
  time: 'Time',
};

/** LOCATION IS THE DEFAULT AND THE MARKED ONE (DESIGN-SPEC.md §3, Prep). */
export const PREP_ORDER_DEFAULT: PrepOrderId = 'location';

export const isPrepOrder = (value: unknown): value is PrepOrderId =>
  value === 'location' || value === 'time';

/** ONE ORIGIN SERVES `/cedar/` AND `/bodega-pay-later/` (WIRING-SPEC.md §11), so the choice is
 *  kept under this prototype's own prefix and `Reset state` sweeps it with the other eleven. */
export const PREP_ORDER_KEY = KEYS.prepOrder;

/** The order the workspace last stood in. A browser that throws on storage — a private window —
 *  still opens on `Location`, which is the answer it would have given anyway. */
export function readPrepOrder(): PrepOrderId {
  try {
    const held = window.localStorage.getItem(PREP_ORDER_KEY);
    return isPrepOrder(held) ? held : PREP_ORDER_DEFAULT;
  } catch {
    return PREP_ORDER_DEFAULT;
  }
}

/** Kept, so the choice survives the day walk and the next visit. */
export function writePrepOrder(order: PrepOrderId): void {
  try {
    window.localStorage.setItem(PREP_ORDER_KEY, order);
  } catch {
    /* a storage that refuses leaves the surface standing in the order it is drawing */
  }
}

/* ── THE SIX FACTS A ROW SORTS ON ─────────────────────────────────────────────────────────── */

/**
 * WHAT THE GROUPING ACTUALLY READS. Six facts, and the surface folds each one from Cedar's `Sale`
 * at the one seam where the two vocabularies meet:
 *
 *   `id`        `sale.id`
 *   `at`        `sale.at` — the hour the request reached the desk, which is the arrival order
 *   `block`     `zoneWordOf(sale.customer.zone)`, or nothing where the customer has no block
 *   `review`    `isStanding(sale, today)` or `!canPrepare(sale)` — it wants judging before packing
 *   `prepared`  `isPrepared(sale)`
 *   `recheck`   `sale.prep.stale`
 */
export type PrepRow = {
  id: string;
  /** `HH:MM`, so a plain string compare is the arrival order */
  at: string;
  /** the block this order goes out to, or nothing while it has none */
  block: string | null;
  /** it needs judging before it can be packed — `To review` */
  review: boolean;
  prepared: boolean;
  recheck: boolean;
};

export type PrepGroup<T extends PrepRow> = {
  /** stable across renders and across a day walk, so React keys and the paper agree */
  key: string;
  /** the noun label a person reads: `Chorrillos`, `To review`, `To assign` */
  word: string;
  /** the label with its count: `Chorrillos · 6 sales` */
  heading: string;
  rows: T[];
};

/* ── THE TWO GROUPS THAT ARE NOT BLOCKS ───────────────────────────────────────────────────── */

/** IT STANDS FIRST, IN BOTH ORDERS. Sales' `All orders / To review 11 / Archived` scope row goes
 *  and its duty becomes this group: an order still at `request` can be neither packed nor lost, and
 *  Peter asked for a merging — what arrived and needs judging sits above what is ready to pack. */
export const TO_REVIEW = 'To review';

/** IT STANDS LAST. A shop still deciding which block an order goes out to keeps it in a named group
 *  rather than losing it off the list — `print-queue.ts`'s own `truck ?? 'assign'` idiom and its
 *  stated reason, one level up. */
export const TO_ASSIGN = 'To assign';

/* ── THE COUNTS READ `sales` ──────────────────────────────────────────────────────────────── */

/** DESIGN-SPEC.md §3: «counts read `sales`». An order in this prototype is a sale — one shop, one
 *  price, no fiscal document — so the word on every count is the word for the thing itself. */
export const salesWords = (n: number): string => `${n} ${n === 1 ? 'sale' : 'sales'}`;

export const headingOf = (word: string, n: number): string => `${word} · ${salesWords(n)}`;

/* ── THE ARRIVAL ORDER ────────────────────────────────────────────────────────────────────── */

/** OLDEST FIRST, AND THE ID BREAKS A TIE so two orders on the same minute keep one order across
 *  every render and on the paper that prints them. */
const byArrival = <T extends PrepRow>(a: T, b: T): number =>
  a.at.localeCompare(b.at) || a.id.localeCompare(b.id);

/* ── BY LOCATION ──────────────────────────────────────────────────────────────────────────── */

/**
 * `To review` first, then the blocks in the order their first order arrived, then `To assign`.
 *
 * THE BLOCKS ARE ORDERED BY THEIR OWN FIRST ARRIVAL rather than alphabetically, because the list is
 * one day long and a person reads it in the order the morning happened: the block that started
 * ringing at 07:05 is the block they are already thinking about. Alphabetical would be a second
 * fact about the day that nothing in the day produced.
 *
 * ORDERING BY THE REQUESTED SLOT IS REFUSED by the law above `slotOf` in `../cedar/sale.ts`: «the
 * PRINTED OUTPUTS are where slots matter… neither the river nor the prep list ever orders by this.»
 */
export function byLocation<T extends PrepRow>(rows: T[]): PrepGroup<T>[] {
  const review: T[] = [];
  const assign: T[] = [];
  const blocks = new Map<string, T[]>();

  for (const row of [...rows].sort(byArrival)) {
    if (row.review) { review.push(row); continue; }
    if (!row.block) { assign.push(row); continue; }
    const held = blocks.get(row.block);
    if (held) held.push(row);
    else blocks.set(row.block, [row]);
  }

  return [
    ...(review.length ? [group('review', TO_REVIEW, review)] : []),
    ...[...blocks.entries()].map(([word, held]) => group(`block:${word}`, word, held)),
    ...(assign.length ? [group('assign', TO_ASSIGN, assign)] : []),
  ];
}

/* ── BY TIME RECEIVED ─────────────────────────────────────────────────────────────────────── */

/**
 * ONE FLAT LIST, OLDEST FIRST, UNDER `To review`.
 *
 * `To review` keeps its group here too, and that is the point of it being a group rather than a
 * filter: the thing that needs a person is the same thing at the top of either order, so switching
 * the control changes what is beneath it and never what the surface is asking of them.
 */
export function byTimeReceived<T extends PrepRow>(rows: T[]): PrepGroup<T>[] {
  const sorted = [...rows].sort(byArrival);
  const review = sorted.filter((row) => row.review);
  const rest = sorted.filter((row) => !row.review);
  return [
    ...(review.length ? [group('review', TO_REVIEW, review)] : []),
    ...(rest.length ? [group('received', 'Received', rest)] : []),
  ];
}

const group = <T extends PrepRow>(key: string, word: string, rows: T[]): PrepGroup<T> =>
  ({ key, word, heading: headingOf(word, rows.length), rows });

/** THE ORDER THE LIST IS SHOWING, FLATTENED — what `Print` hands `daySheetOrder` so the paper
 *  prints the sequence on screen (`daySheetOrder` maps the array it is handed and sorts nothing). */
export const flatten = <T extends PrepRow>(groups: PrepGroup<T>[]): T[] =>
  groups.flatMap((g) => g.rows);

/** The whole grouping, by the order standing. One door, so the surface and the paper read one
 *  function and can never disagree about what the list is. */
export const groupsFor = <T extends PrepRow>(order: PrepOrderId, rows: T[]): PrepGroup<T>[] =>
  order === 'location' ? byLocation(rows) : byTimeReceived(rows);

/* ── THE WORD UNDER THE ROW ───────────────────────────────────────────────────────────────── */

/**
 * THE STATE WORD, WITH PREP'S TWO FACETS OVER IT.
 *
 * `standing` is the word for WHERE THE GOODS ARE — `Asked for`, `Prepared`, `Handed over`, the
 * shop's own three (`cast.ts` · `PREP_STATES`), which the surface folds Cedar's eight states onto
 * at `PREP_STATE_OF` before it calls in here. The state is carried by words, never by colour, and
 * never by a second weight of the same word. Prep adds exactly two readings above it, in this
 * precedence:
 *
 *   `Re-check`  the goods moved after the bay picked it, so the pick no longer describes the crate
 *   `Prepared`  it is picked and the pick still stands
 *
 * `Re-check` wins over `Prepared` because a stale pick is the one thing on the row a person has to
 * act on, and a row that said `Prepared` about a changed order would be the lie the facet exists to
 * catch.
 *
 * NO TICK IS ADDED HERE. The picking ceremony is parked by §26.1 in three places, and `prepareSale`
 * has zero call sites — `sale.prep` is written by the seeder alone. So the row READS the pick and
 * never writes one, which is question 2 for Peter (prep-design.md).
 */
export const RE_CHECK = 'Re-check';
export const PREPARED = 'Prepared';

export function prepWordOf(row: Pick<PrepRow, 'prepared' | 'recheck'>, standing: string): string {
  if (row.recheck) return RE_CHECK;
  if (row.prepared) return PREPARED;
  return standing;
}
