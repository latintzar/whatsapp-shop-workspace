#!/usr/bin/env node
/** Synthetic journal checks; device/browser and provider acceptance need the separate phone test. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = 'src/prototypes/bodega-pay-later/connection-experiment-state.ts';
const out = mkdtempSync(join(tmpdir(), 'bodega-connection-test-'));
try {
  execFileSync(join(root, 'node_modules/.bin/tsc'), [source, '--outDir', out, '--resolveJsonModule', '--esModuleInterop', '--module', 'commonjs',
    '--target', 'ES2020', '--strict', '--skipLibCheck'], { cwd: root, stdio: 'pipe' });
  const require = createRequire(join(out, 'anchor.cjs'));
  const { sanitizeExperimentJournal: sanitize, appendExperimentEvent: append, MAX_EXPERIMENT_EVENTS,
    isExperimentRunId } = require(join(out, 'connection-experiment-state.js'));

  const secret = 'private-provider-answer';
  const recovered = sanitize({ version: 1, page: 2, attempt: 3, outcome: 'active', status: 'authorizing',
    code: secret, phoneNumber: secret, accountId: secret,
    events: [
      { at: 100, page: 2, attempt: 3, kind: 'status', value: 'authorizing', code: secret },
      { at: 101, page: 2, attempt: 3, kind: 'failure', value: secret, data: { code: secret } },
      { at: 102, page: 2, attempt: 3, kind: secret, value: 'provider' },
    ],
  });
  assert.equal(JSON.stringify(recovered).includes(secret), false, 'private and unknown storage fields are discarded');
  assert.deepEqual(recovered.events, [
    { at: 100, page: 2, attempt: 3, kind: 'status', value: 'authorizing' },
    { at: 101, page: 2, attempt: 3, kind: 'failure' },
  ]);
  const reopened = append(recovered, { kind: 'load' }, 200);
  assert.equal(reopened.outcome, 'interrupted', 'reload records loss of the current provider controller');
  assert.equal(reopened.page, 3);
  assert.equal(reopened.attempt, 3, 'loading a page never begins a provider attempt');
  const fresh = append(reopened, { kind: 'launch' }, 300);
  assert.equal(fresh.attempt, 4);
  assert.equal(fresh.outcome, 'active');
  assert.equal(fresh.status, undefined, 'a new attempt drops its predecessor’s status');
  const hidden = append(fresh, { kind: 'pagehide', value: 'persisted' }, 400);
  const shown = append(hidden, { kind: 'pageshow', value: 'persisted' }, 500);
  assert.equal(shown.outcome, 'active', 'a bfcache round trip keeps the current controller distinct from reload');
  const finishedEvent = append(shown, { kind: 'provider_event', value: 'finish_coexistence' }, 600);
  assert.equal(finishedEvent.outcome, 'active', 'Meta FINISH alone never claims the backend connection succeeded');
  const complete = append(finishedEvent, { kind: 'completion', value: 'complete' }, 700);
  assert.equal(complete.outcome, 'completed');
  assert.equal(append(complete, { kind: 'load' }, 800).outcome, 'completed', 'the prior result survives reopening as prior evidence');

  let bounded = sanitize(null);
  for (let index = 0; index < 300; index++) bounded = append(bounded, { kind: 'visibility', value: 'visible' }, index);
  assert.equal(bounded.events.length, MAX_EXPERIMENT_EVENTS);
  assert.equal(bounded.events[0].at, 300 - MAX_EXPERIMENT_EVENTS);
  assert.equal(sanitize({ ...bounded, events: Array(400).fill(bounded.events[0]) }).events.length, MAX_EXPERIMENT_EVENTS);
  assert.deepEqual(sanitize({ version: 2, events: [{ code: secret }] }), sanitize(null));
  assert.equal(sanitize({ version: 1, page: '5', attempt: Infinity }).page, 0);
  assert.equal(sanitize({ version: 1, page: -1, attempt: 1001 }).attempt, 0);
  assert.equal(append({ ...bounded, page: 10000 }, { kind: 'load' }, 900).page, 10000);
  assert.equal(append({ ...bounded, attempt: 1000 }, { kind: 'launch' }, 900).attempt, 1000);
  assert.equal(isExperimentRunId('7e1449a2-c16f-470e-bb5c-8d903a146090'), true);
  for (const invalid of [secret, '', null, '7e1449a2-c16f-170e-bb5c-8d903a146090']) assert.equal(isExperimentRunId(invalid), false);
  console.log('PASS bodega connection experiment: privacy allowlist, bounded history, reload/return distinction and explicit completion');
} finally {
  rmSync(out, { recursive: true, force: true });
}
