/* THE ROUND TRIP OUT, FOR ONE SHOP — a copy of Cedar's `export-files.ts`, two sheets long.
 *
 * WHY A COPY AND WHAT CHANGED (DESIGN-SPEC.md §7 item 11, WIRING-SPEC.md §7). Cedar's file writes
 * six sheets for a distributor with tarifas, comerciales, trucks and an ERP. This shop has one
 * price and one counter, so:
 *
 *   · THE TARIFA COLUMN IS GONE from the customers sheet, with `tiers.ts` and the whole tier
 *     registry — one shop sells at one price, so a band column would be a column of one value.
 *   · NO PRICE COLUMNS. Cedar's orders sheet carries `price` and `line total` off the tarifa a
 *     product is being sold on, and its `prices` sheet is nothing but that. Both are read off a
 *     pricing engine this candidate has none of. What survives is the TRANSACTION's own amount,
 *     which is the money seed's own integer and the figure Money already draws.
 *   · TWO SHEETS, `orders` and `customers`, which the door names `By transaction` and
 *     `By customer` (DESIGN-SPEC.md §3 card 5, §6). The transcripts, catalogue and goods-in sheets
 *     leave with the surfaces that fed them.
 *
 * ═══ CSV, AND WHY, WHICH IS CEDAR'S REASONING UNCHANGED ═════════════════════════════════════
 * A shop takes its book to its contador, its bank or a spreadsheet. All three read CSV. The file
 * opens with a byte-order mark because Excel reads a UTF-8 CSV as Latin-1 without one and turns
 * «Bodega Yesenia» into mojibake on the shop's own screen; `\r\n` ends the lines for the same
 * reader. `CSV_BOM` is imported from Cedar's `output-files.ts` so one constant serves both.
 *
 * ═══ NOTHING IS INVENTED ════════════════════════════════════════════════════════════════════
 * Every column is a fact a surface already draws. The bundle is handed IN rather than read from a
 * store, so this module folds nothing of its own and can never become a second arithmetic; the
 * surface that draws Money is the surface that fills it (`export.tsx`).
 *
 * ═══ AND THE WINDOW IS THE FIXTURES' OWN ════════════════════════════════════════════════════
 * The bundle carries the period it is a record OF — 90 days, 20 June to 18 September 2026 for the
 * seeded bodega (`fixtures/cast-bodega.json` `money.windows.money`) — and a transaction outside it
 * is left out of the file. An export that quietly carried a day beyond the period it names would
 * be a file whose own heading is wrong.
 */
import { CSV_BOM } from '../../cedar/output-files';

/** The two sheets, and the door's two doors (`By transaction` · `By customer`). */
export type PaperSheetId = 'orders' | 'customers';

/** ONE TRANSACTION, as the shop's own record holds it. */
export type PaperTransaction = {
  /** the record's own reference — the sale's number, or the payment request's id */
  reference: string;
  /** the day it happened, `2026-09-18`, which is what the window is measured on */
  day: string;
  /** the hour, where the record kept one */
  at?: string;
  /** the shop's own contact name for the buyer — `Rosa menú` */
  customer: string;
  /** WHAT IT IS FOR — the words the shop typed when it made the payment link, carried from the
   *  request to the buyer's page, to the message, and to this row (Peter: «you can generate new
   *  payment links with the description of everything so that you keep stuff logged»). */
  describedAs?: string;
  /** the figure, in minor units, the way the money seed and Cedar's money model both hold it */
  amountMinor: number;
  /** `yape` · `plin` · `transfer` · `cash` · `fiado` */
  paidBy?: string;
  /** the state word the row reads on screen */
  state: string;
  /** the payment page, where one was made for this transaction */
  link?: string;
};

/** ONE CUSTOMER, with what they take and what they owe. */
export type PaperCustomer = {
  id: string;
  /** the shop's own WhatsApp contact name, which is what the read returns */
  name: string;
  phone?: string;
  /** the channel the orders arrive on — `whatsapp` for this shop */
  channel?: string;
  /** the block the address sits on, which is how Prep groups the day */
  block?: string;
  /** `fiado` or `cash` */
  settles: string;
  /** sales in the window */
  sales: number;
  /** what those sales came to, in minor units */
  amountMinor: number;
  /** open fiados, and what they come to */
  fiados: number;
  owedMinor: number;
  /** the day the oldest open fiado started */
  owedSince?: string;
};

/** THE PERIOD THE FILE IS A RECORD OF, stated by the record rather than by the file. */
export type PaperWindow = { days: number; from: string; to: string };

/** WHAT THE DOOR HANDS IN. */
export type PaperBundle = {
  /** the shop, which the file's own name carries */
  house: string;
  /** `PEN` for this shop — one currency, stated once rather than derived per row */
  currency: string;
  /** the reference day, which is the file's name and the period's end */
  today: string;
  window: PaperWindow;
  transactions: PaperTransaction[];
  customers: PaperCustomer[];
};

export type PaperSheet = {
  name: string;
  head: string[];
  rows: Array<Array<string | number>>;
  /** the source record behind each row, which is what `export-period.ts` measures coverage on */
  recordKeys: string[];
};

/** The shape `export-period.ts prepareExport` takes and gives back. */
export type PaperDocument = { sheets: PaperSheet[]; warnings: string[]; rows: number };

/* ── ONE CELL ─────────────────────────────────────────────────────────────────────────────────
 * A quote, a comma, a semicolon or a newline inside a value is what turns a takeout into a file
 * whose columns have silently shifted by one — and the description the shop types is free text, so
 * this is the column it happens on. RFC 4180's own answer: wrap and double the quotes.
 */
const cell = (value: string | number | undefined | null): string => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const csvOf = (sheet: { head: string[]; rows: Array<Array<string | number>> }): string =>
  [sheet.head, ...sheet.rows].map((row) => row.map(cell).join(',')).join('\r\n');

/** A FIGURE THE TRADE WRITES. Soles are held as an integer in minor units everywhere in this
 *  candidate; the file writes them PLAIN, with a dot, which is what a spreadsheet reads back as a
 *  number rather than as text. The comma is this file's own separator, so it cannot also be the
 *  decimal mark — which is why the screen's `S/ 38,500` and the file's `38500.00` are the same
 *  amount written for two different readers. */
export const amountOf = (minor: number): string =>
  Number.isFinite(minor) ? (minor / 100).toFixed(2) : '';

/** THE WINDOW DECIDES WHAT IS IN THE FILE. Days are ISO, so a string compare is a date compare. */
export const withinWindow = (day: string, window: PaperWindow): boolean =>
  day >= window.from && day <= window.to;

/** The transactions this bundle's period holds, oldest first, which is how a book is read. */
export const transactionsInWindow = (bundle: PaperBundle): PaperTransaction[] =>
  bundle.transactions
    .filter((row) => withinWindow(row.day, bundle.window))
    .sort((a, b) => a.day.localeCompare(b.day) || (a.at ?? '').localeCompare(b.at ?? '')
      || a.reference.localeCompare(b.reference));

/* ── THE TWO SHEETS ───────────────────────────────────────────────────────────────────────── */

export function sheetOf(id: PaperSheetId, bundle: PaperBundle): PaperSheet {
  switch (id) {
    case 'orders': {
      /* ONE ROW PER TRANSACTION. Cedar writes one row per order LINE because a distributor
         reconciles lines; a bodega reconciles takings, and the thing the shop can recognise is the
         sale — the day, the person, what it was for, and the figure. */
      const rows = transactionsInWindow(bundle);
      return {
        name: 'sales-by-transaction',
        head: ['reference', 'day', 'hour', 'customer', 'what it is for', 'amount', 'currency', 'paid by', 'state', 'payment link'],
        rows: rows.map((row) => [
          row.reference, row.day, row.at ?? '', row.customer, row.describedAs ?? '',
          amountOf(row.amountMinor), bundle.currency, row.paidBy ?? '', row.state, row.link ?? '',
        ]),
        recordKeys: rows.map((row) => `transaction:${row.reference}`),
      };
    }

    case 'customers':
      /* ⚠ NO `tarifa` COLUMN, and none of the columns that came with it — comercial, truck, zone,
         the ERP's own name. One shop, one price, one counter: what is left is the person, how they
         settle, what they took in the window and what is still open. */
      return {
        name: 'customers',
        head: ['id', 'name', 'phone', 'channel', 'block', 'settles', 'sales', 'amount', 'fiados', 'owed', 'owed since', 'currency'],
        rows: bundle.customers.map((customer) => [
          customer.id, customer.name, customer.phone ?? '', customer.channel ?? '', customer.block ?? '',
          customer.settles, customer.sales, amountOf(customer.amountMinor),
          customer.fiados, amountOf(customer.owedMinor), customer.owedSince ?? '', bundle.currency,
        ]),
        recordKeys: bundle.customers.map((customer) => `customer:${customer.id}`),
      };
  }
}

/** BOTH SHEETS, AS ONE DOCUMENT — what `export-period.ts prepareExport` measures coverage over. */
export function paperDocument(bundle: PaperBundle): PaperDocument {
  const sheets = [sheetOf('orders', bundle), sheetOf('customers', bundle)];
  return { sheets, warnings: [], rows: sheets.reduce((total, sheet) => total + sheet.rows.length, 0) };
}

/** THE FILE'S OWN NAME — the shop, the sheet and the day, so two takeouts in a downloads folder
 *  are two files a person can tell apart without opening either. */
export const fileNameOf = (sheet: { name: string }, house: string, day: string): string =>
  `rocoto-${house.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${sheet.name}-${day}.csv`;

/** PUT IT ON THEIR DISK, AND SAY WHAT WENT ON IT.
 *
 *  IT RETURNS THE BYTES, which is Cedar's own correction («It's not calculating the right download
 *  size», Peter, 2026-09-10): `Blob.size` is the exact UTF-8 length of the payload the browser
 *  writes, mark included, and it is the number a person can check against their downloads folder. */
export function saveCsv(name: string, text: string): number {
  const blob = new Blob([`${CSV_BOM}${text}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return blob.size;
}

/** WHAT A PRESS DID, so the row beside the button says it in its own seat (§76). */
export type PaperTakeaway = { rows: number; bytes: number; name: string };

/** THE WHOLE ACT, IN ONE CALL, so the door's two buttons are one line each. */
export function takeAway(sheet: PaperSheet, house: string, day: string): PaperTakeaway {
  const name = fileNameOf(sheet, house, day);
  return { rows: sheet.rows.length, bytes: saveCsv(name, csvOf(sheet)), name };
}
