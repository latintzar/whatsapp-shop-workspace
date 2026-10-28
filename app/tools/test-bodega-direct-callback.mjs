#!/usr/bin/env node
/** Synthetic callback checks: authorization values must clear before any fetch or app boot. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'bodega-direct-callback-'));
try {
  execFileSync(join(root, 'node_modules/.bin/tsc'), ['src/prototypes/bodega-pay-later/direct-callback.ts',
    '--outDir', out, '--resolveJsonModule', '--esModuleInterop', '--module', 'commonjs', '--target', 'ES2020', '--strict', '--skipLibCheck'],
  { cwd: root, stdio: 'pipe' });
  const require = createRequire(join(out, 'anchor.cjs'));
  const { routeDirectCallback } = require(join(out, 'direct-callback.js'));
  const state = `bodega-direct-${'a'.repeat(43)}`;
  const returned = '/bodega-pay-later/?connection-test=direct&returned=1';
  const makeIO = (response = { ok: true, json: async () => ({ ok: true }) }) => {
    const calls = [];
    return { calls, io: {
      clean: () => calls.push(['clean']),
      replace: (path) => calls.push(['replace', path]),
      request: async (path, options) => { calls.push(['request', path, options]); return response; },
    } };
  };
  const normal = makeIO();
  assert.equal(routeDirectCallback('?theme=proof', normal.io), null);
  assert.deepEqual(normal.calls, [], 'ordinary root requests remain available to the kit');
  const success = makeIO();
  const pending = routeDirectCallback(`?state=${state}&code=PRIVATE_CODE`, success.io);
  assert.deepEqual(success.calls[0], ['clean'], 'the callback URL clears synchronously before transport');
  await pending;
  assert.equal(success.calls[1][1], '/api/bodega/connection-test/complete');
  const options = success.calls[1][2];
  assert.equal(options.credentials, 'same-origin');
  assert.equal(options.referrerPolicy, 'no-referrer');
  assert.deepEqual(JSON.parse(options.body), { state, code: 'PRIVATE_CODE' });
  assert.deepEqual(success.calls[2], ['replace', returned]);
  for (const query of ['error=PRIVATE_ERROR', 'error_description=PRIVATE_ERROR', 'error=&code=PRIVATE_CODE', '']) {
    const cancelled = makeIO();
    await routeDirectCallback(`?state=${state}&${query}`, cancelled.io);
    assert.deepEqual(JSON.parse(cancelled.calls[1][2].body), { state, cancelled: true });
    assert.equal(JSON.stringify(cancelled.calls).includes('PRIVATE_'), false, 'provider error text stays out of transport and navigation');
  }
  for (const response of [{ ok: false, json: async () => ({ ok: true }) },
    { ok: true, json: async () => ({ ok: false }) }]) {
    const failed = makeIO(response);
    await routeDirectCallback(`?state=${state}&code=PRIVATE_CODE`, failed.io);
    assert.deepEqual(failed.calls.at(-1), ['replace', `${returned}&callback=failed`]);
  }
  const network = makeIO();
  network.io.request = async () => { throw new Error('PRIVATE_TRANSPORT_ERROR'); };
  await routeDirectCallback(`?state=${state}&code=PRIVATE_CODE`, network.io);
  assert.deepEqual(network.calls, [['clean'], ['replace', `${returned}&callback=failed`]]);
  console.log('PASS bodega direct callback: URL scrub precedes transport; private errors excluded; failed returns stay distinct');
} finally { rmSync(out, { recursive: true, force: true }); }
