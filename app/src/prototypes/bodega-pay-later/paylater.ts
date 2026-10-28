/* PAY-LATER, PER PURCHASE (DESIGN-SPEC.md §1 «What is off», §3 card 2, WIRING-SPEC.md §8).
 *
 * «Pay-later being per purchase at 30 days.» ONE RECORD PER PURCHASE, and that is the whole model:
 * a purchase is offered the 30 days, the shop uses them, and the record settles or runs late. There
 * is NO LIMIT FIELD, no revolving arithmetic and no rate, which is why Cedar's `money-finance.ts`,
 * its `AdvanceDialog` and the route `#/money/advance/<minor>` stay out of this bundle — and why
 * `app/tools/test-bodega-money.mjs` proves no `ADVANCE_` constant and no limit call is reachable
 * from this directory.
 *
 * WHAT THIS MODULE IS, THEREFORE: the term, the two words, and the gate. `Offered` and `Used` are
 * the two of card 2's five words that make a claim about credit, so they render only once a lender
 * signs — `regulatory.ts` holds the lender switch and this module reads it. Until then the surface
 * names the seat and prints the line below in it: the region is decided, and it says so in words a
 * shop reads rather than in the grey bars this product keeps for a surface that is loading.
 */
import { LENDER_NAME, lenderSigned } from './regulatory';

/** The term, and the only term: thirty days from the delivery. */
export const PAY_LATER_DAYS = 30;

/** The two words pay-later adds to a purchase row. */
export const PAY_LATER_MARKS = ['offered', 'used'] as const;
export type PayLaterMark = (typeof PAY_LATER_MARKS)[number];

export const PAY_LATER_WORD: Record<PayLaterMark, string> = { offered: 'Offered', used: 'Used' };

/** One record per purchase. It holds a purchase, a mark and a day, and it holds nothing else. */
export type PayLaterRecord = {
  purchaseId: string;
  mark: PayLaterMark;
  /** the day the mark was written, `YYYY-MM-DD` */
  on: string;
  /** the day the thirty days run to, `YYYY-MM-DD` */
  dueOn: string;
};

/** Thirty days from the delivery, in the shop's own calendar. */
export function payLaterDueOn(deliveredOn: string, days = PAY_LATER_DAYS): string {
  const at = Date.parse(`${deliveredOn}T12:00:00Z`);
  return Number.isFinite(at) ? new Date(at + days * 86400000).toISOString().slice(0, 10) : deliveredOn;
}

/** `Offered` and `Used` render only once a lender signs. Ahead of that this is false everywhere. */
export const payLaterVisible = (name: string = LENDER_NAME): boolean => lenderSigned(name);

/**
 * The placeholder the card draws in pay-later's seat while the signature is outstanding. The
 * attribute is what a drive reads to prove the region is a declared placeholder rather than a
 * region somebody forgot.
 */
export const PAY_LATER_PLACEHOLDER = 'pay-later';

/** What the placeholder says it is standing in for, in words a shop reads. */
export const PAY_LATER_PLACEHOLDER_LABEL = 'Pay later';
export const PAY_LATER_PLACEHOLDER_LINE =
  'Thirty days on a purchase lands here, one record per purchase, once a lender signs.';
