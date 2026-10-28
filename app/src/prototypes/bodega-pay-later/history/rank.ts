/* THE ORDER THE LIKELY LIST STANDS IN — one flag, two rules (WHATSAPP-HISTORY-SPEC.md §5).
 *
 * Until the debt read exists the rig ranks by laughs: the top people are the contacts whose chats
 * hold the most «haha» and «jaja» in the fetched pages, and the screen PRINTS the rule, so the
 * switch stays visible. The evidence rule that replaces it stands beside it in this file, already
 * written and already tested, so the change is one constant.
 *
 * WHY A TEST RULE AT ALL. Peter fixed the debt rule as «based on messages history basically», and
 * the evidence that rule reads — fiado asked for, an order with the payment message missing after
 * it — is the order brain's work under a bounded budget. The laughs count needs no model: it is a
 * count over text this page already fetched, so the rig ranks on the shop's OWN chats from the first
 * run and the screen says which rule it used.
 *
 * ═══ THE LAUGHS RULE WIDENS THE CANDIDATES, IT DOES NOT ONLY REORDER THEM ═══════════════════════
 * Peter tests the rig with his PERSONAL number: «the numbers it will show in this case as my biggest
 * debtors would be my mom and my dad — mama and papa… if you wanna derive the "top" numbers you can
 * make the script analyse the ones with the most "haha"'s and serve those?… then we'd send JUST my
 * mom's number though the referral. Maybe we can sort the rest alphabetically and put a search at the
 * top with elastic so that i can tick other numbers too.» A chat of family and friends carries no
 * fiado note and no purchase, so a rule that only reorders the evidence rule's own candidates leaves
 * BOTH screens empty and his mother unreachable. While this flag reads `laughs`, therefore, every
 * reading that HOLDS A LAUGH is a candidate: screen 4 draws its `OWED_ROWS` of them and says how few
 * they are under `LAUGHS_FLOOR`, and screen 5 lists every contact the read produced with the top
 * `LAUGHS_TICKED_ROWS` ticked and the rest under them — the named contacts A–Z, then the numbers the
 * contacts sync named nowhere, newest activity first (`read.ts`, `byContact`).
 */

/** What every row hands the ranking. The read produces it; this file only orders it. */
export type Evidence = {
  id: string;
  name: string;
  /** whether the contacts sync named this counterparty, or the service fell back to the digits */
  named: boolean;
  /** «haha» and «jaja» runs in the fetched pages */
  laughs: number;
  /** messages reading as «fía», «te debo», «al cuaderno» */
  fiadoAsks: number;
  /** orders with no payment message after them */
  ordersAwaitingPayment: number;
  /** days since the newest order in the chat */
  lastOrderDaysAgo: number;
  /** receipts seen in the chat */
  paymentsSeen: number;
  /** orders in the window, which is how often it repeats */
  orders: number;
};

export type RankRule = 'laughs' | 'evidence';

/** THE FLAG. One constant, and the screen prints which rule it read. */
export const RANK_RULE: RankRule = 'evidence';

/** The line the screen carries while the laughs rule stands, verbatim. */
export const LAUGHS_RULE_LINE = 'Ranked by laughs in your chats for now; the debt read replaces this rule.';

/**
 * SCREEN 4'S ROWS, WHICHEVER RULE RANKED THEM: the top eight.
 *
 * The heading claims the people who owe the shop MOST LIKELY, and that is a shortlist the shop reads
 * and decides in one sitting. A list that holds every chat the read produced is the shop's whole book
 * under a heading that promised its top — eighteen faces, eighteen decisions and a page five screens
 * tall — so the ceiling belongs to the screen rather than to the rule that ordered it, and the rows
 * the laughs rule draws and the rows the evidence rule draws are the same eight.
 */
export const OWED_ROWS = 8;

/** Screen 5's ticked rows while the laughs rule stands; every other contact is listed under them. */
export const LAUGHS_TICKED_ROWS = 5;

/**
 * THE FLOOR THE SHORTLIST SAYS SO UNDER — three chats with a laugh in them.
 *
 * Peter's own account answered this: 103 of the 120 chats the read fetched hold no laugh at all, and the
 * top row holds eleven. So screen 4 draws the chats that DO hold one, up to `OWED_ROWS`, and where fewer
 * than three chats hold any it says that in one sentence and the walk carries on — a shortlist of two
 * rows under a heading claiming the people who most likely owe is a rule reporting itself, which the
 * shop reads once and continues past.
 */
export const LAUGHS_FLOOR = 3;

/** A named contact stands before a number wherever a rule ties: half of a real account's chats carry
 *  the digits alone, and a row the shop can read is the row it can decide on. */
export const namedFirst = (a: Pick<Evidence, 'named'>, b: Pick<Evidence, 'named'>): number =>
  Number(b.named) - Number(a.named);

/** Screen 5's top rows once the evidence rule stands: the suppliers with the most purchases. */
export const EVIDENCE_TOP_SUPPLIERS = 3;

/** A laugh, however the chat writes it: «jaja», «haha», «jeje», «hehe», the Cyrillic «хаха» and
 *  «ахах» a Bulgarian or Russian chat types, and the laughing faces. A run counts once, which is
 *  one laugh in one message; a row of faces counts once too. */
export function laughsIn(text: string): number {
  const runs = text.toLowerCase().match(/(?:ja){2,}|(?:ha){2,}|(?:je){2,}|(?:he){2,}|(?:ха){2,}|(?:ах){2,}|(?:хи){2,}|(?:\u{1F602}|\u{1F923}|\u{1F639}|\u{1F606})+/gu);
  return runs ? runs.length : 0;
}

/** The test rule: the most laughs first, then the named contacts, then the name, so the order is
 *  stable and a tie of four laughs reads as people before it reads as digits. */
export const rankByLaughs = <T extends Evidence>(rows: T[]): T[] =>
  [...rows].sort((a, b) => b.laughs - a.laughs || namedFirst(a, b) || a.name.localeCompare(b.name));

/**
 * The rule that replaces it: who is LIKELY to owe, on the chat's own evidence. Fiado asked for
 * weighs most, an order with the payment message missing after it next, then how recent the last
 * order is and how often the chat repeats; receipts seen pull a row down, because a chat full of
 * payments is a chat that pays.
 */
export function evidenceScore(row: Evidence): number {
  const recency = row.lastOrderDaysAgo <= 1 ? 6 : row.lastOrderDaysAgo <= 3 ? 4 : row.lastOrderDaysAgo <= 7 ? 2 : 0;
  return row.fiadoAsks * 5 + row.ordersAwaitingPayment * 3 + recency + Math.min(row.orders, 12) * 0.25
    - row.paymentsSeen;
}

export const rankByEvidence = <T extends Evidence>(rows: T[]): T[] =>
  [...rows].sort((a, b) => evidenceScore(b) - evidenceScore(a) || a.name.localeCompare(b.name));

/** The list in the order the screen draws it, and the rule it stood on. */
export function rank<T extends Evidence>(rows: T[], rule: RankRule = RANK_RULE): { rows: T[]; rule: RankRule } {
  return { rows: rule === 'laughs' ? rankByLaughs(rows) : rankByEvidence(rows), rule };
}
