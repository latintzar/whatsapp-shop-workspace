import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'bodega-mobile-check-'));
try {
  execFileSync(join(root, 'node_modules/.bin/tsc'), ['src/prototypes/bodega-pay-later/mobile/state.ts',
    '--outDir', out, '--resolveJsonModule', '--esModuleInterop', '--module', 'commonjs', '--target', 'ES2020', '--strict', '--skipLibCheck'], { cwd: root, stdio: 'pipe' });
  const { readDraftValue, acceptsReturn, publicCodeFromLink, publicWaitlistValue, isTestNotificationAction,
    orchestrateNotificationTest, singleflightNotificationTest, TEST_NOTIFICATION_ID, TEST_NOTIFICATION_ACTION, TEST_NOTIFICATION_CHANNEL, EMPTY_DRAFT } = createRequire(join(out, 'anchor.cjs'))(join(out, 'prototypes/bodega-pay-later/mobile/state.js'));
  assert.deepEqual(readDraftValue(null), EMPTY_DRAFT);
  assert.deepEqual(readDraftValue('{broken'), EMPTY_DRAFT);
  const draft = readDraftValue(JSON.stringify({ version: 1, step: 'name', language: 'es', kind: 'bodega',
    ownerName: 'Tester', name: 'Mi bodega', address: 'Calle 123', account: 'FAKE', token: 'SECRET', place: 999, code: 'PRIVATE' }));
  assert.equal(draft.step, 'name');
  assert.equal(draft.name, 'Mi bodega');
  assert.equal(draft.language, 'es');
  assert.equal(draft.ownerName, 'Tester');
  assert.deepEqual(Object.keys(draft).sort(), Object.keys(EMPTY_DRAFT).sort());
  assert.equal(JSON.stringify(draft).includes('SECRET'), false);
  assert.equal(JSON.stringify(draft).includes('999'), false);
  assert.equal(readDraftValue(JSON.stringify({ version: 99, step: 'waitlist' })).step, 'arrival');
  assert.equal(readDraftValue(JSON.stringify({ version: 1, step: 'connected', kind: 'FAKE', name: 'x'.repeat(900) })).step, 'arrival');
  assert.equal(readDraftValue(JSON.stringify({ version: 1, name: 'x'.repeat(900) })).name.length, 100);
  assert.equal(acceptsReturn('rocoto://return'), true);
  assert.equal(acceptsReturn('rocoto://return?code=SECRET'), false);
  assert.equal(acceptsReturn('rocoto://return.evil.test'), false);
  assert.equal(acceptsReturn('https://evil.test/return'), false);
  assert.equal(acceptsReturn('rocoto://return/other'), false);
  for (const link of ['AB2345', 'rocoto://waitlist/AB2345', 'https://shop.example.invalid/bodega-app/?lista=AB2345',
    'https://shop.example.invalid/bodega-app/waitlist/AB2345', 'https://shop.example.invalid/bodega-pay-later/?lista=AB2345']) {
    assert.equal(publicCodeFromLink(link), 'AB2345');
  }
  for (const link of ['https://evil.test/?lista=AB2345', 'rocoto://waitlist/AB2345?token=SECRET', 'AB01IO', '../AB2345']) {
    assert.equal(publicCodeFromLink(link), '');
  }
  assert.equal(publicWaitlistValue({ name: 'A', place: 0, ahead: 0, joined: 0 }), null);
  assert.equal(publicWaitlistValue({ name: 'A', place: '99', ahead: 98, joined: 0 }), null);
  assert.deepEqual(publicWaitlistValue({ name: 'A', kind: 'bodega', place: 99, ahead: 98, joined: 0, token: 'SECRET' }),
    { name: 'A', kind: 'bodega', place: 99, ahead: 98, joined: 0 });
  const notification = { actionId: TEST_NOTIFICATION_ACTION, notification: { id: TEST_NOTIFICATION_ID,
    extra: { kind: 'rocoto-tester', version: 1 } } };
  assert.equal(isTestNotificationAction(notification), true);
  assert.equal(isTestNotificationAction({ ...notification, actionId: 'tap' }), true);
  assert.equal(isTestNotificationAction({ ...notification, notification: { ...notification.notification, id: 731002 } }), false);
  assert.equal(isTestNotificationAction({ ...notification, notification: { ...notification.notification, extra: { kind: 'rocoto-tester', version: 1, token: 'SECRET' } } }), false);
  const makeAdapter = (overrides = {}) => {
    const calls = [];
    const adapter = {
      isNative: true, getAvailability: async () => ({ enabled: true, channelsSupported: true }),
      checkPermissions: async () => ({ display: 'granted' }), requestPermissions: async () => ({ display: 'granted' }),
      createChannel: async () => { calls.push('channel'); }, listChannels: async () => [{ id: TEST_NOTIFICATION_CHANNEL, importance: 3 }],
      registerActions: async () => { calls.push('actions'); }, schedule: async (value) => { calls.push(['schedule', value]); }, ...overrides,
    };
    return { adapter, calls };
  };
  {
    const { adapter, calls } = makeAdapter({ checkPermissions: async () => ({ display: 'denied' }), requestPermissions: async () => ({ display: 'denied' }) });
    assert.equal(await orchestrateNotificationTest(adapter), 'permission-denied');
    assert.equal(calls.some((call) => Array.isArray(call) && call[0] === 'schedule'), false);
  }
  {
    const { adapter, calls } = makeAdapter({ listChannels: async () => [{ id: TEST_NOTIFICATION_CHANNEL, importance: 0 }] });
    assert.equal(await orchestrateNotificationTest(adapter), 'channel-disabled');
    assert.equal(calls.includes('actions'), false);
  }
  {
    const { adapter, calls } = makeAdapter({ getAvailability: async () => ({ enabled: true, channelsSupported: false }) });
    assert.equal(await orchestrateNotificationTest(adapter), 'scheduled');
    assert.equal(calls.includes('channel'), false);
    const scheduled = calls.find((call) => Array.isArray(call) && call[0] === 'schedule')[1];
    assert.equal('schedule' in scheduled, false);
    assert.equal('at' in scheduled, false);
    assert.equal(scheduled.isExactNotification, false);
  }
  {
    const { adapter } = makeAdapter({ createChannel: async () => { throw new Error('channel'); } });
    assert.equal(await orchestrateNotificationTest(adapter), 'error');
  }
  {
    let scheduleCount = 0;
    const { adapter } = makeAdapter({ schedule: async () => { scheduleCount += 1; await new Promise((resolve) => setTimeout(resolve, 5)); } });
    assert.equal((await Promise.all([orchestrateNotificationTest(adapter), orchestrateNotificationTest(adapter)])).filter((value) => value === 'scheduled').length, 2);
    assert.equal(scheduleCount, 2);
  }
  {
    let runCount = 0;
    const run = singleflightNotificationTest(async () => { runCount += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return 'scheduled'; });
    assert.equal((await Promise.all([run(), run()]))[0], 'scheduled');
    assert.equal(runCount, 1);
  }
  console.log('PASS Android draft: durable bounded fields, restored progress, identity exclusion, exact return door');
} finally { rmSync(out, { recursive: true, force: true }); }
