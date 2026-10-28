/* THE READ — the shop's chats, read into a book (WHATSAPP-HISTORY-SPEC.md §3 to §6).
 *
 * One interface in, one book out: conversations and message pages from the source seam
 * (`source/index.ts`, which answers for the live rig and for the sample world alike), and out of it
 * the counterparties with their roles, the meaning of each message, the likely list with its reason
 * lines, the suppliers the referral step proposes, and the counts screen 3 prints. The ranking is
 * `rank.ts`; the extraction of items and amounts from a message is the order brain's, server-side,
 * under a bounded budget — this file reads what words are there.
 *
 * ═══ THE STANDING RULE REACHES THE CANDIDATES, NOT ONLY THEIR ORDER ═════════════════════════════
 * While `RANK_RULE` reads `laughs` the field is every reading that HOLDS A LAUGH — screen 4 takes the
 * top eight of them, screen 5 lists every contact the read produced with the top five ticked — because
 * the rig runs on Peter's personal number, where a chat holds family rather than commerce. `rank.ts`
 * carries his words and both counts; the evidence rule's own field returns the moment that flag flips.
 *
 * ═══ WHAT A REAL ACCOUNT CHANGED (19 September 2026) ═════════════════════════════════════════════
 * Read against his own connected number — 129 chats, 2,265 messages over the 120 the read fetches —
 * four things in this file were wrong about the world: the kinds a provider actually writes
 * (`media_placeholder`, `edit`, `errors` beside `text`), the 68 chats that carry no contact name, the
 * 103 chats of 120 that hold no laugh at all, and a search that answered the middle of a name. Each
 * one is answered below, beside the count that found it.
 *
 * ═══ WHAT IS ASSERTED AND WHAT IS A CANDIDATE (§7) ══════════════════════════════════════════════
 * Asserted: the counts, the date range, a number, a name, a timestamp. Candidate: a meaning, a role,
 * a trade, a fiado note, an amount a message stated. A figure that reaches the record or a lender is
 * asserted, or it is a candidate the shop confirmed — so the confirmations live here too, in the
 * `rocoto-bodega-history-*` family, and a row before its confirmation reaches neither.
 *
 * ═══ AMOUNTS ═══════════════════════════════════════════════════════════════════════════════════
 * An amount appears where a message states one, as what the message said: `Said «te debo 12» on
 * 4 Sep`. The seeded corpus states quantities, days and names and carries a figure nowhere
 * (`fixtures/README.md`), so on the sample path this line is absent by construction — which is the
 * honest reading of that world rather than a figure invented for it.
 *
 * ═══ THE ROLE, AND ONE DEVIATION STATED ════════════════════════════════════════════════════════
 * The spec ranks goods direction first and the contact name third. A name that NAMES A TRADE —
 * «Distribuidora Aurora», «Marcos pollos», «Gran Mercado Mayorista» — is decisive here, ahead of
 * goods direction, because a shop writes orders to a supplier and reads orders from a customer in
 * the same words, and the trade word is the one piece of evidence a rotation of order texts cannot
 * blur. Goods direction decides every counterparty whose name says nothing, money direction after
 * it, rhythm last. Each role carries its evidence in words until the shop confirms it.
 *
 * The trade a name names is EVIDENCE; the trade a row PRINTS is a label, and it is a smaller set —
 * `tradeWord` keeps the word for the names that leave it unsaid, in the shop's own language.
 */
import type { Conversation, MessagePage, ProofMessage, ProofState } from '../../cedar/connections/types';
import { normalise } from '../referrals';
import { KEYS, scoped } from '../store/keys';
import {
  EVIDENCE_TOP_SUPPLIERS,
  LAUGHS_FLOOR,
  LAUGHS_RULE_LINE,
  LAUGHS_TICKED_ROWS,
  OWED_ROWS,
  RANK_RULE,
  laughsIn,
  namedFirst,
  rank,
  type Evidence,
  type RankRule,
} from './rank';

export { LAUGHS_FLOOR, LAUGHS_RULE_LINE, LAUGHS_TICKED_ROWS, OWED_ROWS, RANK_RULE };

/* ── the six meanings (§3) ────────────────────────────────────────────────────────────────────── */

export type Meaning = 'order-received' | 'order-placed' | 'receipt' | 'fiado-note' | 'price' | 'noise';

/** «te debo», «al cuaderno», «mañana te pago» — the shop's book asked for in words. */
const FIADO = /\b(fiado|fia|f[ií]a|f[ií]eme|cuaderno|an[óo]teme|ap[úu]nteme|me apunta|me anota|te debo|le debo|debo|pendiente|el lunes le pago|ma[ñn]ana le pago|ma[ñn]ana te pago|todito)\b/i;

/** A Yape, a Plin or a transfer voucher. */
const RECEIPT = /\b(yape|yap[eé]|yape[eé]|yapeo|yapee|plin|transfer[íi]|transferencia|dep[óo]sit[oé]|voucher|comprobante)\b/i;

/** A price asked for, or a list sent. */
const PRICE = /\b(precio|precios|cu[áa]nto est[áa]|cu[áa]nto cuesta|cotiza|lista de precios)\b/i;

/** An ask, in the words a bodega's customers use. */
const ASK = /\b(me manda|manda|mande|me guarda|gu[áa]rdame|necesito|quiero|t[íi]ene|tienes|pedido|para el men[úu]|me deja|d[éa]jame|para la obra|encargo|lo mismo de siempre)\b/i;

/** A quantity plus a unit is an order whatever verb carries it. */
const QUANTITY = /\b\d+\s*(kilos?|kg|cajas?|jabas?|sacos?|docenas?|unidades?|bolsas?|botellas?|litros?|paquetes?|bal[óo]n(?:es)?|francés|frances|planchas?)\b/i;

/** What the read calls each message. Direction decides which side of the goods it sits on. */
export function meaningOf(message: Pick<ProofMessage, 'direction' | 'text' | 'kind'>): Meaning {
  const text = message.text || '';
  const inbound = message.direction === 'inbound';
  if (RECEIPT.test(text)) return 'receipt';
  if (inbound && FIADO.test(text)) return 'fiado-note';
  if (PRICE.test(text)) return 'price';
  if (ASK.test(text) || QUANTITY.test(text)) return inbound ? 'order-received' : 'order-placed';
  if (!inbound && FIADO.test(text)) return 'fiado-note';
  return 'noise';
}

/* ── the kinds the service writes, and what the read does with each ───────────────────────────────
 *
 * `kind` IS THE PROVIDER'S OWN `type`, WRITTEN THROUGH AS IT ARRIVES. `upsert_message` in
 * `connections/proof/storage.py` reads `incoming["type"]` and takes the words out of `incoming[type]`
 * — `body`, `caption`, `filename` — so the set a real account produces is Meta's own, and the read
 * has to know it by name. Peter's own connected number, 2,265 messages over 120 chats, answered with
 * `text` · `media_placeholder` · `edit` · `errors` · `audio` · `location` · `contacts` ·
 * `unsupported` · `document` · `reaction` · `interactive` · `image` · `sticker`.
 *
 * SO THREE RULES STAND HERE, each one a defect that account found:
 *
 *   media      A picture arrives as a placeholder (WHATSAPP-HISTORY-SPEC.md §1) and carries no words
 *              at all, so a count that asked the words whether they read as a receipt counted 0 of
 *              224 pictures. Media counts as WHAT IT IS: a picture, or a voice note.
 *   errors     A row the provider could deliver nothing for carries neither words nor a kind to read.
 *              It is passed over entirely, so it swells no count.
 *   edit       A correction carries the corrected text of an earlier message under its own id. Counted
 *              beside that message it doubles the laugh or the order it corrects, so it lands ON the
 *              message it corrects and is a message nowhere.
 */

/** What arrives as a picture or a file, whichever type name the provider used for it. */
export const PICTURE_KINDS = new Set(['media_placeholder', 'image', 'video', 'sticker']);

/** What arrives as a voice note. */
export const VOICE_KINDS = new Set(['audio', 'voice', 'ptt']);

/** The kinds the read passes over: a row that holds a provider error rather than a message. */
export const IGNORED_KINDS = new Set(['errors']);

/** The kind that carries the corrected text of an earlier message. */
export const CORRECTION_KIND = 'edit';

/** A picture whose bytes stayed at Meta, which the read counts as a picture. */
export const stayedAsPicture = (message: Pick<ProofMessage, 'kind' | 'mediaAvailable'>): boolean =>
  PICTURE_KINDS.has(message.kind) && message.mediaAvailable === false;

/** A voice note whose bytes stayed at Meta, counted as a voice note. */
export const stayedAsVoiceNote = (message: Pick<ProofMessage, 'kind' | 'mediaAvailable'>): boolean =>
  VOICE_KINDS.has(message.kind) && message.mediaAvailable === false;

/**
 * THE MESSAGES THE READ COUNTS, out of the rows the service holds: oldest first, the error rows gone,
 * and each correction folded onto the message it corrects.
 *
 * WHICH MESSAGE A CORRECTION CORRECTS. The row carries the corrected words and its own id, and the
 * store keeps no pointer back to the original (`storage.py` writes `id`, `number`, `direction`,
 * `text`, `kind`, `timestamp`), so the read takes the newest earlier message from the SAME side of the
 * chat — which is the message that side had just written. A correction that finds no such message
 * stands as its own message, so its words are read once rather than lost.
 */
export function effectiveMessages(messages: ProofMessage[]): ProofMessage[] {
  const ordered = [...messages].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const out: ProofMessage[] = [];
  for (const message of ordered) {
    if (IGNORED_KINDS.has(message.kind)) continue;
    if (message.kind === CORRECTION_KIND) {
      const seat = out.map((row) => row.direction).lastIndexOf(message.direction);
      if (seat >= 0) {
        out[seat] = { ...out[seat], text: message.text || out[seat].text };
        continue;
      }
    }
    out.push(message);
  }
  return out;
}

/* ── the trade words a name may carry ─────────────────────────────────────────────────────────── */

const strip = (value: string): string => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** The words a value holds, folded: an accent costs nothing and a separator reads as a space. */
const wordsOf = (value: string): string[] => strip(value || '').split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Whole words, the way `painting-map.ts` keys its aliases: a substring alias rewrites its neighbours.
 *
 * ONE LANGUAGE, AND IT IS THE SHOP'S. The trade word is QUOTED from a Peru contact name — the spec
 * reads it out of `full_name` («distribuidora», «mayorista», «abarrotes») — so the word a row prints
 * is the word the shop itself writes. A map that sent `huevos` to `eggs` and `gaseosas` to
 * `beverages` printed a list half in Spanish and half in English under Spanish names, which reads as
 * a translation of the shop's own book. A variant maps to the canonical word its trade carries
 * (`avicola` → `pollos`), and a word that IS the trade maps to itself.
 */
const TRADES: Record<string, string> = {
  mayorista: 'mayorista',
  mercado: 'mercado',
  puesto: 'mercado',
  distribuidora: 'distribuidora',
  distribuidor: 'distribuidora',
  abarrotes: 'abarrotes',
  panaderia: 'panadería',
  panificadora: 'panadería',
  lacteos: 'lácteos',
  pollos: 'pollos',
  pollo: 'pollos',
  avicola: 'pollos',
  huevos: 'huevos',
  gaseosas: 'gaseosas',
  bebidas: 'bebidas',
  cerveceria: 'bebidas',
  limpieza: 'limpieza',
  gas: 'gas',
  embutidos: 'embutidos',
  frutas: 'frutas y verduras',
  verduras: 'frutas y verduras',
};

/** The trade a name names, or nothing where it names none. This is the ROLE's evidence (§3). */
export function tradeIn(name: string): string | null {
  for (const word of strip(name).split(/[^a-z0-9]+/)) {
    const trade = TRADES[word];
    if (trade) return trade;
  }
  return null;
}

/**
 * THE TRADE WORD A ROW PRINTS, which is a smaller thing than the trade a name names.
 *
 * «Distribuidora Aurora · distribuidora», «Gas Santa Rosa · gas», «Iván gaseosas · gaseosas» spend a
 * whole line saying the word already standing above it in bold. So the word prints where the name
 * leaves the trade UNSAID — «Elsa · puesto 214, Gran Mercado Mayorista» reads `mercado`, «Avícola San
 * Fernando» reads `pollos` — and stays silent where the name carries it. The role keeps reading
 * `tradeIn`, because a name that names its trade is evidence whether or not the screen repeats it.
 */
export function tradeWord(name: string, trade: string | null = tradeIn(name)): string | null {
  if (!trade) return null;
  const words = new Set(strip(name).split(/[^a-z0-9]+/));
  const said = strip(trade).split(/[^a-z0-9]+/).filter((word) => word.length > 1);
  return said.some((word) => words.has(word)) ? null : trade;
}

/* ── the words a figure and a day read as ─────────────────────────────────────────────────────── */

/** `once` · `twice` · `4 times`, so a reason line reads as a sentence. */
export const timesWord = (count: number): string => (count === 1 ? 'once' : count === 2 ? 'twice' : `${count} times`);

/** `today` · `yesterday` · `3 days ago`. */
export const dayWords = (days: number): string =>
  (days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`);

/** `1 laugh` · `31 laughs`, the figure the rig's own rule ranks on. */
export const laughWord = (count: number): string => (count === 1 ? '1 laugh' : `${count} laughs`);

const DAY = 86_400_000;

/** Lima's own clock, with no summer step, so a day is a day the shop recognises. */
export const PERU_ZONE = 'America/Lima';
const PERU_OFFSET = 5 * 3_600_000;

/** Which Lima day a moment belongs to. A date on its own is already one. */
const dayStart = (value: string): number => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Date.parse(`${value}T00:00:00Z`);
  const at = Date.parse(value);
  if (Number.isNaN(at)) return 0;
  const shifted = new Date(at - PERU_OFFSET);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
};

export const daysBetween = (from: string, to: string): number =>
  Math.max(0, Math.round((dayStart(to) - dayStart(from)) / DAY));

/** `22 March`, the form screen 3 prints after `since`. */
export const monthDay = (value: string | null): string => {
  if (!value || Number.isNaN(Date.parse(value))) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: PERU_ZONE }).format(new Date(value));
};

/** `4 Sep`, the form a quote's date takes — three letters, the way Cedar's own dates read. */
export const shortDay = (value: string | null): string => {
  if (!value || Number.isNaN(Date.parse(value))) return '';
  const at = new Date(value);
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: PERU_ZONE }).format(at);
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: PERU_ZONE }).format(at);
  return `${day} ${month.slice(0, 3)}`;
};

/** Peru writes the thousands separator as a comma (DESIGN-SPEC.md §6). */
export const grouped = (count: number): string => new Intl.NumberFormat('en-PE').format(count);

/* ── a contact the sync named, and a contact it left as digits ────────────────────────────────────
 *
 * THE COMMONEST ROW ON A REAL ACCOUNT HAS NO NAME. `storage.py`'s `conversations` names a chat
 * `name or data["number"]`, so a counterparty the contacts sync carried no `full_name` for arrives as
 * its own digits with no plus — 68 of the 129 chats on Peter's own number. Those rows were drawing
 * `34` in an initials disc under a heading of eleven digits, which is a row the shop cannot read, so
 * the reading carries the word for it (`named`) and the screens draw the number as a number.
 */

/** A name the contacts sync carried, rather than the digits the service falls back to. */
export const namedContact = (name: string): boolean => /\p{L}/u.test(name || '');

/** The country codes of one digit, and of two; everything else takes three (ITU E.164). */
const ONE_DIGIT_CODES = new Set(['1', '7']);
const TWO_DIGIT_CODES = new Set([
  '20', '27', '30', '31', '32', '33', '34', '36', '37', '38', '39',
  '40', '41', '43', '44', '45', '46', '47', '48', '49',
  '51', '52', '53', '54', '55', '56', '57', '58',
  '60', '61', '62', '63', '64', '65', '66',
  '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98',
]);

/** The country code standing in front of a number's digits. */
export function countryCode(digits: string): string {
  if (ONE_DIGIT_CODES.has(digits.slice(0, 1))) return digits.slice(0, 1);
  if (TWO_DIGIT_CODES.has(digits.slice(0, 2))) return digits.slice(0, 2);
  return digits.slice(0, 3);
}

/**
 * THE NUMBER AS A PERSON READS IT: a plus, the country code, then the rest in threes — `+34 612 345
 * 678`, `+51 987 000 111`, `+359 888 555 012`. A last group of one digit joins the group before it,
 * so a ten-digit subscriber number reads `+1 978 958 9459` rather than trailing a single digit.
 */
export function numberWords(number: string): string {
  const digits = (number || '').replace(/\D+/g, '');
  if (!digits) return '';
  const code = countryCode(digits);
  const rest = digits.slice(code.length);
  const groups: string[] = [];
  for (let at = 0; at < rest.length; at += 3) groups.push(rest.slice(at, at + 3));
  if (groups.length > 1 && groups[groups.length - 1].length === 1) {
    const tail = groups.pop() as string;
    groups[groups.length - 1] += tail;
  }
  return [`+${code}`, ...groups].join(' ').trim();
}

/** The words a row draws for its person: the contact's name, or its number written as a number. */
export const contactWords = (row: { name: string; number: string; named: boolean }): string =>
  (row.named ? row.name : numberWords(row.number || row.name) || row.name);

const AMOUNT = /(?:s\/\s?(\d+(?:[.,]\d{1,2})?))|(\d+(?:[.,]\d{1,2})?)\s*soles\b|\b(?:te debo|le debo|debo)\s+(\d+(?:[.,]\d{1,2})?)/i;

/** The amount a message states, with the words it stated it in. */
export function statedAmount(text: string): { quote: string; digits: string } | null {
  const hit = AMOUNT.exec(text || '');
  if (!hit) return null;
  const digits = hit[1] ?? hit[2] ?? hit[3] ?? '';
  return digits ? { quote: hit[0].trim(), digits } : null;
}

/* ── one conversation, read ───────────────────────────────────────────────────────────────────── */

export type Role = 'customer' | 'supplier' | 'both' | 'other';

export type ThreadReading = {
  id: string;
  name: string;
  number: string;
  /** whether the contacts sync named this counterparty; a row that reads `false` draws its number */
  named: boolean;
  role: Role;
  /** the role's evidence, in words */
  roleWhy: string;
  trade: string | null;
  messages: number;
  ordersIn: number;
  ordersOut: number;
  fiadoAsks: number;
  receiptsIn: number;
  receiptsOut: number;
  prices: number;
  /** pictures whose bytes stayed at Meta */
  pictures: number;
  /** voice notes whose bytes stayed at Meta */
  voiceNotes: number;
  laughs: number;
  ordersAwaitingPayment: number;
  lastOrderAt: string | null;
  lastOrderDaysAgo: number;
  /** days since the newest message of any kind, which is what a chat with no order still carries */
  lastMessageDaysAgo: number;
  oldestAt: string | null;
  newestAt: string | null;
  /** an amount the chat stated, with its own words and its day */
  said: { quote: string; at: string } | null;
};

/**
 * One chat, read. `referenceDay` is the current Peru day, which is what a relative word resolves
 * against and what `last order 3 days ago` counts from.
 */
export function readThread(
  conversation: Pick<Conversation, 'id' | 'name' | 'number' | 'count'>,
  messages: ProofMessage[],
  referenceDay: string,
): ThreadReading {
  const ordered = effectiveMessages(messages);
  let ordersIn = 0;
  let ordersOut = 0;
  let fiadoAsks = 0;
  let receiptsIn = 0;
  let receiptsOut = 0;
  let prices = 0;
  let pictures = 0;
  let voiceNotes = 0;
  let laughs = 0;
  let lastOrderAt: string | null = null;
  let said: { quote: string; at: string } | null = null;
  /* AN ORDER WITH THE PAYMENT MESSAGE MISSING AFTER IT. A receipt clears the oldest order still
     standing, the way a shop settles its book, so what is left at the end is what the chat shows as
     unpaid — evidence, never a total. */
  const awaiting: string[] = [];
  for (const message of ordered) {
    const meaning = meaningOf(message);
    laughs += laughsIn(message.text || '');
    /* MEDIA COUNTS AS WHAT IT IS. A placeholder carries no words, so asking its words whether they read
       as a receipt counted none of them; the picture and the voice note are each counted as themselves
       and the words beside them carry the amount (WHATSAPP-HISTORY-SPEC.md §1). */
    if (stayedAsPicture(message)) pictures += 1;
    else if (stayedAsVoiceNote(message)) voiceNotes += 1;
    if (meaning === 'order-received') {
      ordersIn += 1;
      lastOrderAt = message.timestamp;
      awaiting.push(message.id);
    } else if (meaning === 'order-placed') {
      ordersOut += 1;
      lastOrderAt = message.timestamp;
    } else if (meaning === 'receipt') {
      if (message.direction === 'inbound') { receiptsIn += 1; awaiting.shift(); } else receiptsOut += 1;
    } else if (meaning === 'fiado-note') {
      fiadoAsks += 1;
      const amount = statedAmount(message.text || '');
      if (amount && !said) said = { quote: amount.quote, at: message.timestamp };
    } else if (meaning === 'price') {
      prices += 1;
    }
  }
  const trade = tradeIn(conversation.name);
  const role = roleOf({ trade, ordersIn, ordersOut, receiptsIn, receiptsOut, fiadoAsks });
  const newestAt = ordered[ordered.length - 1]?.timestamp ?? null;
  /* A NAME AND A NUMBER FOR EVERY THREAD. The service names a chat by the contact's profile name or
     the saved name and falls back to the number itself (`connections/proof/storage.py`), and the
     number arrives as the conversation's own `wa_id` digits — so E.164 is written here, once. */
  const number = normalise(conversation.number || conversation.name);
  const name = conversation.name || number;
  return {
    id: conversation.id,
    name,
    number,
    named: namedContact(name),
    role: role.role,
    roleWhy: role.why,
    trade,
    messages: ordered.length || conversation.count,
    ordersIn,
    ordersOut,
    fiadoAsks,
    receiptsIn,
    receiptsOut,
    prices,
    pictures,
    voiceNotes,
    laughs,
    ordersAwaitingPayment: awaiting.length,
    lastOrderAt,
    lastOrderDaysAgo: lastOrderAt ? daysBetween(lastOrderAt, referenceDay) : Number.MAX_SAFE_INTEGER,
    lastMessageDaysAgo: newestAt ? daysBetween(newestAt, referenceDay) : Number.MAX_SAFE_INTEGER,
    oldestAt: ordered[0]?.timestamp ?? null,
    newestAt,
    said,
  };
}

/** The role, with the evidence it stands on. */
export function roleOf(input: {
  trade: string | null;
  ordersIn: number;
  ordersOut: number;
  receiptsIn: number;
  receiptsOut: number;
  fiadoAsks: number;
}): { role: Role; why: string } {
  if (input.trade) return { role: 'supplier', why: `Named a trade: ${input.trade}` };
  if (input.ordersOut > 0 && input.ordersIn > 0) {
    return input.ordersOut >= input.ordersIn * 2
      ? { role: 'supplier', why: 'Orders leave for them' }
      : { role: 'both', why: 'Orders travel both ways' };
  }
  if (input.ordersOut > 0) return { role: 'supplier', why: 'Orders leave for them' };
  if (input.ordersIn > 0) return { role: 'customer', why: `Orders arrive from them, ${timesWord(input.ordersIn)}` };
  if (input.fiadoAsks > 0 || input.receiptsIn > 0) return { role: 'customer', why: 'Payments arrive from them' };
  if (input.receiptsOut > 0) return { role: 'supplier', why: 'Payments leave for them' };
  return { role: 'other', why: 'A neighbour, on the words alone' };
}

/* ── the likely list (§4) ─────────────────────────────────────────────────────────────────────── */

export type LikelyRow = Evidence & {
  number: string;
  /** the reason in words, which every row carries */
  reason: string;
  /** days since the newest message, which is what the laughs reason reads */
  lastMessageDaysAgo: number;
  /** an amount the chat stated, as the message said it */
  said: { quote: string; at: string } | null;
};

/** `Asked to pay later 4 times · last order 3 days ago · 2 payments seen`. */
export const reasonLine = (row: Pick<LikelyRow, 'fiadoAsks' | 'lastOrderDaysAgo' | 'paymentsSeen'>): string => [
  `Asked to pay later ${timesWord(row.fiadoAsks)}`,
  `last order ${dayWords(row.lastOrderDaysAgo)}`,
  `${row.paymentsSeen} payments seen`,
].join(' · ');

/**
 * THE REASON THE SIGN-UP PRINTS — the payment evidence of that chat, and nothing else.
 *
 * ⚠ THE SIGN-UP NEVER SAYS «LAUGHS». Screen 8 of the walk is the screen a distributor is shown, and
 * `34 laughs in your chat` as the reason a business owes money is indefensible in front of one —
 * as is naming the engineering plan that replaces the rule. So this line states what the chat
 * actually holds about money: how often paying later was asked for, how recently they ordered or
 * wrote, and how many payments were seen. A fact the chat carries none of is left out rather than
 * printed as a zero, and the first fact it does carry opens the line.
 * (`LAUGHS_RULE_LINE` and `laughsReasonLine` stay with the Money surface, which owns the rule.)
 */
export const owedReasonLine = (
  row: Pick<LikelyRow, 'fiadoAsks' | 'lastOrderDaysAgo' | 'lastMessageDaysAgo' | 'paymentsSeen'>,
): string => {
  const facts = [
    ...(row.fiadoAsks > 0 ? [`asked to pay later ${timesWord(row.fiadoAsks)}`] : []),
    ...(row.lastOrderDaysAgo < 999
      ? [`last order ${dayWords(row.lastOrderDaysAgo)}`]
      : [`last message ${dayWords(row.lastMessageDaysAgo)}`]),
    ...(row.paymentsSeen > 0 ? [`${row.paymentsSeen} payments seen`] : []),
  ];
  return facts.map((fact, index) => (index === 0 ? fact.charAt(0).toUpperCase() + fact.slice(1) : fact)).join(' · ');
};

/**
 * `31 laughs in your chat · last message 2 days ago`, the reason a row carries while the laughs rule
 * stands — and where the evidence rule's own facts exist in that chat they follow on the same line,
 * so a family chat and a fiado chat both read as one sentence.
 */
export const laughsReasonLine = (
  row: Pick<LikelyRow, 'laughs' | 'lastMessageDaysAgo' | 'fiadoAsks' | 'paymentsSeen'>,
): string => [
  `${laughWord(row.laughs)} in your chat`,
  `last message ${dayWords(row.lastMessageDaysAgo)}`,
  ...(row.fiadoAsks > 0 ? [`asked to pay later ${timesWord(row.fiadoAsks)}`] : []),
  ...(row.paymentsSeen > 0 ? [`${row.paymentsSeen} payments seen`] : []),
].join(' · ');

/** `Said «te debo 12» on 4 Sep`. */
export const saidLine = (said: { quote: string; at: string }): string =>
  `Said «${said.quote}» on ${shortDay(said.at)}`;

/**
 * THE SENTENCE A SHORT SHORTLIST CARRIES, and the reason it exists: 103 of the 120 chats Peter's own
 * account handed the read hold no laugh at all. A rule that ranks on laughs therefore has as many rows
 * as there are chats holding one, and where that is fewer than `LAUGHS_FLOOR` the screen says so in one
 * sentence and the walk carries on (`rank.ts`).
 */
export const thinLaughsLine = (chats: number): string =>
  `${chats === 1 ? '1 chat holds' : `${chats} chats hold`} a laugh, so this list stays short.`;

/** A figure a chat carries no day for reads as a far day rather than as the sentinel itself. */
const daysOrFar = (days: number): number => (days === Number.MAX_SAFE_INTEGER ? 999 : days);

const likelyOf = (reading: ThreadReading, rule: RankRule): LikelyRow => {
  const row = {
    id: reading.id,
    name: reading.name,
    number: reading.number,
    named: reading.named,
    laughs: reading.laughs,
    fiadoAsks: reading.fiadoAsks,
    ordersAwaitingPayment: reading.ordersAwaitingPayment,
    lastOrderDaysAgo: daysOrFar(reading.lastOrderDaysAgo),
    lastMessageDaysAgo: daysOrFar(reading.lastMessageDaysAgo),
    paymentsSeen: reading.receiptsIn,
    orders: reading.ordersIn,
    said: reading.said,
  };
  return { ...row, reason: rule === 'laughs' ? laughsReasonLine(row) : reasonLine(row) };
};

/**
 * Who is LIKELY to owe, on the chat's own evidence, in the order the standing rule gives.
 *
 * THE LAUGHS RULE WIDENS THE FIELD TO EVERY CHAT THAT HOLDS A LAUGH, because a chat of family and
 * friends holds no fiado note and the rig runs on Peter's own number (`rank.ts`). The evidence rule
 * keeps the customers whose chats show fiado asked for or an order with the payment message missing
 * after it.
 *
 * AND THE LAUGH IS THE CANDIDATE'S OWN EVIDENCE, so a chat with none is no candidate: his account
 * holds 103 such chats out of 120, and rows reading `0 laughs in your chat` under a heading claiming
 * the people who most likely owe are the rule printing its own silence. The screen says how few there
 * are where they are few (`candidates`, `thinLaughsLine`).
 *
 * EITHER FIELD REACHES THE SCREEN THROUGH ONE CEILING, `OWED_ROWS`: the heading says the people who
 * most likely owe, which is a shortlist. A caller that wants the whole field asks for its own `rows`.
 */
export function likelyList(
  readings: ThreadReading[],
  options: { rule?: RankRule; rows?: number } = {},
): { rows: LikelyRow[]; rule: RankRule; candidates: number } {
  const rule = options.rule ?? RANK_RULE;
  const field = rule === 'laughs'
    ? readings.filter((reading) => reading.laughs > 0)
    : readings
      .filter((reading) => reading.role === 'customer' || reading.role === 'both')
      .filter((reading) => reading.fiadoAsks > 0 || reading.ordersAwaitingPayment > 0);
  const ranked = rank(field.map((reading) => likelyOf(reading, rule)), rule);
  const ceiling = options.rows ?? OWED_ROWS;
  return {
    rows: ceiling ? ranked.rows.slice(0, ceiling) : ranked.rows,
    rule: ranked.rule,
    candidates: field.length,
  };
}

/* ── the book (§6) ────────────────────────────────────────────────────────────────────────────── */

export type Book = {
  /** the service's own counts where it reports them, the read's own otherwise */
  messages: number;
  conversations: number;
  oldestAt: string | null;
  newestAt: string | null;
  customers: ThreadReading[];
  suppliers: ThreadReading[];
  others: ThreadReading[];
  /** pictures whose bytes stayed at Meta */
  pictures: number;
  /** voice notes whose bytes stayed at Meta */
  voiceNotes: number;
  likely: LikelyRow[];
  rule: RankRule;
  /** the chats the standing rule found to rank, which is what screen 4's own sentence reads */
  candidates: number;
};

export function bookOf(readings: ThreadReading[], state: ProofState | null, options: { rule?: RankRule } = {}): Book {
  const customers = readings.filter((reading) => reading.role === 'customer' || reading.role === 'both');
  const suppliers = readings.filter((reading) => reading.role === 'supplier');
  const others = readings.filter((reading) => reading.role === 'other');
  const list = likelyList(readings, options);
  const read = readings.reduce((total, reading) => total + reading.messages, 0);
  const days = readings.map((reading) => reading.oldestAt).filter(Boolean) as string[];
  const newest = readings.map((reading) => reading.newestAt).filter(Boolean) as string[];
  return {
    messages: state?.history.messages ?? read,
    conversations: state?.history.conversations ?? readings.length,
    oldestAt: state?.history.oldestAt ?? (days.sort()[0] ?? null),
    newestAt: state?.history.newestAt ?? (newest.sort().reverse()[0] ?? null),
    customers,
    suppliers,
    others,
    pictures: readings.reduce((total, reading) => total + reading.pictures, 0),
    voiceNotes: readings.reduce((total, reading) => total + reading.voiceNotes, 0),
    likely: list.rows,
    rule: list.rule,
    candidates: list.candidates,
  };
}

/** `Bought 6 times`, the reason a supplier row carries on the referral screen. */
export const boughtLine = (reading: Pick<ThreadReading, 'ordersOut'>): string =>
  `Bought ${timesWord(reading.ordersOut)}`;

/** A–Z in the reader's own collation, which is how «Lácteos» comes to stand before «Limpieza». */
const byName = (a: Pick<ThreadReading, 'name'>, b: Pick<ThreadReading, 'name'>): number =>
  a.name.localeCompare(b.name);

/**
 * THE ORDER EVERY ALPHABETICAL LIST STANDS IN: the named contacts A–Z, then the numbers the contacts
 * sync left unnamed, newest activity first.
 *
 * Alphabetical over digits sorted 65 numbers to the TOP of the list on Peter's own account — `1` before
 * `A` in every collation — so the first page of the suppliers step was eleven-digit strings and the
 * people he was looking for sat under them. A name reads alphabetically; a number reads by when that
 * chat last spoke, which is the only thing about it the shop can recognise.
 */
export const byContact = (
  a: Pick<ThreadReading, 'name' | 'named' | 'lastMessageDaysAgo'>,
  b: Pick<ThreadReading, 'name' | 'named' | 'lastMessageDaysAgo'>,
): number => namedFirst(a, b)
  || (a.named ? byName(a, b) : a.lastMessageDaysAgo - b.lastMessageDaysAgo || byName(a, b));

/* ── the referral list (ONBOARDING-SPEC.md screen 5) ──────────────────────────────────────────── */

export type ReferralRow = {
  id: string;
  name: string;
  /** E.164, as the read wrote it */
  number: string;
  /** whether the contacts sync named this row; a row that reads `false` draws its number */
  named: boolean;
  /** the trade word, in the shop's own language and only where the name leaves it unsaid */
  trade: string | null;
  /** the reason in words, which every row carries */
  reason: string;
  /** whether the list proposes this row, which is what it arrives ticked on */
  ticked: boolean;
  laughs: number;
  ordersOut: number;
};

/** `last message 2 days ago`, and silence for a row whose chat carries no day at all. */
const recencyWords = (days: number): string =>
  (daysOrFar(days) >= 999 ? '' : `last message ${dayWords(daysOrFar(days))}`);

/**
 * A ROW READS THE EVIDENCE IT HAS. Under the laughs rule a chat holding laughs reads them; a chat
 * holding none reads when it last spoke instead, because `0 laughs in your chat` was the reason line on
 * 103 of the 120 rows of Peter's own account — a sentence that spends a row telling the shop what the
 * chat lacks.
 */
const referralRowOf = (reading: ThreadReading, ticked: boolean, rule: RankRule): ReferralRow => ({
  id: reading.id,
  name: reading.name,
  number: reading.number,
  named: reading.named,
  trade: tradeWord(reading.name, reading.trade),
  reason: rule === 'laughs'
    ? [
      reading.laughs > 0 ? `${laughWord(reading.laughs)} in your chat` : recencyWords(reading.lastMessageDaysAgo),
      reading.ordersOut > 0 ? boughtLine(reading) : '',
    ].filter(Boolean).join(' · ')
    : boughtLine(reading),
  ticked,
  laughs: reading.laughs,
  ordersOut: reading.ordersOut,
});

/**
 * The rows screen 5 draws, in the order it draws them.
 *
 * THE LAUGHS RULE LISTS EVERY CONTACT THE READ PRODUCED: the top `LAUGHS_TICKED_ROWS` by laughs
 * first and ticked, then all the rest unticked in `byContact`'s order — the named contacts A–Z, then
 * the numbers newest activity first — so Peter unticks the five, ticks his mother and the message
 * reaches her alone. The evidence rule keeps the suppliers, the ones the chats hold the most purchases
 * from first, every row ticked.
 */
export function referralRows(readings: ThreadReading[], options: { rule?: RankRule } = {}): ReferralRow[] {
  const rule = options.rule ?? RANK_RULE;
  if (rule === 'laughs') {
    const byLaughs = [...readings].sort((a, b) => b.laughs - a.laughs || namedFirst(a, b) || byName(a, b));
    return [
      ...byLaughs.slice(0, LAUGHS_TICKED_ROWS).map((reading) => referralRowOf(reading, true, rule)),
      ...byLaughs.slice(LAUGHS_TICKED_ROWS).sort(byContact).map((reading) => referralRowOf(reading, false, rule)),
    ];
  }
  const byPurchases = readings
    .filter((reading) => reading.role === 'supplier')
    .sort((a, b) => b.ordersOut - a.ordersOut || byName(a, b));
  return [
    ...byPurchases.slice(0, EVIDENCE_TOP_SUPPLIERS),
    ...byPurchases.slice(EVIDENCE_TOP_SUPPLIERS).sort(byContact),
  ].map((reading) => referralRowOf(reading, true, rule));
}

/**
 * THE SEARCH, as the shop types: a name's WORDS from their start, folded so an accent costs nothing,
 * and the number, whose digits match whether the shop typed the `+`, the spaces or the dashes.
 *
 * FROM THE START, BECAUSE THE MIDDLE OF A NAME IS A COINCIDENCE. `mam` typed over Peter's own contacts
 * returned his mother AND a name that merely holds those three letters in its middle, which is a list
 * he has to read to find the row he already named. Every word of a name is a start — «Elsa Mamani»
 * answers `mam` — and each word the shop types has to find one, so `mama g` narrows rather than widens.
 */
export function matchesQuery(row: Pick<ReferralRow, 'name' | 'number'>, query: string): boolean {
  const needle = query.trim();
  if (!needle) return true;
  const digits = needle.replace(/\D+/g, '');
  if (digits.length > 0 && row.number.replace(/\D+/g, '').includes(digits)) return true;
  const typed = wordsOf(needle);
  const held = wordsOf(row.name);
  return typed.length > 0 && typed.every((part) => held.some((word) => word.startsWith(part)));
}

/* ── the run, page by page ────────────────────────────────────────────────────────────────────── */

/** The source seam, as this file needs it: one interface for the live rig and the sample world. */
export type ReadSource = {
  conversations(signal?: AbortSignal): Promise<Conversation[]>;
  messages(id: string, before?: string): Promise<MessagePage>;
  connection(signal?: AbortSignal): Promise<ProofState>;
};

/** The browser reads the newest chats, oldest chats left behind, so a phone holds a bounded read. */
export const THREAD_CEILING = 120;

/**
 * THE BUDGET PER CHAT, STATED: three pages, and the bridge caps a page at 100 messages, so the read
 * takes at most 300 messages from each chat and at most 120 chats — 360 requests and 36,000 messages
 * in the worst case. A personal history of years finishes in a minute this way rather than in an hour,
 * and the screens draw what has landed after every chat, so the wait is watched rather than blank.
 */
export const PAGES_PER_THREAD = 3;

/**
 * One chat, up to the budget: the newest page first, then older pages through the service's cursor.
 * An older page that fails leaves the pages already read STANDING — a cursor the service declines is
 * a shorter read of that chat rather than a chat that reads as empty — and a message seen twice across
 * two pages is counted once, so a laugh is a laugh.
 */
async function pagesOf(source: ReadSource, id: string, signal?: AbortSignal): Promise<ProofMessage[]> {
  const first = await source.messages(id);
  const seen = new Set<string>();
  const out: ProofMessage[] = [];
  const take = (page: ProofMessage[]): void => {
    for (const message of page) if (!seen.has(message.id)) { seen.add(message.id); out.push(message); }
  };
  take(first.messages);
  let before = first.nextCursor ?? '';
  for (let page = 1; page < PAGES_PER_THREAD && before; page += 1) {
    if (signal?.aborted) break;
    try {
      const answer = await source.messages(id, before);
      take(answer.messages);
      before = answer.nextCursor ?? '';
    } catch {
      break;
    }
  }
  return out;
}

export type ReadStanding = {
  state: ProofState | null;
  threadsTotal: number;
  threadsRead: number;
  readings: ThreadReading[];
  book: Book;
  done: boolean;
  error: string;
};

/**
 * The read, as screen 3 watches it: the state first, then one page per chat, the book rebuilt after
 * each one, so each row is a skeleton until its own count lands.
 */
export async function runRead(
  source: ReadSource,
  options: { referenceDay: string; onStanding?: (standing: ReadStanding) => void; signal?: AbortSignal },
): Promise<ReadStanding> {
  const readings: ThreadReading[] = [];
  let state: ProofState | null = null;
  let threadsTotal = 0;
  const publish = (done: boolean, error = ''): ReadStanding => {
    const standing: ReadStanding = {
      state,
      threadsTotal,
      threadsRead: readings.length,
      readings: [...readings],
      book: bookOf(readings, state),
      done,
      error,
    };
    options.onStanding?.(standing);
    return standing;
  };
  try {
    state = await source.connection(options.signal);
    publish(false);
  } catch {
    /* the state read is the service's own figure; the read stands on its own counts where it fails */
  }
  let conversations: Conversation[] = [];
  try {
    conversations = await source.conversations(options.signal);
  } catch (caught) {
    return publish(true, caught instanceof Error ? caught.message : 'The chats need another read.');
  }
  threadsTotal = Math.min(conversations.length, THREAD_CEILING);
  publish(false);
  for (const conversation of conversations.slice(0, THREAD_CEILING)) {
    if (options.signal?.aborted) return publish(true);
    try {
      const messages = await pagesOf(source, conversation.id, options.signal);
      readings.push(readThread(conversation, messages, options.referenceDay));
    } catch {
      readings.push(readThread(conversation, [], options.referenceDay));
    }
    publish(false);
  }
  return publish(true);
}

/* ── one read a session, and the reading it leaves behind ─────────────────────────────────────── */

/** The finished read, held in memory so screens 3, 4 and 5 stand on ONE read of the chats. */
let held: { referenceDay: string; standing: ReadStanding } | null = null;

/** The read in flight, so a screen the shop continued to early joins the run rather than starting a
 *  second one: `Continue` is live the moment the suppliers row exists, and the read carries on. */
let running: { referenceDay: string; run: Promise<ReadStanding> } | null = null;

/** The reading, kept under the `rocoto-bodega-history-*` family, so a reload costs no pages. */
const readingKey = (scope: string): string => scoped(`${KEYS.history}reading:`, scope);

/** A reading written before `named` and the media counts existed reads as absent, so the screens stand
 *  on a reading that carries every field their rows print — the version moved for `lastMessageDaysAgo`
 *  and the E.164 number, and again for `named`, `pictures` as pictures and `voiceNotes`. */
export const READING_VERSION = 3;

export function storeReading(scope: string, readings: ThreadReading[]): void {
  try {
    window.localStorage.setItem(readingKey(scope), JSON.stringify({ version: READING_VERSION, readings }));
  } catch { /* a browser where storage throws re-reads the pages instead */ }
}

export function loadReading(scope: string): ThreadReading[] {
  try {
    const raw = window.localStorage.getItem(readingKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: number; readings?: ThreadReading[] };
    if (parsed.version !== READING_VERSION) return [];
    return Array.isArray(parsed.readings) ? parsed.readings : [];
  } catch {
    return [];
  }
}

/**
 * The read, once. Screen 3 watches it arrive; screens 4 and 5 read what it left, from memory where this
 * session already ran it and from the stored reading where a reload lost it.
 */
export async function readOnce(
  source: ReadSource,
  options: { referenceDay: string; scope: string; onStanding?: (standing: ReadStanding) => void },
): Promise<ReadStanding> {
  if (held && held.referenceDay === options.referenceDay) {
    options.onStanding?.(held.standing);
    return held.standing;
  }
  if (running && running.referenceDay === options.referenceDay) return running.run;
  const run = runRead(source, { referenceDay: options.referenceDay, onStanding: options.onStanding })
    .then((standing) => {
      held = { referenceDay: options.referenceDay, standing };
      running = null;
      if (standing.readings.length > 0) storeReading(options.scope, standing.readings);
      return standing;
    })
    .catch((caught) => { running = null; throw caught; });
  running = { referenceDay: options.referenceDay, run };
  return run;
}

/** What this session already read, or the stored reading, or nothing at all. */
export function readingNow(scope: string): ThreadReading[] {
  if (held) return held.standing.readings;
  return loadReading(scope);
}

/** `Reset state` drops the held read with the keys. */
export function forgetRead(): void {
  held = null;
  running = null;
}

/* ── the shop's confirmations (§4, §7) ────────────────────────────────────────────────────────── */

export type Confirmation = { id: string; state: 'confirmed' | 'corrected'; amount: string; at: string };

const confirmationsKey = (scope: string): string => scoped(`${KEYS.history}confirmations:`, scope);

export function readConfirmations(scope: string): Record<string, Confirmation> {
  try {
    const raw = window.localStorage.getItem(confirmationsKey(scope));
    if (!raw) return {};
    const held = JSON.parse(raw) as Record<string, Confirmation>;
    return typeof held === 'object' && held !== null ? held : {};
  } catch {
    return {};
  }
}

export function recordConfirmation(scope: string, entry: Confirmation): Record<string, Confirmation> {
  const held = { ...readConfirmations(scope), [entry.id]: entry };
  try {
    window.localStorage.setItem(confirmationsKey(scope), JSON.stringify(held));
  } catch { /* a browser where storage throws keeps this session's confirmations in memory */ }
  return held;
}

/** The word a row carries: `likely` until the shop presses, then its own. */
export const rowWord = (confirmation: Confirmation | undefined): string =>
  (confirmation?.state === 'confirmed' ? 'confirmed' : confirmation?.state === 'corrected' ? 'corrected' : 'likely');

/* ── Meta's own envelope, projected (§8) ──────────────────────────────────────────────────────── */

type EnvelopeMessage = {
  id: string;
  from?: string;
  to?: string;
  timestamp?: string | number;
  type?: string;
  text?: { body?: string };
  image?: { caption?: string };
  document?: { filename?: string };
};

type EnvelopeThread = { id?: string; context?: { user_id?: string }; messages?: EnvelopeMessage[] };

type EnvelopeChange = {
  field?: string;
  value?: {
    metadata?: { display_phone_number?: string; phone_number_id?: string };
    state_sync?: { type?: string; contact?: { user_id?: string; phone_number?: string; full_name?: string; first_name?: string } }[];
    history?: { metadata?: { progress?: number }; errors?: { code?: number }[]; threads?: EnvelopeThread[] }[];
    messages?: EnvelopeMessage[];
    errors?: { code?: number }[];
  };
};

export type HistoryEnvelope = { object?: string; entry?: { id?: string; changes?: EnvelopeChange[] }[] };

export type ProjectedHistory = {
  status: ProofState['history']['status'];
  progress: number;
  conversations: Conversation[];
  messages: Record<string, ProofMessage[]>;
  /** threads whose `context.user_id` found no contact event, which is what parks a read */
  identityWaits: number;
};

const digitsOf = (value: string | undefined | null): string => (value ? value.replace(/\D+/g, '') : '');

/**
 * Meta's envelope, replayed the way the service replays it: the contacts sync names each thread's
 * counterparty by opaque identity, the history chunks carry the messages, `metadata.progress` gives
 * the status, error `2593109` gives `declined`, and a thread whose identity is still to arrive parks
 * and gives `interrupted` with the saved messages standing.
 */
export function projectHistory(envelope: HistoryEnvelope, houseNumber: string): ProjectedHistory {
  const contacts = new Map<string, { number: string; name: string }>();
  const changes: EnvelopeChange[] = [];
  for (const entry of envelope.entry ?? []) for (const change of entry.changes ?? []) changes.push(change);
  for (const change of changes) {
    if (change.field !== 'smb_app_state_sync') continue;
    for (const item of change.value?.state_sync ?? []) {
      if (item.type !== 'contact' || !item.contact?.user_id) continue;
      contacts.set(item.contact.user_id, {
        number: item.contact.phone_number ?? '',
        name: item.contact.full_name ?? item.contact.first_name ?? '',
      });
    }
  }
  const house = digitsOf(houseNumber);
  const messages = new Map<string, ProofMessage[]>();
  const names = new Map<string, string>();
  let progress = 0;
  let declined = false;
  let interrupted = false;
  let identityWaits = 0;
  const take = (thread: EnvelopeThread, message: EnvelopeMessage): void => {
    const identity = thread.context?.user_id ?? '';
    const contact = identity ? contacts.get(identity) : undefined;
    const number = contact?.number ?? thread.id ?? '';
    if (!number) { identityWaits += 1; return; }
    const kind = message.type ?? 'text';
    const body = message.text?.body ?? message.image?.caption ?? message.document?.filename ?? '';
    const at = Number(message.timestamp ?? 0) * 1000;
    const row: ProofMessage = {
      id: message.id,
      direction: digitsOf(message.from) === house ? 'outbound' : 'inbound',
      text: body,
      kind: kind === 'text' ? 'text' : kind,
      timestamp: new Date(at).toISOString(),
      historical: true,
      mediaAvailable: false,
    };
    const key = digitsOf(number);
    names.set(key, contact?.name ?? '');
    const held = messages.get(key) ?? [];
    if (!held.some((seen) => seen.id === row.id)) held.push(row);
    messages.set(key, held);
  };
  for (const change of changes) {
    if (change.field !== 'history') continue;
    for (const error of change.value?.errors ?? []) {
      if (error.code === 2593109) declined = true; else interrupted = true;
    }
    for (const chunk of change.value?.history ?? []) {
      for (const error of chunk.errors ?? []) {
        if (error.code === 2593109) declined = true; else interrupted = true;
      }
      progress = Math.max(progress, Math.min(100, Number(chunk.metadata?.progress ?? 0)));
      for (const thread of chunk.threads ?? []) for (const message of thread.messages ?? []) take(thread, message);
    }
  }
  const conversations: Conversation[] = [...messages.entries()].map(([key, rows]) => {
    const ordered = [...rows].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const last = ordered[ordered.length - 1];
    return {
      id: key,
      name: names.get(key) || key,
      number: key.startsWith('+') ? key : `+${key}`,
      lastMessage: last?.text ?? '',
      lastAt: last?.timestamp ?? '',
      count: ordered.length,
    };
  }).sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt) || a.name.localeCompare(b.name));
  const status: ProofState['history']['status'] = declined ? 'declined'
    : interrupted || identityWaits > 0 ? 'interrupted'
      : progress >= 100 ? 'complete' : 'syncing';
  const pages: Record<string, ProofMessage[]> = {};
  for (const [key, rows] of messages) {
    pages[key] = [...rows].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }
  return { status, progress, conversations, messages: pages, identityWaits };
}
