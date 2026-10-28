/* THE BODEGA'S EXPORT, PROVED (DESIGN-SPEC.md §8, WIRING-SPEC.md §7).
 *
 * Two claims this file exists to keep honest:
 *
 *   1. THE WINDOW IS THE FIXTURES' OWN. `fixtures/cast-bodega.json` declares 90 days, 20 June to
 *      18 September 2026, and says so in `money.windows.money`. The file the shop downloads holds
 *      that period and nothing outside it, and every dated record the fixtures seed sits inside it
 *      — a period whose own records fall outside it would be a heading that lies.
 *
 *   2. A PAYMENT LINK'S DESCRIPTION REACHES ITS EXPORT ROW. Peter: «you can generate new payment
 *      links with the description of everything so that you keep stuff logged». The words the shop
 *      types ride the request, the buyer's page, the message and THIS row — and they are free
 *      text, so the CSV has to survive a comma and a quote inside them.
 *
 * And the two shapes the copy dropped: the customers sheet carries no `tarifa` column, and neither
 * sheet carries a price column.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadTypeScript } from './ts-module.mjs';

const cast = JSON.parse(readFileSync(
  new URL('../src/prototypes/bodega-pay-later/fixtures/cast-bodega.json', import.meta.url), 'utf8'));

const {
  amountOf, csvOf, fileNameOf, paperDocument, sheetOf, transactionsInWindow, withinWindow,
} = loadTypeScript('src/prototypes/bodega-pay-later/paper/export-files.ts', 'bodega-export');

const { backRun, shut, PAID, DELIVERED, FIADO } =
  loadTypeScript('src/prototypes/bodega-pay-later/paper/back-run.ts', 'bodega-back-run');

/* ── 1 · THE WINDOW THE FIXTURES DECLARE ──────────────────────────────────────────────────── */

const window_ = cast.money.windows.money;
const DAY = 24 * 60 * 60 * 1000;
const span = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);

assert.equal(window_.days, 90, 'the money window is the 90 days the fixtures declare');
assert.equal(window_.from, '2026-06-20');
assert.equal(window_.to, '2026-09-18');
assert.equal(span(window_.from, window_.to), window_.days,
  'the declared day count is the distance between the two declared days');
assert.equal(window_.to, cast.referenceDay, 'the window ends on the world’s own reference day');

/* Every dated record the fixtures seed stands inside the period they declare. */
assert.ok(withinWindow(cast.prepDay.date, window_), 'the seeded day stands in the money window');
for (const row of cast.money.fiadoBook.rows) {
  assert.ok(withinWindow(row.since, window_), `the fiado from ${row.since} stands in the money window`);
}
for (const row of cast.money.payables.rows) {
  assert.ok(withinWindow(row.delivered, window_), `the purchase of ${row.delivered} stands in the money window`);
}
for (const row of cast.money.payables.settled) {
  assert.ok(withinWindow(row.paid, window_), `the payment of ${row.paid} stands in the money window`);
}

assert.equal(withinWindow('2026-06-19', window_), false, 'the day before the period stands outside it');
assert.equal(withinWindow('2026-09-19', window_), false, 'the day after the period stands outside it');

/* ── the record under test ────────────────────────────────────────────────────────────────── */

/** The description the shop typed on a payment link, carrying the two characters a CSV fears. */
const DESCRIBED = 'Gaseosas, "Inca Kola" x12 — cumpleaños';

const bundle = {
  house: cast.house.name,
  currency: cast.currency,
  today: cast.referenceDay,
  window: window_,
  transactions: [
    { reference: 'before', day: '2026-06-19', customer: 'Rosa menú', amountMinor: 1000, state: 'Paid' },
    { reference: 'opens', day: '2026-06-20', at: '08:10', customer: 'Rosa menú', amountMinor: 4800, paidBy: 'yape', state: 'Paid' },
    { reference: 'link-1', day: '2026-09-12', at: '11:40', customer: 'Maribel menú', describedAs: DESCRIBED,
      amountMinor: 26500, paidBy: 'yape', state: 'Paid', link: 'https://shop.example.invalid/collect/req-1/t' },
    { reference: 'closes', day: '2026-09-18', at: '07:05', customer: 'Julia 2do piso', amountMinor: 3150, state: 'Fiado' },
    { reference: 'after', day: '2026-09-19', customer: 'Nelly', amountMinor: 1000, state: 'Paid' },
  ],
  customers: [
    { id: 'rosa', name: 'Rosa menú', phone: '+51 971 000 001', channel: 'whatsapp', block: 'Av. Gran Chimú',
      settles: 'fiado', sales: 2, amountMinor: 31800, fiados: 2, owedMinor: 31800, owedSince: '2026-09-05' },
    { id: 'elmer', name: 'Elmer taxi', channel: 'whatsapp', settles: 'cash', sales: 1, amountMinor: 2400,
      fiados: 0, owedMinor: 0 },
  ],
};

/* The period decides what is in the file, and the rows come out oldest first. */
const kept = transactionsInWindow(bundle).map((row) => row.reference);
assert.deepEqual(kept, ['opens', 'link-1', 'closes'],
  'the file holds the period’s own days, oldest first, and leaves the days outside it out');

const orders = sheetOf('orders', bundle);
assert.equal(orders.name, 'sales-by-transaction');
assert.equal(orders.rows.length, 3, 'one row per transaction inside the period');
assert.deepEqual(orders.recordKeys, ['transaction:opens', 'transaction:link-1', 'transaction:closes'],
  'every row names the record it came from, which is what coverage is measured on');

/* ── 2 · THE DESCRIPTION REACHES THE ROW ──────────────────────────────────────────────────── */

const described = orders.head.indexOf('what it is for');
assert.ok(described >= 0, 'the transaction sheet carries the column the description lands in');
assert.equal(orders.rows[1][described], DESCRIBED,
  'the words the shop typed on the payment link are the cell, unchanged');
assert.equal(orders.rows[0][described], '', 'a sale made without a link leaves the column empty');

const csv = csvOf(orders);
const lines = csv.split('\r\n');
assert.equal(lines.length, 4, 'a heading and three rows, ended the way a spreadsheet reads them');
assert.equal(lines[0], orders.head.join(','), 'the heading is the sheet’s own columns');
assert.ok(csv.includes('"Gaseosas, ""Inca Kola"" x12 — cumpleaños"'),
  'a comma and a quote inside the description are wrapped and doubled, so the columns hold');
assert.equal(lines[2].split(',').length > 1, true, 'the described row still has its own columns');
assert.ok(lines[2].includes('https://shop.example.invalid/collect/req-1/t'),
  'the payment page the description rode in on is on the row beside it');

/* The figure is written plain, with a dot, because the comma is this file's separator. */
assert.equal(amountOf(26500), '265.00');
assert.equal(amountOf(0), '0.00');
assert.equal(orders.rows[1][orders.head.indexOf('amount')], '265.00');
assert.equal(orders.rows[1][orders.head.indexOf('currency')], 'PEN');

/* ── 3 · WHAT THE COPY DROPPED ────────────────────────────────────────────────────────────── */

const customers = sheetOf('customers', bundle);
assert.equal(customers.head.includes('tarifa'), false, 'the customers sheet lost the tarifa column');
for (const sheet of [orders, customers]) {
  for (const column of sheet.head) {
    assert.equal(/price|tarifa/i.test(column), false, `${sheet.name} carries no price column: ${column}`);
  }
}
assert.deepEqual(customers.rows[0], ['rosa', 'Rosa menú', '+51 971 000 001', 'whatsapp', 'Av. Gran Chimú',
  'fiado', 2, '318.00', 2, '318.00', '2026-09-05', 'PEN']);
assert.deepEqual(customers.recordKeys, ['customer:rosa', 'customer:elmer']);

/* ── 4 · THE DOCUMENT, AND ITS NAME ───────────────────────────────────────────────────────── */

const document_ = paperDocument(bundle);
assert.equal(document_.sheets.length, 2, 'two sheets: by transaction and by customer');
assert.equal(document_.rows, 5, 'the document counts the rows it actually carries');
assert.equal(fileNameOf(orders, cast.house.name, cast.referenceDay),
  'rocoto-bodega-yesenia-sales-by-transaction-2026-09-18.csv',
  'the file names the shop, the sheet and the day');

/* ── 5 · THE NINETY DAYS ARE IN THE FILE, AND THE RECORD'S OWN COUNTS SAY SO ───────────────────
 *
 * The door names 90 days. Two taps away `#/money/record` prints `218 of 284 sales` over the last 28
 * days and `26 of 28 days` with a sale. A file that named those 90 days and held the day's twelve
 * orders would be a book twenty times smaller than the record standing beside it — so `back-run.ts`
 * writes the days behind today from those very counts, and this section is what keeps the two
 * screens the same shop.
 */
const DAY_MS = 86400000;
const dayValue = (iso) => Date.parse(`${iso}T12:00:00Z`);
const dayBefore = (iso, days) => new Date(dayValue(iso) - days * DAY_MS).toISOString().slice(0, 10);

/* ── THE SEED ROLLS ONTO THE DAY THE APP IS OPENED (the QA pass, item 17) ──────────────────────
 * Money used to compute against `referenceDay` while Prep took today from the workspace clock, so
 * a purchase two days past its day agreed printed «Late · 1 day» and the export was named for 18
 * September for ever. The seed keeps its ANCHOR and the book is rolled — `seedDay` in
 * `supplier-payments.ts` — so these assertions roll with it. The shift is computed here the same
 * way, in Lima's own day, rather than imported, so the test states the rule rather than the code. */
const limaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(new Date());
const SHIFT = Math.round((dayValue(limaToday) - dayValue(cast.referenceDay)) / DAY_MS);
const rolled = (iso) => new Date(dayValue(iso) + SHIFT * DAY_MS).toISOString().slice(0, 10);
const rolledWindow = { ...cast.money.windows.money, from: rolled(cast.money.windows.money.from), to: rolled(cast.money.windows.money.to) };
const rolledPrepDay = rolled(cast.prepDay.date);

const indicator = (id) => cast.money.record.indicators.find((row) => row.id === id);
const salesRow = indicator('sales-with-the-payment-recorded');
const daysRow = indicator('days-with-a-sale');
const today = cast.prepDay.orders;
const seeded = backRun();
const countedFrom = dayBefore(rolledWindow.to, daysRow.of - 1);
const counted = seeded.filter((sale) => sale.day >= countedFrom);

assert.equal(counted.length + today.length, salesRow.of,
  'the record’s own window holds the record’s own number of sales, the day’s twelve among them');
assert.equal(new Set([...counted.map((sale) => sale.day), rolledPrepDay]).size, daysRow.count,
  'a sale lands on as many days as `Days with a sale` counts');

/* AND ON THE WINDOW THE SCREEN ACTUALLY PRINTS. `Days with a sale` is clamped to the connection
   (`record.ts clampedWindow`), so a shop in line since 3 September reads `15 of 16 days` — and the
   same book has to hold that reading too, because that is the figure beside the export door. */
const sinceConnected = Math.round(
  (dayValue(limaToday) - dayValue(rolled(cast.money.queue.inLineSince))) / DAY_MS) + 1;
const clamped = Math.max(1, Math.min(daysRow.of, sinceConnected));
const clampedFrom = dayBefore(rolledWindow.to, clamped - 1);
assert.equal(
  new Set([...seeded.filter((sale) => sale.day >= clampedFrom).map((sale) => sale.day), rolledPrepDay]).size,
  Math.round((daysRow.count * clamped) / daysRow.of),
  'the clamped window holds the days the clamped reading prints, at the ledger’s own rate');
assert.equal(
  counted.filter((sale) => sale.state === PAID).length + today.filter((order) => order.settles !== 'fiado').length,
  salesRow.count, 'the payment is recorded on exactly the sales that indicator counts');
assert.ok(seeded.some((sale) => sale.state === DELIVERED),
  'the sales whose payment is still to be recorded are in the book, which is the gap that indicator measures');

/* The shop shuts one day a fortnight, and that is what leaves two days of the 28 with no sale. */
const dayOff = (iso) => Math.round((dayValue(rolledWindow.to) - dayValue(iso)) / DAY_MS);
for (const sale of seeded) {
  assert.equal(shut(dayOff(sale.day)), false, `the shop traded on ${sale.day}, so no sale sits on a day it shut`);
  assert.ok(withinWindow(sale.day, rolledWindow), `the seeded sale of ${sale.day} stands in the money window`);
  assert.notEqual(sale.day, rolledPrepDay, 'the day the app is opened carries the day’s own twelve orders and nothing seeded');
}
assert.equal(new Set(seeded.map((sale) => sale.reference)).size, seeded.length,
  'every row has its own reference, because coverage is measured on it');

/* THE FIADO BOOK IS THE SAME MONEY IN BOTH SHEETS: what the customer row says is owed is what the
   transaction rows of that customer's open fiados come to, and the oldest carries `owed since`. */
for (const row of cast.money.fiadoBook.rows) {
  const open = seeded.filter((sale) => sale.customerId === row.customer && sale.state === FIADO);
  assert.equal(open.length, row.sales, `${row.customer} has as many open fiados as the book says`);
  assert.equal(open.reduce((total, sale) => total + sale.amountMinor, 0), row.amountMinor,
    `${row.customer}’s open fiados come to the figure the book states`);
  assert.equal(open[0].day, rolled(row.since), `${row.customer}’s oldest open fiado is dated the day the book says`);
}

/* The seeded days stay under the day the fixtures call a peak, and leave the counter its takings. */
const perDay = new Map();
for (const sale of seeded) perDay.set(sale.day, (perDay.get(sale.day) ?? 0) + sale.amountMinor);
const mean = [...perDay.values()].reduce((total, day) => total + day, 0) / perDay.size;
assert.ok(mean < cast.prepDay.averageDayMinor,
  'the seeded orders of an average day sit under the day the seed declares, so the counter keeps its share');
assert.ok(mean < cast.prepDay.ordersTotalMinor,
  'and under the reference day, which the fixtures call the Friday peak');

/* AND THE DOOR WRITES THEM: `seededBundle` is the day's twelve on top of the run proved above. */
const door = readFileSync(
  new URL('../src/prototypes/bodega-pay-later/paper/export.tsx', import.meta.url), 'utf8');
assert.match(door, /\[\s*\.\.\.backRun\(\)/, 'the seeded bundle opens on the 90 days');
assert.match(door, /\$\{document_\.sheets\[0\]\.rows\.length\} sales/,
  'and the line above the doors counts the rows the file actually holds');

console.log('bodega export: the declared window holds, its 90 days stand up to the record, '
  + 'and a payment link’s description reaches its row');
