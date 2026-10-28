/* WHAT THIS SHOP HAS DECLARED, ON ITS OWN KEY (WIRING-SPEC.md §11).
 *
 * WHY A COPY AND NOT AN IMPORT. `cedar/incoming.ts` is a ledger vocabulary — `buildLedger`, `lotBook`,
 * `rowsOf`, every fold over an arrival — plus a STORE under `rocoto-stock-declared-v1:<sector>`.
 * Everything pure is imported from there and stays one definition for both houses; the store is
 * re-stated here against `rocoto-bodega-stock-declared-v1:<sector>`, because this shop and Cedar's
 * fruit house share one origin and the cast seats both on the `fruit` catalogue. On Cedar's key the
 * allocation book behind an albarán reads ANOTHER house's arrivals, and the prototype writes that
 * house's row back on every sector switch — one row, two authors.
 *
 * SO THIS STORE READS, AND STANDING ON A BOOK IS NOT DECLARING ONE. The bodega has a counter rather
 * than a cold room: no surface here announces a landing or codes one, so the book opens empty and the
 * allocation book behind the albarán carries the lots the catalogue itself holds. The day a surface
 * declares stock, its verb lands HERE, beside this read — `announce` and `codeIt` in
 * `cedar/incoming.ts` are the shape, and they write CEDAR's key until they are copied.
 */
import * as React from 'react';
import type { SectorId } from '../../../scenarios/meta';
import type { Declared, IncomingEvent } from '../../cedar/incoming';
import { KEYS, scoped } from './keys';

const keyFor = (sector: SectorId): string => scoped(KEYS.declaredStock, sector);

const stored = (sector: SectorId): string | null => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(keyFor(sector)); } catch { return null; }
};

/** One object per house, so a render that re-reads the book gets the same book back. */
const BOOKS: Partial<Record<SectorId, Declared>> = {};

/** This house's book. An unreadable browser record cannot invent stock. */
const bookOf = (sector: SectorId): Declared => {
  const held = BOOKS[sector];
  if (held) return held;
  let made: Declared = { sector, events: [], codes: {} };
  try {
    const raw = JSON.parse(stored(sector) || 'null');
    if (raw?.sector === sector && Array.isArray(raw.events)) {
      made = {
        sector,
        codes: raw.codes ?? {},
        events: raw.events
          .filter((event: IncomingEvent) => event.sector === sector)
          .map((event: IncomingEvent) => ({ ...event, at: new Date(event.at) }))
          .filter((event: IncomingEvent) => Number.isFinite(event.at.getTime())),
      };
    }
  } catch { /* An unreadable browser record cannot invent stock. */ }
  BOOKS[sector] = made;
  return made;
};

const listeners = new Set<() => void>();

const subscribe = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

/** A write in another tab is a new book: the held copy is dropped and every reader re-reads. */
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && !event.key.startsWith(KEYS.declaredStock)) return;
    if (event.key === null) for (const sector of Object.keys(BOOKS) as SectorId[]) delete BOOKS[sector];
    else delete BOOKS[event.key.slice(KEYS.declaredStock.length) as SectorId];
    for (const fn of listeners) fn();
  });
}

/** Revision token for a local editor. Production replaces this with the stream revision. */
export const stockRevision = (sector: SectorId): string => stored(sector) ?? '';

/** What this house has declared. */
export function useDeclared(sector: SectorId): Declared {
  const read = React.useCallback(() => bookOf(sector), [sector]);
  return React.useSyncExternalStore(subscribe, read);
}
