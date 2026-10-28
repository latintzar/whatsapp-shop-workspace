/* THE BROWSER KEYS, AND THE ONE CONTROL THAT CLEARS THEM.
 *
 * ONE ORIGIN SERVES `/cedar/` AND `/bodega-pay-later/`, which is the whole reason this file exists:
 * a shared key means one prototype editing the other's ledger, so every store this candidate copies
 * renames its prefix to `rocoto-bodega-` (WIRING-SPEC.md §11, DESIGN-SPEC.md §7 item 11).
 *
 * THE LIST BELOW IS WHAT A READER CHECKS THE SWEEP AGAINST, so it holds every key this prototype
 * actually writes — the stores it copied, and the conveniences its own surfaces keep. A key ending
 * in `:` takes the scope after it, the way Cedar's own stores are keyed; `history-` is a family,
 * one entry per reading.
 *
 * ONE LEDGER THIS PROTOTYPE WRITES LIVES OUTSIDE THE PREFIX, and it is named at the foot of the list
 * with the reason and the verb that clears it: `rocoto-app-day`, Cedar's own day store, which
 * `cedar/sale.ts` appends to on every act.
 *
 * ONE KEY LEFT THIS LIST BECAUSE THIS SHOP OPENS NO CHANNEL WORKSPACE. `channel-access-v1:` was
 * `cedar-channel-api.ts`'s, copied for a bearer nothing here asked for: the WhatsApp rig runs on
 * `/api/proof/*`, the payment page carries `money-api.ts`'s own bearer under `money-api-v1:`, and
 * the one surface that opened a channel workspace was Cedar's onboarding card in the rail foot,
 * which left with the walk it counted (`shell/rail.tsx`). Both the key and the copied module are in
 * Git; a surface here that needs `/api/cedar/access/*` brings them back together.
 *
 * TWO PINS SIT OUTSIDE THE SWEEP AND ARE KEPT. `rocoto-runtime-base` is `runtime-client.ts`'s
 * developer pin, shared with Cedar; `rocoto-bodega-collections-base` is `money-api.ts`'s pin for a
 * loopback collection service. Both belong to the developer rather than to this shop, and a reset
 * that dropped either would move a developer's runtime under them (`money-api.ts`'s own note).
 */
export const PREFIX = 'rocoto-bodega-';

export const KEYS = {
  /** the money ledger — `money-store.ts`, copied */
  money: `${PREFIX}money-v1:`,
  /** what the shop owes its suppliers, purchase by purchase */
  supplierPayments: `${PREFIX}supplier-payments-v1:`,
  /** the invitations, their tokens and their four states */
  invites: `${PREFIX}invites-v1:`,
  /** how far along the critical path this shop stands */
  stage: `${PREFIX}stage-v1:`,
  /** the read: meanings, roles, candidate lines, the ranking, the analysis cursor */
  history: `${PREFIX}history-`,
  /** which WhatsApp door the shop chose — `whatsapp-connection.tsx`, copied */
  whatsappSelected: `${PREFIX}whatsapp-selected-v1`,
  /** the payment-request bearer — `money-api.ts`, copied */
  moneyApi: `${PREFIX}money-api-v1:`,
  /** the chase rungs and their timers — `chase.ts`, copied */
  chase: `${PREFIX}chase-v1:`,
  /** Prep's own order: `Location` or `Time` — `prep-order.ts` */
  prepOrder: `${PREFIX}prep-order`,
  /** the print queue — `print-queue.ts`, copied */
  print: `${PREFIX}print`,
  /** what the printer already did, kept beside the queue — `print-queue.ts`, copied */
  printJournal: `${PREFIX}print-journal`,
  /** which area covers this shop has met — `covers.tsx` */
  covers: `${PREFIX}covers-v1`,
  /** the desk rail, open or away — `shell/rail.tsx`, copied */
  railOpen: `${PREFIX}rail-open`,
  /** the export centre's own schedules, per sector — `shell/printing.tsx`, copied */
  outputSchedules: `${PREFIX}export-output-schedules`,
  /** what the mail provider answered about a sent output — `shell/printing.tsx`, copied */
  emailProviderReceipts: `${PREFIX}export-email-provider-receipts`,
  /** the packing copies an operator confirmed — `packing-output.ts`, copied */
  packingOutput: `${PREFIX}packing-output-v1`,
  /** the packing marks this house issued — `packing-output.ts`, copied */
  packingMarks: `${PREFIX}packing-marks-v1`,
  /** what this shop declared arriving — `store/declared-stock.ts`, copied */
  declaredStock: `${PREFIX}stock-declared-v1:`,
  /** the paper and file templates — `store/output-templates-store.ts`, copied */
  outputTemplates: `${PREFIX}output-templates-v1:`,
} as const;

/* ── THE ONE LEDGER THAT STAYS CEDAR'S, AND WHAT CLEARS IT ────────────────────────────────────
 * `cedar/day.ts` holds the day's event ledger under `rocoto-app-day`, one row per sector, and
 * `cedar/sale.ts` — five thousand lines, imported live by the detail, Prep, the print queue and the
 * chats — appends to it through `setDay` on every act. Re-keying it means copying `sale.ts` itself,
 * so this shop's acts land in CEDAR'S store, in the `fruit` row the cast is seated on.
 *
 * WHICH MAKES `resetLocal()` THE WRONG TOOL FOR IT, both ways. The key holds Cedar's fish and meat
 * days beside this shop's row, so removing it drops two houses that were never this shop's to drop;
 * and removing bytes leaves `cedar/day.ts`'s LIVE ledger in memory, which re-persists the same events
 * on the next act. `Reset state` therefore clears the row through Cedar's own verb — `resetDay(sector)`
 * in `start/arrival.tsx`, beside the other three forgets — which empties this shop's row, keeps the
 * other houses and tells the live store, and drops the whole key when no house is left in it.
 */
export const CEDAR_DAY_KEY = 'rocoto-app-day';

/** The developer's own pin for a loopback collection service, kept through a reset. */
export const COLLECTIONS_BASE = `${PREFIX}collections-base`;

/** Kept through a reset, because they belong to the developer rather than to this shop. */
export const KEPT: readonly string[] = ['rocoto-runtime-base', COLLECTIONS_BASE];

/** A scoped key, for a store keyed to one workspace. */
export const scoped = (key: string, scope: string): string => `${key}${scope}`;

const stores = (): Storage[] => {
  const out: Storage[] = [];
  try { out.push(window.localStorage); } catch { /* a browser where storage throws still renders */ }
  try { out.push(window.sessionStorage); } catch { /* the same */ }
  return out;
};

/**
 * EVERY `rocoto-bodega-*` KEY, GONE — the browser half of `Reset state`.
 *
 * It sweeps by prefix rather than by the list above, so a store added later is cleared the day it
 * lands; the list is what a reader checks the sweep against. The server half is the rest of the
 * control: `POST /api/proof/whatsapp/disconnect`, then the rig's own login and referral records
 * (WIRING-SPEC.md §11).
 *
 * Returns the keys it removed, so the control can say what it did.
 */
export function resetLocal(): string[] {
  const removed: string[] = [];
  for (const store of stores()) {
    const keys: string[] = [];
    try {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && key.startsWith(PREFIX) && !KEPT.includes(key)) keys.push(key);
      }
      for (const key of keys) { store.removeItem(key); removed.push(key); }
    } catch { /* a storage that throws mid-sweep leaves the rest of the reset standing */ }
  }
  return removed;
}
