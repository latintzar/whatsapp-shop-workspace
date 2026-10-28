/* THE REFERRAL RECORD — invitations, their tokens, their four states (WIRING-SPEC.md §5).
 *
 * The critical path ends on a sent message, so this file holds what was sent, to whom, on which
 * token, and how far each invitation got. It is pure arithmetic over a stored book plus one browser
 * store keyed `rocoto-bodega-invites-v1:<scope>`; the `wa.me` hand-off is the ONE send path today —
 * Rocoto composes the words, the shop presses send in its own WhatsApp — because sending from the
 * shop's own number waits on Advanced Access and a template approved on that shop's WABA
 * (WIRING-SPEC.md §5, the two conditions it owns).
 *
 * THE FOUR STATES, AND THE ACT THAT MOVES EACH:
 *
 *   ready      Rocoto proposed the supplier and the row arrived ticked          `Ready`
 *   sent       the shop pressed send on that row and its own WhatsApp opened    `Sent`
 *   invited    the shop confirmed with `I sent them`                            `Invited`
 *   connected  that supplier's WhatsApp connected — token first, number second  `Connected`
 *
 * `sending` belongs to the referral screen alone: it is the transient while a hand-off is open, so
 * it lives on the screen and this record keeps the four states above.
 *
 * NUMBERS ARE STORED IN E.164, because the match runs on a normalised number where no invitation
 * token came back with the connection. Nine digits mean Peru, and a number that arrived with its own
 * country code keeps it — the rig's own run invites `+359 888 555 012`.
 */
import { KEYS, scoped } from './store/keys';

export type InviteState = 'ready' | 'sent' | 'invited' | 'connected';

/** The word each state prints, the one set every surface reads (WIRING-SPEC.md §5). */
export const INVITE_WORD: Record<InviteState, string> = {
  ready: 'Ready',
  sent: 'Sent',
  invited: 'Invited',
  connected: 'Connected',
};

export type SupplierInvite = {
  id: string;
  scope: string;
  supplierId: string;
  name: string;
  /** E.164, as `normalise` writes it */
  phone: string;
  token: string;
  state: InviteState;
  /** when this row last moved */
  at: string;
};

export type InviteBook = { version: 1; scope: string; rows: SupplierInvite[] };

/* ── the number ───────────────────────────────────────────────────────────────────────────────── */

/**
 * E.164, one rule: digits only, `51` implied for a nine-digit mobile, stored `+51#########`.
 * A number that arrives with its own country code keeps it, so a supplier outside Peru is invitable
 * and the rig's own run reaches `+359 888 555 012`.
 */
export function normalise(input: string): string {
  const digits = input.replace(/\D+/g, '');
  if (digits.length === 0) return '';
  const explicit = input.trim().startsWith('+') || input.trim().startsWith('00');
  if (explicit) return `+${digits.replace(/^00/, '')}`;
  if (digits.length === 9) return `+51${digits}`;
  if (digits.length === 11 && digits.startsWith('51')) return `+${digits}`;
  return `+${digits}`;
}

/** Two numbers are the same supplier where their E.164 forms agree. */
export const sameNumber = (a: string, b: string): boolean => normalise(a) === normalise(b) && normalise(a) !== '';

/** The digits `wa.me` takes, which is E.164 with the plus dropped. */
export const waDigits = (phone: string): string => normalise(phone).replace(/^\+/, '');

/* ── the name a face reads ────────────────────────────────────────────────────────────────────── */

/**
 * THE DISC TAKES THE PERSON, AND THE PUNCTUATION STAYS IN THE ROW. Base's `Avatar` splits a name on
 * spaces and draws the first letter of the first two words, so a contact written with a separator in
 * the second seat — «Elsa · puesto 214, Gran Mercado Mayorista» — drew `E·`, a separator read as an
 * initial, beside the neat `DA` and `GS` discs. The separators a contact name carries (· • – —) come
 * out before the initials are taken, so that row reads `EP`, while the row's own words keep the name
 * exactly as the shop's contacts wrote it.
 */
export const faceName = (name: string): string => {
  const words = name.replace(/[·•–—]/g, ' ').replace(/\s+/g, ' ').trim();
  return words || name;
};

/* ── the message, and the hand-off ────────────────────────────────────────────────────────────── */

/**
 * The invitation, MESSAGES.md row 5's own body. The two link sentences are cleared; the queue clause
 * ships with the dated queue-policy file, so it stands beside this body rather than inside it.
 */
export const inviteBody = (token: string): string =>
  `Estoy usando Rocoto para llevar mis compras y mis pagos. Conecta tu WhatsApp acá: soyrocoto.com/connect?i=${token}`;

/** The hand-off: the shop's own WhatsApp, opened on that supplier's chat with the message ready. */
export const waHandoff = (phone: string, body: string): string =>
  `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(body)}`;

/* ── the tokens ───────────────────────────────────────────────────────────────────────────────── */

/** An opaque invitation token: what the connect link carries, and what the match reads first. */
export function mintToken(random: () => number = Math.random): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) out += alphabet[Math.floor(random() * alphabet.length) % alphabet.length];
  return out;
}

/* ── the book ─────────────────────────────────────────────────────────────────────────────────── */

export const emptyBook = (scope: string): InviteBook => ({ version: 1, scope, rows: [] });

/** A proposal becomes a row the moment the shop presses send, so a book holds claims alone. */
export function propose(
  book: InviteBook,
  supplier: { id: string; name: string; phone: string },
  now: string,
  token = mintToken(),
): { book: InviteBook; row: SupplierInvite } {
  const standing = book.rows.find((row) => row.supplierId === supplier.id
    || sameNumber(row.phone, supplier.phone));
  if (standing) return { book, row: standing };
  const row: SupplierInvite = {
    id: `${supplier.id}-${token}`,
    scope: book.scope,
    supplierId: supplier.id,
    name: supplier.name,
    phone: normalise(supplier.phone),
    token,
    state: 'ready',
    at: now,
  };
  return { book: { ...book, rows: [...book.rows, row] }, row };
}

const RANK: Record<InviteState, number> = { ready: 0, sent: 1, invited: 2, connected: 3 };

/** A row moves forward alone: a later confirmation over an earlier one keeps the later state. */
export function move(book: InviteBook, id: string, state: InviteState, now: string): InviteBook {
  return {
    ...book,
    rows: book.rows.map((row) => (row.id === id && RANK[state] > RANK[row.state]
      ? { ...row, state, at: now } : row)),
  };
}

/** `I sent them`: every row the shop pressed becomes a claim Rocoto watches. */
export function confirmSent(book: InviteBook, now: string): InviteBook {
  return { ...book, rows: book.rows.map((row) => (row.state === 'sent' ? { ...row, state: 'invited', at: now } : row)) };
}

/**
 * The connection comes back: the invitation token decides first, the normalised number second.
 * A supplier that connected with no invitation leaves every row where it stands — it joined as its
 * own shop.
 */
export function connected(book: InviteBook, claim: { token?: string; phone?: string }, now: string): InviteBook {
  const byToken = claim.token ? book.rows.find((row) => row.token === claim.token) : undefined;
  const byNumber = !byToken && claim.phone
    ? book.rows.find((row) => sameNumber(row.phone, claim.phone as string))
    : undefined;
  const hit = byToken ?? byNumber;
  return hit ? move(book, hit.id, 'connected', now) : book;
}

export const sentRows = (book: InviteBook): SupplierInvite[] =>
  book.rows.filter((row) => RANK[row.state] >= RANK.sent);

export const invitedRows = (book: InviteBook): SupplierInvite[] =>
  book.rows.filter((row) => RANK[row.state] >= RANK.invited);

export const connectedRows = (book: InviteBook): SupplierInvite[] =>
  book.rows.filter((row) => row.state === 'connected');

/** Screen 6's two figures, this session's own: `9 invitations sent · 2 connected`. */
export const tally = (book: InviteBook): { sent: number; connected: number } => ({
  sent: sentRows(book).length,
  connected: connectedRows(book).length,
});

/* ── the store ────────────────────────────────────────────────────────────────────────────────── */

export function readBook(scope: string): InviteBook {
  try {
    const raw = window.localStorage.getItem(scoped(KEYS.invites, scope));
    if (!raw) return emptyBook(scope);
    const held = JSON.parse(raw) as Partial<InviteBook>;
    const rows = Array.isArray(held.rows) ? held.rows.filter((row): row is SupplierInvite =>
      Boolean(row && typeof row.id === 'string' && typeof row.phone === 'string' && row.state in RANK)) : [];
    return { version: 1, scope, rows };
  } catch {
    return emptyBook(scope);
  }
}

export function writeBook(book: InviteBook): InviteBook {
  try {
    window.localStorage.setItem(scoped(KEYS.invites, book.scope), JSON.stringify(book));
  } catch { /* a browser where storage throws keeps this session's book in memory */ }
  return book;
}
