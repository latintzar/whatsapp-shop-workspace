#!/usr/bin/env node
/* test-bodega-referrals.mjs — THE REFERRAL RECORD (WIRING-SPEC.md §5, ONBOARDING-SPEC.md screen 5).
 *
 * The critical path ends on a sent message, so the record behind it is the one piece of arithmetic
 * that decides what screen 6 says and what a supplier's connection is matched against. This test runs
 * `referrals.ts` itself.
 *
 * WHAT IT HOLDS
 *   E.164         nine digits mean Peru; a number that arrives with its own country code keeps it, so
 *                 the rig's own run reaches +359 888 555 012.
 *   THE MESSAGE   MESSAGES.md row 5's body, with the invitation token in it, and the `wa.me` hand-off
 *                 that carries it into the shop's own WhatsApp.
 *   FOUR STATES   ready → sent → invited → connected, each moved by its own act, forward only.
 *   THE MATCH     the invitation token first, the normalised number second, and a supplier that
 *                 connected with no invitation leaves every row where it stands.
 *   THE TALLY     `9 invitations sent · 2 connected`, this session's own two figures.
 *   THE STORE     one namespaced key, `rocoto-bodega-invites-v1:<scope>`, round-tripped.
 *   THE LIST      screen 5's own rows (`history/read.ts`, `referralRows`): while the laughs rule stands
 *                 EVERY contact the read produced is listed, the top five by laughs ticked and the rest
 *                 alphabetical and unticked, and the search reaches any of them by name or by number.
 *   A PERSONAL    the live rig reads Peter's own number, so a fixture of family and friends with no
 *   HISTORY       commerce at all proves his mother is on the list, tickable and searchable — and that
 *                 the supplier rule finds nobody there, which is the defect the laughs rule answers.
 *   THE SEARCH    a query of letters matches name words FROM THEIR START, so a name holding those
 *                 letters mid-word stays out of the answer, and digits still match the number.
 *   THE NUMBERS   65 of the 120 chats that account handed the read carry no contact name: those rows
 *                 stand after the names, newest activity first, each drawing its own number in
 *                 international form and still invitable.
 *
 * RUN, from app/:  node tools/test-bodega-referrals.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SURFACE = 'src/prototypes/bodega-pay-later';
const OUT = join(ROOT, 'node_modules', '.cache', 'bodega-referrals-test');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execFileSync(join(ROOT, 'node_modules', '.bin', 'tsc'), [
  `${SURFACE}/referrals.ts`,
  `${SURFACE}/history/read.ts`,
  `${SURFACE}/store/keys.ts`,
  '--outDir', OUT,
  '--resolveJsonModule', '--esModuleInterop', '--module', 'commonjs',
  '--target', 'ES2020',
  '--strict',
  '--skipLibCheck',
  '--esModuleInterop',
], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

/* the store reads the browser's own storage, so the test hands it one */
const held = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (held.has(key) ? held.get(key) : null),
    setItem: (key, value) => held.set(key, String(value)),
    removeItem: (key) => held.delete(key),
    key: (index) => [...held.keys()][index] ?? null,
    get length() { return held.size; },
  },
};

/* `history/read.ts` reaches Cedar's own DTOs, so the emitted tree keeps the prototype's own folder */
const require = createRequire(join(OUT, 'anchor.cjs'));
const referrals = require(join(OUT, 'bodega-pay-later', 'referrals.js'));
const read = require(join(OUT, 'bodega-pay-later', 'history', 'read.js'));
const rank = require(join(OUT, 'bodega-pay-later', 'history', 'rank.js'));
const keys = require(join(OUT, 'bodega-pay-later', 'store', 'keys.js'));
const cast = JSON.parse(readFileSync(join(ROOT, SURFACE, 'fixtures/cast-bodega.json'), 'utf8'));

const NOW = '2026-09-18T12:00:00-05:00';

/* ── E.164 ────────────────────────────────────────────────────────────────────────────────────── */
assert.equal(referrals.normalise('976431412'), '+51976431412', 'nine digits mean Peru');
assert.equal(referrals.normalise('+51 957 621 349'), '+51957621349', 'a Peruvian number keeps its shape');
assert.equal(referrals.normalise('51957621349'), '+51957621349', 'eleven digits already carry Peru');
assert.equal(referrals.normalise('+359 888 555 012'), '+359888555012', 'the rig’s own run reaches Bulgaria');
assert.equal(referrals.normalise('00359888555012'), '+359888555012', 'a double-zero prefix is a plus');
assert.equal(referrals.normalise(''), '');
assert.equal(referrals.sameNumber('957 621 349', '+51957621349'), true);
assert.equal(referrals.sameNumber('957 621 349', '+359888555012'), false);
assert.equal(referrals.waDigits('+51 957 621 349'), '51957621349');

/* every supplier in the cast normalises to a reachable number */
for (const supplier of cast.suppliers) {
  assert.match(referrals.normalise(supplier.phone), /^\+51\d{9}$/, `${supplier.name} is reachable`);
}

/* ── THE NAME A FACE READS ────────────────────────────────────────────────────────────────────── */
/* Base's own rule, the one `Avatar` runs on the name it is given: the first letter of the first two
   words, uppercased. A contact whose separator sits in the second seat drew it as an initial — «Elsa
   · puesto 214, Gran Mercado Mayorista» came out `E·` — so the disc reads `faceName`. */
const initialsOf = (name) => name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
assert.equal(referrals.faceName('Elsa · puesto 214, Gran Mercado Mayorista'), 'Elsa puesto 214, Gran Mercado Mayorista');
assert.equal(initialsOf(referrals.faceName('Elsa · puesto 214, Gran Mercado Mayorista')), 'EP', 'the disc reads letters');
assert.equal(referrals.faceName('Marcos pollos'), 'Marcos pollos', 'a name with no separator stands as it is');
assert.equal(referrals.faceName('·'), '·', 'a name of separators alone keeps something to draw');
for (const supplier of cast.suppliers) {
  assert.match(initialsOf(referrals.faceName(supplier.name)), /^[\p{L}\p{N}]{1,2}$/u, `${supplier.name} draws letters`);
}

/* ── THE MESSAGE ──────────────────────────────────────────────────────────────────────────────── */
assert.equal(
  referrals.inviteBody('ab12cd34ef'),
  'Estoy usando Rocoto para llevar mis compras y mis pagos. Conecta tu WhatsApp acá: soyrocoto.com/connect?i=ab12cd34ef',
  'MESSAGES.md row 5, verbatim, with the token in it',
);
const handoff = referrals.waHandoff('+51 957 621 349', referrals.inviteBody('ab12cd34ef'));
assert.ok(handoff.startsWith('https://wa.me/51957621349?text='), 'the hand-off opens that supplier’s chat');
assert.equal(decodeURIComponent(handoff.split('text=')[1]), referrals.inviteBody('ab12cd34ef'), 'with the message ready');
assert.match(referrals.mintToken(() => 0.5), /^[a-z2-9]{10}$/, 'a token is opaque and short');

/* ── FOUR STATES ──────────────────────────────────────────────────────────────────────────────── */
assert.deepEqual(referrals.INVITE_WORD, { ready: 'Ready', sent: 'Sent', invited: 'Invited', connected: 'Connected' });

let book = referrals.emptyBook('bodega');
const rows = [];
for (const supplier of cast.suppliers) {
  const result = referrals.propose(book, { id: supplier.id, name: supplier.name, phone: supplier.phone }, NOW);
  book = result.book;
  rows.push(result.row);
}
assert.equal(book.rows.length, cast.suppliers.length, 'nine suppliers, nine rows');
assert.equal(book.rows.every((row) => row.state === 'ready'), true, 'every row arrives ready');

const again = referrals.propose(book, { id: 'abarrotes', name: 'Distribuidora Aurora', phone: '+51 957 621 349' }, NOW);
assert.equal(again.book.rows.length, cast.suppliers.length, 'a supplier proposed twice keeps one row');
assert.equal(again.row.token, rows.find((row) => row.supplierId === 'abarrotes').token, 'and keeps its token');

for (const row of rows) book = referrals.move(book, row.id, 'sent', NOW);
assert.equal(referrals.sentRows(book).length, 9, '`Suppliers you brought` lists the rows from sent on');
book = referrals.confirmSent(book, NOW);
assert.equal(referrals.invitedRows(book).length, 9, '`I sent them` turns every press into a claim');
book = referrals.move(book, rows[0].id, 'sent', NOW);
assert.equal(book.rows.find((row) => row.id === rows[0].id).state, 'invited', 'a row moves forward alone');

/* ── THE MATCH ────────────────────────────────────────────────────────────────────────────────── */
book = referrals.connected(book, { token: rows[2].token }, NOW);
assert.equal(book.rows.find((row) => row.id === rows[2].id).state, 'connected', 'the token decides first');
book = referrals.connected(book, { phone: '957 621 349' }, NOW);
assert.equal(book.rows.find((row) => row.supplierId === 'abarrotes').state, 'connected', 'the number decides second');
const before = JSON.stringify(book);
book = referrals.connected(book, { phone: '+359 888 555 012' }, NOW);
assert.equal(JSON.stringify(book), before, 'a supplier that joined on its own leaves every row standing');

/* ── THE TALLY ────────────────────────────────────────────────────────────────────────────────── */
assert.deepEqual(referrals.tally(book), { sent: 9, connected: 2 }, '9 invitations sent · 2 connected');

/* ── THE LIST, OVER A PERSONAL HISTORY ────────────────────────────────────────────────────────── */
/* Peter: «then we'd send JUST my mom's number though the referral. Maybe we can sort the rest
   alphabetically and put a search at the top with elastic so that i can tick other numbers too, and
   make it properly work. i'll make sure i deselect everyone and select my mom so that she only gets the
   message» — so every contact has to BE on the list, and hers has to be findable. */
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

const personal = PEOPLE.map(([name, number, count, days]) => {
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
  return read.readThread({ id: `p-${name}`, name, number, count: total }, messages, PERSONAL_DAY);
});

const list = read.referralRows(personal, { rule: 'laughs' });
assert.equal(list.length, PEOPLE.length, 'the list holds EVERY contact the read produced');
assert.equal(rank.LAUGHS_TICKED_ROWS, 5);
assert.deepEqual(list.slice(0, 5).map((row) => row.name), ['Mama', 'Papa', 'Ilian', 'Zulema', 'Abuela'],
  'the top five by laughs stand first');
assert.equal(list.slice(0, 5).every((row) => row.ticked), true, 'and arrive ticked');
const rest = list.slice(5);
assert.deepEqual(rest.map((row) => row.name), [...rest.map((row) => row.name)].sort((a, b) => a.localeCompare(b)),
  'the rest are alphabetical');
assert.equal(rest.some((row) => row.ticked), false, 'and wait for a tick of their own');
assert.equal(list[0].reason, '31 laughs in your chat', 'a row reads its laughs count');
assert.equal(list[0].number, '+359888555012', 'and carries a number the hand-off can open');
assert.ok(referrals.waHandoff(list[0].number, referrals.inviteBody('ab12cd34ef')).startsWith('https://wa.me/359888555012?text='),
  'so ticking Mama alone opens her chat with the message ready');

/* THE SEARCH: a name's WORDS from their start, and the number whether the shop typed the plus, the
   spaces or the dashes. FROM THE START, because `mam` over his own contacts returned his mother AND a
   name that merely holds those three letters in its middle — a list he has to read to find the row he
   already named. */
const found = (query) => list.filter((row) => read.matchesQuery(row, query)).map((row) => row.name);
assert.deepEqual(found('555012'), ['Mama'], 'a fragment of a number finds the row');
assert.deepEqual(found('+359 888 555 012'), ['Mama'], 'and so does the number as WhatsApp prints it');
assert.deepEqual(found('359-888-555-012'), ['Mama'], 'dashes and all');
assert.deepEqual(found('mam'), ['Mama'], 'a fragment of a name finds it too');
assert.deepEqual(found('andres'), ['Andrés'], 'an accent costs the shop nothing');
assert.equal(found('').length, PEOPLE.length, 'an empty search shows every row');

/* a name that holds the letters mid-word stays out of the answer, and every word of a name is a start */
const midWord = read.readThread({ id: 'p-Ramamurti', name: 'Ramamurti', number: '+34600111222', count: 1 },
  [{ id: 'r-1', direction: 'inbound', text: 'hola', kind: 'text', timestamp: `${PERSONAL_DAY}T09:00:00Z`, historical: true, mediaAvailable: false }],
  PERSONAL_DAY);
const twoWords = read.readThread({ id: 'p-Elsa', name: 'Elsa Mamani', number: '+51987000444', count: 1 },
  [{ id: 'e-1', direction: 'inbound', text: 'hola', kind: 'text', timestamp: `${PERSONAL_DAY}T09:00:00Z`, historical: true, mediaAvailable: false }],
  PERSONAL_DAY);
const wider = read.referralRows([...personal, midWord, twoWords], { rule: 'laughs' });
const foundIn = (query) => wider.filter((row) => read.matchesQuery(row, query)).map((row) => row.name).sort();
assert.deepEqual(foundIn('mam'), ['Elsa Mamani', 'Mama'],
  'a query of letters matches name words from their start, and passes over a name holding them mid-word');
assert.deepEqual(foundIn('rama'), ['Ramamurti'], 'and that name answers its own first letters');
assert.deepEqual(foundIn('elsa mam'), ['Elsa Mamani'], 'two words narrow rather than widen');

/* ── THE NUMBERS THE CONTACTS LEFT UNNAMED ───────────────────────────────────────────────────────
 * 65 of the 120 chats the read fetched off Peter's own account carry no contact name, so the service
 * hands back the digits. Digits sort above `A` in every collation, which put eleven-digit strings on the
 * first page of this screen and the people he was looking for under them; and the row drew two of those
 * digits in an initials disc. So a number stands after the names, newest activity first, and draws
 * itself as a number. */
const number = (digits, days) => read.readThread(
  { id: `n-${digits}`, name: digits, number: digits, count: 1 },
  [{
    id: `n-${digits}-1`, direction: 'inbound', text: 'hola', kind: 'text',
    timestamp: new Date(Date.parse(`${PERSONAL_DAY}T15:00:00Z`) - days * 86400000).toISOString(),
    historical: true, mediaAvailable: false,
  }],
  PERSONAL_DAY,
);
const mixed = read.referralRows([...personal, number('34600111222', 9), number('34600333444', 3), twoWords], { rule: 'laughs' });
assert.equal(mixed.length, PEOPLE.length + 3, 'every contact the read produced is on the list');
const tail = mixed.slice(rank.LAUGHS_TICKED_ROWS);
assert.deepEqual(tail.filter((row) => row.named).map((row) => row.name),
  [...tail.filter((row) => row.named).map((row) => row.name)].sort((a, b) => a.localeCompare(b)),
  'the named contacts under the ticked five stand A–Z');
assert.deepEqual(tail.map((row) => row.named), [...tail.map((row) => row.named)].sort((a, b) => Number(b) - Number(a)),
  'and every number stands after every name');
assert.deepEqual(tail.filter((row) => !row.named).map((row) => row.name), ['34600333444', '34600111222'],
  'the numbers run newest activity first');
const drawn = tail.find((row) => !row.named);
assert.equal(drawn.named, false, 'a row carries the word for it');
assert.equal(read.contactWords(drawn), '+34 600 333 444', 'and draws its number with a plus, in threes');
const namedRow = tail.find((row) => row.named);
assert.equal(read.contactWords(namedRow), namedRow.name, 'while a named row draws the name the contacts wrote');
assert.ok(referrals.waHandoff(drawn.number, referrals.inviteBody('ab12cd34ef')).startsWith('https://wa.me/34600333444?text='),
  'and a number the contacts named nowhere is still invitable');

/* A ROW READS THE EVIDENCE IT HAS: 103 of those 120 chats hold no laugh, so `0 laughs in your chat`
   was the reason line on all of them — a sentence spent telling the shop what a chat lacks. */
assert.equal(drawn.reason, 'last message 3 days ago', 'a row with no laugh reads when the chat last spoke');
assert.equal(mixed.filter((row) => /^0 laughs/.test(row.reason)).length, 0, 'and no row reads a count of nothing');
assert.equal(mixed[0].reason, '31 laughs in your chat', 'while a chat that holds laughs still reads them');

/* THE DEFECT, KEPT AS A TEST: on the supplier rule this personal history proposes nobody at all. */
assert.equal(read.referralRows(personal, { rule: 'evidence' }).length, 0,
  'the supplier rule finds no row in a chat of family, which is what the laughs rule answers');

/* and the bodega world still yields its nine suppliers once the debt read replaces the rule */
const bodega = cast.suppliers.map((supplier, index) => read.readThread(
  { id: supplier.id, name: supplier.name, number: supplier.phone, count: 2 },
  [
    { id: `${supplier.id}-out`, direction: 'outbound', text: 'para mañana 8 kilos de pierna', kind: 'text',
      timestamp: `2026-09-1${(index % 8) + 1}T15:00:00Z`, historical: true, mediaAvailable: false },
    { id: `${supplier.id}-in`, direction: 'inbound', text: 'jajaja gracias casera', kind: 'text',
      timestamp: `2026-09-1${(index % 8) + 1}T16:00:00Z`, historical: true, mediaAvailable: false },
  ],
  PERSONAL_DAY,
));
const proposed = read.referralRows(bodega, { rule: 'evidence' });
assert.equal(proposed.length, cast.suppliers.length, 'nine suppliers, nine rows');
assert.equal(proposed.every((row) => row.ticked), true, 'every one of them ticked');
assert.equal(proposed[0].reason, 'Bought once', 'each carrying the purchases its rows count');

/* ── THE STORE ────────────────────────────────────────────────────────────────────────────────── */
referrals.writeBook(book);
assert.equal(held.has(`${keys.KEYS.invites}bodega`), true, 'the book lands on its own namespaced key');
assert.deepEqual(referrals.readBook('bodega'), book, 'and comes back as it went in');
assert.equal(keys.resetLocal().includes(`${keys.KEYS.invites}bodega`), true, '`Reset state` sweeps it');
assert.deepEqual(referrals.readBook('bodega'), referrals.emptyBook('bodega'), 'and leaves an empty book behind');

console.log(`GREEN · the referral record: ${cast.suppliers.length} suppliers proposed · four states · the token before the number · a personal history lists ${list.length} contacts with ${list.filter((row) => row.ticked).length} ticked and ${list[0].name} first`);
