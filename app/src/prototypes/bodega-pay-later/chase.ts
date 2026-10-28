/* THE FIADO REMINDER AND ITS TIMER — Cedar's `chase.ts`, COPIED, its key renamed, ITS FEE GONE.
 *
 * THREE EDITS (DESIGN-SPEC.md §3 card 3, MESSAGES.md row 14, WIRING-SPEC.md §11):
 *
 *   1  THE KEY IS RENAMED, `rocoto-cedar-chase-v1:` → `rocoto-bodega-chase-v1:`. This module owns a
 *      record, one origin serves both prototypes, so a shared key would mean one book editing the
 *      other's (WIRING-SPEC.md §11).
 *   2  CEDAR'S FEE RUNG IS DROPPED. «The fiado reminder states the sale, the amount and the date,
 *      and it carries a fee nowhere» — so `CHASE_FEE_BASIS_POINTS`, `CHASE_FEE_DAYS`,
 *      `chaseFeeMinor` and `chaseFeeDate` left with it, and the three rungs say the same true thing
 *      in the same register. A fee is a charge to a customer, and a charge is a term of an
 *      agreement nobody has made with her customers.
 *   3  A RECORD BELONGS TO A CUSTOMER, rather than to an invoice: fiscal is off, so there is no
 *      invoice to key a ladder to. The fiado row is the thing chased, and the row belongs to the
 *      person who owes it.
 *
 * TWO CLOCKS, EACH ANSWERING ITS OWN QUESTION (Cedar's own note, kept). The fiado book reads the
 * shop's own calendar, which is what keeps `Since 2 Sep` stable across a reload; the TIMER measures
 * real elapsed minutes on the device, so every `at` and `nextAt` here is a wall-clock instant.
 *
 * THE RUNGS AND THEIR HOURS GO TO THE LAWYER HOUR (DESIGN-SPEC.md §9 question 1). Until then the
 * ladder is three sends of one cleared sentence, and it ENDS there: the next act is a person.
 */
import { KEYS, scoped } from './store/keys';

export const CHASE_KEY_PREFIX = KEYS.chase;

/** The rungs of the ladder. A step is capped here and nowhere else. */
export const CHASE_STEPS = 3;
export type ChaseStep = 1 | 2 | 3;

/** How often the timer fires. 24 h is the default; 12 and 48 are the other two. */
export const CHASE_HOURS = [12, 24, 48] as const;
export type ChaseEvery = (typeof CHASE_HOURS)[number];
export const CHASE_EVERY_DEFAULT: ChaseEvery = 24;

export type ChaseSend = {
  /** the wall-clock instant this reminder went out */
  at: string;
  step: ChaseStep;
  /** the door it travelled. Her customers are on WhatsApp, and mail stays readable. */
  channel: 'whatsapp' | 'email';
  /** exactly the words the conversation holds */
  text: string;
};

export type ChaseRecord = {
  /** the person who owes the fiado */
  customerId: string;
  sends: ChaseSend[];
  auto: { on: boolean; everyHours: ChaseEvery; nextAt: string | null };
  /** set when the third reminder lands: this one is a person's to finish */
  flaggedAt: string | null;
};

export type ChaseBook = { version: 1; scope: string; records: Record<string, ChaseRecord> };

export const chaseKey = (scope: string): string => scoped(CHASE_KEY_PREFIX, scope);
export const emptyChaseBook = (scope: string): ChaseBook => ({ version: 1, scope, records: {} });

export const emptyChaseRecord = (customerId: string): ChaseRecord => ({
  customerId, sends: [], auto: { on: false, everyHours: CHASE_EVERY_DEFAULT, nextAt: null }, flaggedAt: null,
});

const instant = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const isEvery = (value: unknown): value is ChaseEvery => CHASE_HOURS.includes(value as ChaseEvery);

/** One record, validated field by field. A damaged record reads as ABSENT rather than as a
 *  half-chase: the card then offers the ladder from step 1, which is the honest state. */
export function parseRecord(raw: unknown, customerId: string): ChaseRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<ChaseRecord>;
  if (value.customerId !== customerId || !Array.isArray(value.sends) || value.sends.length > 24) return null;
  const sends: ChaseSend[] = [];
  for (const row of value.sends) {
    const send = row as Partial<ChaseSend> | null;
    if (!send || typeof send !== 'object' || !instant(send.at)) return null;
    if (send.step !== 1 && send.step !== 2 && send.step !== 3) return null;
    if (send.channel !== 'whatsapp' && send.channel !== 'email') return null;
    if (typeof send.text !== 'string' || send.text.length > 2000) return null;
    sends.push({ at: send.at, step: send.step, channel: send.channel, text: send.text });
  }
  const auto = value.auto as ChaseRecord['auto'] | undefined;
  if (!auto || typeof auto !== 'object' || typeof auto.on !== 'boolean' || !isEvery(auto.everyHours)) return null;
  if (auto.nextAt !== null && !instant(auto.nextAt)) return null;
  if (value.flaggedAt !== null && !instant(value.flaggedAt)) return null;
  return { customerId, sends, auto: { on: auto.on, everyHours: auto.everyHours, nextAt: auto.nextAt },
    flaggedAt: value.flaggedAt };
}

export function parseChase(raw: unknown, scope: string): ChaseBook {
  if (!raw || typeof raw !== 'object') return emptyChaseBook(scope);
  const value = raw as Partial<ChaseBook>;
  if (value.version !== 1 || value.scope !== scope || !value.records || typeof value.records !== 'object') {
    return emptyChaseBook(scope);
  }
  const records: Record<string, ChaseRecord> = {};
  for (const [customerId, row] of Object.entries(value.records)) {
    const record = parseRecord(row, customerId);
    if (record) records[customerId] = record;
  }
  return { version: 1, scope, records };
}

export function readChase(scope: string): ChaseBook {
  try { return parseChase(JSON.parse(localStorage.getItem(chaseKey(scope)) || 'null'), scope); }
  catch { return emptyChaseBook(scope); }
}

export function writeChase(book: ChaseBook): void {
  try {
    localStorage.setItem(chaseKey(book.scope), JSON.stringify(book));
    window.dispatchEvent(new CustomEvent('rocoto:bodega-chase-changed', { detail: { scope: book.scope } }));
  } catch { /* The current session keeps the record it is holding. */ }
}

export const chaseRecordOf = (book: ChaseBook, customerId: string): ChaseRecord =>
  book.records[customerId] ?? emptyChaseRecord(customerId);

export const putChase = (book: ChaseBook, record: ChaseRecord): ChaseBook =>
  ({ ...book, records: { ...book.records, [record.customerId]: record } });

/** The rung the NEXT reminder stands on. Three sends is the whole ladder, so it stays at 3. */
export const chaseStepOf = (record: ChaseRecord): ChaseStep =>
  (Math.min(record.sends.length + 1, CHASE_STEPS) as ChaseStep);

/** `Reminder 1 of 3` — the rung, said the way the dialog says it. The register is one register,
 *  because the words are one cleared sentence, so the rung carries the count alone. */
export const chaseStepWords = (step: ChaseStep): string => `Reminder ${step} of ${CHASE_STEPS}`;

export type ChaseMessageInput = {
  /** the name the shop's own contacts hold, `Rosa menú` */
  customerName: string;
  /** the sale's own day, as the customer reads it: `2 de setiembre` */
  saleDateText: string;
  /** the amount, in the shop's own grammar: `S/ 48.00` */
  amountText: string;
  /** the payment page, where one stands */
  link: string;
};

/**
 * THE ONE SENTENCE, AND IT IS THE ONLY ONE (MESSAGES.md row 14, cleared).
 *
 * «Hola Rosa, tu compra del 2 de setiembre por S/ 48.00 sigue pendiente. Te dejo el link para
 *  pagar: {link}»
 *
 * It states the sale, the amount and the date, and it states nothing else — no fee, no charge and
 * no threat, because the shop's relationship with her neighbour is the thing being protected. Every
 * rung sends this, so a first reminder and a third one differ in their COUNT rather than in their
 * register, and the escalation lives on the card as a flag for a person.
 */
/**
 * THE NAME SHE IS CALLED, WHICH IS THE FIRST WORD OF THE SHOP'S OWN TAG. A bodeguera's contacts
 * carry half-labels — `Maribel obra`, `Rosa menú`, `Julia 2do piso` — so a reminder that greeted
 * her by the whole tag read «Hola Maribel obra», which is «Hello Maribel building-site». The first
 * token is her name and the rest is the shop's note to itself (the QA pass, item 39).
 */
export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/**
 * IT IS WRITTEN IN SPANISH, BECAUSE IT GOES TO A NEIGHBOUR IN LIMA (item 39). The screens of this
 * build read English; the reminder is the one string that leaves the app for a customer's phone,
 * and MESSAGES.md row 14 is the cleared sentence it carries, verbatim.
 */
export function chaseMessageOf(input: ChaseMessageInput): string {
  const pay = input.link ? ` Te dejo el link para pagar: ${input.link}` : '';
  return `Hola ${firstName(input.customerName)}, tu compra del ${input.saleDateText} por ${input.amountText} sigue pendiente.${pay}`;
}

const scheduleFrom = (at: string, everyHours: ChaseEvery): string | null => {
  const from = Date.parse(at);
  return Number.isFinite(from) ? new Date(from + everyHours * 3600000).toISOString() : null;
};

/** A reminder landed. It joins the record, the timer moves on by its own interval, and the third
 *  one flags the card. Once the ladder is finished nothing is scheduled: the next act is a call. */
export function recordSend(record: ChaseRecord, send: ChaseSend, everyHours: ChaseEvery): ChaseRecord {
  const sends = [...record.sends, send];
  const finished = sends.length >= CHASE_STEPS;
  return {
    ...record,
    sends,
    auto: { on: record.auto.on, everyHours, nextAt: record.auto.on && !finished ? scheduleFrom(send.at, everyHours) : null },
    flaggedAt: send.step >= CHASE_STEPS ? send.at : record.flaggedAt,
  };
}

/** The switch, and the interval beside it. Turning it on starts the countdown from right now. */
export function setAuto(record: ChaseRecord, on: boolean, everyHours: ChaseEvery, now: string): ChaseRecord {
  const finished = record.sends.length >= CHASE_STEPS;
  return { ...record, auto: { on, everyHours, nextAt: on && !finished ? scheduleFrom(now, everyHours) : null } };
}

/** The chases whose moment has come: the timer is on, its instant has passed, the ladder has a rung
 *  left, and the fiado still owes money. Balances come from the caller, because the book is Money's
 *  to read and this module holds no state. Stable order, by customer. */
export function dueChases(records: Record<string, ChaseRecord>, now: string, balances: Record<string, number>): ChaseRecord[] {
  const at = Date.parse(now);
  if (!Number.isFinite(at)) return [];
  return Object.values(records)
    .filter((record) => record.auto.on
      && record.sends.length < CHASE_STEPS
      && instant(record.auto.nextAt)
      && Date.parse(record.auto.nextAt as string) <= at
      && (balances[record.customerId] ?? 0) > 0)
    .sort((a, b) => a.customerId.localeCompare(b.customerId));
}

/** `next in 23 h` · `next in 40 min` · `due now`. Hours from an hour up, minutes below it. */
export function countdownWords(nextAt: string | null, now: string): string {
  if (!instant(nextAt) || !Number.isFinite(Date.parse(now))) return '';
  const minutes = Math.round((Date.parse(nextAt) - Date.parse(now)) / 60000);
  if (minutes <= 0) return 'due now';
  return minutes >= 60 ? `next in ${Math.floor(minutes / 60)} h` : `next in ${minutes} min`;
}

const HOUR_FORMAT = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;
const DAY_FORMAT = { day: 'numeric', month: 'short' } as const;

/** `Reminded 09:41` on the day it happened, `Reminded 13 Sep 09:41` on any day after it. */
export function chasedWords(lastAt: string | null, now = new Date().toISOString()): string {
  if (!instant(lastAt)) return '';
  const at = new Date(lastAt);
  const hour = at.toLocaleTimeString('en-GB', HOUR_FORMAT);
  const today = new Date(now).toDateString() === at.toDateString();
  return today ? `Reminded ${hour}` : `Reminded ${at.toLocaleDateString('en-GB', DAY_FORMAT)} ${hour}`;
}

/** The whole status line a card prints under its acts: what was said last, and what happens next. */
export function chaseStatusWords(record: ChaseRecord, now: string): string {
  const chased = chasedWords(record.sends[record.sends.length - 1]?.at ?? null, now);
  const countdown = record.auto.on ? countdownWords(record.auto.nextAt, now) : '';
  return [chased, countdown].filter(Boolean).join(' · ');
}
