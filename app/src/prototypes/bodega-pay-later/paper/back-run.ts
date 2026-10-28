/* THE NINETY DAYS, AS TRANSACTIONS — the book behind the export door (DESIGN-SPEC.md §3 card 5).
 *
 * WHY THIS FILE EXISTS. The export door names a period of 90 days, and the record two taps away
 * says a sale landed on 26 of the last 28 days and that 218 of 284 sales in that window carry a
 * recorded payment. A file that named those 90 days and held the day's twelve orders would be a
 * book whose own heading is twenty times its contents — and the export is the file a shop hands its
 * contador. So the 90 days the fixtures declare are written out HERE, as the transactions the
 * record already asserts, and the door writes them.
 *
 * ═══ EVERY FIGURE IN THIS FILE IS THE WORLD'S OWN ═══════════════════════════════════════════
 *   how many        `money.record.indicators` — `sales-with-the-payment-recorded`'s own denominator,
 *                   284 sales over the 28 days it counts, the day's twelve of `prepDay` among them
 *   how many days   the same register's `days-with-a-sale`, 26 of 28, which is a shop that shuts one
 *                   day a fortnight — so that is the rule, and the last 28 days hold exactly two
 *   whose sale      each customer's own `perWeek`, as the share of the week they take
 *   how much        each customer's own `bandMinor`, to the nearest fifty céntimos
 *   what happened   `sales-with-the-payment-recorded`'s own count, 218 of 284, so the book records
 *                   the payment on exactly the share the record claims
 *   what is open    `money.fiadoBook.rows`, placed on the sales they are the debt of
 *   how it was paid `money.incoming30d`'s own credit mix, 812 Yape to 234 Plin, and cash where the
 *                   cast says the customer settles in cash
 *
 * `perWeek` COUNTS ORDERS, AND THE RECORD COUNTS SALES. Eighteen customers ordering `perWeek` times
 * come to 59 orders a week, and the record counts 284 sales in four weeks — 48 more. Those are the
 * counter purchases a Yape credit puts a name on (`incoming30d.matchedToSale`), which are sales in
 * the book and orders nowhere. So the RATE is the record's and the SHARE is `perWeek`'s: a customer
 * who orders five times a week carries five fifty-ninths of the book.
 *
 * ═══ DERIVED, SO THE SAME BOOK COMES BACK ═══════════════════════════════════════════════════
 * `spin` is `customer-profile.tsx`'s own derivation (`usualOf`: «a pure function of the customer's
 * own id … so the same four rows return on every reload»). Nothing here reads a clock or a random
 * number, so the file a shop takes today and the file it takes after a reload are the same file,
 * and the built run is held once per page.
 *
 * ⚠ THIS IS SEED, AND THE SPEC SAYS SO (DESIGN-SPEC.md §3: «Seeded: the payables, the fiado book,
 * the 90 days»). The moment Money's own ledger holds the days, `areas/money.tsx` hands its bundle to
 * the door and this run stands behind it for the days the ledger has yet to reach.
 */
import { customers, money, prepDay, type BodegaCustomer } from '../cast';
import { seedDay, seedWindowDays } from '../supplier-payments';
import type { PaperTransaction } from './export-files';

/* ── the words a row's state carries ──────────────────────────────────────────────────────────
 * Three, and each says what IS. `Paid` — the payment is in the record. `Delivered` — the goods went
 * and the payment is still to be recorded, which is the very gap `Sales with the payment recorded`
 * counts, and it is Cedar's own word for a sale whose money has still to be made final. `Fiado` —
 * the shop is carrying it, and the fiado book says how much.
 */
export const PAID = 'Paid';
export const DELIVERED = 'Delivered';
export const FIADO = 'Fiado';

/** A sale of the seeded book, carrying the id the fiado book and the customer sheet know it by. */
export type BackRunSale = PaperTransaction & { customerId: string };

/* ── the shop's own clock and shutters ────────────────────────────────────────────────────── */

const DAY_MS = 86400000;
/** Midday UTC, so a day's arithmetic is a day's arithmetic whatever Lima's offset is doing. */
const dayValue = (iso: string): number => Date.parse(`${iso}T12:00:00Z`);
const dayBefore = (iso: string, days: number): string =>
  new Date(dayValue(iso) - days * DAY_MS).toISOString().slice(0, 10);
const pad = (n: number): string => String(n).padStart(2, '0');

/** ONE DAY A FORTNIGHT, SHUT. `days-with-a-sale` reads `26 of 28`, which is two days in four weeks
 *  with no sale on them; a fortnight rule is the one shape that puts exactly two there and keeps
 *  the same rate over the whole 90 days. The phase is the one that leaves every day the fixtures
 *  already date a record on — a fiado's `since`, the reference day itself — trading. */
export const SHUT_EVERY = 14;
export const SHUT_PHASE = 5;
export const shut = (offset: number): boolean => offset % SHUT_EVERY === SHUT_PHASE;

/** The shop's counter hours, which is the span a sale's hour is drawn from. */
const OPEN_HOUR = 7;
const OPEN_MINUTES = 13 * 60;

/** Soles are counted in fifties at a bodega counter, so an amount lands on one. */
const TICKET_STEP = 50;

const SPIN_MOD = 99991;

/** `customer-profile.tsx`'s own spin, so a derived figure is derived the one way in this candidate. */
const spin = (seed: string): number => {
  let out = 7;
  for (let i = 0; i < seed.length; i += 1) out = (out * 131 + seed.charCodeAt(i)) % SPIN_MOD;
  return out;
};

/* ── what the record asserts ──────────────────────────────────────────────────────────────── */

/** One field of one indicator, or `0` where the seed states none — a world that claims no
 *  denominator gets no back-run, and the door prints the day it holds. */
const asserted = (id: string, field: 'count' | 'of'): number =>
  money.record.indicators.find((row) => row.id === id)?.[field] ?? 0;

/** THE ONE WEEK OF SALES, IN THE ORDER THEY LAND. Each customer takes `perWeek` seats, spread
 *  through the week by their own spin, so a continuous walk through this cycle hands every customer
 *  their own share of the book at their own spacing rather than in a block. */
export function weekCycle(): BodegaCustomer[] {
  const seats: { at: number; person: BodegaCustomer }[] = [];
  for (const person of customers) {
    const phase = spin(person.id) / SPIN_MOD;
    for (let k = 0; k < person.perWeek; k += 1) seats.push({ at: (k + phase) / person.perWeek, person });
  }
  seats.sort((a, b) => a.at - b.at);
  return seats.map((seat) => seat.person);
}

/** EVERY k-TH ROW OF n, AND EXACTLY k OF THEM — the stride that lands a share on the nose, so the
 *  count of sales whose payment is still to be recorded is the record's own figure rather than
 *  approximately it. */
function markDelivered(rows: BackRunSale[], k: number): void {
  const n = rows.length;
  if (n <= 0 || k <= 0) return;
  rows.forEach((sale, i) => {
    if (Math.floor(((i + 1) * k) / n) > Math.floor((i * k) / n)) {
      sale.state = DELIVERED;
      sale.paidBy = '';
    }
  });
}

/* ── the book ─────────────────────────────────────────────────────────────────────────────── */

function build(): BackRunSale[] {
  /* THE WHOLE BOOK ROLLS WITH THE CLOCK (the QA pass, item 17). The window's own days are the
     seed's, rolled onto the day the app is opened, so the file the shop takes today ends today. */
  const period = seedWindowDays(money.windows.money);
  const span = Math.round((dayValue(period.to) - dayValue(period.from)) / DAY_MS);
  const counted = asserted('sales-with-the-payment-recorded', 'of');
  const recorded = asserted('sales-with-the-payment-recorded', 'count');
  const countedDays = asserted('days-with-a-sale', 'of');
  const today = prepDay.orders.length;
  const cycle = weekCycle();
  if (span <= 0 || countedDays <= 1 || counted <= today || !cycle.length) return [];

  /* THE RATE IS THE RECORD'S OWN. Its window holds `counted` sales, the reference day holds the
     day's orders, and what is left falls on the trading days of that window — so the whole 90 days
     run at the rate the record was read at. */
  let tradingInWindow = 0;
  for (let offset = 1; offset < countedDays; offset += 1) if (!shut(offset)) tradingInWindow += 1;
  if (tradingInWindow <= 0) return [];
  const rate = (counted - today) / tradingInWindow;

  const rows: BackRunSale[] = [];
  const seen = new Map<string, number>();
  let carry = 0;
  let made = 0;
  let seat = 0;
  /* Oldest first, one day at a time, the fraction carried rather than rounded away — so the count
     over any stretch of the book is the rate times its trading days, to the sale. */
  for (let offset = span; offset >= 1; offset -= 1) {
    if (shut(offset)) continue;
    carry += rate;
    const n = Math.floor(carry) - made;
    made += n;
    const day = dayBefore(period.to, offset);
    for (let j = 0; j < n; j += 1) {
      const person = cycle[seat % cycle.length];
      seat += 1;
      const nth = (seen.get(person.id) ?? 0) + 1;
      seen.set(person.id, nth);
      const [low, high] = person.bandMinor;
      const inBand = low + Math.round((spin(`${person.id}-${nth}`) % (high - low + 1)) / TICKET_STEP) * TICKET_STEP;
      const minute = spin(`${person.id}-${nth}-hour`) % OPEN_MINUTES;
      rows.push({
        reference: '',
        day,
        at: `${pad(OPEN_HOUR + Math.floor(minute / 60))}:${pad(minute % 60)}`,
        customer: person.name,
        customerId: person.id,
        amountMinor: Math.min(high, Math.max(low, inBand)),
        paidBy: '',
        state: PAID,
      });
    }
  }

  /* ── WHAT IS STILL OPEN IS THE FIADO BOOK'S, PLACED ON THE SALES IT IS THE DEBT OF ──────────
     A row of the book says who, how much, over how many sales and since when. So its newest sales
     from that day on become those sales, their amounts come to the book's own figure, and the
     oldest of them carries the day the book says the debt started — which is the day the customer
     sheet prints in `owed since`. THE BOOK'S FIGURE WINS OVER THE BAND: a confirmed row is the
     shop's own answer about that person, and a fiado bigger than her usual basket is why it is
     still open. */
  for (const seeded of money.fiadoBook.rows) {
    const row = { ...seeded, since: seedDay(seeded.since) };
    const mine = rows.filter((sale) => sale.customerId === row.customer);
    const since = mine.filter((sale) => sale.day >= row.since);
    const chosen = (since.length >= row.sales ? since : mine).slice(-row.sales);
    if (!chosen.length) continue;
    const each = Math.floor(row.amountMinor / chosen.length);
    chosen.forEach((sale, i) => {
      sale.state = FIADO;
      sale.paidBy = '';
      sale.amountMinor = i < chosen.length - 1 ? each : row.amountMinor - each * (chosen.length - 1);
    });
    chosen[0].day = row.since;
  }

  rows.sort((a, b) => a.day.localeCompare(b.day) || (a.at ?? '').localeCompare(b.at ?? ''));

  /* ── THE PAYMENT RECORDED ON THE SHARE THE RECORD CLAIMS ────────────────────────────────────
     `218 of 284` leaves 66 sales in that window whose payment is still to be recorded. The day's
     own fiados and the fiado book are 15 of them; the rest are sales the shop delivered and took
     the coins for without ever writing the payment down, which is the gap the indicator measures
     and the reason the product exists. The same share runs back over the days before the record's
     window, so the book reads one way throughout. */
  const from = dayBefore(period.to, countedDays - 1);
  const inWindow = rows.filter((sale) => sale.day >= from);
  const open = inWindow.filter((sale) => sale.state !== FIADO);
  const fiadoToday = prepDay.orders.filter((order) => order.settles === 'fiado').length;
  const fiadoInWindow = inWindow.length - open.length;
  const toRecord = Math.max(0, counted - recorded - fiadoToday - fiadoInWindow);
  markDelivered(open, Math.min(toRecord, open.length));
  const older = rows.filter((sale) => sale.day < from);
  markDelivered(older, open.length ? Math.round((older.length * toRecord) / open.length) : 0);

  /* ── THE REFERENCE, LAST, OFF THE DAY THE ROW ENDED UP ON ───────────────────────────────────
     `sale-2026-08-24-03` is the shape the day's own orders carry, and coverage is measured on it
     (`export-files.ts recordKeys`), so it is written after the fiado moved its day: two rows
     sharing a reference would be two records the changed-only projection reads as one. */
  const nth = new Map<string, number>();
  const mix = money.incoming30d.yape.credits + money.incoming30d.plin.credits;
  for (const sale of rows) {
    const n = (nth.get(sale.day) ?? 0) + 1;
    nth.set(sale.day, n);
    sale.reference = `sale-${sale.day}-${pad(n)}`;
    if (sale.state !== PAID) continue;
    /* HOW IT WAS PAID: cash where the cast says the customer settles in cash, and otherwise the
       seed's own credit mix — 812 Yape to 234 Plin. */
    const settles = customers.find((person) => person.id === sale.customerId)?.settles;
    sale.paidBy = settles === 'cash' ? 'cash'
      : mix > 0 && spin(`${sale.reference}-paid`) % mix < money.incoming30d.plin.credits ? 'plin' : 'yape';
  }

  return rows;
}

let held: BackRunSale[] | null = null;

/** THE SEEDED NINETY DAYS, BUILT ONCE PER PAGE. The door asks for it on every press, and it is the
 *  same book every time, so it is derived once and held. */
export function backRun(): BackRunSale[] {
  if (!held) held = build();
  return held;
}
