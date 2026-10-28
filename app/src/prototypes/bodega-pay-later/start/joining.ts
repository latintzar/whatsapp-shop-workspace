/* WHAT JOINING RECORDS — the place, the referral, the business, its address and its Yape.
 *
 * One module for the five calls the last steps of the walk make, all of them same-origin on this
 * page's own host and all of them served by `mock-api/app/bodega.py` behind the session cookie
 * `start/session.ts` minted from the WhatsApp connection:
 *
 *   GET  /api/bodega/waitlist            the place, the referral code and its link, the covered
 *                                        purchases, and how many businesses joined through this one
 *   POST /api/bodega/referral/attribute  `#/r/<code>`, attributed once, after the connection
 *   PUT  /api/bodega/business            what the business is, its name and its chosen address
 *   GET  /api/bodega/address/suggestions Google Places, session-token'd, Peru, through the runtime
 *   GET  /api/bodega/address/place       the coordinate of the suggestion the shop picked
 *   PUT  /api/bodega/yape                the Yape number, and the QR photo where one is given
 *
 * ═══ THE NUMBERS ARE THE API'S, NEVER THE PAGE'S (ONBOARDING-SPEC.md §0) ════════════════════
 * The place, the referral code, the covered purchases and how far a business moves are all read
 * from the service. This file does no arithmetic on any of them.
 *
 * ═══ AND THE SAMPLE WORLD SAYS SO ══════════════════════════════════════════════════════════
 * Local development runs with no connection service behind it, so the sign-in cannot be minted and
 * every one of these paths answers the named `awaiting` state `session.ts` already defines. The
 * walk carries on there on the SAMPLE WORLD's own seeded place (`fixtures/cast-bodega.json`,
 * `money.queue`) — the same rule the read already follows, where the fixture's counts print under
 * the words `Sample chats`. A screen standing on the seed says `Sample waitlist`, so a figure a
 * service never gave is never passed off as one it did.
 */
import * as React from 'react';
import { queue } from '../cast';
import { bodegaApi, type Answer } from './session';
import type { Lang } from './words';
import { nativeWalk, walkStorage } from './runtime';

/* ── the place ────────────────────────────────────────────────────────────────────────────── */

export type Waitlist = {
  /** this business's place in the queue, as the service counts it */
  place: number;
  /** how many businesses stand in front of it */
  ahead: number;
  referralCode: string;
  referralUrl: string;
  joined: string;
  /** how many purchases the referrals so far have covered */
  coveredPurchases: number;
  /** how many businesses joined through this one */
  joinedThroughYou: number;
  /** the language this business signed up in, which the service keeps on its row. The WALK reads
   *  the page's own choice rather than this (`start/words.ts`); it is here because the record
   *  carries it and a reader of this type should know it exists. */
  language?: Lang;
  onboarded?: boolean;
  statusUrl?: string;
};

/** WHERE A PLACE CAME FROM. `service` is the rig's own record; `sample` is the seeded world, and
 *  the screen prints that word beside the figure. */
export type PlaceSource = 'service' | 'sample';

export type Standing = { waitlist: Waitlist; source: PlaceSource };

/** THE SAMPLE WORLD'S OWN PLACE, seeded beside its chats and its money (`fixtures/README.md`). */
export const SAMPLE_WAITLIST: Waitlist = {
  place: queue.place,
  ahead: Math.max(0, queue.place - 1),
  referralCode: queue.referralCode,
  referralUrl: `${window.location.origin}${window.location.pathname}#/r/${queue.referralCode}`,
  joined: queue.inLineSince,
  coveredPurchases: 0,
  joinedThroughYou: 0,
};

/** How many places one business is worth, and how many businesses cover one purchase — the two
 *  numbers screen 9 states. They are the service's own constants, seeded here for the sample
 *  world (`mock-api/app/bodega.py`: `WAITLIST_MOVE_UP`, `REFERRALS_PER_COVERED_PURCHASE`). */
export const MOVE_UP = queue.movesUpBy;
export const PER_COVERED_PURCHASE = queue.perCoveredPurchase;

export const readWaitlist = (): Promise<Answer<Waitlist>> => bodegaApi<Waitlist>('/waitlist');

/**
 * THE PLACE, AS EVERY SCREEN READS IT. The service first; the sample world where it is awaiting.
 * A screen re-reads after something that moves the number — a referral attributed, a share taken —
 * by asking for `again`.
 */
export function useWaitlist(): { standing: Standing | null; again: () => void } {
  const [standing, setStanding] = React.useState<Standing | null>(null);
  const [round, setRound] = React.useState(0);
  React.useEffect(() => {
    let live = true;
    void readWaitlist().then((answer) => {
      if (!live) return;
      setStanding(answer.ok
        ? { waitlist: answer.value, source: 'service' }
        : nativeWalk() ? null : { waitlist: SAMPLE_WAITLIST, source: 'sample' });
    });
    return () => { live = false; };
  }, [round]);
  return { standing, again: React.useCallback(() => setRound((n) => n + 1), []) };
}

/* The word a screen prints where the figure came from the seed rather than the service is a
   STRING THE SHOP READS, so it lives in the walk's own table with its Spanish beside it
   (`start/words.ts`, `sampleSays`). */

/* ── the referral a link carries ──────────────────────────────────────────────────────────── */

/** `#/r/<code>` — the code a link handed this browser, held until the connection exists to attach
 *  it to. It rides the page's own session storage, because it is worth exactly one walk. */
const REFERRAL_KEY = 'rocoto-bodega-referred-by';

export function rememberReferral(code: string): void {
  const clean = code.trim().toUpperCase().slice(0, 12);
  if (!clean) return;
  try { window.sessionStorage.setItem(REFERRAL_KEY, clean); } catch { /* a browser that refuses forgets */ }
}

export function heldReferral(): string {
  try { return window.sessionStorage.getItem(REFERRAL_KEY) ?? ''; } catch { return ''; }
}

export function forgetReferral(): void {
  try { window.sessionStorage.removeItem(REFERRAL_KEY); } catch { /* the same */ }
}

/**
 * ATTRIBUTE THE HELD CODE, ONCE THE CONNECTION EXISTS. The service is idempotent, refuses a
 * business's own code and answers an unknown one with a plain `false`, so this is safe to call
 * whenever a session lands. A code that was attributed is dropped, so a second walk starts clean.
 */
export async function attributeHeldReferral(): Promise<boolean> {
  const code = heldReferral();
  if (!code) return false;
  const answer = await bodegaApi<{ attributed?: boolean }>('/referral/attribute', { code });
  if (answer.ok) { forgetReferral(); return Boolean(answer.value.attributed); }
  return false;
}

/* ── the business ─────────────────────────────────────────────────────────────────────────── */

/** The three the shop chooses between (ONBOARDING-SPEC.md §0, screen 4). */
/** Current relationship roles. Supplier means the business sells to other businesses. */
export type BusinessKind = 'bodega' | 'supplier' | 'restaurant';
export type LegacyBusinessKind = 'sells_to_bodegas' | 'sells_to_restaurants';

/** Stored pre-0.6 supplier answers remain readable and normalize before the UI uses them. */
export function canonicalBusinessKind(value: unknown): BusinessKind | null {
  if (value === 'bodega' || value === 'supplier' || value === 'restaurant') return value;
  return value === 'sells_to_bodegas' || value === 'sells_to_restaurants' ? 'supplier' : null;
}

export type ChosenAddress = { text: string; placeId: string; lat: number; lng: number };

export type Business = { personName?: string; kind: BusinessKind | null; name: string; address: ChosenAddress | null };

/** Suppliers continue to the seller-specific steps; bodegas and restaurants take the buyer path. */
export const sellsOnward = (kind: BusinessKind | null): boolean => kind === 'supplier';

export async function readBusiness(): Promise<Answer<Business>> {
  const answer = await bodegaApi<Omit<Business, 'kind'> & { kind?: unknown }>('/business');
  return answer.ok ? { ok: true, value: { ...answer.value, kind: canonicalBusinessKind(answer.value.kind) } } : answer;
}

/** THE RECORD CARRIES THE LANGUAGE THIS SHOP SIGNED UP IN, so the buddy writes to it the way it
 *  read the walk (`start/words.ts`; MESSAGES.md). Spanish is the default on the service's side too,
 *  so a record written before this field existed reads as Spanish. */
export const writeBusiness = (body: {
  kind: BusinessKind; name: string; address: ChosenAddress; language: Lang;
}): Promise<Answer<Business>> => bodegaApi<Business>('/business', body, 20000, 'PUT');

/* ── WHAT THE SHOP ANSWERED, WHILE IT IS WALKING ──────────────────────────────────────────────
 * The kind, the name and the address are asked on two screens and read on three more, and the
 * service holds them only once the address has been picked. So the walk keeps its own draft in
 * this page's session storage, and the record is written the moment the address lands.
 */
const DRAFT_KEY = 'rocoto-bodega-joining';

export type Draft = {
  kind: BusinessKind | null;
  name: string;
  address: ChosenAddress | null;
  /** whether this shop connected its Yape — what puts the chip on its pass (`start/pass.tsx`) */
  yape: boolean;
};

export const EMPTY_DRAFT: Draft = { kind: null, name: '', address: null, yape: false };

export function readDraft(): Draft {
  try {
    const held = walkStorage().getItem(DRAFT_KEY);
    if (!held) return EMPTY_DRAFT;
    const parsed = JSON.parse(held) as Partial<Draft>;
    return {
      kind: canonicalBusinessKind(parsed.kind),
      name: typeof parsed.name === 'string' ? parsed.name : '',
      address: parsed.address ?? null,
      yape: parsed.yape === true,
    };
  } catch { return EMPTY_DRAFT; }
}

export function writeDraft(draft: Draft): Draft {
  try { walkStorage().setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* held in memory alone */ }
  return draft;
}

export function forgetDraft(): void {
  try { walkStorage().removeItem(DRAFT_KEY); } catch { /* the same */ }
}

/* ── the address ──────────────────────────────────────────────────────────────────────────── */

export type Suggestion = {
  placeId: string;
  text: string;
  /** what the row prints in bold — the street and its number */
  mainText: string;
  /** and what it prints quietly beside it — the district and the city */
  secondaryText: string;
};

/** ONE SEARCH SESSION, ONE TOKEN. Google bills an autocomplete session rather than a keystroke, so
 *  every request from one search carries the same token and the pick that ends it closes the
 *  session. A fresh token starts the next one. */
export const newSessionToken = (): string => Math.random().toString(36).slice(2, 12);

export const addressSuggestions = (query: string, sessionToken: string):
Promise<Answer<{ provider: string; suggestions: Suggestion[] }>> =>
  bodegaApi<{ provider: string; suggestions: Suggestion[] }>(
    `/address/suggestions?query=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(sessionToken)}`,
  );

export const addressPlace = (placeId: string, sessionToken: string): Promise<Answer<ChosenAddress>> =>
  bodegaApi<ChosenAddress>(
    `/address/place?placeId=${encodeURIComponent(placeId)}&sessionToken=${encodeURIComponent(sessionToken)}`,
  );

/** THE ADDRESSES THE SAMPLE WORLD OFFERS, matching the fixture set the runtime answers with where
 *  no Places key is configured (`mock-api/app/bodega.py`, `FIXTURE_ADDRESSES`) — so the walk is
 *  whole with the runtime, with a key, and with neither. */
export const SAMPLE_SUGGESTIONS: Suggestion[] = [
  {
    placeId: 'fixture-av-larco', text: 'Av. Larco 345, Miraflores, Lima, Perú',
    mainText: 'Av. Larco 345', secondaryText: 'Miraflores, Lima, Perú',
  },
  {
    placeId: 'fixture-jr-union', text: 'Jr. de la Unión 618, Cercado de Lima, Lima, Perú',
    mainText: 'Jr. de la Unión 618', secondaryText: 'Cercado de Lima, Lima, Perú',
  },
  {
    placeId: 'fixture-av-arequipa', text: 'Av. Arequipa 2450, Lince, Lima, Perú',
    mainText: 'Av. Arequipa 2450', secondaryText: 'Lince, Lima, Perú',
  },
];

export const SAMPLE_PLACES: Record<string, ChosenAddress> = {
  'fixture-av-larco': { placeId: 'fixture-av-larco', text: 'Av. Larco 345, Miraflores, Lima, Perú', lat: -12.1211, lng: -77.0292 },
  'fixture-jr-union': { placeId: 'fixture-jr-union', text: 'Jr. de la Unión 618, Cercado de Lima, Lima, Perú', lat: -12.0472, lng: -77.0325 },
  'fixture-av-arequipa': { placeId: 'fixture-av-arequipa', text: 'Av. Arequipa 2450, Lince, Lima, Perú', lat: -12.0850, lng: -77.0330 },
};

/* ── the Yape ─────────────────────────────────────────────────────────────────────────────── */

export type YapeOnFile = { number: string; hasQr: boolean };

export const readYape = (): Promise<Answer<YapeOnFile>> => bodegaApi<YapeOnFile>('/yape');

/** The number, and the QR photo where the shop gave one. A number sent again with no fresh photo
 *  keeps the photo already on file (`mock-api/app/bodega.py`). */
export function writeYape(number: string, qr: File | null): Promise<Answer<YapeOnFile>> {
  const form = new FormData();
  form.append('number', number);
  if (qr) form.append('qr', qr);
  return bodegaApi<YapeOnFile>('/yape', form, 30000, 'PUT');
}

/** The shop's own QR, served back to its own session alone. */
export const OWN_QR = '/api/bodega/yape/qr';

/** A CUSTOMER'S PAYMENT PAGE reads the shop it is for by its public code. */
export const shopsYape = (code: string): string => `/api/bodega/pay/${encodeURIComponent(code)}/yape`;
export const shopsYapeQr = (code: string): string => `/api/bodega/pay/${encodeURIComponent(code)}/yape/qr`;

/* ── the Peruvian mobile, as a person types it ────────────────────────────────────────────── */

/** `987 654 321` as it is typed, and `+51 987 654 321` when it is sent — the shape
 *  `mock-api/app/bodega.py`'s `peru_mobile` accepts. */
export function yapeDigits(value: string): string {
  return value.replace(/\D/g, '').replace(/^51/, '').slice(0, 9);
}

export function yapeWords(digits: string): string {
  const clean = yapeDigits(digits);
  return [clean.slice(0, 3), clean.slice(3, 6), clean.slice(6, 9)].filter(Boolean).join(' ');
}

/** Peru's mobiles are nine digits beginning with 9. */
export const yapeReady = (digits: string): boolean => /^9\d{8}$/.test(yapeDigits(digits));

export const yapeE164 = (digits: string): string => `+51${yapeDigits(digits)}`;

/* ── the invitation, and the status page ───────────────────────────────────────── */

/* THE MESSAGE THE OWNER FORWARDS is a string the shop reads, so it lives in the walk's own table
   with its Spanish beside it (`start/words.ts`, `invitation` and `shareTitle`), and the road it
   travels — the owner's own share sheet, never a send — is `start/share.ts`. */

/**
 * THE STATUS PAGE'S OWN READ — `GET /api/bodega/status/<code>`, by referral code, with NO cookie.
 *
 * It is the one public read this service has, because the buddy's first message links to it and a
 * shop opens that link on whatever phone the message landed on (MESSAGES.md). So it carries what a
 * person may show somebody — the business's name, what it is, where it is, its place, the
 * businesses that joined through it — and no phone number and no address of its own.
 *
 * An unknown code is the service's own `bodega_status_unknown`, which the page tells apart from a
 * service that has yet to answer: the first draws the screen that names the waitlist, the second
 * stands on the sample world like every other screen of the walk (`start/lista.tsx`).
 */
export type PublicStatus = {
  name: string;
  kind: BusinessKind | null;
  place: number;
  ahead: number;
  /** how many businesses joined through this code */
  joined: number;
  /** how many purchases those businesses have covered */
  covered: number;
  referral_url: string;
  language: string;
};

export const STATUS_UNKNOWN = 'bodega_status_unknown';

export async function readStatus(code: string): Promise<Answer<PublicStatus>> {
  const answer = await bodegaApi<Omit<PublicStatus, 'kind'> & { kind?: unknown }>(`/status/${encodeURIComponent(code)}`);
  return answer.ok ? { ok: true, value: { ...answer.value, kind: canonicalBusinessKind(answer.value.kind) } } : answer;
}

/**
 * THE WALK IS WALKED — recorded once, the moment the last screen is reached.
 *
 * Peter, 20 September 2026: «if they didn tmessage the buddy for 5 minutes after they finished the
 * las tonbaroding step, we should messages them with imeta template». This is what starts that
 * clock: the service records `onboarded_at` and the buddy's own timer reads it. It is idempotent,
 * it carries no body, and its answer moves nothing on the screen — a rig with no session behind it
 * refuses it, and the shop is done either way.
 */
export const markOnboarded = (): Promise<Answer<{ onboarded?: boolean }>> =>
  bodegaApi<{ onboarded?: boolean }>('/onboarded', {});

/* ── the status link a message carries ────────────────────────────────────────────── */

/** `?lista=<CODE>` — the address the buddy's first message links to. It is a QUERY rather than a
 *  hash so the link survives being forwarded, shortened and previewed; the page turns it into
 *  `#/lista/<CODE>` on the first render (`App.tsx`). */
export const LISTA_PARAM = 'lista';

export function listaAsked(search: string = window.location.search): string {
  try {
    const held = (new URLSearchParams(search).get(LISTA_PARAM) ?? '').trim().toUpperCase();
    return /^[A-Z0-9]{1,12}$/.test(held) ? held : '';
  } catch { return ''; }
}

/** THE QUERY IS DROPPED ONCE THE ADDRESS HAS BECOME THE ROUTE, so a press that leaves the status
 *  page for the walk is never pulled back to it by the link that opened the tab. Everything else
 *  the address carries — `?lang=en`, `?dev=1` — stays. */
export function dropListaQuery(): void {
  try {
    const at = new URL(window.location.href);
    if (!at.searchParams.has(LISTA_PARAM)) return;
    at.searchParams.delete(LISTA_PARAM);
    window.history.replaceState(null, '', `${at.pathname}${at.search}${at.hash}`);
  } catch { /* a browser that refuses keeps the query, and the route still stands */ }
}
