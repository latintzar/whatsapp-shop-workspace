/**
 * THE ALLOCATION BOOK, READING THIS SHOP'S OWN DECLARED STOCK (WIRING-SPEC.md §11).
 *
 * Cedar's copy of this adapter is nine lines of arithmetic over `cedar/incoming.ts`'s STORE, and the
 * store is keyed `rocoto-stock-declared-v1:<sector>`. One origin serves `/cedar/` and
 * `/bodega-pay-later/` and the cast seats both on the `fruit` catalogue, so importing it pointed the
 * albarán's lots at another house's arrivals. Everything it folds is Cedar's and imported —
 * `buildLedger`, `lotBook`, `rowsOf` — and the two lines that touch the browser read
 * `store/declared-stock.ts` instead.
 *
 * This browser adapter stays deliberately local: production replaces its revision string and
 * candidate rows with the authoritative inventory stream, without changing the allocation UI.
 */
import * as React from 'react';
import type { Cast } from '../../scenarios/data/cast';
import { dayFromId, todayId, type AllocationCandidate, type Sale } from '../cedar/sale';
import { nowOf } from '../cedar/day';
import { useConfig } from '../cedar/config';
import { useRules } from '../cedar/rules';
import { buildLedger, lotBook, rowsOf } from '../cedar/incoming';
import { stockRevision, useDeclared } from './store/declared-stock';

export type AllocationBook = {
  revision: string;
  byProduct: Record<string, AllocationCandidate[]>;
};

const productionInstant = (value: string | undefined): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const instant = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(instant) ? instant : null;
};

const commitmentRevision = (sales: Sale[]): string => sales
  .filter((sale) => !sale.archived)
  .flatMap((sale) => sale.lines.filter((line) => !line.off).flatMap((line) => (line.allocations ?? []).map((allocation) =>
    `${sale.id}:${sale.day}:${line.id}:${allocation.batch}:${allocation.qty}`)))
  .sort()
  .join('|');

export function useAllocationBook(cast: Cast, sales: Sale[] = []): AllocationBook {
  const { config } = useConfig();
  const declared = useDeclared(cast.sector);
  const rules = useRules();
  const now = React.useMemo(() => {
    const instant = dayFromId(todayId(cast));
    const [hours, minutes] = nowOf(cast).split(':').map(Number);
    instant.setHours(hours || 0, minutes || 0, 0, 0);
    return instant;
  }, [cast]);
  const ledger = React.useMemo(
    () => buildLedger({ cast, config, declared, rules: rules.rules, now }),
    [cast, config, declared, rules.rules, now],
  );
  const byProduct = React.useMemo(() => Object.fromEntries(cast.products.map((product) => [
    product.id,
    lotBook(cast, product, rowsOf(ledger, product.id))
      .map<AllocationCandidate>((lot) => ({
        batch: lot.id,
        code: lot.code,
        available: Math.max(0, lot.left),
        receivedAt: productionInstant(lot.arrival?.productionDate) ?? lot.arrival?.at.getTime() ?? 0,
        day: lot.day,
      }))
      .sort((left, right) => left.receivedAt - right.receivedAt || left.code.localeCompare(right.code)),
  ])), [cast, ledger]);
  // An open split becomes stale for either half of availability: physical stock or another saved
  // Albaran commitment. The browser signature is a Kit revision token, not a backend claim.
  const revision = `${stockRevision(cast.sector)}
${commitmentRevision(sales)}`;
  return { revision, byProduct };
}

export const lotsForAllocation = (book: AllocationBook, product: string): AllocationCandidate[] =>
  book.byProduct[product] ?? [];
