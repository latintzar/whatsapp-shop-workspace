/* YOUR PLACE IN THE LIST — a standing with no number (DESIGN-SPEC.md §3 card 5, WIRING-SPEC.md §8).
 *
 * «A position number or queue length — dropped on Peter's read of 18 September.» So `QueueStanding`
 * holds no `position` field and no length: what a shop reads is the cleared line, the day it joined,
 * how many of its suppliers are on Rocoto, and what moves it up. Every one of those is a fact about
 * SUPPLIERS rather than a claim about money, which is why this block ships ahead of a lender.
 *
 * THE FOUR STATES COME FROM ONE PLACE AND ONE PLACE ONLY: `referrals.ts`, which the onboarding
 * package owns and which writes the book at `rocoto-bodega-invites-v1:<scope>`. This module is a
 * READER of it (WIRING-SPEC.md §5), so `INVITE_WORD`, `InviteState` and `SupplierInvite` are
 * re-exported from there rather than restated here — one set, one writer, one word per state, and
 * `Suppliers you brought` lists the rows from `sent` on.
 */
import { supplierOf } from './cast';
import { INVITE_WORD, readBook, type InviteState, type SupplierInvite } from './referrals';
import { PLACE_MOVES_LINE, QUEUE_LINE_EN, QUEUE_LINE_ES } from './regulatory';
import { seedDay } from './supplier-payments';

export { INVITE_WORD };
export type { InviteState, SupplierInvite };

/** The four states in the order they move, which is what the sort below reads. */
export const INVITE_STATES: readonly InviteState[] = ['ready', 'sent', 'invited', 'connected'];

/** The invitations this shop holds, as `referrals.ts` wrote them. */
export const readInvites = (scope: string): SupplierInvite[] => readBook(scope).rows;

/** `Suppliers you brought` lists the rows from `sent` on, newest state first, then by name. */
const ORDER: Record<InviteState, number> = { connected: 0, invited: 1, sent: 2, ready: 3 };

const DAY_MS = 86400000;
const dayAfter = (day: string, days: number): string => {
  const at = Date.parse(`${day}T12:00:00Z`);
  return Number.isFinite(at) ? new Date(at + days * DAY_MS).toISOString().slice(0, 10) : day;
};

/**
 * THE ROWS THE COUNTS ARE ABOUT. `4 of 9 invited · 2 connected` came off the seed while the rows
 * came off the local book, so a fresh browser read a block stating counts over zero rows (the QA
 * pass, item 22). The seed's own four invitations are rows here, each with its supplier's name,
 * its state word and a day, and the shop's own invitations replace them by supplier.
 */
export function seededInvites(seed: QueueSeedInput): SupplierInvite[] {
  const joined = new Set(seed.joined);
  return seed.invited.map((supplierId, index) => {
    const supplier = supplierOf(supplierId);
    return {
      id: `seed-${supplierId}`,
      scope: '',
      supplierId,
      name: supplier?.name ?? supplierId,
      phone: supplier?.phone ?? '',
      token: '',
      state: (joined.has(supplierId) ? 'connected' : 'invited') as InviteState,
      at: `${seedDay(dayAfter(seed.inLineSince, (index + 1) * 2))}T10:00:00-05:00`,
    };
  });
}

export const suppliersBrought = (
  invites: readonly SupplierInvite[], seed?: QueueSeedInput,
): SupplierInvite[] => {
  const bySupplier = new Map<string, SupplierInvite>();
  if (seed) for (const row of seededInvites(seed)) bySupplier.set(row.supplierId, row);
  for (const row of invites) if (row.state !== 'ready') bySupplier.set(row.supplierId, row);
  return [...bySupplier.values()]
    .sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.name.localeCompare(b.name));
};

/* ── the standing ─────────────────────────────────────────────────────────────────────────── */

/** WHAT A SHOP READS ABOUT ITS PLACE. There is no `position` field and no queue length, by
 *  decision; adding either would be the one claim a shop could hold Rocoto to. */
export type QueueStanding = {
  /** the day it joined the list */
  inLineSince: string;
  /** how many suppliers this shop buys from */
  suppliers: number;
  /** how many of them have been invited */
  invited: number;
  /** how many of them have connected */
  connected: number;
  clearedLine: string;
  clearedLineSource: string;
};

export type QueueSeedInput = {
  inLineSince: string;
  suppliers: number;
  invited: readonly string[];
  joined: readonly string[];
  clearedLine?: string;
  clearedLineSource?: string;
};

/**
 * The standing, from the shop's own seed and from whatever `referrals.ts` has recorded since. An
 * invitation the shop actually sent counts from `sent` on, and a supplier counts as connected on
 * the state `connected`, so the two numbers always describe the same list.
 */
export function queueStanding(seed: QueueSeedInput, invites: readonly SupplierInvite[] = []): QueueStanding {
  const seededInvited = new Set(seed.invited);
  const seededJoined = new Set(seed.joined);
  for (const row of invites) {
    if (row.state !== 'ready') seededInvited.add(row.supplierId);
    if (row.state === 'connected') seededJoined.add(row.supplierId);
  }
  return {
    inLineSince: seed.inLineSince,
    suppliers: Math.max(seed.suppliers, seededInvited.size),
    invited: seededInvited.size,
    connected: seededJoined.size,
    clearedLine: seed.clearedLine ?? QUEUE_LINE_ES,
    clearedLineSource: seed.clearedLineSource ?? QUEUE_LINE_EN,
  };
}

/**
 * THE LINE THIS BUILD PRINTS, AND IT PRINTS ONE LANGUAGE.
 *
 * This is the English review build, so every screen reads English: the cleared Spanish stands
 * untouched in `regulatory.ts` and in the fixture for the Spanish build, and the English it was
 * written from is what a surface draws. A card that printed both read as a translation left in by
 * accident (the QA pass, item 2), so the two never share a screen.
 */
export const queueLine = (standing: Pick<QueueStanding, 'clearedLineSource'>): string =>
  standing.clearedLineSource;

const LONG_DAY = { day: 'numeric', month: 'long', timeZone: 'UTC' } as const;

/** `In line since 3 September` — her own dated fact, in the shop's own calendar. */
export function inLineWords(day: string): string {
  const at = Date.parse(`${day}T12:00:00Z`);
  return Number.isFinite(at)
    ? `In line since ${new Intl.DateTimeFormat('en-GB', LONG_DAY).format(at)}`
    : 'In line since the day you connected';
}

/** `Suppliers on Rocoto · 4 of 9 invited · 2 connected` — one line, three counts she can recount. */
export const supplierCountWords = (standing: QueueStanding): string =>
  `Suppliers on Rocoto · ${standing.invited} of ${standing.suppliers} invited · ${standing.connected} connected`;

/** The act on `Suppliers you brought` (the build context's own decision). */
export const BRING_MORE_ACT = 'Invite more suppliers';

export { PLACE_MOVES_LINE };
