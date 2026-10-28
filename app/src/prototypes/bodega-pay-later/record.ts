/* YOUR RECORD — one word, three counted lines, and the rule printed (DESIGN-SPEC.md §3 card 4).
 *
 * «super simple but still fintech-precise»: one level word from a closed set of three, over three
 * indicators that each print their COUNT, their DENOMINATOR, their WINDOW, their FLOOR and their
 * newest reason. POINTS AND WEIGHTS ARE GONE, by decision — «a weighted total is the one part a
 * shop cannot recount» — so this module computes no score and exposes none.
 *
 * ═══ THE THREE INDICATORS ═══════════════════════════════════════════════════════════════════
 *   Paid on the day                    supplier payments settled on or before the day agreed
 *                                      · evidence: a matched bank debit, or her dated confirmation
 *                                      · window 90 days · floor 3 BANK-GRADED payments
 *   Days with a sale                   days carrying at least one recorded sale
 *                                      · window 28 days, CLAMPED TO THE CONNECTION · floor 7 days
 *   Sales with the payment recorded    sales whose payment is recorded
 *                                      · window 28 days · floor 10 sales
 *
 * ═══ THE LEVEL RULE, AND THE SCREEN PRINTS IT ═══════════════════════════════════════════════
 *   Starting   while an indicator sits under its floor
 *   Steady     every indicator at 80 / 60 / 70 per cent or better
 *   Punctual   every supplier payment in the 90 days paid on or before the day, plus 80 and 85
 *   and thirty days since the last measured payment step the band down, with a line of its own.
 *
 * A FLOOR COUNTS BANK-GRADED EVENTS ALONE on the payment indicator, so the record stays earnable
 * by a shop Prometeo cannot reach: her own dated confirmations still count towards the RATIO, and
 * the floor is what the bank has seen. Under its floor an indicator reads
 * `Unknown · Counts from 3 payments`, which states what would make it readable.
 */

export const LEVELS = ['Starting', 'Steady', 'Punctual'] as const;
export type LevelWord = (typeof LEVELS)[number];

export const INDICATOR_IDS = [
  'paid-on-the-day',
  'days-with-a-sale',
  'sales-with-the-payment-recorded',
] as const;
export type IndicatorId = (typeof INDICATOR_IDS)[number];

export const INDICATOR_TITLE: Record<IndicatorId, string> = {
  'paid-on-the-day': 'Paid on the day',
  'days-with-a-sale': 'Days with a sale',
  'sales-with-the-payment-recorded': 'Sales with the payment recorded',
};

/** What each indicator counts, in the words the page prints under its title. */
export const INDICATOR_UNIT: Record<IndicatorId, string> = {
  'paid-on-the-day': 'payments',
  'days-with-a-sale': 'days',
  'sales-with-the-payment-recorded': 'sales',
};

export const INDICATOR_WINDOW_DAYS: Record<IndicatorId, number> = {
  'paid-on-the-day': 90,
  'days-with-a-sale': 28,
  'sales-with-the-payment-recorded': 28,
};

/** The floor each indicator counts from. On the payments row it counts bank-graded events alone. */
export const INDICATOR_FLOOR: Record<IndicatorId, number> = {
  'paid-on-the-day': 3,
  'days-with-a-sale': 7,
  'sales-with-the-payment-recorded': 10,
};

/** `Steady` — 80 / 60 / 70 per cent or better, in the spec's own order. */
export const STEADY_PER_CENT: Record<IndicatorId, number> = {
  'paid-on-the-day': 80,
  'days-with-a-sale': 60,
  'sales-with-the-payment-recorded': 70,
};

/** `Punctual` — every supplier payment paid on or before the day, plus 80 and 85 per cent. */
export const PUNCTUAL_PER_CENT: Record<IndicatorId, number> = {
  'paid-on-the-day': 100,
  'days-with-a-sale': 80,
  'sales-with-the-payment-recorded': 85,
};

/** Thirty days since the last measured payment step the band down. */
export const QUIET_DAYS = 30;

/* ── THE RULE, AS THE SCREEN PRINTS IT ────────────────────────────────────────────────────── */

export const LEVEL_RULE_LINES: readonly string[] = [
  'Starting · while an indicator sits under its floor',
  'Steady · every indicator at 80 / 60 / 70 per cent or better',
  'Punctual · every supplier payment in the 90 days paid on or before the day, plus 80 and 85 per cent',
];

/** The fourth rule line, punctuated like the three above it and read as a sentence rather than as
 *  a typo: «Thirty days since your last measured payment step the band down.» put a plural verb
 *  against a singular subject and ended in the only full stop in its group (the QA pass, item 21). */
export const QUIET_RULE_LINE = 'The band steps down when your last measured payment is thirty days old';

/* ── THE INPUT ────────────────────────────────────────────────────────────────────────────── */

/** One indicator's raw counts, as the ledgers hand them over. */
export type IndicatorInput = {
  id: IndicatorId;
  /** the events that went the right way */
  count: number;
  /** the events measured in the window */
  of: number;
  /** how many of those the bank itself graded */
  bankGraded?: number;
  /** the newest reason, one line, in the words the page prints */
  newestReason?: string;
};

export type RecordInput = {
  /** the day this reading is taken, `YYYY-MM-DD` */
  asOf: string;
  /** the day the shop connected, which is what clamps the 28-day window */
  connectedOn?: string;
  /** the day of the newest measured supplier payment, `YYYY-MM-DD` */
  lastMeasuredPaymentOn?: string;
  indicators: readonly IndicatorInput[];
};

/* ── THE READING ──────────────────────────────────────────────────────────────────────────── */

export type IndicatorReading = {
  id: IndicatorId;
  title: string;
  /** the events that went the right way, over the window this row prints */
  count: number;
  /** the events measured, over the window this row prints, so `of` fits inside it on a day count */
  of: number;
  /** whole per cent, rounded down, or `null` while the indicator sits under its floor */
  perCent: number | null;
  /** the window this indicator counts over, after the clamp to the connection */
  windowDays: number;
  asOf: string;
  floor: number;
  bankGraded: number | null;
  /** at or above its floor, so the ratio is readable */
  measured: boolean;
  /** `8 of 9 payments` · `Unknown · Counts from 3 payments` */
  words: string;
  /** `7 of 9 payments confirmed by your bank`, where the bank graded any of them */
  gradeWords: string;
  newestReason: string;
};

export type RecordReading = {
  level: LevelWord;
  /** why the level word stands, one line */
  levelReason: string;
  /** the band stepped down for thirty quiet days, and the reason line says so */
  stepped: boolean;
  indicators: IndicatorReading[];
  rule: readonly string[];
  quietRule: string;
  asOf: string;
};

const dayValue = (day: string): number => Date.parse(`${day}T12:00:00Z`);

/** Whole days between two calendar days, inclusive of both, or `null` where either is unreadable. */
export function daysInclusive(from: string, to: string): number | null {
  const a = dayValue(from), b = dayValue(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.floor((b - a) / 86400000) + 1;
}

/** The 28-day window, clamped to the connection: a shop 14 days old counts over 14 days. */
export function clampedWindow(id: IndicatorId, input: RecordInput): number {
  const declared = INDICATOR_WINDOW_DAYS[id];
  if (id !== 'days-with-a-sale' || !input.connectedOn) return declared;
  const since = daysInclusive(input.connectedOn, input.asOf);
  return since === null ? declared : Math.max(1, Math.min(declared, since));
}

const perCentOf = (count: number, of: number): number | null =>
  of > 0 ? Math.floor((count * 100) / of) : null;

/** An indicator that counts DAYS has the window itself for a denominator. */
const countsDays = (id: IndicatorId): boolean => INDICATOR_UNIT[id] === 'days';

/**
 * THE COUNTS SIT INSIDE THE WINDOW THEY ARE PRINTED UNDER, which is the whole point of a figure a
 * shop can recount. An indicator that counts DAYS has the window for a denominator, so the clamp
 * to the connection shortens the counts with it: a shop 16 days old, handed the ledger's declared
 * `26 of 28 days`, reads `15 of 16 days` over `Last 16 days` at the ledger's own rate. Events —
 * payments, sales — keep their denominators, which stand outside the window's length by nature.
 */
export function overWindow(row: IndicatorInput, windowDays: number): { count: number; of: number } {
  if (!countsDays(row.id) || row.of <= windowDays || row.of <= 0) return { count: row.count, of: row.of };
  const of = Math.max(1, windowDays);
  return { count: Math.max(0, Math.min(of, Math.round((row.count * of) / row.of))), of };
}

/** The events a floor counts: bank-graded on the payments row, measured events on the other two. */
export function floorCount(row: IndicatorInput): number {
  return row.id === 'paid-on-the-day' ? row.bankGraded ?? 0 : row.of;
}

export function readIndicator(row: IndicatorInput, input: RecordInput): IndicatorReading {
  const floor = INDICATOR_FLOOR[row.id];
  const windowDays = clampedWindow(row.id, input);
  /* The counts the row prints, read over the window the row prints — and the floor reads those,
     so a shop six days old sits under `Counts from 7 days` rather than over a stale 28. */
  const { count, of } = overWindow(row, windowDays);
  const measured = floorCount({ ...row, count, of }) >= floor;
  const unit = INDICATOR_UNIT[row.id];
  const perCent = measured ? perCentOf(count, of) : null;
  const graded = row.bankGraded ?? null;
  return {
    id: row.id,
    title: INDICATOR_TITLE[row.id],
    count,
    of,
    perCent,
    windowDays,
    asOf: input.asOf,
    floor,
    bankGraded: graded,
    measured,
    words: measured
      ? `${count} of ${of} ${unit}`
      : `Unknown · Counts from ${floor} ${unit}`,
    gradeWords: graded === null ? '' : `${graded} of ${of} ${unit} confirmed by your bank`,
    newestReason: row.newestReason ?? '',
  };
}

const byId = (rows: readonly IndicatorReading[], id: IndicatorId): IndicatorReading | undefined =>
  rows.find((row) => row.id === id);

/** Thirty days since the newest measured payment, which steps the band down. */
export function quiet(input: RecordInput): boolean {
  if (!input.lastMeasuredPaymentOn) return false;
  const since = daysInclusive(input.lastMeasuredPaymentOn, input.asOf);
  return since !== null && since > QUIET_DAYS;
}

const atOrAbove = (row: IndicatorReading | undefined, threshold: number): boolean =>
  Boolean(row?.measured && row.perCent !== null && row.perCent >= threshold);

const stepDown = (level: LevelWord): LevelWord =>
  level === 'Punctual' ? 'Steady' : level === 'Steady' ? 'Starting' : 'Starting';

/**
 * THE LEVEL, FROM THE RULE THE SCREEN PRINTS. Read in the rule's own order: an indicator under its
 * floor is `Starting`; three ratios at 80 / 60 / 70 is `Steady`; every payment on or before the day
 * plus 80 and 85 is `Punctual`; and thirty quiet days step whatever that produced down one band.
 */
export function readRecord(input: RecordInput): RecordReading {
  const indicators = INDICATOR_IDS
    .map((id) => input.indicators.find((row) => row.id === id))
    .filter((row): row is IndicatorInput => Boolean(row))
    .map((row) => readIndicator(row, input));

  const payments = byId(indicators, 'paid-on-the-day');
  const days = byId(indicators, 'days-with-a-sale');
  const sales = byId(indicators, 'sales-with-the-payment-recorded');
  const under = indicators.filter((row) => !row.measured);

  let level: LevelWord = 'Starting';
  let levelReason = under.length
    ? `${under[0].title} counts from ${under[0].floor} ${INDICATOR_UNIT[under[0].id]}`
    : 'Your three indicators are still finding their level';

  if (!under.length && indicators.length === INDICATOR_IDS.length) {
    const steady = INDICATOR_IDS.every((id) => atOrAbove(byId(indicators, id), STEADY_PER_CENT[id]));
    const everyPaymentOnTheDay = Boolean(payments && payments.count === payments.of);
    const punctual = steady && everyPaymentOnTheDay
      && atOrAbove(days, PUNCTUAL_PER_CENT['days-with-a-sale'])
      && atOrAbove(sales, PUNCTUAL_PER_CENT['sales-with-the-payment-recorded']);
    if (punctual) {
      level = 'Punctual';
      levelReason = `Every one of your ${payments?.of ?? 0} supplier payments in the 90 days landed on or before the day`;
    } else if (steady) {
      level = 'Steady';
      const lowest = INDICATOR_IDS
        .map((id) => ({ row: byId(indicators, id)!, target: PUNCTUAL_PER_CENT[id] }))
        .filter(({ row, target }) => row.perCent !== null && row.perCent < target)
        .sort((a, b) => (a.row.perCent ?? 0) - a.target - ((b.row.perCent ?? 0) - b.target))[0];
      /* THE ONE SENTENCE UNDER THE BIG WORD SAYS WHAT IS. This is the most-read line on the shop's
         own credit record, so it spends itself on the payments that landed as agreed; the shortfall
         stays where a shop can act on it, in `Paid on the day`'s own counts below. */
      levelReason = !everyPaymentOnTheDay && payments
        ? `${payments.count} of your ${payments.of} supplier payments landed on or before the day agreed`
        : lowest
          ? `${lowest.row.title} at ${lowest.row.perCent} per cent holds this band`
          : 'Every indicator sits at its Steady mark';
    } else {
      const short = INDICATOR_IDS
        .map((id) => ({ row: byId(indicators, id)!, target: STEADY_PER_CENT[id] }))
        .find(({ row, target }) => (row.perCent ?? 0) < target);
      levelReason = short
        ? `${short.row.title} at ${short.row.perCent} per cent, and Steady asks for ${short.target}`
        : 'Your three indicators are still finding their level';
    }
  }

  const stepped = quiet(input);
  if (stepped) {
    level = stepDown(level);
    levelReason = `${QUIET_DAYS} days since your last measured payment, so the band stepped down to ${level}`;
  }

  return { level, levelReason, stepped, indicators, rule: LEVEL_RULE_LINES,
    quietRule: QUIET_RULE_LINE, asOf: input.asOf };
}
