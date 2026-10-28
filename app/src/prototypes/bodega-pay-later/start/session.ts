/* THE SESSION'S OWN PLUMBING — the sign-in, the reset, the referral record, the closing message
 * (WIRING-SPEC.md §1, §4).
 *
 * Every call is same-origin on this page's own host and every one of them is host-only cookie work
 * (`__Host-bodega_session`, Secure, HttpOnly), served by `mock-api/app/bodega.py`:
 *
 *   POST /api/bodega/session/connection  the WhatsApp connection, exchanged for the cookie
 *   GET  /api/bodega/session             who this browser is signed in as, from the cookie alone
 *   POST /api/bodega/session/reset       the rig's own session and referral records, cleared
 *   POST /api/bodega/referrals           the invitations this shop sent, kept with its session
 *   POST /api/bodega/notify              Rocoto's own number, messaging the CONNECTED one
 *
 * ═══ THE WHATSAPP CONNECTION IS THE SIGN-IN ══════════════════════════════════════════════════════
 * The connection service binds an authorised account to THIS BROWSER's own session: `get_state`
 * refuses a browser holding no `__Host-cedar_session`, and `store_for_session` answers a store only
 * where that session's sealed record carries an account, which is written in one place — inside the
 * Meta connect handler, after the exchanged token verified that exact account and phone. A fresh
 * browser's session is unbound and reads `connection: null`. So a connection THIS browser can see is
 * proof this browser authorised it, and `openFromConnection()` turns it into the rig's own cookie.
 *
 * ═══ THE NAMED AWAITING STATE ═══════════════════════════════════════════════════════════════════
 * Rocoto's sends need `WA_CLOUD_TOKEN` and `WA_CLOUD_PHONE_ID`, and the module requires its own
 * values and falls back to nothing — a silent fallback would message from another company's number.
 * So an absent key answers a named 503, and this file turns it into ONE state the screens print:
 * `awaiting`. Local development, where the service itself is still to answer, reads the same way, and
 * the walk carries on — the same rule the history's own 503 follows (WIRING-SPEC.md §9).
 *
 * ═══ WHO THE PAGE IS SIGNED IN AS ═══════════════════════════════════════════════════════════════
 * Three sources, in this order:
 *
 *   1 the page's own record (`stage.ts`), which needs no network;
 *   2 `GET /api/bodega/session`, the cookie and the service alone — the answer that survives a
 *     browser where storage throws, and the one a second phone reads;
 *   3 the connected account the source seam reports. ON THE RIG that answer is exchanged for the
 *     cookie through `POST /session/connection`, so the session outlives the connection service's own
 *     eight-hour binding; IN LOCAL DEVELOPMENT the seam answers from the bodega fixture, the page
 *     reads `Sample chats`, and the seeded account stands in with no service behind it.
 */
import * as React from 'react';
import publicSettings from '../../../shop-config.json';
import { chatSource } from '../source';
import { SCOPE, readStage, signIn, signOut, type SignedVia, type Stage } from '../stage';
import { nativeWalk } from './runtime';

export const BODEGA_API = '/api/bodega';

/** Rocoto's own number on Meta's Cloud API, the one that writes to the shop (MESSAGES.md §2). */
export const ROCOTO_NUMBER = publicSettings.botNumber || 'Configure your WhatsApp number';

/** The same number as a `wa.me` address — what «Say hi to Rocoto on WhatsApp» opens. */
export const ROCOTO_CHAT = publicSettings.botChat;

/**
 * THE SHOP'S OWN CHAT WITH ROCOTO, WITH THE GREETING ALREADY WRITTEN.
 *
 * THAT MESSAGE IS WHAT OPENS THE 24-HOUR WINDOW, so the buddy can answer inside it. The greeting
 * carries the business's name and its reference, which is how the buddy knows who said hi
 * (`start/words.ts`, `greeting`; MESSAGES.md). Two screens offer it: the last screen of the walk
 * and the status page.
 */
export const sayHiLink = (greeting: string): string =>
  ROCOTO_CHAT ? `${ROCOTO_CHAT}?text=${encodeURIComponent(greeting)}` : '#/admin/connections';

/** The sentence a screen prints while Rocoto's own sending number is awaiting its key. */
export const AWAITING_SAYS = 'Rocoto’s own number is awaiting its key, so the walk carries on here.';

/** What a refusal carrying no sentence of its own says. */
export const AGAIN_SAYS = 'Ask for this again in a moment.';

export type Reason = 'awaiting' | 'again';

/**
 * A REFUSAL CARRIES THE SERVICE'S OWN MACHINE WORD.
 *
 * The sentence is for the shop; the CODE is for the screen, and the walk needs it to tell the two
 * kinds of refusal apart: one the shop can act on — the number it typed, the photo it chose — and
 * one that is about the rig rather than about this shop. A screen that cannot tell them apart
 * holds a shop on a step for ever over an answer it can do nothing about, which is what screen 7
 * did (`start/yape.tsx`). The code is `{error: {code}}` where the service sent one, and an empty
 * string where the answer carried no shape of its own.
 */
export type Answer<T> =
  | { ok: true; value: T }
  | { ok: false; reason: Reason; says: string; code: string };

const ok = <T,>(value: T): Answer<T> => ({ ok: true, value });
const no = <T,>(reason: Reason, says: string, code = ''): Answer<T> => ({ ok: false, reason, says, code });

/** The service's own error shape: `{error: {code, message}}`, one machine word and one sentence.
 *  A refusal that carries the machine word ALONE — `{error: 'bodega_status_unknown'}` — is read the
 *  same way, so a path that answers in the short shape still reaches the screen that handles it. */
type Refusal = { error?: string | { code?: string; message?: string } };

/**
 * One request shape for every call above — a GET where there is no body, a POST where there is.
 *
 * THE AWAITING STATE IS THREE CASES READ AS ONE: the named 503 the module answers while
 * `WA_CLOUD_TOKEN` and `WA_CLOUD_PHONE_ID` are absent, a 404 where the service itself is still to
 * land, and a network answer of another shape — local development, where the page runs with no
 * `mock-api` behind it. All three mean the same thing to a shop standing at the first screen, and the
 * walk carries on, which is the rule the history's own 503 already follows (WIRING-SPEC.md §9).
 */
export async function bodegaApi<T>(
  path: string,
  body?: unknown,
  timeoutMs = 20000,
  method?: 'GET' | 'POST' | 'PUT',
): Promise<Answer<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  /* A FORM CARRIES ITS OWN CONTENT TYPE (the Yape QR photo, `PUT /yape`): setting one by hand
     would drop the multipart boundary the browser generates. */
  const form = typeof FormData !== 'undefined' && body instanceof FormData;
  try {
    const native = nativeWalk();
    if (native) {
      const response = await native.request(path, body, method);
      if (response.status >= 200 && response.status < 300 && response.data !== null) return ok(response.data as T);
      const refusal = (response.data ?? {}) as Refusal;
      const shape = typeof refusal.error === 'string' ? { code: refusal.error } : (refusal.error ?? {});
      return no('again', ('message' in shape ? shape.message : '') || AGAIN_SAYS, shape.code ?? 'bodega_mobile_request_failed');
    }
    const response = await fetch(`${BODEGA_API}${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body === undefined || form ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (response.ok && data !== null) return ok(data as T);
    const refusal = (data ?? {}) as Refusal;
    const shape = typeof refusal.error === 'string' ? { code: refusal.error } : (refusal.error ?? {});
    const code = shape.code ?? '';
    const says = ('message' in shape ? shape.message : '') ?? '';
    if (response.status === 503 || response.status === 404 || code === 'bodega_whatsapp_unconfigured' || data === null) {
      return no('awaiting', AWAITING_SAYS, code);
    }
    return no('again', says.slice(0, 200) || AGAIN_SAYS, code);
  } catch {
    return nativeWalk() ? no('again', AGAIN_SAYS, 'bodega_mobile_network') : no('awaiting', AWAITING_SAYS);
  } finally {
    window.clearTimeout(timer);
  }
}

/* ── the four session calls ───────────────────────────────────────────────────────────────────── */

export type Verified = { signedIn?: boolean; phone?: string; connection?: boolean };

/**
 * The WhatsApp connection, exchanged for this page's own session.
 *
 * The service reads the connection for the browser's OWN proof session, so the browser proves
 * nothing it did not authorise itself; the number comes back from the connection and the page keeps
 * it. It is asked once, the moment Meta's walk reports an account, and once more by the gate where a
 * browser arrives holding the connection alone.
 */
export async function openFromConnection(): Promise<Answer<Verified>> {
  const answer = await bodegaApi<Verified>('/session/connection', {});
  if (answer.ok && answer.value.phone) hold(answer.value.phone, 'connection');
  return answer;
}

/** Who this browser is signed in as, from the cookie and the service alone. */
export const readSession = (): Promise<Answer<Verified>> => bodegaApi<Verified>('/session');

/** The rig's own session and referral records, cleared — the server half of `Reset state`. */
export const resetRig = (): Promise<Answer<{ cleared?: boolean }>> =>
  bodegaApi<{ cleared?: boolean }>('/session/reset', {});

/** The invitations this shop sent, kept with its session, so a second phone shows the same record. */
export const recordReferrals = (invited: { name: string; phone: string }[]): Promise<Answer<{ invited?: unknown[] }>> =>
  bodegaApi<{ invited?: unknown[] }>('/referrals', { invited });

/** THE FIXED SET ROCOTO'S OWN NUMBER MAY SAY (`mock-api/app/bodega.py`, `Notice`). A page names a
 *  KIND and never a sentence, so a signed-in browser can put no words in Rocoto's mouth, and the
 *  destination is the session's own number, read by the service from the connection it was minted
 *  with. `waitlist` is the buddy's answer after the shop says hi: its place and its link. */
export type Notice = 'closing' | 'supplier-connected' | 'waitlist';

/**
 * Rocoto's own number, messaging the connected one. THE DESTINATION IS THE SESSION'S, read by the
 * service from the connection it was minted with, so this call names no number at all.
 */
export const notify = (kind: Notice, name = ''): Promise<Answer<{ wamid?: string }>> =>
  bodegaApi<{ wamid?: string }>('/notify', { kind, name });

/* ── who the page is signed in as ─────────────────────────────────────────────────────────────── */

const hold = (number: string, via: SignedVia): Stage =>
  signIn({ number, via, at: new Date().toISOString() }, SCOPE);

export const forget = (): Stage => signOut(SCOPE);

export type Standing = {
  /** the page holds a session */
  signed: boolean;
  /** the number it is signed in as, as the service or the connection reported it */
  number: string;
  via: SignedVia | null;
  /** the read has yet to land */
  checking: boolean;
};

const standingOf = (stage: Stage): Standing => (stage.signed
  ? { signed: true, number: stage.signed.number, via: stage.signed.via, checking: false }
  : { signed: false, number: '', via: null, checking: false });

/** The page's own record, read once, with no network behind it. */
export const stageRecord = (): Standing => standingOf(readStage(SCOPE));

/**
 * The session, as every gate reads it: the page's own record first, then the service's cookie, then
 * the connected account the source seam reports. A screen never learns which source answered — it
 * learns whether the page holds a session and which number it holds.
 */
export function useStanding(): Standing {
  const [standing, setStanding] = React.useState<Standing>(() => {
    const held = stageRecord();
    return held.signed ? held : { ...held, checking: true };
  });
  React.useEffect(() => {
    let live = true;
    const held = stageRecord();
    if (held.signed) { setStanding(held); return () => { live = false; }; }
    const settle = async () => {
      const session = await readSession();
      if (!live) return;
      if (session.ok && session.value.signedIn && session.value.phone) {
        hold(session.value.phone, 'connection');
        setStanding({ signed: true, number: session.value.phone, via: 'connection', checking: false });
        return;
      }
      /* THE CONNECTION ANSWERS FOR BOTH WORLDS (WIRING-SPEC.md §1, §9).
         On the rig the connection service binds its state to the browser's OWN session — a session
         is account-bound only after Meta verified that account and phone — so a connection this
         browser can see is proof this browser authorised it, and it is exchanged here for the rig's
         own cookie: `POST /session/connection` holds the number for thirty days, above a service
         binding of eight hours. Where that exchange has yet to answer the page still stands on the
         connection, which is the posture local development runs in: the bridge answers 503, the seam
         reads the bodega fixture, the screens read `Sample chats` and the walk carries on. */
      const source = await chatSource();
      const state = await source.connection();
      if (!live) return;
      const number = state.connection?.number ?? '';
      if (!number) { setStanding({ signed: false, number: '', via: null, checking: false }); return; }
      const minted = source.kind === 'proof' ? await openFromConnection() : null;
      if (!live) return;
      /* ON THE RIG THE SERVER'S ANSWER IS THE SIGN-IN: a refusal from `/session/connection` leaves the
         page signed out, because a desk opened over a session the service never minted answers 401
         under every act. The sample world has no service, so its seeded connection stands in. */
      const mine = minted?.ok && minted.value.phone ? minted.value.phone : (source.kind === 'proof' ? '' : number);
      if (!mine) { setStanding({ signed: false, number: '', via: null, checking: false }); return; }
      hold(mine, 'connection');
      setStanding({ signed: true, number: mine, via: 'connection', checking: false });
    };
    void settle().catch(() => { if (live) setStanding({ signed: false, number: '', via: null, checking: false }); });
    return () => { live = false; };
  }, []);
  return standing;
}

/** The account this page's messages are addressed to: the connection's own, read through the seam. */
export async function connectedAccount(): Promise<{ number: string; name: string }> {
  if (nativeWalk()) {
    const [session, business] = await Promise.all([readSession(), bodegaApi<{ name: string }>('/business')]);
    return { number: session.ok ? session.value.phone ?? '' : '', name: business.ok ? business.value.name : '' };
  }
  try {
    const source = await chatSource();
    const state = await source.connection();
    return { number: state.connection?.number ?? stageRecord().number, name: state.connection?.name ?? '' };
  } catch {
    return { number: stageRecord().number, name: '' };
  }
}

/** The distributor a link names, `?d=` — `Mayorista San Jorge invited you`. */
export function distributor(search: string = window.location.search): string {
  try {
    const value = new URLSearchParams(search).get('d') ?? '';
    return value === 'san-jorge' ? 'Mayorista San Jorge' : value.slice(0, 60);
  } catch {
    return '';
  }
}
