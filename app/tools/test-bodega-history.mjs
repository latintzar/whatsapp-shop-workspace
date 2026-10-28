#!/usr/bin/env node
/* test-bodega-history.mjs — THE READ, over Meta's own envelope (WHATSAPP-HISTORY-SPEC.md).
 *
 * `history/read.ts` turns the shop's chats into its book: the meaning of each message, the
 * counterparty's role, the likely list with its reason lines, the counts screen 3 prints. This test
 * runs the real module over `fixtures/whatsapp-history-v1.json` — the bodega world in the envelope
 * `connections/proof/storage.py` projects — so the read under test is the shipped one.
 *
 * WHAT IT HOLDS
 *   THE ENVELOPE     2,960 messages across 27 threads project with no identity left waiting, and
 *                    the chunks' own `metadata.progress` gives `complete`.
 *   THE ROLES        18 customers and 9 suppliers, the figures screen 3 prints on this path.
 *   THE REASON LINES every row of `chatCorpus.whoOwesYou` comes back out of the messages, word for
 *                    word — the evidence is in the chats rather than in a seeded sentence.
 *   THE RULE         the laughs rule WIDENS the field to every chat and draws the top eight, the chat
 *                    with the most «jaja» first; the evidence rule keeps its own narrow six.
 *   A PERSONAL       the live rig reads Peter's own number, so a fixture of family and friends with no
 *   HISTORY          commerce at all proves Mama and Papa lead screen 4 — and that the evidence rule
 *                    finds nobody there, which is the defect the laughs rule answers.
 *   THE KINDS        the set a REAL account writes — `media_placeholder`, `edit`, `errors`, `audio`
 *                    beside `text` — each counted as what it is: a picture, a voice note, a
 *                    correction of the message before it, and a row the read passes over.
 *   THE NUMBERS      68 of the 129 chats on that account carry no contact name, so a row draws its
 *                    number in international form, the named contacts sort first, and a tie in the
 *                    ranking puts a person before a number.
 *   THE FLOOR        103 of its 120 chats hold no laugh, so screen 4 draws the chats that hold one and
 *                    says how few there are where fewer than three do.
 *   THE FIGURES      the counts screen 3 prints are the service's own `history` fields where it
 *                    reports them, and the read's own only where it does not.
 *   THE PRICE GREP   the corpus states quantities, days and names, so the envelope holds no currency
 *                    token at all and the read asserts no amount.
 *   THE AMOUNT       the figure the shop types on screen 4 leaves `start/amount.ts` as minor units in
 *                    every grammar a Peruvian shopkeeper writes, or as the one sentence the field
 *                    shows: a negative, a keystroke above the ceiling and three decimals are each
 *                    answered rather than stored.
 *
 * RUN, from app/:  node tools/test-bodega-history.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SURFACE = 'src/prototypes/bodega-pay-later';
const OUT = join(ROOT, 'node_modules', '.cache', 'bodega-history-test');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execFileSync(join(ROOT, 'node_modules', '.bin', 'tsc'), [
  `${SURFACE}/history/read.ts`,
  `${SURFACE}/history/rank.ts`,
  `${SURFACE}/start/amount.ts`,
  '--outDir', OUT,
  '--resolveJsonModule', '--esModuleInterop', '--module', 'commonjs',
  '--target', 'ES2020',
  '--strict',
  '--skipLibCheck',
  '--esModuleInterop',
], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

const require = createRequire(join(OUT, 'anchor.cjs'));
const read = require(join(OUT, 'bodega-pay-later', 'history', 'read.js'));
const rank = require(join(OUT, 'bodega-pay-later', 'history', 'rank.js'));
const amount = require(join(OUT, 'bodega-pay-later', 'start', 'amount.js'));

const cast = JSON.parse(readFileSync(join(ROOT, SURFACE, 'fixtures/cast-bodega.json'), 'utf8'));
const raw = readFileSync(join(ROOT, SURFACE, 'fixtures/whatsapp-history-v1.json'), 'utf8');
const envelope = JSON.parse(raw);

/* ── THE ENVELOPE ─────────────────────────────────────────────────────────────────────────────── */
const projected = read.projectHistory(envelope, cast.house.whatsapp);
assert.equal(projected.identityWaits, 0, 'every thread found its contact event');
assert.equal(projected.status, 'complete', 'the chunks report a finished sync');
assert.equal(projected.progress, 100);
assert.equal(projected.conversations.length, cast.chatCorpus.threads, '27 threads');
const messages = Object.values(projected.messages).reduce((total, page) => total + page.length, 0);
assert.equal(messages, cast.chatCorpus.messages, '2,960 messages');

const oldest = Object.values(projected.messages).flat().map((row) => row.timestamp).sort()[0];
assert.equal(read.monthDay(oldest), '22 March', 'the window opens on the fixture’s own day');

/* ── THE READING ──────────────────────────────────────────────────────────────────────────────── */
const readings = projected.conversations.map((conversation) =>
  read.readThread(conversation, projected.messages[conversation.id], cast.referenceDay));
const book = read.bookOf(readings, null);
assert.equal(book.customers.length, 18, '18 customers, the figure screen 3 prints');
assert.equal(book.suppliers.length, 9, '9 suppliers, the referral step’s own unit');
assert.equal(book.messages, cast.chatCorpus.messages, 'the read’s own count equals the service’s');
assert.equal(book.conversations, cast.chatCorpus.threads);
assert.ok(book.pictures > 0, 'the pictures the chats hold are counted, so the gap is a stated fact');
assert.equal(book.voiceNotes, 0, 'and this world sends its orders in words, so it holds no voice note');

/* every supplier is named by its trade, and the purchases its chat shows are the cast's own */
for (const supplier of cast.suppliers) {
  const reading = readings.find((row) => row.name === supplier.name);
  assert.ok(reading, `${supplier.name} is in the read`);
  assert.equal(reading.role, 'supplier', `${supplier.name} reads as a supplier`);
  assert.ok(reading.trade, `${supplier.name} names its trade`);
  assert.equal(reading.ordersOut, supplier.purchases,
    `${supplier.name} carries the purchases the cast declares, so the envelope and the sample world agree`);
}

/* THE PURCHASES TELL THE SUPPLIERS APART. A share of each group's message budget gave five of them
   `Bought 60 times` and four `Bought 32 times`, which says the same thing about the mayorista the shop
   buys from twice a week and about the egg man. The count now follows each supplier's own rhythm. */
const bought = cast.suppliers.map((supplier) => supplier.purchases);
assert.equal(new Set(bought).size, bought.length, 'nine suppliers, nine different purchase counts');
const purchasesOf = (id) => cast.suppliers.find((supplier) => supplier.id === id).purchases;
assert.ok(purchasesOf('pan') > purchasesOf('pollo'), 'the daily bread drop is bought from most often');
assert.ok(purchasesOf('pollo') > purchasesOf('mercado'), 'four chicken mornings a week beat two at the mayorista');
assert.ok(purchasesOf('gas') < purchasesOf('limpieza'), 'the gas man comes on call, which is least often of all');

/* THE TRADE WORD: one language, the shop's own, and silent where the name already says it. Screen 5
   printed «Distribuidora Aurora · distribuidora» and «Don Aníbal · huevos de Huaral · eggs» — half the
   list in English, and four rows of five restating the name above them. The word is quoted out of a
   Peru contact name, so each one is named here rather than checked for letters. */
const TRADE_WORD = {
  mercado: 'mercado',
  pollo: 'pollos',
  huevos: 'huevos',
  lacteos: 'lácteos',
  pan: 'panadería',
  bebidas: 'gaseosas',
  abarrotes: 'distribuidora',
  limpieza: 'limpieza',
  gas: 'gas',
};
for (const supplier of cast.suppliers) {
  assert.equal(read.tradeIn(supplier.name), TRADE_WORD[supplier.id],
    `${supplier.name}: the trade reads in the shop's own language`);
  assert.equal(read.tradeWord(supplier.name), null,
    `${supplier.name}: a name that says its trade prints the word once`);
}
assert.equal(read.tradeWord('Avícola San Fernando'), 'pollos', 'a name that leaves the trade unsaid carries the word');
assert.equal(read.tradeWord('Puesto 12 · Rita'), 'mercado', 'and so does a puesto with a number');
assert.equal(read.tradeWord('Mama'), null, 'a name that names no trade carries none');
const referrals = read.referralRows(readings, { rule: 'evidence' });
assert.equal(referrals[0].reason, `Bought ${purchasesOf('pan')} times`, 'the most purchases lead the referral list');
assert.equal(referrals.filter((row) => row.trade).length, 0, 'and every row in this world says its trade in its name');

/* ── THE REASON LINES ─────────────────────────────────────────────────────────────────────────── */
const byName = new Map(readings.map((row) => [row.name, row]));
for (const row of cast.chatCorpus.whoOwesYou.rows) {
  const person = cast.customers.find((customer) => customer.id === row.customer);
  const reading = byName.get(person.name);
  assert.ok(reading, `${person.name} is in the read`);
  assert.equal(reading.fiadoAsks, row.fiadoAsks, `${person.name}: fiado asked for`);
  assert.equal(reading.receiptsIn, row.paymentsSeen, `${person.name}: payments seen`);
  assert.equal(reading.ordersAwaitingPayment, row.ordersAwaitingPayment, `${person.name}: orders awaiting payment`);
  assert.equal(reading.lastOrderDaysAgo, row.lastOrderDaysAgo, `${person.name}: how recent the last order is`);
  assert.equal(read.reasonLine({
    fiadoAsks: reading.fiadoAsks,
    lastOrderDaysAgo: reading.lastOrderDaysAgo,
    paymentsSeen: reading.receiptsIn,
  }), row.reason, `${person.name}: the reason line, word for word`);
}

/* ── THE RULE ─────────────────────────────────────────────────────────────────────────────────── */
assert.equal(rank.RANK_RULE, 'evidence', 'the public workspace ranks trade evidence; the personal-account laughs rig remains explicitly testable');
assert.equal(rank.LAUGHS_RULE_LINE, 'Ranked by laughs in your chats for now; the debt read replaces this rule.');
assert.equal(rank.laughsIn('jajaja casera'), 1, 'a run of «ja» counts once');
assert.equal(rank.laughsIn('hahaha y jaja'), 2, 'two runs count twice');
assert.equal(rank.laughsIn('gracias casera'), 0);

const likely = read.likelyList(readings, { rule: 'laughs' });
assert.equal(likely.rule, 'laughs');
const laughs = cast.chatCorpus.laughs.byCustomer;
const owing = cast.chatCorpus.whoOwesYou.rows.map((row) =>
  cast.customers.find((customer) => customer.id === row.customer).name);
/* THE LAUGHS RULE WIDENS THE FIELD: every chat is a candidate and the rows are the top eight by
   laughs, because the rig runs on Peter's own number where a chat holds family (`rank.ts`). */
assert.equal(rank.OWED_ROWS, 8);
assert.equal(likely.rows.length, rank.OWED_ROWS, 'the rows are the top eight chats by laughs');
const byLaughs = Object.entries(laughs).sort((a, b) => b[1] - a[1]).slice(0, rank.OWED_ROWS)
  .map(([who]) => cast.customers.find((customer) => customer.id === who).name);
assert.deepEqual(likely.rows.map((row) => row.name), byLaughs,
  'and they are the eight chats the cast seeded the most laughs into, in that order');
const top = cast.customers.find((customer) => customer.id === 'nelly');
assert.equal(likely.rows[0].name, top.name, 'the chat with the most laughs stands first');
assert.equal(likely.rows[0].laughs, laughs.nelly, 'and it holds the laughs the cast seeded');
const ordered = likely.rows.map((row) => row.laughs);
assert.deepEqual(ordered, [...ordered].sort((a, b) => b - a), 'the list falls by laughs');
for (const row of likely.rows) {
  assert.match(row.reason, /^\d+ laughs? in your chat · last message [^·]+/,
    'every row reads its laughs evidence in words');
}
const withFiado = likely.rows.find((row) => row.fiadoAsks > 0);
assert.match(withFiado.reason, /· asked to pay later .*· \d+ payments seen$/,
  'and where the evidence rule’s own facts exist they follow on the same line');
assert.equal(read.laughsReasonLine({ laughs: 31, lastMessageDaysAgo: 2, fiadoAsks: 0, paymentsSeen: 0 }),
  '31 laughs in your chat · last message 2 days ago', 'the reason line, word for word');
assert.equal(read.laughWord(1), '1 laugh');
/* the laughs the whole read counted are the cast's own, chat by chat */
for (const [who, count] of Object.entries(laughs)) {
  const person = cast.customers.find((customer) => customer.id === who);
  assert.equal(byName.get(person.name).laughs, count, `${person.name}: the laughs in the chat`);
}

/* the evidence rule that replaces it is written and ordered too, and its own field is the narrow one */
const byEvidence = read.likelyList(readings, { rule: 'evidence' });
assert.equal(byEvidence.rule, 'evidence');
assert.deepEqual(read.likelyList(readings).rows, byEvidence.rows, 'the default uses the tested economic evidence ranking');
assert.deepEqual([...byEvidence.rows.map((row) => row.name)].sort(), [...owing].sort(),
  'the candidates are the six rows the chats hold evidence for, and nobody else');
const scores = byEvidence.rows.map((row) => rank.evidenceScore(row));
assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'the evidence rule falls by its own score');
assert.equal(byEvidence.rows[0].name, cast.customers.find((c) => c.id === 'maribel').name,
  'the heaviest fiado row leads once the evidence rule stands');
for (const row of byEvidence.rows) {
  assert.match(row.reason, /^Asked to pay later .* · last order .* · \d+ payments seen$/,
    'and its rows keep the evidence reason line, word for word');
}

/* ── THE CEILING IS THE SCREEN'S, NOT THE RULE'S ───────────────────────────────────────────────────
 * THE DEFECT, KEPT AS A TEST: the heading claims the people who most likely owe, and an uncapped
 * evidence rule handed screen 4 the shop's whole book instead — every customer with one fiado note in
 * a chat, which on a bodega's own history is the same list screen 3 had just counted. This corpus
 * holds six such rows, so the ceiling only shows on a longer book: twelve of them reach the screen as
 * eight, and the whole field stays reachable for a caller that asks for it. */
const crowd = Array.from({ length: 12 }, (_, seat) => read.readThread(
  { id: `crowd-${seat}`, name: `Crowd ${String.fromCharCode(65 + seat)}`, number: `+5198700${seat}11`, count: 4 },
  [
    { id: `crowd-${seat}-order`, direction: 'inbound', text: 'me manda 2 gaseosas grandes', kind: 'text',
      timestamp: `2026-09-0${(seat % 8) + 1}T15:00:00Z`, historical: true, mediaAvailable: false },
    { id: `crowd-${seat}-ask`, direction: 'inbound', text: 'casera me fía hasta el viernes', kind: 'text',
      timestamp: `2026-09-0${(seat % 8) + 1}T16:00:00Z`, historical: true, mediaAvailable: false },
    { id: `crowd-${seat}-laugh`, direction: 'inbound', text: Array.from({ length: seat + 1 }, () => 'jaja').join(' '), kind: 'text',
      timestamp: `2026-09-0${(seat % 8) + 1}T17:00:00Z`, historical: true, mediaAvailable: false },
  ],
  cast.referenceDay,
));
assert.equal(crowd.length, 12, 'twelve chats that all asked to pay later');
assert.equal(read.likelyList(crowd, { rule: 'evidence' }).rows.length, rank.OWED_ROWS,
  'the evidence rule draws the screen’s eight rather than the whole book');
assert.equal(read.likelyList(crowd, { rule: 'laughs' }).rows.length, rank.OWED_ROWS,
  'and the laughs rule draws the same eight, so one ceiling serves the screen');
assert.equal(read.likelyList(crowd, { rule: 'evidence', rows: 0 }).rows.length, crowd.length,
  'the whole field stays reachable for a caller that asks for it');

/* ── THE WORDS ────────────────────────────────────────────────────────────────────────────────── */
assert.equal(read.timesWord(1), 'once');
assert.equal(read.timesWord(2), 'twice');
assert.equal(read.timesWord(7), '7 times');
assert.equal(read.dayWords(0), 'today');
assert.equal(read.dayWords(1), 'yesterday');
assert.equal(read.dayWords(3), '3 days ago');
assert.equal(read.grouped(2960), '2,960', 'Peru writes the thousands separator as a comma');
assert.equal(read.meaningOf({ direction: 'inbound', kind: 'text', text: 'casera me fía hasta el viernes? 1 kilo de arroz' }), 'fiado-note');
assert.equal(read.meaningOf({ direction: 'inbound', kind: 'text', text: 'ya te yapeé señora, gracias' }), 'receipt');
assert.equal(read.meaningOf({ direction: 'inbound', kind: 'text', text: 'me manda 2 gaseosas grandes' }), 'order-received');
assert.equal(read.meaningOf({ direction: 'outbound', kind: 'text', text: 'Marcos buenas, para mañana 8 kilos de pierna' }), 'order-placed');
assert.equal(read.meaningOf({ direction: 'inbound', kind: 'image', text: 'lista de precios de esta semana' }), 'price');
assert.equal(read.meaningOf({ direction: 'inbound', kind: 'text', text: 'gracias casera, buenas noches' }), 'noise');
assert.equal(read.boughtLine({ ordersOut: 6 }), 'Bought 6 times');
assert.equal(read.rowWord(undefined), 'likely');
assert.equal(read.rowWord({ id: 'a', state: 'confirmed', amount: '', at: '' }), 'confirmed');

/* an amount appears where a message states one, as what the message said */
assert.deepEqual(read.statedAmount('anóteme te debo 12 porfa'), { quote: 'te debo 12', digits: '12' });
assert.deepEqual(read.statedAmount('son S/ 48.00 casera'), { quote: 'S/ 48.00', digits: '48.00' });
assert.equal(read.statedAmount('me manda 2 gaseosas'), null, 'a quantity is no amount');
assert.equal(read.saidLine({ quote: 'te debo 12', at: '2026-09-04T15:00:00Z' }), 'Said «te debo 12» on 4 Sep');

/* ── A PERSONAL HISTORY, WHICH IS WHAT THE LIVE RIG READS ─────────────────────────────────────── */
/* Peter tests the rig with his own number — family and friends, no commerce at all: «the numbers it
   will show in this case as my biggest debtors would be my mom and my dad — mama and papa… if you
   wanna derive the "top" numbers you can make the script analyse the ones with the most "haha"'s and
   serve those?». So the laughs rule has to WIDEN the candidates, and this fixture is the proof. */
const PERSONAL_DAY = '2026-09-18';
const QUIET = ['buenas noches', 'te llamo en la tarde', 'ya hablamos'];
/* name · number · laughs · days since the newest message */
const PEOPLE = [
  ['Mama', '+359888555012', 31, 2],
  ['Papa', '+359888000222', 24, 1],
  ['Ilian', '+34612345678', 12, 5],
  ['Zulema', '+51987000111', 9, 3],
  ['Abuela', '+359888700422', 7, 8],
  ['Carlos', '+34655123987', 5, 4],
  ['Bea', '+34699888777', 4, 9],
  ['Andrés', '+51944333222', 3, 12],
  ['Diego', '+34677555444', 2, 20],
  ['Elena', '+359887111333', 0, 30],
];

function personalReadings(module) {
  return PEOPLE.map(([name, number, count, days]) => {
    const newest = Date.parse(`${PERSONAL_DAY}T15:00:00Z`) - days * 86400000;
    const total = count + 2;
    const messages = [];
    for (let i = 0; i < total; i += 1) {
      messages.push({
        id: `${name}-${i}`,
        direction: i % 2 === 0 ? 'inbound' : 'outbound',
        text: i < count ? 'jajaja' : QUIET[i % QUIET.length],
        kind: 'text',
        timestamp: new Date(newest - (total - 1 - i) * 3600000).toISOString(),
        historical: true,
        mediaAvailable: false,
      });
    }
    return module.readThread({ id: `p-${name}`, name, number, count: total }, messages, PERSONAL_DAY);
  });
}

const personal = personalReadings(read);
assert.equal(personal.every((row) => row.fiadoAsks === 0 && row.ordersIn === 0 && row.ordersOut === 0), true,
  'a personal history carries no commerce at all');
assert.equal(personal.find((row) => row.name === 'Mama').laughs, 31, 'Mama holds the most laughs');
assert.equal(personal.find((row) => row.name === 'Mama').number, '+359888555012',
  'and a usable number in E.164, from the conversation’s own wa_id');
assert.equal(personal.find((row) => row.name === 'Mama').lastMessageDaysAgo, 2);

const personalLikely = read.likelyList(personal, { rule: 'laughs' });
assert.equal(personalLikely.rows.length, rank.OWED_ROWS, 'screen 4 draws the top eight by laughs');
assert.deepEqual(personalLikely.rows.slice(0, 2).map((row) => row.name), ['Mama', 'Papa'],
  'and his mother and his father lead them, which is the whole point of the rule');
assert.deepEqual(personalLikely.rows.map((row) => row.name),
  ['Mama', 'Papa', 'Ilian', 'Zulema', 'Abuela', 'Carlos', 'Bea', 'Andrés'],
  'the eight are the eight chats with the most laughs, in that order');
assert.equal(personalLikely.rows[0].reason, '31 laughs in your chat · last message 2 days ago',
  'and each row reads its laughs evidence in words');
assert.equal(personalLikely.rows[1].reason, '24 laughs in your chat · last message yesterday');

/* THE DEFECT, KEPT AS A TEST: the evidence rule's own field is empty on a personal history, so a rule
   that only reordered it left screen 4 blank and Peter's mother unreachable. */
assert.equal(read.likelyList(personal, { rule: 'evidence' }).rows.length, 0,
  'the evidence rule finds no candidate in a chat of family, which is what the laughs rule answers');

/* ── THE KINDS A REAL ACCOUNT WRITES ─────────────────────────────────────────────────────────────
 * Peter's own connected number answered the read with `text` · `media_placeholder` · `edit` ·
 * `errors` · `audio` · `location` · `contacts` · `unsupported` · `document` · `reaction` ·
 * `interactive` · `image` · `sticker` — the provider's own `type`, written through by
 * `connections/proof/storage.py`. Three of those the read had never been told about, and each one was
 * a wrong count on screen: 227 pictures counted as 0, error rows counted as messages, and every
 * correction counting its laugh or its order a second time. */
const row = (id, over) => ({
  id, direction: 'inbound', text: '', kind: 'text',
  timestamp: '2026-09-18T15:00:00Z', historical: true, mediaAvailable: false, ...over,
});
const kindsOf = (name, rows) =>
  read.readThread({ id: `k-${name}`, name, number: '+51987000111', count: rows.length }, rows, '2026-09-19');

const media = kindsOf('media', [
  row('m1', { kind: 'media_placeholder' }),
  row('m2', { kind: 'media_placeholder', direction: 'outbound' }),
  row('m3', { kind: 'image' }),
  row('m4', { kind: 'sticker' }),
  row('m5', { kind: 'audio' }),
  row('m6', { kind: 'location' }),
  row('m7', { text: 'ya te yapeé casera' }),
]);
assert.equal(media.pictures, 4, 'a placeholder, an image and a sticker are pictures, whichever words they carry');
assert.equal(media.voiceNotes, 1, 'and an audio row is a voice note');
assert.equal(read.stayedAsPicture({ kind: 'media_placeholder', mediaAvailable: false }), true,
  'a placeholder is the kind a picture arrives as (WHATSAPP-HISTORY-SPEC.md §1)');
assert.equal(read.stayedAsPicture({ kind: 'text', mediaAvailable: false }), false, 'and words are no picture');
assert.equal(read.stayedAsVoiceNote({ kind: 'audio', mediaAvailable: false }), true);

const errored = kindsOf('errors', [
  row('x1', { text: 'me manda 2 gaseosas' }),
  row('x2', { kind: 'errors' }),
  row('x3', { kind: 'errors', direction: 'outbound' }),
  row('x4', { text: 'jajaja' }),
]);
assert.equal(errored.messages, 2, 'an errors row is passed over, so the count is the messages read');
assert.equal(errored.laughs, 1);
assert.equal(errored.ordersIn, 1);

const corrected = kindsOf('edit', [
  row('c1', { text: 'jajaja buenas' }),
  row('c2', { kind: 'edit', text: 'jajaja buenas noches' }),
]);
assert.equal(corrected.laughs, 1, 'a correction is the same laugh, counted once');
assert.equal(corrected.messages, 1, 'and the same message, counted once');
const correctedOrder = kindsOf('edit-order', [
  row('c3', { text: 'me manda 2 cajas de leche' }),
  row('c4', { kind: 'edit', text: 'me manda 3 cajas de leche' }),
]);
assert.equal(correctedOrder.ordersIn, 1, 'a correction never doubles an order');
const emptyEdit = kindsOf('edit-empty', [row('c5', { text: 'jajaja' }), row('c6', { kind: 'edit' })]);
assert.deepEqual([emptyEdit.messages, emptyEdit.laughs], [1, 1],
  'a correction the provider sent no words with leaves the message standing');
const orphanEdit = kindsOf('edit-orphan', [row('c7', { kind: 'edit', text: 'jajaja' })]);
assert.equal(orphanEdit.messages, 1, 'and a correction with no message before it is read once, as itself');
assert.equal(read.effectiveMessages([
  row('p1', { text: 'uno' }), row('p2', { kind: 'errors' }), row('p3', { kind: 'edit', text: 'dos' }),
]).map((message) => message.text).join(','), 'dos', 'the words the read counts are the corrected ones');

/* ── THE NUMBERS THE CONTACTS LEFT UNNAMED ───────────────────────────────────────────────────────
 * 68 of the 129 chats on that account carry no contact name: `storage.py` names a conversation
 * `name or data["number"]`, so the row arrives as its own digits. Such a row was drawing two of those
 * digits in an initials disc under a heading of eleven more. */
assert.equal(read.namedContact('Mama'), true);
assert.equal(read.namedContact('34612345678'), false, 'the digits the service falls back to are no name');
assert.equal(read.namedContact(''), false);
const unnamed = read.readThread({ id: 'u1', name: '34612345678', number: '34612345678', count: 1 },
  [row('u-1', { text: 'jajaja' })], '2026-09-19');
assert.equal(unnamed.named, false, 'the reading carries the word for it');
assert.equal(unnamed.number, '+34612345678', 'and E.164, from the conversation’s own digits');
assert.equal(read.readThread({ id: 'u2', name: 'Mama', number: '+359888555012', count: 1 },
  [row('u-2', { text: 'hola' })], '2026-09-19').named, true, 'a named chat carries the other');
assert.equal(read.numberWords('34612345678'), '+34 612 345 678', 'a number reads with its plus and in threes');
assert.equal(read.numberWords('51987000111'), '+51 987 000 111');
assert.equal(read.numberWords('359888555012'), '+359 888 555 012', 'a three-digit country code is read as one');
assert.equal(read.numberWords('19789589459'), '+1 978 958 9459', 'and a last digit joins the group before it');
assert.equal(read.numberWords('447911123456'), '+44 791 112 3456');
assert.equal(read.numberWords('525512345678'), '+52 551 234 5678');
assert.equal(read.numberWords('+51 987 000 111'), '+51 987 000 111', 'a number already written stands as it is');
assert.equal(read.numberWords(''), '');
assert.equal(read.countryCode('34612345678'), '34');
assert.equal(read.countryCode('359888555012'), '359');
assert.equal(read.countryCode('19789589459'), '1');
assert.equal(read.contactWords({ name: '34612345678', number: '+34612345678', named: false }), '+34 612 345 678',
  'a row the contacts named nowhere draws its number');
assert.equal(read.contactWords({ name: 'Mama', number: '+359888555012', named: true }), 'Mama', 'and a named row its name');

/* A TIE PUTS THE PEOPLE FIRST. Four laughs was the count of four chats on that account, two of them
   numbers, so the tiebreak decides what the top eight is made of. */
const tied = [
  read.readThread({ id: 'tie-number', name: '34600999888', number: '34600999888', count: 1 }, [row('t1', { text: 'jajaja' })], '2026-09-19'),
  read.readThread({ id: 'tie-name', name: 'Bea', number: '+34699888777', count: 1 }, [row('t2', { text: 'jajaja' })], '2026-09-19'),
];
assert.deepEqual(read.likelyList(tied, { rule: 'laughs' }).rows.map((r) => r.name), ['Bea', '34600999888'],
  'a tie in the laughs ranking puts the named contact first');

/* ── THE FLOOR UNDER THE LAUGHS RULE ────────────────────────────────────────────────────────────
 * THE DEFECT, KEPT AS A TEST: 103 of the 120 chats that account handed the read hold no laugh at all,
 * and the top chat holds eleven. Every chat was a candidate, so screen 4 drew rows reading `0 laughs
 * in your chat` — the rule printing its own silence under a heading claiming the people who most
 * likely owe. */
const quiet = [
  read.readThread({ id: 'q-mama', name: 'Mama', number: '+359888555012', count: 1 }, [row('q1', { text: 'jajaja' })], '2026-09-19'),
  read.readThread({ id: 'q-papa', name: 'Papa', number: '+359888000222', count: 1 }, [row('q2', { text: 'jaja' })], '2026-09-19'),
  read.readThread({ id: 'q-rita', name: 'Rita', number: '+51987000999', count: 1 }, [row('q3', { text: 'buenas noches' })], '2026-09-19'),
  read.readThread({ id: 'q-sara', name: 'Sara', number: '+51987000666', count: 1 }, [row('q4', { text: 'ya hablamos' })], '2026-09-19'),
];
const quietList = read.likelyList(quiet, { rule: 'laughs' });
assert.deepEqual(quietList.rows.map((r) => r.name), ['Mama', 'Papa'], 'screen 4 draws the chats that hold a laugh');
assert.equal(quietList.candidates, 2, 'and says how many chats the rule found to rank');
assert.equal(rank.LAUGHS_FLOOR, 3, 'three is the floor the sentence stands under');
assert.equal(read.thinLaughsLine(2), '2 chats hold a laugh, so this list stays short.', 'the sentence, word for word');
assert.equal(read.thinLaughsLine(1), '1 chat holds a laugh, so this list stays short.', 'and in the singular');
assert.equal(read.thinLaughsLine(0), '0 chats hold a laugh, so this list stays short.',
  'and a chat book with none says that too, so the walk carries on from a stated fact');
assert.equal(read.likelyList(readings, { rule: 'laughs' }).candidates >= rank.LAUGHS_FLOOR, true,
  'the bodega world holds laughs enough that the sentence stays away');

/* ── THE COUNTS SCREEN 3 PRINTS ARE THE SERVICE'S OWN ───────────────────────────────────────────
 * `GET /api/proof/state` reports `history.messages`, `history.conversations`, `history.oldestAt` and
 * `history.newestAt` (WHATSAPP-HISTORY-SPEC.md §2), and the read fetches a bounded 120 chats of three
 * pages each — so the figures on screen are the service's where it reports them and the read's own
 * only where it does not. The real run answered `2,318 messages · 129 conversations` against 120
 * chats read. */
const served = read.bookOf(quiet, {
  history: {
    status: 'complete', progress: 100, messages: 2318, conversations: 129,
    oldestAt: '2026-03-16T10:00:00Z', newestAt: '2026-09-09T10:00:00Z',
  },
});
assert.equal(served.messages, 2318, 'the message count is the field the service reports');
assert.equal(served.conversations, 129, 'and so is the conversation count');
assert.equal(read.monthDay(served.oldestAt), '16 March', 'and the window opens on the service’s own day');
assert.equal(read.bookOf(quiet, null).conversations, quiet.length, 'with no state, the read counts what it read');

/* ── THE AMOUNT THE SHOP TYPES (§268 QA item 27) ───────────────────────────────────────────────
 * Screen 4's keypad took anything and the row printed it raw: «12.345,67» came back as
 * «S/ 12.345,67», «99999999999» stood whole and «-50» saved as «S/ 50». Every figure now leaves
 * `start/amount.ts` as MINOR UNITS, which is the shape `money-store.ts` holds and `bodegaMoney`
 * prints, so one grammar reaches every screen. */
const minorOf = (typed) => {
  const answer = amount.parseAmount(typed);
  assert.equal(answer.ok, true, `${typed} is a figure`);
  return answer.minor;
};
assert.equal(minorOf('460'), 46000, 'a whole number is soles');
assert.equal(minorOf('460.50'), 46050, 'a point is the decimal');
assert.equal(minorOf('460,5'), 46050, 'and so is a comma, with one digit after it');
assert.equal(minorOf('S/ 460'), 46000, 'the symbol the field draws costs nothing');
assert.equal(minorOf('12,345.67'), 1234567, 'Peru groups thousands with a comma');
assert.equal(minorOf('12.345,67'), 1234567, 'and a shop that types it the other way lands the same');
assert.equal(minorOf('12,345'), 1234500, 'a lone separator with three digits after it groups');
assert.equal(minorOf('0'), 0, 'zero is a figure the shop is allowed to mean');
assert.equal(amount.amountWords(1234567), '12345.67', 'the record carries two decimals');

const askOf = (typed) => {
  const answer = amount.parseAmount(typed);
  assert.equal(answer.ok, false, `${typed} is answered rather than stored`);
  assert.equal(/[.!?]$/.test(answer.ask), false, 'an inline message takes no end punctuation');
  return answer.ask;
};
assert.equal(askOf(''), 'Type the amount in soles', 'an empty field is asked for the figure');
assert.equal(askOf('   '), 'Type the amount in soles', 'and so is a field of spaces');
assert.equal(askOf('-50'), 'Type an amount of zero or more', 'a negative is answered');
assert.equal(askOf('doce'), 'Type the amount in numbers, like 12.50', 'letters are answered');
assert.equal(askOf('12.3456'), 'Type the amount with up to two decimals', 'four decimals are answered');
assert.equal(askOf('99999999999'), `Type an amount up to ${amount.AMOUNT_CEILING_WORDS}`,
  'and a keystroke above the ceiling says the ceiling');
assert.equal(amount.AMOUNT_CEILING_MINOR, 9999999, 'the ceiling is S/ 99,999.99');
assert.equal(amount.parseAmount('99999.99').ok, true, 'the ceiling itself is a figure');

/* ── THE PRICE GREP ───────────────────────────────────────────────────────────────────────────── */
assert.equal(/S\/|soles/i.test(raw), false, 'the chat corpus carries no currency token');
for (const row of likely.rows) assert.equal(row.said, null, 'so the read asserts no amount on this path');

console.log(`GREEN · the read: ${book.conversations} conversations · ${book.messages} messages · ${book.customers.length} customers · ${book.suppliers.length} suppliers · ${likely.rows.length} likely rows by laughs · ${byEvidence.rows.length} by evidence · ${book.pictures} pictures · a personal history leads with ${personalLikely.rows[0].name} and ${personalLikely.rows[1].name}`);
