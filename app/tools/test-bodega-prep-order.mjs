/* PREP'S TWO ORDERS, PROVED (DESIGN-SPEC.md §3 · prep-design.md).
 *
 * `prep-order.ts` is the whole of what `Location` and `Time` mean, and it is pure on purpose — six
 * facts per row, no React, no cast, no browser — so the claims the screen makes can be held here
 * rather than by eye on a screenshot.
 *
 * The four this file exists to keep honest:
 *
 *   1. `To review` STANDS FIRST, IN BOTH ORDERS. Sales' own scope row goes and its duty becomes the
 *      list's first group: an order still at `request` can be neither packed nor lost.
 *   2. THE BLOCKS THEN, AND `To assign` LAST. A shop still deciding where an order goes out keeps it
 *      in a named group rather than off the list.
 *   3. ARRIVAL ORDER INSIDE A GROUP, and one flat oldest-first list under `Time`.
 *   4. THE ORDER ON SCREEN IS THE ORDER ON PAPER. `flatten` is what the print sheet hands
 *      `daySheetOrder`, which maps the array it is given and sorts nothing.
 *
 * And the word over the state word: `Re-check` beats `Prepared`, because a row that said
 * «Prepared» about an order that changed after it was picked is the lie the facet exists to catch.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadTypeScript } from './ts-module.mjs';

const {
  PREPARED, PREP_ORDERS, PREP_ORDER_DEFAULT, PREP_ORDER_KEY, PREP_ORDER_WORD, RE_CHECK,
  TO_ASSIGN, TO_REVIEW, byLocation, byTimeReceived, flatten, groupsFor, headingOf, isPrepOrder,
  prepWordOf, salesWords,
} = loadTypeScript('src/prototypes/bodega-pay-later/prep-order.ts', 'bodega-prep-order');

/* ── THE DAY, WRITTEN OUT ──────────────────────────────────────────────────────────────────────
 * Twelve orders on one Friday, in the shape `fixtures/cast-bodega.json` seeds them: three blocks,
 * one order with no block yet, and three that still want judging. They are declared OUT OF ORDER
 * on purpose — a grouping that only works on pre-sorted input is not a grouping.
 */
const row = (id, at, block, extra = {}) => ({
  id, at, block, review: false, prepared: false, recheck: false, ...extra,
});

const day = [
  row('sonia', '11:15', 'Jr. Los Amautas'),
  row('maribel', '07:05', null, { review: true }),
  row('julia', '08:10', 'Av. Gran Chimú', { prepared: true }),
  row('elmer', '09:20', 'Jr. Chinchaysuyo'),
  row('rosa', '07:20', null, { review: true }),
  row('hugo', '08:25', 'Av. Gran Chimú', { prepared: true, recheck: true }),
  row('nancy', '10:50', 'Jr. Los Amautas'),
  row('nelly', '07:35', null, { review: true }),
  row('jose', '09:40', 'Jr. Chinchaysuyo'),
  row('walter', '09:05', 'Av. Gran Chimú'),
  row('flor', '10:05', null),
  row('milagros', '10:30', 'Psje. Las Dalias'),
];

/* ── 1 · THE CONTROL ITSELF ────────────────────────────────────────────────────────────────── */

assert.deepEqual(PREP_ORDERS, ['location', 'time'], 'two segments, Location first');
assert.equal(PREP_ORDER_DEFAULT, 'location', 'Location is the default and the marked one');
assert.equal(PREP_ORDER_WORD.location, 'Location');
assert.equal(PREP_ORDER_WORD.time, 'Time');
assert.equal(PREP_ORDER_KEY, 'rocoto-bodega-prep-order',
  'the choice is kept under this prototype’s own prefix, so Reset state sweeps it');
assert.ok(isPrepOrder('location') && isPrepOrder('time'));
assert.ok(!isPrepOrder('zone'), 'an unknown answer is refused rather than stored');

/* ── 2 · THE COUNTS READ `sales` ───────────────────────────────────────────────────────────── */

assert.equal(salesWords(1), '1 sale');
assert.equal(salesWords(6), '6 sales');
assert.equal(headingOf('Chorrillos', 6), 'Chorrillos · 6 sales',
  'a heading names the thing and carries its count');

/* ── 3 · BY LOCATION ───────────────────────────────────────────────────────────────────────── */

const byBlock = byLocation(day);
const words = byBlock.map((g) => g.word);

assert.equal(words[0], TO_REVIEW, '`To review` stands first');
assert.equal(words[words.length - 1], TO_ASSIGN, '`To assign` stands last');
assert.deepEqual(words, [
  TO_REVIEW,
  /* the blocks in the order their own first order arrived: 08:10 · 09:20 · 10:30 · 11:15 */
  'Av. Gran Chimú', 'Jr. Chinchaysuyo', 'Psje. Las Dalias', 'Jr. Los Amautas',
  TO_ASSIGN,
], 'the blocks run by their own first arrival, between the two named groups');

assert.equal(byBlock[0].heading, `${TO_REVIEW} · 3 sales`);
assert.deepEqual(byBlock[0].rows.map((r) => r.id), ['maribel', 'rosa', 'nelly'],
  'arrival order inside `To review`: 07:05 · 07:20 · 07:35');
assert.deepEqual(byBlock[1].rows.map((r) => r.id), ['julia', 'hugo', 'walter'],
  'arrival order inside a block: 08:10 · 08:25 · 09:05');
assert.deepEqual(byBlock[byBlock.length - 1].rows.map((r) => r.id), ['flor'],
  'an order with no block yet is in `To assign`, never missing');

assert.equal(
  day.length,
  byBlock.reduce((n, g) => n + g.rows.length, 0),
  'every order of the day is in exactly one group',
);
assert.equal(new Set(flatten(byBlock).map((r) => r.id)).size, day.length, 'and in exactly one');

/* A GROUP THAT WOULD BE EMPTY IS ABSENT rather than drawn as a heading over nothing. */
const clean = byLocation(day.filter((r) => !r.review && r.block));
assert.ok(!clean.some((g) => g.word === TO_REVIEW || g.word === TO_ASSIGN),
  'with nothing to review and nothing to assign, neither heading is drawn');

/* ── 4 · BY TIME RECEIVED ──────────────────────────────────────────────────────────────────── */

const byTime = byTimeReceived(day);
assert.equal(byTime.length, 2, '`To review`, then one flat list');
assert.equal(byTime[0].word, TO_REVIEW, '`To review` stands first in this order too');
assert.deepEqual(byTime[0].rows.map((r) => r.id), ['maribel', 'rosa', 'nelly']);
assert.deepEqual(
  byTime[1].rows.map((r) => r.at),
  ['08:10', '08:25', '09:05', '09:20', '09:40', '10:05', '10:30', '10:50', '11:15'],
  'one flat list, oldest first',
);

/* ── 5 · THE ORDER ON SCREEN IS THE ORDER ON PAPER ─────────────────────────────────────────── */

assert.deepEqual(flatten(groupsFor('location', day)).map((r) => r.id), flatten(byBlock).map((r) => r.id));
assert.deepEqual(flatten(groupsFor('time', day)).map((r) => r.id), flatten(byTime).map((r) => r.id));
assert.notDeepEqual(
  flatten(groupsFor('location', day)).map((r) => r.id),
  flatten(groupsFor('time', day)).map((r) => r.id),
  'the two orders really are two orders, so the sheet the surface hands down is worth handing down',
);

/* ── 6 · THE WORD OVER THE STATE WORD ──────────────────────────────────────────────────────── */

assert.equal(prepWordOf({ prepared: false, recheck: false }, 'Asked for'), 'Asked for',
  'an ordinary row says where the goods are, in the shop’s own three words');
assert.equal(prepWordOf({ prepared: true, recheck: false }, 'Asked for'), PREPARED);
assert.equal(prepWordOf({ prepared: true, recheck: true }, 'Asked for'), RE_CHECK,
  'a pick that no longer describes the crate says `Re-check`, never `Prepared`');
assert.equal(prepWordOf({ prepared: false, recheck: true }, 'Handed over'), RE_CHECK);

/* ── 7 · AND THE SHOP'S OWN FRIDAY GOES THROUGH IT ─────────────────────────────────────────── */

const cast = JSON.parse(readFileSync(
  new URL('../src/prototypes/bodega-pay-later/fixtures/cast-bodega.json', import.meta.url), 'utf8'));

const seeded = cast.prepDay.orders.map((order) => ({
  id: `${order.n}`,
  at: order.received,
  block: order.block,
  review: order.review === true,
  prepared: order.state === 'Prepared',
  recheck: false,
}));

const seededGroups = byLocation(seeded);
assert.equal(seededGroups[0].word, TO_REVIEW);
assert.equal(seededGroups[0].rows.length, 3, 'the seeded Friday opens with three orders to review');
assert.equal(
  seededGroups.reduce((n, g) => n + g.rows.length, 0),
  cast.prepDay.orders.length,
  'the seeded day’s twelve orders all reach a group',
);
assert.deepEqual(
  [...new Set(seeded.filter((r) => !r.review).map((r) => r.block))].sort(),
  seededGroups.filter((g) => g.word !== TO_REVIEW && g.word !== TO_ASSIGN).map((g) => g.word).sort(),
  'the blocks on screen are the blocks the fixtures declare',
);

console.log('bodega prep order: green');
