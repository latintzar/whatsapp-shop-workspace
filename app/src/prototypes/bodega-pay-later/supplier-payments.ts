/* WHAT YOU OWE YOUR SUPPLIERS — one record per purchase (DESIGN-SPEC.md §3 card 2, WIRING-SPEC.md §8).
 *
 * «Pay-later is per purchase»: one row per purchase, a supplier, an amount, a due date and a state
 * word, and the state words are the five this set allows — `Offered`, `Used`, `Due 24 Sep`,
 * `Settled 12 Sep`, `Late · 3 days` — drawn in INK rather than in colour, because this product has
 * no traffic lights. `Offered` and `Used` belong to pay-later and render only once a lender signs
 * (`paylater.ts` holds that gate).
 *
 * ═══ AN AMOUNT IS WHAT THE SUPPLIER WROTE IN THE CHAT ═══════════════════════════════════════
 * The chat corpus states quantities, days and names and states a price NOWHERE (DESIGN-SPEC.md the
 * rig, item 7), so a purchase carries an amount only where the money seed declares one. A row
 * without one reads its QUANTITY line instead — «2 sacos, 1 caja» — which is exactly what the
 * message said, and the row stays honest rather than inventing a figure.
 *
 * ═══ SETTLEMENT IS EVIDENCE, AND THERE ARE TWO KINDS ════════════════════════════════════════
 *   bank   a matched outgoing movement on the connected account — the bank graded it
 *   shop   her own dated `I paid it`
 * Both settle a purchase; only the first counts towards the record's FLOOR, which is what keeps a
 * shop Prometeo cannot reach scorable (`record.ts`). Her confirmations live in this module's own
 * store, `rocoto-bodega-supplier-payments-v1:<scope>`.
 */
import { cedarTodayId } from '../cedar/scenario-clock';
import { REFERENCE_DAY } from './cast';
import { KEYS, scoped } from './store/keys';

export type SettlementGrade = 'bank' | 'shop';

/** The five words a purchase row may print, and nothing else. */
export type PurchaseStateKind = 'offered' | 'used' | 'due' | 'settled' | 'late';

export type SupplierPurchase = {
  id: string;
  supplierId: string;
  supplierName: string;
  /** where the supplier is reached for payment — her Yape goes to this number */
  supplierPhone?: string;
  /** minor units, and present only where the money seed declares one */
  amountMinor?: number;
  /** what the message said, where it stated a quantity rather than an amount */
  quantityLine?: string;
  /** `YYYY-MM-DD` */
  deliveredOn: string;
  /** `YYYY-MM-DD`, the day agreed */
  dueOn: string;
  /** `YYYY-MM-DD`, the day it settled */
  settledOn?: string;
  settledBy?: SettlementGrade;
  /** the words the evidence carries, `confirmed by your bank` */
  settledNote?: string;
  /** pay-later's own mark, which renders only once a lender signs */
  payLater?: 'offered' | 'used';
};

export type PurchaseState = { kind: PurchaseStateKind; word: string; lateDays: number };

/* THE THREE-LETTER MONTH, WRITTEN OUT. `Intl` under en-GB now returns «Sept» for September, and
 * this set's words are `Due 24 Sep` and `Settled 12 Sep` — pinned in DESIGN-SPEC.md §3 — so the
 * twelve stand here rather than at the mercy of a locale data revision. */
export const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** `24 Sep` — the shop's own calendar, one grammar everywhere on this surface. */
export function purchaseDate(day: string): string {
  const at = new Date(`${day}T12:00:00Z`);
  return Number.isFinite(at.getTime())
    ? `${at.getUTCDate()} ${SHORT_MONTHS[at.getUTCMonth()]}`
    : '';
}

const dayValue = (day: string): number => Date.parse(`${day}T12:00:00Z`);

/* ══ ONE CLOCK, THE ONE PREP READS ═══════════════════════════════════════════════════════════
 *
 * Money computed against the fixture's `referenceDay` while Prep took today from the workspace
 * clock, so on 19 September a purchase two days past its day agreed printed «Late · 1 day» and
 * `Money in` was labelled «20 Aug to 18 Sep» (the QA pass, item 17). The seed keeps its anchor —
 * its dates are written against `referenceDay` and hold their distances from it — and the whole
 * book is ROLLED onto the day the app is opened, so the two surfaces name one day for good.
 */

const DAY_MS = 86400000;

/** The day the workspace is on, which is the day Prep prints. */
export const moneyToday = (): string => cedarTodayId();

/** Whole days from one calendar day to another. */
export function daysBetween(from: string, to: string): number {
  const a = dayValue(from), b = dayValue(to);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / DAY_MS) : 0;
}

/** How far the seed has travelled from its anchor to today. */
export const seedShiftDays = (today: string = moneyToday()): number =>
  daysBetween(REFERENCE_DAY, today);

/** A seeded day, rolled onto today's clock: `2026-09-17` due against a 19 September anchor stays
 *  one day late whatever day the founder opens the app on. */
export function seedDay(day: string, today: string = moneyToday()): string {
  const at = dayValue(day);
  if (!Number.isFinite(at)) return day;
  return new Date(at + seedShiftDays(today) * DAY_MS).toISOString().slice(0, 10);
}

/** A seeded window, rolled whole, so `Money in` ends on today rather than on the anchor. */
export const seedWindowDays = <T extends { from: string; to: string }>(window: T, today: string = moneyToday()): T =>
  ({ ...window, from: seedDay(window.from, today), to: seedDay(window.to, today) });

/** Whole days the day agreed has passed by, 0 while it still stands. */
export function lateDays(purchase: SupplierPurchase, today: string): number {
  const due = dayValue(purchase.dueOn), now = dayValue(today);
  if (!Number.isFinite(due) || !Number.isFinite(now)) return 0;
  return Math.max(0, Math.round((now - due) / 86400000));
}

/**
 * THE ROW'S STATE, IN ONE OF FIVE WORDS. Settled wins, because it is the end of the row; then
 * pay-later's own mark where a lender has signed and the shop took the 30 days; then the day
 * agreed, read as `Due 24 Sep` while it stands and `Late · 3 days` once it has passed.
 */
export function purchaseState(purchase: SupplierPurchase, today: string, payLaterVisible = false): PurchaseState {
  if (purchase.settledOn) {
    return { kind: 'settled', word: `Settled ${purchaseDate(purchase.settledOn)}`, lateDays: 0 };
  }
  if (payLaterVisible && purchase.payLater) {
    return { kind: purchase.payLater, word: purchase.payLater === 'offered' ? 'Offered' : 'Used', lateDays: 0 };
  }
  const late = lateDays(purchase, today);
  if (late > 0) return { kind: 'late', word: `Late · ${late} ${late === 1 ? 'day' : 'days'}`, lateDays: late };
  return { kind: 'due', word: `Due ${purchaseDate(purchase.dueOn)}`, lateDays: 0 };
}

/** What the row reads where the fixtures declare an amount for it, and what it reads otherwise. */
export const purchaseCarriesAmount = (purchase: SupplierPurchase): boolean =>
  Number.isSafeInteger(purchase.amountMinor) && (purchase.amountMinor as number) > 0;

/** `4 purchases to pay · 1 late` — the card's own window, printed over its own rows. */
export function purchaseSummary(rows: readonly SupplierPurchase[], today: string): string {
  const open = rows.filter((row) => !row.settledOn);
  const late = open.filter((row) => lateDays(row, today) > 0).length;
  const head = `${open.length} ${open.length === 1 ? 'purchase' : 'purchases'} to pay`;
  return late > 0 ? `${head} · ${late} late` : head;
}

/** Open rows first, the nearest day agreed at the top, then the settled ones newest first. */
export function orderPurchases(rows: readonly SupplierPurchase[]): SupplierPurchase[] {
  return rows.slice().sort((a, b) => {
    if (Boolean(a.settledOn) !== Boolean(b.settledOn)) return a.settledOn ? 1 : -1;
    if (a.settledOn && b.settledOn) return b.settledOn.localeCompare(a.settledOn) || a.id.localeCompare(b.id);
    return a.dueOn.localeCompare(b.dueOn) || a.supplierName.localeCompare(b.supplierName) || a.id.localeCompare(b.id);
  });
}

/* ── HER OWN DATED CONFIRMATIONS ──────────────────────────────────────────────────────────── */

/** `I paid it`, with the day she said it. The shop's own evidence, graded `shop`. */
export type PaidConfirmation = { purchaseId: string; on: string; at: string };

export type PaidBook = { version: 1; scope: string; rows: PaidConfirmation[] };

export const paidKey = (scope: string): string => scoped(KEYS.supplierPayments, scope);
export const emptyPaidBook = (scope: string): PaidBook => ({ version: 1, scope, rows: [] });

const calendarDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));

export function parsePaidBook(raw: unknown, scope: string): PaidBook {
  if (!raw || typeof raw !== 'object') return emptyPaidBook(scope);
  const value = raw as Partial<PaidBook>;
  if (value.version !== 1 || value.scope !== scope || !Array.isArray(value.rows)) return emptyPaidBook(scope);
  const rows: PaidConfirmation[] = [];
  for (const row of value.rows.slice(0, 400)) {
    const item = row as Partial<PaidConfirmation>;
    if (!item || typeof item.purchaseId !== 'string' || !item.purchaseId) continue;
    if (!calendarDay(item.on) || typeof item.at !== 'string' || !Number.isFinite(Date.parse(item.at))) continue;
    rows.push({ purchaseId: item.purchaseId, on: item.on, at: item.at });
  }
  return { version: 1, scope, rows };
}

export function readPaidBook(scope: string): PaidBook {
  try { return parsePaidBook(JSON.parse(localStorage.getItem(paidKey(scope)) || 'null'), scope); }
  catch { return emptyPaidBook(scope); }
}

export function writePaidBook(book: PaidBook): void {
  try {
    localStorage.setItem(paidKey(book.scope), JSON.stringify(book));
    window.dispatchEvent(new CustomEvent('rocoto:bodega-payments-changed', { detail: { scope: book.scope } }));
  } catch { /* The session keeps the confirmation it is holding. */ }
}

/** One confirmation, recorded on the day she gives it. A second one for the same purchase replaces
 *  the first, so the row carries one settlement rather than a stack. */
export function confirmPaid(book: PaidBook, purchaseId: string, on: string, at = new Date().toISOString()): PaidBook {
  const rows = book.rows.filter((row) => row.purchaseId !== purchaseId);
  return { ...book, rows: [...rows, { purchaseId, on, at }] };
}

/** Her confirmations laid over the seeded rows, so one list is what every surface reads. */
export function withConfirmations(
  rows: readonly SupplierPurchase[], book: PaidBook,
): SupplierPurchase[] {
  const held = new Map(book.rows.map((row) => [row.purchaseId, row]));
  return rows.map((row) => {
    const confirmed = held.get(row.id);
    if (!confirmed || row.settledOn) return row;
    return { ...row, settledOn: confirmed.on, settledBy: 'shop' as SettlementGrade,
      settledNote: 'you told Rocoto the day you paid it' };
  });
}

/* ── WHAT THE RECORD READS OFF THESE ROWS ─────────────────────────────────────────────────── */

export type PaymentGrades = {
  /** payments settled on or before the day agreed */
  onTheDay: number;
  /** payments measured in the window */
  measured: number;
  /** how many of those the bank itself graded */
  bankGraded: number;
  /** the day of the newest measured payment */
  newestOn: string;
  /** the newest reason, one line */
  newestReason: string;
};

/** The 90-day window the payment indicator counts over, taken off the settled rows themselves. */
export function paymentGrades(rows: readonly SupplierPurchase[], today: string, windowDays = 90): PaymentGrades {
  const floor = dayValue(today) - (windowDays - 1) * 86400000;
  const settled = rows
    .filter((row): row is SupplierPurchase & { settledOn: string } => Boolean(row.settledOn))
    .filter((row) => dayValue(row.settledOn) >= floor)
    .sort((a, b) => b.settledOn.localeCompare(a.settledOn));
  const onTheDay = settled.filter((row) => row.settledOn <= row.dueOn).length;
  const bankGraded = settled.filter((row) => row.settledBy === 'bank').length;
  const newest = settled[0];
  const reason = newest
    ? `${purchaseDate(newest.settledOn)} · ${newest.settledOn <= newest.dueOn ? 'Paid on the day' : `Paid ${Math.round((dayValue(newest.settledOn) - dayValue(newest.dueOn)) / 86400000)} days after the day agreed`} · ${newest.supplierName} · ${newest.settledNote ?? (newest.settledBy === 'bank' ? 'confirmed by your bank' : 'you told Rocoto the day you paid it')}`
    : '';
  return { onTheDay, measured: settled.length, bankGraded, newestOn: newest?.settledOn ?? '', newestReason: reason };
}

/**
 * The seeded 90-day payment indicator plus whatever she has confirmed since. Her own confirmations
 * move the RATIO; the floor still counts what the bank graded, which is the whole point of the two
 * grades (`record.ts`).
 */
export function paymentIndicator(
  seed: { count: number; of: number; bankGraded?: number; newestReason?: string },
  grades: PaymentGrades,
  seededSettled = 1,
): { count: number; of: number; bankGraded: number; newestReason: string } {
  const added = Math.max(0, grades.measured - seededSettled);
  const addedOnTheDay = Math.max(0, grades.onTheDay - Math.min(seededSettled, grades.onTheDay));
  return {
    count: seed.count + addedOnTheDay,
    of: seed.of + added,
    bankGraded: seed.bankGraded ?? 0,
    newestReason: grades.newestReason || seed.newestReason || '',
  };
}
