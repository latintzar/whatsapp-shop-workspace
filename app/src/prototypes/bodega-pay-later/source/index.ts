/* THE SOURCE — ONE SEAM, and the whole reason the screens hold one code path.
 *
 * Every surface that reads the shop's chats reads THIS interface. Behind it stand two
 * implementations of the same shape:
 *
 *   proof   the live rig: the same-origin bridge `/api/proof/*` → Cedar's connection service, which
 *           is Peter's own connected number and its real history (WIRING-SPEC.md §1 and §3).
 *   sample  the fallback, reached where the bridge answers 503, which is local development. The
 *           bodega world of `fixtures/cast-bodega.json`, and the UI names it `Sample chats`
 *           (WHATSAPP-HISTORY-SPEC.md §8).
 *
 * THE CHOICE IS MADE ONCE, AT BOOT, by probing `GET /api/proof/state`: a state the bridge answers
 * with selects `proof`; a 503, a network failure or an answer of another shape selects `sample`. A
 * screen therefore asks for conversations and messages and stays ignorant of which world answered,
 * which is what keeps the fixture a fallback rather than a second build.
 */
import * as React from 'react';
import { disconnectWhatsApp, proofApi, ProofApiError } from '../../cedar/connections/api';
import type { Conversation, MessagePage, ProofMessage, ProofState } from '../../cedar/connections/types';
import {
  REFERENCE_DAY, corpus, customerOf, customers, house, laughs, likelyOwed, supplierOf, suppliers,
  type SampleText,
} from '../cast';
import { laughsIn } from '../history/rank';
import { meaningOf, type Meaning } from '../history/read';
import { nativeWalk } from '../start/runtime';

export type SourceKind = 'proof' | 'sample';

export type ChatSource = {
  kind: SourceKind;
  /** every chat the connected account holds, newest activity first */
  conversations(signal?: AbortSignal): Promise<Conversation[]>;
  /** one page of a chat, older pages through `before` */
  messages(id: string, before?: string): Promise<MessagePage>;
  /** the connection and the history's own counts and range */
  connection(signal?: AbortSignal): Promise<ProofState>;
  /** drops the subscription and the active authority, which is what `Reset state` starts with */
  disconnect(): Promise<void>;
};

/** THE WORD EACH SOURCE SAYS ON SCREEN, so one string serves every surface that prints it. */
export const SOURCE_WORD: Record<SourceKind, string> = {
  proof: 'Your chats',
  sample: 'Sample chats',
};

/* ── the live rig ─────────────────────────────────────────────────────────────────────────── */

/** Opens the service's browser session, the call Cedar's own walk starts with. */
const openSession = (timeoutMs?: number) => proofApi<{ ok: boolean }>('/session', { body: {}, timeoutMs });

/** A setup session lasts thirty minutes and an account session eight hours, so a read that meets a
 *  401 renews the session once and asks again; any other answer stands. */
async function withSession<T>(ask: () => Promise<T>): Promise<T> {
  try {
    return await ask();
  } catch (error) {
    if (!(error instanceof ProofApiError) || error.status !== 401) throw error;
    await openSession();
    return ask();
  }
}

const proofSource = (): ChatSource => ({
  kind: 'proof',
  conversations: (signal) => withSession(() => proofApi<{ conversations: Conversation[] }>('/conversations', { signal }))
    .then((page) => page.conversations),
  /* the bridge forwards `after`, `before` and `limit` alone, and caps a page at 100 */
  messages: (id, before) => withSession(() => proofApi<MessagePage>(
    `/conversations/${encodeURIComponent(id)}/messages?limit=100${before ? `&before=${encodeURIComponent(before)}` : ''}`,
  )),
  connection: (signal) => withSession(() => proofApi<ProofState>('/state', { signal })),
  disconnect: () => disconnectWhatsApp().then(() => undefined),
});

/* ── the bodega world ─────────────────────────────────────────────────────────────────────── */

/** The seeded account, reporting the fixture's own figures: `2,960 messages · 27 conversations ·
 *  since 22 March` (ONBOARDING-SPEC.md screen 3). */
const sampleState = (): ProofState => ({
  ready: true,
  blockers: [],
  meta: { appId: 'sample', configId: 'sample', graphVersion: 'sample' },
  connection: {
    wabaId: 'sample',
    phoneId: 'sample',
    number: house.whatsapp,
    name: house.name,
    coexistence: true,
  },
  setup: { status: 'ready', step: 'complete', error: null },
  history: {
    status: 'complete',
    progress: 100,
    messages: corpus.messages,
    conversations: corpus.threads,
    oldestAt: `${corpus.from}T09:00:00-05:00`,
    newestAt: `${corpus.to}T19:30:00-05:00`,
  },
});

/** A chat per person in the cast, the shop's own contact names, its own numbers — and each row's last
 *  message read off its own thread, the way `projectHistory` reads one off the provider's pages. The
 *  count is the shop's whole chat; the page below is a bounded page of it. */
const sampleConversations = (): Conversation[] => [
  ...customers.map((person) => ({ id: `customer-${person.id}`, name: person.name, number: person.phone, count: person.messages })),
  ...suppliers.map((person) => ({ id: `supplier-${person.id}`, name: person.name, number: person.phone, count: person.messages })),
].map((row) => {
  const page = sampleMessages(row.id);
  const last = page[page.length - 1];
  return { ...row, lastMessage: last?.text ?? '', lastAt: last?.timestamp ?? '' };
}).sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt) || a.name.localeCompare(b.name));

/* ═══ A SCRIPT PER THREAD, BECAUSE A ROTATION GIVES EVERYONE THE SAME SENTENCE ════════════════════
 *
 * One rotation of the corpus through every chat put every line in every thread, so eighteen customers
 * came back with the same counts: eleven rows of screen 4 read «Asked to pay later 8 times» and two
 * people carried one sentence between them, word for word. A likely list whose reasons repeat reads as
 * written rather than as read, which is the opposite of what that screen is for.
 *
 * So each thread is composed from its OWN script. The six customers the fixture declares evidence for
 * carry the counts it declares (`chatCorpus.whoOwesYou`, which is also what the envelope fixture and
 * `Money` already stand on); every other person takes a last-order day of their own; and the laughs are
 * the ones the cast seeded, chat by chat, so a chat holding 34 «jaja» in the cast holds 34 of them here
 * (WHATSAPP-HISTORY-SPEC.md §5). No two people can then read alike.
 *
 * THE WORDS STAY THE CORPUS'S OWN: a beat is picked from the fixture's lines by what the READ calls
 * them — `meaningOf`, the shipped classifier — so the world the screens read is the world the fixture
 * states, and a line the fixture rewrites arrives here without an edit.
 */

/** One line of the corpus, in the shape the read asks a message for. */
type Line = Pick<ProofMessage, 'direction' | 'text' | 'kind'>;

const lineOf = (text: SampleText): Line => ({
  direction: text.direction === 'in' ? 'inbound' : 'outbound',
  text: text.text,
  kind: text.image ? 'image' : 'text',
});

/** The fixture's lines that read as one meaning, in one direction; `laughing` splits the chatter into
 *  the lines that hold a «jaja» and the lines that hold none. */
const linesOf = (meaning: Meaning, direction: Line['direction'], laughing = false): Line[] =>
  corpus.sampleTexts.map(lineOf).filter((line) => line.direction === direction
    && meaningOf(line) === meaning && (laughsIn(line.text) > 0) === laughing);

const ORDERS_IN = linesOf('order-received', 'inbound');
const ORDERS_OUT = linesOf('order-placed', 'outbound');
const ASKS = linesOf('fiado-note', 'inbound');
const RECEIPTS_IN = linesOf('receipt', 'inbound');
const RECEIPTS_OUT = linesOf('receipt', 'outbound');
const PRICES = linesOf('price', 'inbound');
const LAUGHS = linesOf('noise', 'inbound', true);
const CHATTER = linesOf('noise', 'inbound', false);

/** What one thread holds, and the two days its reason line reads. */
type ThreadScript = {
  ordersIn: number;
  ordersOut: number;
  asks: number;
  receiptsIn: number;
  receiptsOut: number;
  prices: number;
  laughs: number;
  /** the day the newest order sits on, counted back from the reference day */
  lastOrderDaysAgo: number;
  /** the day the newest message of any kind sits on, at or after that order */
  lastMessageDaysAgo: number;
  /** the beats to spread the script over, which is this world's bounded page */
  slots: number;
};

/** A page of this world, bounded the way the bridge bounds one. */
const PAGE_CEILING = 80;

/** The customers the fixture declares the evidence for, by id. */
const DECLARED = new Map(likelyOwed.map((row) => [row.customer, row]));

/** Everyone else, in the cast's own order, which is where each takes its own figures from. */
const OTHERS = customers.filter((person) => !DECLARED.has(person.id)).map((person) => person.id);

/** A chat carries on after its last order, so the newest message sits a day or three later. */
const quietAfter = (lastOrderDaysAgo: number, seat: number): number =>
  Math.max(0, lastOrderDaysAgo - (1 + (seat % 3)));

/** THE LAUGHS A CHAT HOLDS. The cast's `laughs` block seeds the ten it ranks, and it holds the order
 *  both screens stand on; a chat it leaves out still holds a «jaja» or three, under the four of the
 *  smallest seeded chat, so the ranking is the block's and a row still reads a reason of its own. */
const laughsFor = (who: string, seat: number): number => laughs[who] ?? (1 + (seat % 3));

/**
 * One customer's script. The declared six come back as `chatCorpus.whoOwesYou` states them — the asks,
 * the payments seen, the orders still awaiting one and the day of the last order. The other twelve take
 * a last-order day of their own, `7` days ago and one more for each seat, so every reason line on the
 * screen differs from every other by its own day at least.
 */
function customerScript(who: string): ThreadScript {
  const declared = DECLARED.get(who);
  const seat = Math.max(OTHERS.indexOf(who), 0);
  const asks = declared ? declared.fiadoAsks : 1 + (seat % 4);
  const receiptsIn = declared ? declared.paymentsSeen : 2 + ((seat * 3) % 5);
  const awaiting = declared ? declared.ordersAwaitingPayment : 1 + (seat % 3);
  const lastOrderDaysAgo = declared ? declared.lastOrderDaysAgo : 7 + seat;
  return {
    ordersIn: receiptsIn + awaiting,
    ordersOut: 0,
    asks,
    receiptsIn,
    receiptsOut: 0,
    prices: seat % 2,
    laughs: laughsFor(who, seat),
    lastOrderDaysAgo,
    lastMessageDaysAgo: quietAfter(lastOrderDaysAgo, declared ? asks : seat),
    slots: Math.min(customerOf(who)?.messages ?? 40, PAGE_CEILING),
  };
}

/**
 * One supplier's script: orders leave for them, payments leave for them, and the purchases are the
 * ones the CAST declares, `supplier.purchases`.
 *
 * THE COUNT IS THE SUPPLIER'S OWN RHYTHM, WHICH IS WHY IT IS DECLARED RATHER THAN COUNTED OFF A SEAT.
 * A seat number gave the mayorista the shop buys from twice a week `Bought twice` and the gas man it
 * calls once a month `Bought 10 times` — nine different figures, every one of them about the row's
 * place in a list rather than about the shop. The cast states the drops each chat shows (bread daily
 * and first, gas on call and last), so the referral rows rank the way the week does and the reason
 * line tells the shop something it can check.
 */
function supplierScript(who: string): ThreadScript {
  const seat = Math.max(suppliers.findIndex((person) => person.id === who), 0);
  return {
    ordersIn: 0,
    ordersOut: supplierOf(who)?.purchases ?? (2 + seat),
    asks: 0,
    receiptsIn: 0,
    receiptsOut: 1 + (seat % 3),
    prices: 1 + (seat % 2),
    laughs: laughsFor(who, seat),
    lastOrderDaysAgo: 1 + seat,
    lastMessageDaysAgo: quietAfter(1 + seat, seat),
    slots: Math.min(supplierOf(who)?.messages ?? 40, PAGE_CEILING),
  };
}

/** The slots a kind's beats fall on, spread evenly with a margin at each end, so an order lands every
 *  few messages rather than in a block: the `j`-th of `count` beats over `slots` slots. */
const spread = (count: number, slots: number): number[] =>
  Array.from({ length: count }, (_, j) => Math.floor(((j + 0.5) * slots) / count));

/**
 * The beats of one thread, one to a slot, chatter where a slot came due empty — so the page is exactly
 * as long as the script's slots and stays inside the page the bridge would return.
 *
 * ORDERS FIRST WHERE A SLOT FALLS DUE TO SEVERAL, and a kind with fewer beats trails the kind with more
 * — which is what leaves `receiptsIn` payments settling the oldest orders and `ordersIn - receiptsIn` of
 * them standing, the evidence the likely list reads.
 */
function beatsOf(script: ThreadScript): { lines: Line[]; lastOrder: number } {
  const kinds = [
    { pool: ORDERS_IN, count: script.ordersIn, order: true },
    { pool: ORDERS_OUT, count: script.ordersOut, order: true },
    { pool: ASKS, count: script.asks, order: false },
    { pool: RECEIPTS_IN, count: script.receiptsIn, order: false },
    { pool: RECEIPTS_OUT, count: script.receiptsOut, order: false },
    { pool: PRICES, count: script.prices, order: false },
    { pool: LAUGHS, count: script.laughs, order: false },
  ].map((kind) => ({ ...kind, count: kind.pool.length > 0 ? kind.count : 0 }));
  const beats = kinds.reduce((total, kind) => total + kind.count, 0);
  const slots = Math.max(script.slots, beats + 1);
  const plans = kinds.map((kind) => spread(kind.count, slots));
  const taken = kinds.map(() => 0);
  const due: { line: Line; order: boolean }[] = [];
  const lines: Line[] = [];
  let lastOrder = -1;
  const write = (beat: { line: Line; order: boolean }): void => {
    lines.push(beat.line);
    if (beat.order) lastOrder = lines.length - 1;
  };
  for (let slot = 0; slot < slots; slot += 1) {
    kinds.forEach((kind, index) => {
      while (taken[index] < kind.count && plans[index][taken[index]] === slot) {
        due.push({ line: kind.pool[taken[index] % kind.pool.length], order: kind.order });
        taken[index] += 1;
      }
    });
    const next = due.shift();
    if (next) write(next); else lines.push(CHATTER[slot % CHATTER.length]);
  }
  /* a slot that fell due to two kinds leaves one beat over; it belongs to the chat all the same */
  while (due.length > 0) write(due.shift() as { line: Line; order: boolean });
  return { lines, lastOrder };
}

const DAY = 86_400_000;

/** Lima midnight on the reference day, which every day-ago is counted back from. */
const MIDNIGHT = Date.parse(`${REFERENCE_DAY}T00:00:00-05:00`);

/** The oldest beat, a couple of days inside the window the fixture declares. */
const OPEN_DAYS_AGO = Math.max(corpus.windowDays - 2, 1);

/**
 * One thread's page: the script's beats, dated so the last order lands on the day the script names and
 * the newest message on its own. Nine in the morning and a minute per beat — the DAY is what a reason
 * line reads, and the minute keeps the order the script wrote, so a receipt sorts after the order it
 * settles even where both fall on one day.
 */
function sampleMessages(id: string): ProofMessage[] {
  const who = id.replace(/^(customer|supplier)-/, '');
  const script = id.startsWith('supplier-') ? supplierScript(who) : customerScript(who);
  const { lines, lastOrder } = beatsOf(script);
  const walked = (from: number, to: number, step: number, of: number): number =>
    Math.round(from - ((from - to) * step) / Math.max(of, 1));
  const daysAgoAt = (index: number): number => {
    if (lastOrder < 0) return walked(OPEN_DAYS_AGO, script.lastMessageDaysAgo, index, lines.length - 1);
    if (index <= lastOrder) {
      const from = lastOrder === 0 ? script.lastOrderDaysAgo : OPEN_DAYS_AGO;
      return walked(from, script.lastOrderDaysAgo, index, lastOrder);
    }
    return walked(script.lastOrderDaysAgo, script.lastMessageDaysAgo, index - lastOrder, lines.length - 1 - lastOrder);
  };
  return lines.map((line, index) => ({
    id: `${id}-${index}`,
    direction: line.direction,
    text: line.text,
    kind: line.kind,
    timestamp: new Date(MIDNIGHT - daysAgoAt(index) * DAY + 9 * 3_600_000 + index * 60_000).toISOString(),
    historical: true,
    mediaAvailable: false,
  }));
}

const sampleSource = (): ChatSource => ({
  kind: 'sample',
  conversations: () => Promise.resolve(sampleConversations()),
  /* one page per chat: `before` reaches the end of this world's own history */
  messages: (id, before) => Promise.resolve(
    before ? { messages: [], nextCursor: null } : { messages: sampleMessages(id), nextCursor: null },
  ),
  connection: () => Promise.resolve(sampleState()),
  disconnect: () => Promise.resolve(),
});

/* ── the boot probe, once ─────────────────────────────────────────────────────────────────── */

const looksLikeState = (value: unknown): value is ProofState =>
  typeof value === 'object' && value !== null && 'history' in value && 'meta' in value;

let chosen: Promise<ChatSource> | null = null;

async function choose(): Promise<ChatSource> {
  // Browser proof cookies never become native authority. Until the account-scoped history
  // bridge is available, native onboarding offers the shop's real referral link with no cast.
  if (nativeWalk()) return {
    kind: 'proof', conversations: async () => [],
    messages: async () => ({ messages: [], nextCursor: null }),
    connection: async () => ({ ready: false, blockers: [], meta: { appId: '', configId: '', graphVersion: '' },
      connection: null, setup: { status: 'ready', step: 'complete', error: null },
      history: { status: 'idle', progress: 0, messages: 0, conversations: 0, oldestAt: null, newestAt: null } }),
    disconnect: async () => { throw new Error('Use the account connection settings.'); },
  };
  try {
    /* THE SESSION COMES FIRST. The service answers `/state` to a browser that holds its session
       cookie and 401 to one that holds none, so a first visit that asked for the state alone read
       the live rig as absent and drew the bodega world on demo (19 September). `POST /session` is
       what Cedar's own walk opens with; it answers a fresh browser with an unbound session. */
    await openSession(8000);
    const state = await proofApi<unknown>('/state', { timeoutMs: 8000 });
    if (looksLikeState(state)) return proofSource();
  } catch {
    /* the bridge answers 503 while `CEDAR_WHATSAPP_BRIDGE_ENABLED` is unset, and a development
       server answers the page itself; both mean the bodega world */
  }
  return sampleSource();
}

/** The source this session reads, resolved once and shared by every screen. */
export const chatSource = (): Promise<ChatSource> => (chosen ??= choose());

/** The same source, for a component: the probe's answer once it lands. */
export function useChatSource(): ChatSource | null {
  const [source, setSource] = React.useState<ChatSource | null>(null);
  React.useEffect(() => {
    let live = true;
    chatSource().then((resolved) => { if (live) setSource(resolved); });
    return () => { live = false; };
  }, []);
  return source;
}
