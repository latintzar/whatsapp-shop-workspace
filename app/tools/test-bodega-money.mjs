/* MONEY, FOR THE BODEGA — the arithmetic a shop has to be able to recount, pinned.
 *
 * DESIGN-SPEC.md §8 asks this file for two things by name:
 *
 *   · «The indicators reproduce a worked day-14 reading and the level rule.» The reading below is
 *     day 14 of a shop that connected on 3 September — the day the 28-day window is CLAMPED to 14
 *     and the payment indicator still sits under its bank-graded floor — and the whole level rule
 *     is walked from `Starting` up to `Punctual` and back down through the thirty quiet days.
 *   · «The bundle reaches no `ADVANCE_*` constant, `advanceLimitOf` call or NubeFact route.» That
 *     is proved twice: by a sweep of every file in this prototype's directory, and by walking the
 *     IMPORT CLOSURE out of `areas/money.tsx` — the graph the browser actually loads — so a Cedar
 *     module that reached `money-finance.ts` three imports deep would fail here.
 *
 * And two more the same section asks of Money: that a new payment link carries the description the
 * shop typed into its request, its buyer page, its message and its export row; and that no string
 * states a credit amount, limit, rate, term or date while the lender name is empty.
 *
 * The drive proves the same rules on the rendered surface (`drives/drive-268-bodega-money.py`).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { loadTypeScript, APP_ROOT } from './ts-module.mjs';

const DIR = 'src/prototypes/bodega-pay-later';

const record = loadTypeScript(`${DIR}/record.ts`, 'bodega-record');
const payments = loadTypeScript(`${DIR}/supplier-payments.ts`, 'bodega-supplier-payments');
const paylater = loadTypeScript(`${DIR}/paylater.ts`, 'bodega-paylater');
const queue = loadTypeScript(`${DIR}/queue.ts`, 'bodega-queue');
const chase = loadTypeScript(`${DIR}/chase.ts`, 'bodega-chase');
const law = loadTypeScript(`${DIR}/regulatory.ts`, 'bodega-regulatory');

const seed = JSON.parse(readFileSync(join(APP_ROOT, DIR, 'fixtures/cast-bodega.json'), 'utf8'));

/* ══ THE WORKED DAY-14 READING ═══════════════════════════════════════════════════════════════
 *
 * The shop connected on 3 September, so on 16 September it is FOURTEEN DAYS OLD. Two things the
 * spec asks for are visible only at that age:
 *
 *   · `Days with a sale` counts over 14 days rather than 28 — «28 days, CLAMPED TO THE CONNECTION»
 *   · `Paid on the day` sits under its floor, because two bank-graded payments is short of three,
 *     so the row reads `Unknown · Counts from 3 payments` and the level word is `Starting`
 *
 * The figures: 2 of 2 payments landed on the day, both graded by the bank; 13 of the 14 days
 * carried a sale; 96 of the 128 sales in the window have their payment recorded.
 */
const DAY_14 = {
  asOf: '2026-09-16',
  connectedOn: '2026-09-03',
  lastMeasuredPaymentOn: '2026-09-12',
  indicators: [
    { id: 'paid-on-the-day', count: 2, of: 2, bankGraded: 2,
      newestReason: '12 Sep · Paid on the day · Distribuidora Aurora · confirmed by your bank' },
    { id: 'days-with-a-sale', count: 13, of: 14, newestReason: '16 Sep · A sale recorded today' },
    { id: 'sales-with-the-payment-recorded', count: 96, of: 128,
      newestReason: '16 Sep · Payment recorded · matched by Rocoto' },
  ],
};

test('day 14 · the 28-day window is clamped to the connection', () => {
  assert.equal(record.daysInclusive('2026-09-03', '2026-09-16'), 14);
  assert.equal(record.clampedWindow('days-with-a-sale', DAY_14), 14);
  assert.equal(record.clampedWindow('sales-with-the-payment-recorded', DAY_14), 28,
    'only the days indicator is clamped; the other two keep their declared window');
  assert.equal(record.clampedWindow('paid-on-the-day', DAY_14), 90);
});

test('day 14 · a floor counts bank-graded events alone, and an indicator under it reads Unknown', () => {
  const reading = record.readRecord(DAY_14);
  const [paid, days, sales] = reading.indicators;

  assert.equal(paid.id, 'paid-on-the-day');
  assert.equal(paid.measured, false, 'two bank-graded payments is short of the floor of three');
  assert.equal(paid.words, 'Unknown · Counts from 3 payments');
  assert.equal(paid.perCent, null, 'an unmeasured indicator states no ratio');
  assert.equal(paid.gradeWords, '2 of 2 payments confirmed by your bank');
  assert.equal(paid.floor, 3);

  assert.equal(days.words, '13 of 14 days');
  assert.equal(days.perCent, 92);
  assert.equal(days.windowDays, 14, 'the window the row prints is the clamped one');

  assert.equal(sales.words, '96 of 128 sales');
  assert.equal(sales.perCent, 75);
});

test('day 14 · the level word is Starting, and it names the indicator holding it there', () => {
  const reading = record.readRecord(DAY_14);
  assert.equal(reading.level, 'Starting');
  assert.equal(reading.levelReason, 'Paid on the day counts from 3 payments');
  assert.equal(reading.stepped, false);
});

test('the level rule is printed on the screen, in three lines and one more', () => {
  const reading = record.readRecord(DAY_14);
  assert.deepEqual(reading.rule, [
    'Starting · while an indicator sits under its floor',
    'Steady · every indicator at 80 / 60 / 70 per cent or better',
    'Punctual · every supplier payment in the 90 days paid on or before the day, plus 80 and 85 per cent',
  ]);
  /* THE FOURTH LINE IS PUNCTUATED LIKE THE THREE ABOVE IT AND READS AS A SENTENCE (item 21). */
  assert.equal(reading.quietRule, 'The band steps down when your last measured payment is thirty days old');
  assert.equal(/\.$/.test(reading.quietRule), false, 'the four rule lines end alike');
  assert.deepEqual([...record.LEVELS], ['Starting', 'Steady', 'Punctual']);
});

/* ══ THE SAME RULE, WALKED ═══════════════════════════════════════════════════════════════════ */

const reading = (over) => record.readRecord({
  asOf: '2026-09-18', connectedOn: '2026-06-20', lastMeasuredPaymentOn: '2026-09-12',
  indicators: [
    { id: 'paid-on-the-day', count: 9, of: 9, bankGraded: 8 },
    { id: 'days-with-a-sale', count: 26, of: 28 },
    { id: 'sales-with-the-payment-recorded', count: 250, of: 284 },
  ].map((row) => ({ ...row, ...(over[row.id] ?? {}) })),
  ...(over.clock ?? {}),
});

test('Punctual asks for every payment on the day, plus 80 and 85 per cent', () => {
  assert.equal(reading({}).level, 'Punctual');
  // One payment after the day agreed, and the band steps back to Steady.
  assert.equal(reading({ 'paid-on-the-day': { count: 8, of: 9 } }).level, 'Steady');
  // Sales with the payment recorded under 85 per cent is also short of Punctual.
  assert.equal(reading({ 'sales-with-the-payment-recorded': { count: 218, of: 284 } }).level, 'Steady');
});

test('Steady asks for 80 / 60 / 70, and under any one of them the word is Starting', () => {
  const short = reading({ 'sales-with-the-payment-recorded': { count: 150, of: 284 } });
  assert.equal(short.level, 'Starting');
  assert.match(short.levelReason, /^Sales with the payment recorded at 52 per cent, and Steady asks for 70$/);
});

test('thirty days since the last measured payment step the band down, with its own line', () => {
  const quiet = record.readRecord({
    asOf: '2026-10-20', connectedOn: '2026-06-20', lastMeasuredPaymentOn: '2026-09-12',
    indicators: [
      { id: 'paid-on-the-day', count: 9, of: 9, bankGraded: 8 },
      { id: 'days-with-a-sale', count: 26, of: 28 },
      { id: 'sales-with-the-payment-recorded', count: 250, of: 284 },
    ],
  });
  assert.equal(quiet.stepped, true);
  assert.equal(quiet.level, 'Steady', 'Punctual steps down one band');
  assert.equal(quiet.levelReason, '30 days since your last measured payment, so the band stepped down to Steady');
});

const seeded = () => record.readRecord({
  asOf: seed.referenceDay,
  connectedOn: seed.money.queue.inLineSince,
  lastMeasuredPaymentOn: seed.money.payables.settled[0].paid,
  indicators: seed.money.record.indicators.map((row) => ({
    id: row.id, count: row.count, of: row.of, bankGraded: row.bankGraded, newestReason: row.newestReason,
  })),
});

test('the seeded 90-day reading is the one the fixture states: Steady', () => {
  const reading90 = seeded();
  assert.equal(reading90.level, seed.money.record.level);
  assert.equal(reading90.level, 'Steady');
  assert.deepEqual(reading90.indicators.map((row) => row.perCent), [88, 93, 76]);
  assert.equal(reading90.indicators[0].gradeWords, '7 of 9 payments confirmed by your bank');
});

/* THE ONE SENTENCE UNDER THE BIG WORD SAYS WHAT IS. The record is what a lender reads, so its
   most-read line states the payments that landed as agreed; the shortfall is countable in the
   payment indicator's own `8 of 9 · 88%` underneath, which is where a shop can act on it. */
test('the reason under the level word states what landed, and states it positively', () => {
  const reading90 = seeded();
  assert.equal(reading90.levelReason, '8 of your 9 supplier payments landed on or before the day agreed');
  assert.equal(reading90.indicators[0].words, '8 of 9 payments');
  for (const word of [' after the day', 'late', 'missed', 'failed']) {
    assert.equal(reading90.levelReason.includes(word), false, `the reason line says ${word} nowhere`);
  }
});

/* A COUNT NEVER OVERRUNS THE WINDOW IT IS PRINTED UNDER. The shop connected on 3 September, so on
   18 September `Days with a sale` prints over SIXTEEN days — and «26 of 28 days» inside a 16-day
   window is the one figure a shop could never recount. The ledger's declared 28-day reading is
   read over the clamped window at its own rate: 26 of 28 becomes 15 of 16. */
test('a day count sits inside the window the row prints', () => {
  const reading90 = seeded();
  const days = reading90.indicators.find((row) => row.id === 'days-with-a-sale');
  assert.equal(days.windowDays, 16, '3 September to 18 September is 16 days');
  assert.ok(days.of <= days.windowDays,
    `${days.of} days counted inside a ${days.windowDays}-day window`);
  assert.ok(days.count <= days.of, `${days.count} of ${days.of}`);
  assert.equal(days.words, '15 of 16 days');

  // The day-14 reading already arrives sized to its window, so the clamp leaves it as it stands.
  const day14 = record.readRecord(DAY_14).indicators.find((row) => row.id === 'days-with-a-sale');
  assert.equal(day14.words, '13 of 14 days');
  assert.ok(day14.of <= day14.windowDays);

  // A shop six days old sits under the floor of 7 days rather than over a stale 28.
  const young = record.readRecord({ ...DAY_14, asOf: '2026-09-08' })
    .indicators.find((row) => row.id === 'days-with-a-sale');
  assert.equal(young.windowDays, 6);
  assert.ok(young.of <= young.windowDays);
  assert.equal(young.words, 'Unknown · Counts from 7 days');

  // Events keep their own denominators: 284 sales in 28 days is no contradiction.
  const sales = reading90.indicators.find((row) => row.id === 'sales-with-the-payment-recorded');
  assert.equal(sales.words, '218 of 284 sales');
  assert.equal(sales.windowDays, 28);
});

test('points and weights are absent — the module computes no score', () => {
  const reading90 = record.readRecord(DAY_14);
  const keys = new Set(Object.keys(reading90).concat(Object.keys(reading90.indicators[0])));
  for (const banned of ['points', 'weight', 'weights', 'score', 'total']) {
    assert.equal(keys.has(banned), false, `a reading states ${banned} nowhere`);
  }
  const source = readFileSync(join(APP_ROOT, DIR, 'record.ts'), 'utf8');
  assert.equal(/\bpoints\b|\bweighted\b\s*total/i.test(source.replace(/\/\*[\s\S]*?\*\//g, '')), false);
});

/* ══ THE PURCHASES, AND THE FIVE WORDS ═══════════════════════════════════════════════════════ */

const purchase = (over = {}) => ({
  id: 'p1', supplierId: 'abarrotes', supplierName: 'Distribuidora Aurora',
  amountMinor: 68200, deliveredOn: '2026-09-16', dueOn: '2026-09-23', ...over,
});

test('the state words are the five this set allows, and `Offered` waits for a lender', () => {
  assert.equal(payments.purchaseState(purchase(), '2026-09-18').word, 'Due 23 Sep');
  assert.equal(payments.purchaseState(purchase({ dueOn: '2026-09-15' }), '2026-09-18').word, 'Late · 3 days');
  assert.equal(payments.purchaseState(purchase({ dueOn: '2026-09-17' }), '2026-09-18').word, 'Late · 1 day');
  assert.equal(payments.purchaseState(purchase({ settledOn: '2026-09-12' }), '2026-09-18').word, 'Settled 12 Sep');
  // pay-later's own two words render only once a lender signs
  const offered = purchase({ payLater: 'offered' });
  assert.equal(payments.purchaseState(offered, '2026-09-18', false).word, 'Due 23 Sep');
  assert.equal(payments.purchaseState(offered, '2026-09-18', true).word, 'Offered');
  assert.equal(payments.purchaseState(purchase({ payLater: 'used' }), '2026-09-18', true).word, 'Used');
});

test('the month is written out, so `Due 24 Sep` is the word rather than the locale of the day', () => {
  assert.equal(payments.purchaseDate('2026-09-24'), '24 Sep');
  assert.equal(payments.purchaseDate('2026-09-12'), '12 Sep');
  assert.equal(payments.purchaseDate('2026-06-20'), '20 Jun');
  assert.equal(payments.purchaseDate('nonsense'), '');
});

test('an amount rides a row only where the fixtures declare one', () => {
  assert.equal(payments.purchaseCarriesAmount(purchase()), true);
  const quantityOnly = purchase({ amountMinor: undefined, quantityLine: '2 sacos, 1 caja' });
  assert.equal(payments.purchaseCarriesAmount(quantityOnly), false,
    'the chat corpus states quantities and states a price nowhere');
  assert.equal(quantityOnly.quantityLine, '2 sacos, 1 caja');
  // every purchase the money seed declares carries its own integer amount, in minor units
  for (const row of seed.money.payables.rows) {
    assert.equal(Number.isSafeInteger(row.amountMinor), true, `${row.supplier} carries an integer amount`);
  }
});

test('the card prints its own window over its own rows', () => {
  const rows = seed.money.payables.rows.map((row, index) => ({
    id: `p${index}`, supplierId: row.supplier, supplierName: row.supplier,
    amountMinor: row.amountMinor, deliveredOn: row.delivered, dueOn: row.due,
  }));
  assert.equal(payments.purchaseSummary(rows, seed.referenceDay), '4 purchases to pay · 1 late');
  assert.equal(payments.purchaseSummary([], seed.referenceDay), '0 purchases to pay');
});

test('settlement is the matched bank debit or her own dated word, and only the bank grades a floor', () => {
  const rows = [
    { ...purchase({ id: 'bank', settledOn: '2026-09-12', dueOn: '2026-09-14', settledBy: 'bank',
      settledNote: 'confirmed by your bank' }) },
    { ...purchase({ id: 'shop', settledOn: '2026-09-17', dueOn: '2026-09-16', settledBy: 'shop' }) },
  ];
  const grades = payments.paymentGrades(rows, '2026-09-18');
  assert.equal(grades.measured, 2);
  assert.equal(grades.onTheDay, 1, 'the shop-graded one landed a day after the day agreed');
  assert.equal(grades.bankGraded, 1);
  assert.equal(grades.newestOn, '2026-09-17');
  assert.match(grades.newestReason, /^17 Sep · Paid 1 days after the day agreed · Distribuidora Aurora ·/);
});

test('her own `I paid it` lands on the row, dated, and a second one replaces the first', () => {
  let book = payments.emptyPaidBook('bodega');
  book = payments.confirmPaid(book, 'p1', '2026-09-18', '2026-09-18T12:00:00.000Z');
  book = payments.confirmPaid(book, 'p1', '2026-09-17', '2026-09-18T12:05:00.000Z');
  assert.equal(book.rows.length, 1);
  assert.equal(book.rows[0].on, '2026-09-17');
  const [row] = payments.withConfirmations([purchase()], book);
  assert.equal(row.settledOn, '2026-09-17');
  assert.equal(row.settledBy, 'shop');
  assert.equal(payments.parsePaidBook(JSON.parse(JSON.stringify(book)), 'bodega').rows.length, 1);
  assert.equal(payments.parsePaidBook({ version: 1, scope: 'other', rows: [] }, 'bodega').rows.length, 0);
});

/* ══ PAY-LATER · PER PURCHASE, AT THIRTY DAYS, BEHIND THE LENDER ═════════════════════════════ */

test('pay-later is per purchase at thirty days, and it holds no limit', () => {
  assert.equal(paylater.PAY_LATER_DAYS, 30);
  assert.equal(paylater.payLaterDueOn('2026-09-16'), '2026-10-16');
  assert.deepEqual(paylater.PAY_LATER_WORD, { offered: 'Offered', used: 'Used' });
  assert.equal(paylater.payLaterVisible(''), false, 'the words wait for a signed lender');
  assert.equal(paylater.payLaterVisible('A signed lender'), true);
  assert.equal(paylater.PAY_LATER_PLACEHOLDER, 'pay-later');
});

/* ══ THE CREDIT LAW ══════════════════════════════════════════════════════════════════════════ */

test('the lender is unnamed, so every credit string this surface prints makes no credit claim', () => {
  assert.equal(law.LENDER_NAME, '');
  assert.equal(law.lenderSigned(), false);
  assert.deepEqual(law.creditLawClear(law.CREDIT_SURFACE_STRINGS), [],
    'no string states a credit amount, limit, rate, term or date while the lender name is empty');
});

test('the gate goes red on a claim, on purpose', () => {
  assert.deepEqual(law.creditLawClear(['Your rate is 3 per cent']), ['Your rate is 3 per cent']);
  assert.deepEqual(law.creditLawClear(['Pre-aprobado']), ['Pre-aprobado']);
  assert.deepEqual(law.creditLawClear(['Up to S/ 5,000']), ['Up to S/ 5,000']);
  assert.deepEqual(law.creditLawClear(['Repay by 24 September']), ['Repay by 24 September']);
  // Once a lender signs, the same strings pass: the gate is the signature, not the vocabulary.
  assert.deepEqual(law.creditLawClear(['Your rate is 3 per cent'], 'A signed lender'), []);
});

test('the cleared lines ship byte-exact, with their English source beside them', () => {
  assert.equal(law.QUEUE_LINE_ES, seed.money.queue.clearedLine);
  assert.equal(law.QUEUE_LINE_EN, seed.money.queue.clearedLineSource);
  assert.equal(law.QUEUE_LINE_EN,
    'Businesses already using Rocoto go first, and every business you bring moves you up.');
  assert.equal(law.WORKING_CAPITAL_ES,
    'Estamos preparando crédito de capital de trabajo para negocios como el tuyo, con una entidad financiera supervisada por la SBS.');
});

/* ══ THE PLACE IN THE LIST ═══════════════════════════════════════════════════════════════════ */

test('a standing holds no position and no queue length', () => {
  const standing = queue.queueStanding(seed.money.queue, []);
  assert.equal('position' in standing, false, 'a position number was dropped on Peter’s read of 18 September');
  assert.equal('length' in standing, false);
  assert.equal(queue.inLineWords(standing.inLineSince), 'In line since 3 September');
  assert.equal(queue.supplierCountWords(standing), 'Suppliers on Rocoto · 4 of 9 invited · 2 connected');
  assert.equal(queue.PLACE_MOVES_LINE, 'Your place moves when a supplier you brought joins.');
});

test('`Suppliers you brought` reads referrals.ts’s four states, from `sent` on', () => {
  assert.deepEqual([...queue.INVITE_STATES], ['ready', 'sent', 'invited', 'connected']);
  assert.deepEqual(queue.INVITE_WORD,
    { ready: 'Ready', sent: 'Sent', invited: 'Invited', connected: 'Connected' });
  const invites = ['ready', 'sent', 'invited', 'connected'].map((state, index) => ({
    id: `i${index}`, scope: 'bodega', supplierId: `s${index}`, name: `Supplier ${index}`,
    phone: '+51951603307', token: `t${index}`, state,
  }));
  const brought = queue.suppliersBrought(invites);
  assert.deepEqual(brought.map((row) => row.state), ['connected', 'invited', 'sent'],
    'a row that is still `ready` has yet to be brought');
  const standing = queue.queueStanding(seed.money.queue, invites);
  assert.equal(standing.invited, 7, 'the four seeded invitations plus the three sent rows');
  assert.equal(standing.connected, 3);
});

test('the four states have one writer, and Money is a reader of it', () => {
  const referrals = loadTypeScript(`${DIR}/referrals.ts`, 'bodega-referrals');
  // `queue.ts` re-exports referrals.ts's own table rather than restating it; two tool compiles
  // give two module instances, so the claim is read on the values.
  assert.deepEqual(queue.INVITE_WORD, referrals.INVITE_WORD);
  assert.deepEqual(queue.INVITE_WORD,
    { ready: 'Ready', sent: 'Sent', invited: 'Invited', connected: 'Connected' });
  const source = readFileSync(join(APP_ROOT, DIR, 'queue.ts'), 'utf8');
  assert.match(source, /from '\.\/referrals'/, 'the states are imported rather than restated');
  const book = referrals.emptyBook('bodega');
  const proposed = referrals.propose(book, { id: 'abarrotes', name: 'Distribuidora Aurora',
    phone: '+51 957 621 349' }, '2026-09-18T12:00:00.000Z', () => 0.5);
  assert.equal(proposed.row.state, 'ready');
  assert.deepEqual(queue.suppliersBrought(proposed.book.rows), [],
    'a row that is still `ready` has yet to be brought');
  const sent = referrals.move(proposed.book, proposed.row.id, 'sent', '2026-09-18T12:05:00.000Z');
  assert.equal(queue.suppliersBrought(sent.rows).length, 1);
  assert.equal(queue.queueStanding(seed.money.queue, sent.rows).invited, 4,
    'that supplier was already among the four the seed had invited');
});

/* ══ THE FIADO REMINDER, WITH CEDAR'S FEE RUNG DROPPED ═══════════════════════════════════════ */

/* IT IS THE ONE STRING THAT LEAVES THE APP FOR A CUSTOMER'S PHONE, so it is written in HER
   language and greets her by her NAME — the first word of the shop's own contact tag, because
   «Maribel obra» is «Maribel building-site» said out loud (the QA pass, item 39). MESSAGES.md
   row 14 is the cleared sentence, and this is it verbatim. */
test('the reminder states the sale, the amount and the date, in Spanish, and it carries no fee', () => {
  const words = chase.chaseMessageOf({
    customerName: 'Rosa menú', saleDateText: '2 de setiembre', amountText: 'S/ 48.00',
    link: 'https://rocoto.invalid/collect/abc/def',
  });
  assert.equal(words,
    'Hola Rosa, tu compra del 2 de setiembre por S/ 48.00 sigue pendiente. Te dejo el link para pagar: https://rocoto.invalid/collect/abc/def');
  assert.equal(chase.chaseMessageOf({ customerName: 'Rosa menú', saleDateText: '2 de setiembre',
    amountText: 'S/ 48.00', link: '' }),
  'Hola Rosa, tu compra del 2 de setiembre por S/ 48.00 sigue pendiente.');
  assert.equal(chase.firstName('Maribel obra'), 'Maribel', 'the shop’s note to itself stays out of the greeting');
  assert.equal(chase.firstName('Julia 2do piso'), 'Julia');
  for (const key of ['CHASE_FEE_BASIS_POINTS', 'CHASE_FEE_DAYS', 'chaseFeeMinor', 'chaseFeeDate']) {
    assert.equal(key in chase, false, `Cedar's fee rung left with the copy: ${key}`);
  }
  assert.equal(/fee|recargo|mora/i.test(words), false);
});

test('the ladder has three rungs, its key is this prototype’s own, and the third flags a person', () => {
  assert.equal(chase.CHASE_STEPS, 3);
  assert.equal(chase.chaseKey('bodega'), 'rocoto-bodega-chase-v1:bodega');
  assert.equal(chase.chaseStepWords(2), 'Reminder 2 of 3');
  let held = chase.emptyChaseRecord('rosa');
  for (const step of [1, 2, 3]) {
    held = chase.recordSend(held, { at: `2026-09-1${step}T09:41:00.000Z`, step, channel: 'whatsapp', text: 'x' }, 24);
  }
  assert.equal(held.sends.length, 3);
  assert.equal(held.flaggedAt, '2026-09-13T09:41:00.000Z');
  assert.equal(chase.chaseStepOf(held), 3, 'the step is capped at the last rung');
});

/* ══ THE PAYMENT PAGE CARRIES THE WORDS THE SHOP TYPED ═══════════════════════════════════════ */

test('the description the shop typed rides the request, the page, the message and the export row', () => {
  const api = loadTypeScript(`${DIR}/money-api.ts`, 'bodega-money-api');
  const payload = api.paymentLinkPayload({
    id: 'link-1', amountMinor: 4800, description: 'Fiado of 2 September', customerName: 'Rosa menú',
    reference: 'BODEGA-LINK1', sellerName: 'Bodega Yesenia', receivingBank: 'bbva',
    accountLabel: 'ahorros · moneda nacional', sampleClock: '2026-09-18T12:00:00-05:00',
  });
  // 1 · the request copper creates
  assert.equal(payload.description, 'Fiado of 2 September');
  assert.equal(payload.amount_minor, 4800);
  assert.equal(payload.currency, 'PEN');
  assert.equal('billing_draft' in payload, false, 'fiscal is off, so no draft rides this rail');
  assert.equal('commercial_document' in payload, false);
  // 2 · the message the customer reads carries the same string through the reminder
  const message = chase.chaseMessageOf({ customerName: 'Rosa menú', saleDateText: '2 September',
    amountText: 'S/ 48.00', link: 'https://rocoto.invalid/collect/abc/def' });
  assert.match(message, /https:\/\/rocoto\.invalid\/collect\/abc\/def$/);
  // 3 · the export row. THE DOOR MOVED (`paper/export.tsx`, `paper/export-files.ts`): the sheet is
  //     built by `ledgerBundle` and written by `sheetOf` now, rather than by a head stated inside
  //     `money-overview.tsx`. The claim is the same one — the words the shop typed reach the row of
  //     the file that row is about — so it is read where those two files carry it.
  const bundle = readFileSync(join(APP_ROOT, DIR, 'paper/export.tsx'), 'utf8');
  assert.match(bundle, /describedAs: link\.description/);
  const sheet = readFileSync(join(APP_ROOT, DIR, 'paper/export-files.ts'), 'utf8');
  assert.match(sheet, /'what it is for'/);
  assert.match(sheet, /row\.describedAs/);
  // 4 · the buyer page is copper's own, reached by the URL the service returns
  const api_source = readFileSync(join(APP_ROOT, DIR, 'money-api.ts'), 'utf8');
  assert.match(api_source, /url\.pathname\.startsWith\('\/collect\/'\)/);
});

test('the copied stores rename their prefixes, so neither prototype edits the other’s ledger', () => {
  const keys = readFileSync(join(APP_ROOT, DIR, 'store/keys.ts'), 'utf8');
  assert.match(keys, /export const PREFIX = 'rocoto-bodega-';/);
  for (const [file, key] of [
    ['money-store.ts', 'KEYS.money'],
    ['money-api.ts', 'KEYS.moneyApi'],
    ['chase.ts', 'KEYS.chase'],
    ['store/declared-stock.ts', 'KEYS.declaredStock'],
    ['store/output-templates-store.ts', 'KEYS.outputTemplates'],
  ]) {
    const text = readFileSync(join(APP_ROOT, DIR, file), 'utf8');
    assert.equal(text.includes(key), true, `${file} keys off ${key}`);
    assert.equal(/rocoto-cedar-[a-z-]+-v1:/.test(text.replace(/\/\*[\s\S]*?\*\//g, '')), false,
      `${file} carries no Cedar key outside its own comments`);
  }
  /* AND THE CALL SITES REACH THE COPIES. `cedar/output-templates.ts` and `cedar/incoming.ts` keep the
     vocabulary — every fold, every act that returns the next template — so the import stays; what may
     never come back is their STORE, under `rocoto:outputs:templates:<sector>` and
     `rocoto-stock-declared-v1:<sector>`, which this shop and Cedar's fruit house would share. */
  const printing = readFileSync(join(APP_ROOT, DIR, 'shell/printing.tsx'), 'utf8');
  assert.match(printing, /import \{ readTemplates, subscribeTemplates, writeTemplates \} from '\.\.\/store\/output-templates-store';/,
    'the export centre reads and writes this shop’s own template store');
  assert.equal(/(readTemplates|writeTemplates|subscribeTemplates)[^;]*from '\.\.\/\.\.\/cedar\/output-templates'/.test(printing), false,
    'and reaches Cedar’s template store nowhere');
  const detail = readFileSync(join(APP_ROOT, DIR, 'detail.tsx'), 'utf8');
  assert.match(detail, /from '\.\/lot-allocation-book';/,
    'the detail’s allocation book is the copy, so the albarán’s lots are this shop’s declared stock');
  assert.equal(detail.includes("from '../cedar/lot-allocation-book'"), false,
    'and Cedar’s own book, which reads Cedar’s key, is imported nowhere');
  const copied = readFileSync(join(APP_ROOT, DIR, 'money-api.ts'), 'utf8');
  assert.match(copied, /from '\.\.\/cedar\/money-runtime\.json'/,
    'the copy reads the one runtime table both surfaces read, and adds no binding file');
});

/* ══ THE REVOLVING ADVANCE IS UNREACHABLE ════════════════════════════════════════════════════
 *
 * Two sweeps, because they answer two different questions.
 *
 *   THE DIRECTORY sweep asks what THIS PROTOTYPE says. Nothing here may name the revolving
 *   advance, and nothing here may call a fiscal route: fiscal is off once, so `/billing-draft`,
 *   `/commercial-document` and `/invoice` are unreachable from this directory rather than merely
 *   uncalled — the copied `money-api.ts` left those five functions behind with the invoices.
 *
 *   THE IMPORT CLOSURE out of `areas/money.tsx` asks what the BROWSER LOADS, following value
 *   imports and skipping `import type`, which the compiler erases. `money-finance.ts`, its
 *   `AdvanceDialog` and the route `#/money/advance/<minor>` must appear in no module of it.
 *
 * Cedar's own `money-api.ts` IS in the closure — `money-bank-api.ts` is imported for the bank read
 * and imports it — and it still carries its fiscal helpers. They are Cedar's, they are called from
 * nowhere in this directory, and the directory sweep is what proves that.
 */

const ADVANCE_TOKENS = [
  ['ADVANCE_', 'a revolving-advance constant'],
  ['advanceLimitOf', 'the advance limit call'],
  ['money-finance', 'Cedar\u2019s revolving advance module'],
  ['AdvanceDialog', 'Cedar\u2019s advance dialog'],
  ['#/money/advance/', 'the advance route'],
];

const FISCAL_TOKENS = [
  ['/billing-draft', 'copper\u2019s fiscal draft route'],
  ['/commercial-document', 'copper\u2019s commercial-document route'],
  ['/invoice', 'copper\u2019s invoice route'],
  ['prepareCollectionFiscal', 'the fiscal preparation call'],
  ['submitCollectionInvoice', 'the invoice submission call'],
  ['nubefact', 'a NubeFact provider call'],
];

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const walkFiles = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walkFiles(path, out);
    else if (/\.tsx?$/.test(name)) out.push(path);
  }
  return out;
};

const offencesIn = (paths, tokens, allow = () => false) => {
  const found = [];
  for (const path of paths) {
    const text = stripComments(readFileSync(path, 'utf8'));
    for (const [token, what] of tokens) {
      if (text.toLowerCase().includes(token.toLowerCase()) && !allow(path, token)) {
        found.push(`${relative(APP_ROOT, path)} reaches ${what} (${token})`);
      }
    }
  }
  return found;
};

test('no file in this prototype names the revolving advance', () => {
  assert.deepEqual(offencesIn(walkFiles(join(APP_ROOT, DIR)), ADVANCE_TOKENS), []);
});

test('no file in this prototype calls a fiscal route — fiscal is off once', () => {
  /* `money-model.ts`'s own invoice vocabulary is imported and left unwritten, so a word like
     `invoiceSeries` in a copied type is the model's, rather than a call. The tokens above are
     ROUTES and CALLS for that reason. */
  assert.deepEqual(offencesIn(walkFiles(join(APP_ROOT, DIR)), FISCAL_TOKENS), []);
});

test('the sweep goes red on a planted advance, on purpose', () => {
  const planted = offencesIn([join(APP_ROOT, 'src/prototypes/cedar/money-finance.ts')], ADVANCE_TOKENS);
  assert.ok(planted.length > 0, 'Cedar\u2019s own advance module is exactly what this sweep catches');
});

/* \u2550\u2550 THIS SHOP OPENS NO CHANNEL WORKSPACE \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
 *
 * `cedar/cedar-channel-api.ts` holds a BEARER under `rocoto-cedar-channel-access-v1:<base>`, and one
 * origin serves `/cedar/` and `/bodega-pay-later/` (WIRING-SPEC.md \u00a711) \u2014 so a surface here that
 * allocated one would spend CEDAR's connection authority from this page. This shop's own doors carry
 * their own bearers: the WhatsApp rig runs on `/api/proof/*` and the payment page on
 * `money-api.ts`'s `money-api-v1:`.
 *
 * TWO CEDAR MODULES ALLOCATE ON MOUNT, and they are the tokens: `setup-progress.tsx`, whose
 * onboarding card reads the phone posture, and `phone-runtime.ts`, which is what it reads through.
 * `email-provider.ts` stays out of the list on purpose \u2014 it checks `hasChannelWorkspace()` first and
 * reads only where a workspace already stands, which is its own file's stated rule.
 */
const CHANNEL_TOKENS = [
  ['cedar/setup-progress', 'Cedar\u2019s onboarding card, whose mount opens a channel workspace'],
  ['cedar/phone-runtime', 'Cedar\u2019s phone provider, whose mount opens a channel workspace'],
  ['channelApi(', 'a channel-workspace call'],
  ['channelWorkspace(', 'a channel-workspace allocation'],
];

test('no file in this prototype opens a channel workspace \u2014 the bearer stays Cedar\u2019s', () => {
  assert.deepEqual(offencesIn(walkFiles(join(APP_ROOT, DIR)), CHANNEL_TOKENS), []);
});

test('the channel sweep goes red on Cedar\u2019s phone provider, on purpose', () => {
  const planted = offencesIn([join(APP_ROOT, 'src/prototypes/cedar/phone-runtime.ts')], CHANNEL_TOKENS);
  assert.ok(planted.length > 0, 'the module that allocates is exactly what this sweep catches');
});

/* THE IMPORT CLOSURE OUT OF THE AREA — the graph the browser actually loads. `import type` is
 * skipped, because the compiler erases it: `export-files.ts` takes `Sale`, `Thread` and `Cast` as
 * types alone, so Cedar's scenario world reaches no bundle through it. */
const closureOf = (entry) => {
  const seen = new Set();
  const pending = [entry];
  const push = (from, specifier) => {
    const target = resolve(dirname(from), specifier);
    for (const candidate of [target, `${target}.ts`, `${target}.tsx`,
      join(target, 'index.ts'), join(target, 'index.tsx')]) {
      try {
        if (statSync(candidate).isFile()) { pending.push(candidate); return; }
      } catch { /* the next candidate */ }
    }
  };
  while (pending.length) {
    const path = pending.pop();
    if (seen.has(path) || !/\.tsx?$/.test(path)) continue;
    seen.add(path);
    let text;
    try { text = readFileSync(path, 'utf8'); } catch { continue; }
    for (const match of text.matchAll(/import\s+([\s\S]*?)\bfrom\s*['"](\.[^'"]+)['"]/g)) {
      if (/^\s*type\b/.test(match[1])) continue;
      push(path, match[2]);
    }
    for (const match of text.matchAll(/import\s*\(\s*['"](\.[^'"]+)['"]/g)) push(path, match[1]);
    for (const match of text.matchAll(/import\s*['"](\.[^'"]+)['"]/g)) push(path, match[1]);
    for (const match of text.matchAll(/import\.meta\.glob\(\s*['"]([^'"]+)['"]/g)) {
      const literal = match[1].replace(/\*/g, '');
      if (!literal.includes('*')) push(path, literal.replace(/\.tsx?$/, ''));
    }
  }
  return [...seen];
};

test('the Money area\u2019s whole import closure reaches no revolving advance', () => {
  const closure = closureOf(join(APP_ROOT, DIR, 'areas/money.tsx'));
  assert.ok(closure.length > 12, `the closure walked ${closure.length} files`);
  assert.equal(closure.some((path) => /money-finance\.tsx?$/.test(path)), false,
    'money-finance.ts stays out of the bundle');
  assert.deepEqual(offencesIn(closure, ADVANCE_TOKENS), []);
});
