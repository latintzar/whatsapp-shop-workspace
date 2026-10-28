/* THE AMOUNT A SHOP TYPES, NORMALISED ONCE (§268 QA item 27).
 *
 * The keypad behind `Add the amount` took anything and the row printed it raw: «12.345,67» came back
 * as «S/ 12.345,67», «99999999999» stood whole, and «-50» saved as «S/ 50». A figure that reaches the
 * fiado book is money, so it arrives here first and leaves as MINOR UNITS — the one shape
 * `money-store.ts` stores and `bodegaMoney` prints, so every soles figure in the product reads
 * «S/ 12,345.67» whichever screen collected it.
 *
 * WHAT IT ACCEPTS, in the grammars a Peruvian shopkeeper types:
 *   `460` · `460.50` · `460,50` — a separator with one or two digits after it is the decimal
 *   `12,345.67` · `12.345,67`  — the last separator is the decimal, the ones before it group thousands
 *   `12,345` · `12.345`        — a lone separator with three digits after it groups thousands
 *   `S/ 460`                   — the symbol the field already draws, typed again
 *
 * Everything else answers with ONE sentence the field shows inline, in the shop's own words and with
 * no end punctuation (VOICE.md rule 14). The ceiling is the highest fiado a bodega's book carries;
 * a figure above it is a keystroke rather than a debt.
 */

/** `S/ 99,999.99` in minor units — the ceiling a bodega's fiado row stands under. */
export const AMOUNT_CEILING_MINOR = 9_999_999;

/** The ceiling as the message prints it, which is `bodegaMoney(AMOUNT_CEILING_MINOR)`'s own grammar. */
export const AMOUNT_CEILING_WORDS = 'S/ 99,999.99';

export const AMOUNT_ASKS = {
  empty: 'Type the amount in soles',
  sign: 'Type an amount of zero or more',
  digits: 'Type the amount in numbers, like 12.50',
  decimals: 'Type the amount with up to two decimals',
  ceiling: `Type an amount up to ${AMOUNT_CEILING_WORDS}`,
} as const;

export type AmountAnswer = { ok: true; minor: number } | { ok: false; ask: string };

const grouped = (parts: readonly string[]): boolean => parts.every((part) => part.length === 3);

/**
 * The typed figure as minor units, or the one sentence to show under the field.
 *
 * It is a pure function over the string, so the keypad, a test and any other screen that collects a
 * fiado figure read the same rules.
 */
export function parseAmount(typed: string): AmountAnswer {
  const text = String(typed ?? '').replace(/\s/g, '').replace(/^S\//i, '');
  if (text.length === 0) return { ok: false, ask: AMOUNT_ASKS.empty };
  if (text.startsWith('-')) return { ok: false, ask: AMOUNT_ASKS.sign };
  if (!/^[\d.,]+$/.test(text)) return { ok: false, ask: AMOUNT_ASKS.digits };

  const parts = text.split(/[.,]/);
  if (parts.some((part) => part.length === 0)) return { ok: false, ask: AMOUNT_ASKS.digits };

  let whole = parts[0];
  let fraction = '';
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    const head = parts.slice(0, -1);
    if (last.length <= 2) {
      if (head.length > 1 && !grouped(head.slice(1))) return { ok: false, ask: AMOUNT_ASKS.digits };
      whole = head.join('');
      fraction = last;
    } else if (last.length === 3 && grouped(parts.slice(1))) {
      whole = parts.join('');
    } else {
      return { ok: false, ask: AMOUNT_ASKS.decimals };
    }
  }

  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor)) return { ok: false, ask: AMOUNT_ASKS.digits };
  if (minor > AMOUNT_CEILING_MINOR) return { ok: false, ask: AMOUNT_ASKS.ceiling };
  return { ok: true, minor };
}

/** The same figure as the two-decimal string the confirmation record carries, `460.00`. */
export const amountWords = (minor: number): string => (minor / 100).toFixed(2);
