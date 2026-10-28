/* CREDIT LAW, ABOVE EVERY MONEY SURFACE (DESIGN-SPEC.md §1 «Credit law», §6, WIRING-SPEC.md §8).
 *
 * Ahead of a signed lender this product may print a soles figure of credit, a rate, a term, a date
 * or an approval word NOWHERE. What it may print is the cleared queue line and the cleared
 * working-capital sentence, both held here byte-exact, and both shipped with the dated
 * queue-policy file the lawyer hour releases.
 *
 * THE LENDER IS NAMED ONCE IT SIGNS, so `LENDER_NAME` is the one switch: while it is empty
 * `payLaterVisible()` is false, `Offered` and `Used` render nowhere, and every credit string this
 * surface draws is checked by `creditLawClear` — in `app/tools/test-bodega-money.mjs`, on the same
 * list the screens read. The day a lender signs, the name lands here and the gate opens once.
 *
 * WHY THE CHECK IS A FUNCTION RATHER THAN A REVIEW. The rule is «no credit figure, rate, term,
 * date or approval promise», and a reviewer reads a screen at one moment; a function reads every
 * string on every run. The ordinary money figures — a bank balance, a supplier's amount, a fiado
 * row — are the shop's OWN money and stand outside this gate, which is why the gate takes a named
 * list rather than the whole surface.
 */

/** The lender's own name, written here the day it signs. Empty until then. */
export const LENDER_NAME = '';

/** True once a lender has signed, which is the one gate on every credit word. */
export const lenderSigned = (name: string = LENDER_NAME): boolean => name.trim().length > 0;

/* ── THE CLEARED LINES, BYTE-EXACT ────────────────────────────────────────────────────────── */

/** Peter's cleared queue line. It ships verbatim, in Spanish, wherever the spec pins it. */
export const QUEUE_LINE_ES =
  'Los negocios que ya usan Rocoto entran primero, y cada negocio que traes te adelanta en la lista.';

/** The English source the Spanish above was written from (DESIGN-SPEC.md §6, the build context). */
export const QUEUE_LINE_EN =
  'Businesses already using Rocoto go first, and every business you bring moves you up.';

/** The cleared working-capital sentence, and the English it was written from. */
export const WORKING_CAPITAL_ES =
  'Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad financiera supervisada por la SBS.';
export const WORKING_CAPITAL_EN =
  'Working-capital credit for businesses like yours is on its way, with a financial institution supervised by the SBS.';

/** The SUNAT fact, byte-exact Spanish, with the English it was written from beside it. */
export const SUNAT_ES =
  'Tu plata de Yape está en una cuenta del banco, y el banco le informa a la SUNAT el saldo de esa cuenta cuando llega a S/ 38,500 en el mes, que son 7 UIT en 2026.';
export const SUNAT_EN =
  'Your Yape money sits in a bank account, and the bank reports that account balance to SUNAT once it reaches S/ 38,500 in the month, which is 7 UIT in 2026.';

/** What moves a shop up the list, said as what is. */
export const PLACE_MOVES_LINE = 'Your place moves when a supplier you brought joins.';

/* ── THE BANKS ROCOTO READS ───────────────────────────────────────────────────────────────── */

/**
 * THE SEVEN, BCP FIRST (the QA pass, item 43). Money told a shop banking with BCP that BCP was the
 * one bank outside Rocoto's reach — the demo's connect step refusing the demo's own shop — and the
 * sentence forecast an outcome («and BCP joins them») on a screen whose whole job is to state what
 * IS. BCP leads the list, and the line names what is readable and stops there.
 *
 * The list is `fixtures/cast-bodega.json` · `house.banksRead`, said here in the words a shop reads.
 */
export const BANKS_READ: readonly string[] = [
  'BCP', 'BBVA', 'Interbank', 'Scotiabank', 'BanBif', 'Banco Pichincha', 'Mibanco',
];

/** `Rocoto reads BCP, BBVA, Interbank, Scotiabank, BanBif, Banco Pichincha and Mibanco.` */
export const BANK_REACH_LINE = `Rocoto reads ${
  BANKS_READ.slice(0, -1).join(', ')} and ${BANKS_READ[BANKS_READ.length - 1]}.`;

/* ── THE GATE ─────────────────────────────────────────────────────────────────────────────── */

/**
 * THE WORDS THAT MAKE A CREDIT CLAIM. Each one asserts a term of an agreement — a price for money,
 * a length of time, a decision on an application — and every one of them waits for a signed
 * entity. `pre-aprobado` is here in both languages because it is the exact word Peru's own
 * marketing reaches for.
 */
export const CREDIT_CLAIM_WORDS: readonly string[] = [
  'rate', 'tcea', 'tea', 'interest', 'apr', 'limit', 'approved', 'pre-approved', 'preapproved',
  'pre-aprobado', 'aprobado', 'instalment', 'installment', 'repayment', 'term', 'tasa', 'plazo',
  'cuota', 'línea de crédito', 'linea de credito',
];

/** A soles figure, in either grammar a screen could write it. */
const SOLES_FIGURE = /S\/\s?\d/;

/** A calendar date, as a string states one: `24 Sep`, `2026-09-24`, `24 de setiembre`. */
const CALENDAR_DATE = /\b\d{1,2}\s+(de\s+)?[A-Za-zÁ-úá-ú]{3,}\b|\b\d{4}-\d{2}-\d{2}\b/;

/**
 * The first credit claim a string makes, or `null` where it makes none. `SUNAT_ES` and its English
 * carry a soles figure about the shop's OWN tax threshold, so they are named exempt rather than
 * parsed around: the exemption is visible here instead of hidden in a regular expression.
 */
export function creditClaimIn(text: string): string | null {
  const exempt = [SUNAT_ES, SUNAT_EN];
  if (exempt.includes(text.trim())) return null;
  const lower = text.toLocaleLowerCase();
  for (const word of CREDIT_CLAIM_WORDS) if (lower.includes(word)) return word;
  if (SOLES_FIGURE.test(text)) return 'a figure in soles';
  if (CALENDAR_DATE.test(text)) return 'a date';
  return null;
}

/**
 * Every string a credit surface prints, checked against the lender switch. While the lender name
 * is empty each one must make no credit claim; once a lender signs the gate opens and the surface
 * may state the offer's own terms.
 */
export function creditLawClear(strings: readonly string[], name: string = LENDER_NAME): string[] {
  if (lenderSigned(name)) return [];
  return strings.filter((text) => creditClaimIn(text) !== null);
}

/**
 * THE CREDIT STRINGS THIS SURFACE PRINTS, in one list, so the gate reads exactly what a shop
 * reads. `Your place in the list` is the only credit-adjacent block standing today; its own dated
 * facts — `In line since 3 September`, `Suppliers on Rocoto · 4 of 9 invited · 2 connected` —
 * are queue facts about suppliers rather than claims about money, and they are stated by
 * `queue.ts` with their own words.
 */
export const CREDIT_SURFACE_STRINGS: readonly string[] = [
  'Your place in the list',
  'Working capital',
  QUEUE_LINE_ES,
  QUEUE_LINE_EN,
  WORKING_CAPITAL_ES,
  WORKING_CAPITAL_EN,
  PLACE_MOVES_LINE,
  'Suppliers you brought',
  'Invite more suppliers',
];
