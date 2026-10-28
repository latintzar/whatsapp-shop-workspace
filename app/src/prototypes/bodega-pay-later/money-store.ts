/* THE MONEY LEDGER — Cedar's `money-store.ts`, COPIED, its key renamed, its fiscal half gone.
 *
 * WHY A COPY RATHER THAN AN IMPORT (WIRING-SPEC.md §11): one origin serves `/cedar/` and
 * `/bodega-pay-later/`, and this module owns a LEDGER. A shared key would mean one prototype
 * editing the other's book, so the prefix is renamed — `rocoto-cedar-money-v1:` becomes
 * `rocoto-bodega-money-v1:`, one of the keys `Reset state` clears (`store/keys.ts`).
 *
 * WHAT THE COPY DROPS, AND WHY IT IS SHORTER THAN CEDAR'S. Fiscal is off ONCE
 * (DESIGN-SPEC.md §1): a sale is a `Sale` under a generic name, so `money-model.ts`'s invoice
 * fields — `InvoiceSale`, `state.invoices`, `invoiceForSale` — stay UNWRITTEN and UNRENDERED, and
 * with them go `issueInvoice`, `createBillingDraft`, `prepareOrderFiscal`, `submitInvoice` and the
 * whole NubeFact road. `state.invoices` survives in the shape as a list this prototype keeps
 * empty, so an imported Cedar helper that reads it gets an honest empty answer rather than a
 * surprise.
 *
 * WHAT IT KEEPS, AND WHAT IT ADDS:
 *   · the cache, the commit, the listener set and the two reset contracts, as Cedar wrote them
 *   · THE PAYMENT PAGE for any amount the shop names, carrying the WORDS THE SHOP TYPED, which is
 *     card 3's own act (WIRING-SPEC.md §9, `money-api.ts createPaymentLink`)
 *   · THE FIADO BOOK, which is what a confirmation on the read screen records (DESIGN-SPEC.md §2):
 *     until the first one the card reads `Who may owe you`; from it, `Who owes you`
 *   · the receipts a payment matches back, one per page rather than one per invoice
 */
import * as React from 'react';
import { formatMoney, receiptPrincipal, type MoneyEvent, type MoneySetupState, type PaymentQuote,
  type Receipt } from '../cedar/money-model';
import { customerOf, likelyOwed, money as moneySeed } from './cast';
import { seedDay } from './supplier-payments';
import { collectionGuard, collectionOrigin, createPaymentLink, readCollection,
  type CollectionRequest, type PaymentLinkDraft } from './money-api';
import { KEYS, scoped } from './store/keys';

/** ONE SHOP, ONE WORKSPACE. Cedar keys its stores by sector; this prototype is one bodega, so the
 *  scope is one word and every `rocoto-bodega-*` key takes it after the colon. */
export const MONEY_SCOPE = 'bodega';

export const bodegaMoneyKey = (scope: string): string => scoped(KEYS.money, scope);

/* ── THE RECORDS ──────────────────────────────────────────────────────────────────────────── */

/** A payment page the shop made, and the words it typed for it. */
export type PaymentLink = {
  id: string;
  amountMinor: number;
  currency: 'PEN';
  /** what the shop typed this page is for — one string, on the page, in the message, in the export */
  description: string;
  customerId?: string;
  customerName: string;
  /** what a bank statement carries back */
  reference: string;
  url: string;
  status: 'created' | 'copied' | 'sent';
  createdAt: string;
  copiedAt?: string;
  sentAt?: string;
  remoteId?: string;
  remotePending?: boolean;
  paymentQuote?: PaymentQuote;
};

/** A receipt belongs to a PAGE here, rather than to an invoice: fiscal is off. */
export type BodegaReceipt = Omit<Receipt, 'invoiceId'> & { linkId: string };

/** One row of the fiado book, which stands because the shop confirmed it. */
export type FiadoRow = {
  customerId: string;
  customerName: string;
  amountMinor: number;
  /** `YYYY-MM-DD`, the day the fiado started */
  since: string;
  /** how many sales that fiado covers */
  sales: number;
  /** the instant she confirmed it */
  confirmedAt: string;
  /** the reason the likely list gave, kept with the row (§9 question 4) */
  reason?: string;
};

export type BodegaMoneyState = {
  version: 1;
  scope: string;
  setup: MoneySetupState;
  /** UNWRITTEN UNDER FISCAL-OFF, and kept in the shape so a reader gets an honest empty answer. */
  invoices: [];
  links: PaymentLink[];
  receipts: BodegaReceipt[];
  fiado: FiadoRow[];
  events: MoneyEvent[];
};

export type Result<T = undefined> =
  | { ok: true; value: T; state: BodegaMoneyState }
  | { ok: false; error: string };

export function emptyMoney(scope: string): BodegaMoneyState {
  return { version: 1, scope, invoices: [], links: [], receipts: [], fiado: [], events: [],
    setup: { sellerName: '', ruc: '', invoiceSeries: 'F001', bank: 'bbva', bankAccountLabel: '',
      payments: 'pending', invoicing: 'pending' } };
}

/* ── THE DEFENSIVE PARSE ──────────────────────────────────────────────────────────────────── */

const instant = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
const calendarDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
const minor = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const bounded = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max;

function parseLink(raw: unknown): PaymentLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<PaymentLink>;
  if (!bounded(row.id, 120) || !minor(row.amountMinor) || row.currency !== 'PEN') return null;
  if (!bounded(row.description, 400) || !bounded(row.customerName, 160)) return null;
  if (!bounded(row.reference, 160) || !bounded(row.url, 600) || !instant(row.createdAt)) return null;
  if (!['created', 'copied', 'sent'].includes(row.status as string)) return null;
  return {
    id: row.id, amountMinor: row.amountMinor, currency: 'PEN', description: row.description,
    customerName: row.customerName, reference: row.reference, url: row.url,
    status: row.status as PaymentLink['status'], createdAt: row.createdAt,
    ...(row.customerId && bounded(row.customerId, 120) ? { customerId: row.customerId } : {}),
    ...(instant(row.copiedAt) ? { copiedAt: row.copiedAt } : {}),
    ...(instant(row.sentAt) ? { sentAt: row.sentAt } : {}),
    ...(bounded(row.remoteId, 120) ? { remoteId: row.remoteId } : {}),
    ...(row.remotePending === true ? { remotePending: true } : {}),
  };
}

function parseReceipt(raw: unknown): BodegaReceipt | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<BodegaReceipt>;
  if (!bounded(row.id, 120) || !bounded(row.linkId, 120) || !minor(row.amountMinor)) return null;
  if (!bounded(row.currency, 8) || !bounded(row.reference, 200) || !instant(row.at)) return null;
  if (!['yape', 'plin', 'transfer', 'cash'].includes(row.method as string)) return null;
  if (!['manual', 'demo-bank', 'prometeo'].includes(row.source as string)) return null;
  if (!['matched', 'review'].includes(row.status as string)) return null;
  return row as BodegaReceipt;
}

function parseFiado(raw: unknown): FiadoRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<FiadoRow>;
  if (!bounded(row.customerId, 120) || !bounded(row.customerName, 160)) return null;
  if (!minor(row.amountMinor) || !calendarDay(row.since) || !minor(row.sales)) return null;
  if (!instant(row.confirmedAt)) return null;
  return { customerId: row.customerId, customerName: row.customerName, amountMinor: row.amountMinor,
    since: row.since, sales: row.sales, confirmedAt: row.confirmedAt,
    ...(bounded(row.reason, 400) ? { reason: row.reason } : {}) };
}

/** A damaged book opens empty rather than half-read, which is Cedar's own rule for this store. */
export function parseMoney(raw: unknown, scope: string): BodegaMoneyState {
  if (!raw || typeof raw !== 'object') return emptyMoney(scope);
  const value = raw as Partial<BodegaMoneyState>;
  if (value.version !== 1 || value.scope !== scope) return emptyMoney(scope);
  const base = emptyMoney(scope);
  const setup = value.setup && typeof value.setup === 'object'
    ? { ...base.setup, ...value.setup } : base.setup;
  const list = <T,>(rows: unknown, parse: (row: unknown) => T | null, cap: number): T[] => {
    if (!Array.isArray(rows)) return [];
    const out: T[] = [];
    for (const row of rows.slice(0, cap)) { const parsed = parse(row); if (parsed) out.push(parsed); }
    return out;
  };
  return { version: 1, scope, invoices: [], setup,
    links: list(value.links, parseLink, 500),
    receipts: list(value.receipts, parseReceipt, 2000),
    fiado: list(value.fiado, parseFiado, 200),
    events: Array.isArray(value.events) ? (value.events.slice(0, 500) as MoneyEvent[]) : [] };
}

/* ── THE CACHE AND THE COMMIT, AS CEDAR WROTE THEM ────────────────────────────────────────── */

const cache = new Map<string, BodegaMoneyState>();
const listeners = new Set<() => void>();
const pendingLinks = new Map<string, Promise<Result<PaymentLink>>>();

function read(scope: string): BodegaMoneyState {
  if (!cache.has(scope)) {
    let state = emptyMoney(scope);
    try { state = parseMoney(JSON.parse(localStorage.getItem(bodegaMoneyKey(scope)) || 'null'), scope); }
    catch { /* A fresh book remains usable. */ }
    cache.set(scope, state);
  }
  return cache.get(scope)!;
}

function commit<T>(scope: string, result: Result<T>): Result<T> {
  if (!result.ok || read(scope) === result.state) return result;
  try { localStorage.setItem(bodegaMoneyKey(scope), JSON.stringify(result.state)); }
  catch { return { ok: false, error: 'Allow browser storage, then try saving again.' }; }
  cache.set(scope, result.state);
  listeners.forEach((listener) => listener());
  return result;
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const previewOrigin = () => `${window.location.origin}${window.location.pathname}${window.location.search}`;
const failed = (error: unknown): Result<never> =>
  ({ ok: false, error: error instanceof Error ? error.message : 'Reconnect to the payment service, then try again.' });

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key.startsWith(KEYS.money)) {
      cache.clear(); listeners.forEach((listener) => listener());
    }
  });
  /* THE SHARED RESET CONTRACT. `Reset state` sweeps every `rocoto-bodega-*` key and then fires, so this cache
     drops what it holds and the next read opens the honest empty book. */
  const drop = (event: Event) => {
    const scope = (event as CustomEvent<{ scope?: string }>).detail?.scope;
    if (scope) cache.delete(scope); else cache.clear();
    for (const key of [...pendingLinks.keys()]) if (!scope || key.startsWith(`${scope}:`)) pendingLinks.delete(key);
    listeners.forEach((listener) => listener());
  };
  window.addEventListener('rocoto:bodega-workspace-reset', drop);
  window.addEventListener('rocoto:money-workspace-reset', drop);
}

export const moneyStateNow = (scope: string): BodegaMoneyState => read(scope);

/* ── WHAT A PAGE COSTS AND WHAT IT PAID ───────────────────────────────────────────────────── */

/** What is still owed on one payment page, after the receipts matched to it. */
export const linkBalance = (state: BodegaMoneyState, linkId: string): number => {
  const link = state.links.find((row) => row.id === linkId);
  if (!link) return 0;
  const paid = state.receipts
    .filter((row) => row.linkId === linkId && row.status === 'matched')
    .reduce((sum, row) => sum + receiptPrincipal(row), 0);
  return Math.max(0, link.amountMinor - paid);
};

/** The newest page for a customer, which is the one a reminder points at. */
export const linkForCustomer = (state: BodegaMoneyState, customerId: string): PaymentLink | undefined =>
  state.links.filter((row) => row.customerId === customerId).slice(-1)[0];

/** Every page the shop has made, newest first — what `Payment links` lists. */
export const paymentLinks = (state: BodegaMoneyState): PaymentLink[] =>
  state.links.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** The pages made for one sale or one debtor, newest first. */
export const linksForCustomer = (state: BodegaMoneyState, customerId: string): PaymentLink[] =>
  paymentLinks(state).filter((row) => row.customerId === customerId);

/** `S/ 1,234.50` — one grammar for every figure this prototype prints. */
export const bodegaMoney = (amountMinor: number): string => formatMoney(amountMinor, 'PEN');

/* ══ THE FIADO BOOK, AND IT IS THE ONLY ONE ══════════════════════════════════════════════════
 *
 * Money read `state.fiado` and Customers, the Data seat and the export read the fixture, so a
 * fresh browser said «nobody owes you» on one screen and «6 customers · S/ 460.00» two taps away
 * (the QA pass, item 7). ONE BOOK STANDS HERE NOW and every surface reads it:
 *
 *   · the money seed's six rows open it, each carrying the amount, the count and the day the
 *     chats give it, marked `likely` — the same figures Customers and the CSV already printed
 *   · a confirmation or a correction on `#/start/owed` or `#/money/owed` REPLACES that row and
 *     marks it `confirmed`, and `forgetFiado` hands the row back to the likely state it came from
 *   · a person the read found whom the seed holds nothing for joins the book the moment the shop
 *     types an amount for her
 *
 * So a debt shows one amount, one count and one date on Money, on the customer sheet, on the Data
 * seat and in the file, and the word beside it says whose answer it is.
 */

export type FiadoStanding = 'likely' | 'confirmed';

/** One row of the book, with the word that says whether the shop has answered for it. */
export type FiadoBookRow = FiadoRow & { standing: FiadoStanding };

/** The two words a row carries, said as a state rather than as an instruction. */
export const FIADO_STANDING_WORD: Record<FiadoStanding, string> = {
  likely: 'Likely, from your messages',
  confirmed: 'In your fiado book',
};

/** The seed's own six rows, as book rows the shop has still to answer for — each carrying the
 *  reason the read wrote for that person, so the row says what it stands on. */
export function seedFiadoRows(): FiadoBookRow[] {
  const reasons = new Map(likelyOwed.map((row) => [row.customer, row.reason]));
  return moneySeed.fiadoBook.rows.map((row) => ({
    customerId: row.customer,
    customerName: customerOf(row.customer)?.name ?? row.customer,
    amountMinor: row.amountMinor,
    /* THE DAY KEEPS ITS DISTANCE FROM TODAY (item 17), so `Since 28 Aug` stays three weeks old
       whatever day the app is opened on — the same roll `paper/back-run.ts` gives its own rows. */
    since: seedDay(row.since),
    sales: row.sales,
    confirmedAt: '',
    standing: 'likely' as const,
    ...(reasons.get(row.customer) ? { reason: reasons.get(row.customer) as string } : {}),
  }));
}

const biggestFirst = (a: FiadoBookRow, b: FiadoBookRow): number =>
  b.amountMinor - a.amountMinor
  || a.since.localeCompare(b.since)
  || a.customerName.localeCompare(b.customerName);

/** THE BOOK. The seed underneath, the shop's own answers over it, biggest first. */
export function fiadoBook(state: BodegaMoneyState): FiadoBookRow[] {
  const answered = new Map(state.fiado.map((row) => [row.customerId, row]));
  const rows: FiadoBookRow[] = seedFiadoRows().map((row) => {
    const own = answered.get(row.customerId);
    return own ? { ...own, standing: 'confirmed' as const } : row;
  });
  const seeded = new Set(rows.map((row) => row.customerId));
  for (const row of state.fiado) {
    if (!seeded.has(row.customerId)) rows.push({ ...row, standing: 'confirmed' });
  }
  return rows.filter((row) => row.amountMinor > 0).sort(biggestFirst);
}

/** The book as it stands right now, for a helper that holds no hook. */
export const fiadoBookNow = (scope: string): FiadoBookRow[] => fiadoBook(read(scope));

/** One person's row, off the same book. */
export const fiadoRowOf = (state: BodegaMoneyState, customerId: string): FiadoBookRow | undefined =>
  fiadoBook(state).find((row) => row.customerId === customerId);

export const fiadoOfNow = (scope: string, customerId: string): FiadoBookRow | undefined =>
  fiadoRowOf(read(scope), customerId);

/** What the whole book comes to, which is the figure a card prints beside its heading. */
export const fiadoTotal = (rows: readonly { amountMinor: number }[]): number =>
  rows.reduce((sum, row) => sum + row.amountMinor, 0);

/** The rows the shop has answered for, which is what the heading rule reads. */
export const confirmedRows = (state: BodegaMoneyState): FiadoBookRow[] =>
  fiadoBook(state).filter((row) => row.standing === 'confirmed');

/** The heading rule of card 3: `Who may owe you` until the first confirmation. */
export const confirmedFiado = (state: BodegaMoneyState): boolean => state.fiado.length > 0;

/** The book, live, for any surface that draws it. */
export function useFiadoBook(scope: string): FiadoBookRow[] {
  const { state } = useMoney(scope);
  return React.useMemo(() => fiadoBook(state), [state]);
}

/* ── ONE READING OF A TYPED AMOUNT ────────────────────────────────────────────────────────── */

/** The biggest fiado this shop writes down, which is what a stray keystroke lands above. */
export const FIADO_CEILING_MINOR = 5_000_000;

export type SolesReading =
  | { ok: true; amountMinor: number }
  | { ok: false; error: string };

/**
 * WHAT THE SHOP TYPED, READ ONCE. Digits with one separator, either grammar — `1234,50` and
 * `1,234.50` are the same amount — and everything else comes back as a sentence she can act on.
 * `#/start/owed` and `#/money/owed` both read through here, so one keystroke means one thing.
 */
export function parseSoles(text: string): SolesReading {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Type the amount you remember, in soles.' };
  if (trimmed.startsWith('-')) return { ok: false, error: 'Type an amount above zero, in soles.' };
  const digits = trimmed.replace(/\s/g, '');
  /* A separator that stands 3 digits from the end is a thousands mark; anything else is decimals. */
  const cleaned = /^\d{1,3}([.,]\d{3})+$/.test(digits)
    ? digits.replace(/[.,]/g, '')
    : digits.replace(/,/g, '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, error: 'Type the amount in digits, with up to two decimals.' };
  }
  const amountMinor = Math.round(Number(cleaned) * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    return { ok: false, error: 'Type an amount above zero, in soles.' };
  }
  if (amountMinor > FIADO_CEILING_MINOR) {
    return { ok: false, error: `Type an amount up to ${bodegaMoney(FIADO_CEILING_MINOR)}.` };
  }
  return { ok: true, amountMinor };
}

/* ── THE ACTIONS ──────────────────────────────────────────────────────────────────────────── */

const reference = (seed: string): string => `BODEGA-${seed.slice(0, 8).toUpperCase()}`;

async function makeLink(scope: string, input: {
  amountMinor: number; description: string; customerName: string; customerId?: string;
  sellerName: string; accountLabel: string; sampleClock: string;
}): Promise<Result<PaymentLink>> {
  const id = crypto.randomUUID();
  const current = read(scope);
  const link: PaymentLink = {
    id, amountMinor: input.amountMinor, currency: 'PEN', description: input.description.trim(),
    customerName: input.customerName, reference: reference(id), status: 'created',
    createdAt: new Date().toISOString(), url: `${previewOrigin()}#/pay/${id}`,
    ...(input.customerId ? { customerId: input.customerId } : {}),
  };
  if (!Number.isSafeInteger(link.amountMinor) || link.amountMinor <= 0) {
    return { ok: false, error: 'Give this payment page an amount above zero.' };
  }
  if (!link.description) return { ok: false, error: 'Say what this payment page is for.' };
  const reserved = commit(scope, { ok: true, value: link,
    state: { ...current, links: [...current.links, { ...link, remotePending: Boolean(collectionOrigin()) }] } });
  if (!reserved.ok) return reserved;
  if (!collectionOrigin()) return { ok: true, value: link, state: read(scope) };
  const check = collectionGuard(scope);
  const draft: PaymentLinkDraft = {
    id, amountMinor: link.amountMinor, description: link.description, customerName: link.customerName,
    reference: link.reference, sellerName: input.sellerName, receivingBank: current.setup.bank,
    accountLabel: input.accountLabel, sampleClock: input.sampleClock,
  };
  try {
    const remote = await createPaymentLink(scope, draft);
    check();
    if (!remote) return { ok: true, value: link, state: read(scope) };
    return commit(scope, saveRemote(scope, id, remote));
  } catch (error) { return failed(error); }
}

function saveRemote(scope: string, id: string, remote: CollectionRequest): Result<PaymentLink> {
  const latest = read(scope);
  const held = latest.links.find((row) => row.id === id);
  if (!held) return { ok: false, error: 'Open this payment page from the workspace that made it.' };
  const saved: PaymentLink = { ...held, url: remote.buyer_url, remoteId: remote.id, remotePending: false,
    amountMinor: remote.balance_minor > 0 ? remote.balance_minor : held.amountMinor };
  const receipts: BodegaReceipt[] = remote.receipts.map((row) => ({
    id: row.id, linkId: id, amountMinor: row.amount_minor, currency: row.currency,
    reference: row.reference, method: row.method,
    source: row.source === 'sample' ? 'demo-bank' : row.source, at: row.created_at,
    status: row.status,
    ...(row.rounding_minor !== undefined ? { roundingMinor: row.rounding_minor } : {}),
    ...(row.received_at !== undefined ? { receivedAt: row.received_at } : {}),
  }));
  const kept = latest.receipts.filter((row) => row.linkId !== id);
  return { ok: true, value: saved,
    state: { ...latest, links: latest.links.map((row) => (row.id === id ? saved : row)),
      receipts: [...kept, ...receipts] } };
}

export function moneyActions(scope: string) {
  return {
    updateSetup(patch: Partial<MoneySetupState>): Result<MoneySetupState> {
      const current = read(scope);
      const setup = { ...current.setup, ...patch };
      return commit(scope, { ok: true, value: setup, state: { ...current, setup } });
    },

    /** ONE PAGE, WITH THE WORDS THE SHOP TYPED. One call per press, deduplicated by description
     *  and amount so a double press makes one page rather than two. */
    createLink(input: Parameters<typeof makeLink>[1]): Promise<Result<PaymentLink>> {
      const key = `${scope}:${input.amountMinor}:${input.description.trim()}`;
      if (!pendingLinks.has(key)) {
        const pending = makeLink(scope, input)
          .finally(() => { if (pendingLinks.get(key) === pending) pendingLinks.delete(key); });
        pendingLinks.set(key, pending);
      }
      return pendingLinks.get(key)!;
    },

    recordLinkAction(linkId: string, action: 'copied' | 'sent'): Result<PaymentLink> {
      const current = read(scope);
      const link = current.links.find((row) => row.id === linkId);
      if (!link) return { ok: false, error: 'Open this payment page from the workspace that made it.' };
      const at = new Date().toISOString();
      const saved: PaymentLink = { ...link, status: action,
        ...(action === 'copied' ? { copiedAt: at } : { sentAt: at }) };
      return commit(scope, { ok: true, value: saved,
        state: { ...current, links: current.links.map((row) => (row.id === linkId ? saved : row)) } });
    },

    /** The read screen's own act, and the fiado book is what it records (DESIGN-SPEC.md §2). */
    confirmFiado(row: Omit<FiadoRow, 'confirmedAt'>): Result<FiadoRow> {
      const current = read(scope);
      const saved: FiadoRow = { ...row, confirmedAt: new Date().toISOString() };
      const rest = current.fiado.filter((held) => held.customerId !== row.customerId);
      return commit(scope, { ok: true, value: saved, state: { ...current, fiado: [...rest, saved] } });
    },

    /** A correction keeps the row and moves its figure, which is the other half of the one act. */
    correctFiado(customerId: string, amountMinor: number): Result<FiadoRow | undefined> {
      const current = read(scope);
      if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
        return { ok: false, error: 'Give this fiado an amount of zero or more.' };
      }
      const fiado = current.fiado.map((row) => (row.customerId === customerId ? { ...row, amountMinor } : row));
      return commit(scope, { ok: true, value: fiado.find((row) => row.customerId === customerId),
        state: { ...current, fiado } });
    },

    forgetFiado(customerId: string): Result<undefined> {
      const current = read(scope);
      return commit(scope, { ok: true, value: undefined,
        state: { ...current, fiado: current.fiado.filter((row) => row.customerId !== customerId) } });
    },

    /** The service's own answer about one page, read back so a credit lands on its own sale. */
    async refreshLink(linkId: string): Promise<Result<unknown>> {
      const link = read(scope).links.find((row) => row.id === linkId);
      if (!link?.remoteId || !collectionOrigin()) return { ok: true, value: undefined, state: read(scope) };
      const check = collectionGuard(scope);
      try {
        const remote = await readCollection(scope, link.remoteId);
        check();
        return commit(scope, saveRemote(scope, linkId, remote));
      } catch (error) { return failed(error); }
    },
  };
}

export function useMoney(scope: string) {
  const snapshot = React.useCallback(() => read(scope), [scope]);
  const state = React.useSyncExternalStore(subscribe, snapshot, snapshot);
  const actions = React.useMemo(() => moneyActions(scope), [scope]);
  return { state, ...actions };
}
