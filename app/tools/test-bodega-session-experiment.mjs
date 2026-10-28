#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'bodega-session-check-'));
try {
  execFileSync(join(root, 'node_modules/.bin/tsc'), ['src/prototypes/bodega-pay-later/session-experiment-state.ts',
    '--outDir', out, '--resolveJsonModule', '--esModuleInterop', '--module', 'commonjs', '--target', 'ES2020', '--strict', '--skipLibCheck'], { cwd: root, stdio: 'pipe' });
  const { classifySession, maskedSessionPhone, sessionsMismatch } = createRequire(join(out, 'anchor.cjs'))(join(out, 'session-experiment-state.js'));
  const app = classifySession('bodega', 200, { signedIn: true, phone: '+51 999 123 456', token: 'PRIVATE' });
  assert.equal(app.status, 'recognized');
  assert.equal(maskedSessionPhone(app), '•••• 3456');
  assert.equal(JSON.stringify(app).includes('PRIVATE'), false);
  const proof = classifySession('proof', 200, { connection: { number: '51999123456', name: 'PRIVATE' } });
  assert.equal(proof.status, 'recognized');
  assert.equal(sessionsMismatch(app, proof), false);
  assert.equal(sessionsMismatch(app, classifySession('proof', 200, { connection: { number: '+51999876543' } })), true);
  for (const source of ['bodega', 'proof']) {
    assert.equal(classifySession(source, 401, {}).status, 'sign_in');
    for (const status of [0, 403, 404, 429, 500, 503]) assert.equal(classifySession(source, status, {}).status, 'unknown');
    assert.equal(classifySession(source, 200, { phone: 'PRIVATE' }).status, 'unknown');
  }
  assert.equal(classifySession('bodega', 200, { signedIn: false, phone: 'PRIVATE' }).status, 'sign_in');
  assert.equal(classifySession('proof', 200, { connection: null }).status, 'sign_in');
  assert.equal(maskedSessionPhone(classifySession('bodega', 200, { signedIn: true, phone: 'PRIVATE' })), '');
  console.log('PASS bodega session check: existing-session evidence, unknown failures, masked authenticated phone comparison');
} finally { rmSync(out, { recursive: true, force: true }); }
