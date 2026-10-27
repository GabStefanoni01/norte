'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const workerPath = path.join(__dirname, '..', 'worker', 'src', 'worker.js');

test('dry-run worker has valid JavaScript syntax', () => {
  const source = fs.readFileSync(workerPath, 'utf8');
  assert.doesNotThrow(() => new vm.Script(source, { filename: 'worker.js' }));
});

test('dry-run worker requires the internal token and fails closed if execution is enabled', () => {
  const source = fs.readFileSync(workerPath, 'utf8');
  assert.match(source, /AGENTS_INGEST_TOKEN/);
  assert.match(source, /executionEnabled !== false/);
  assert.match(source, /AbortSignal\.timeout\(5000\)/);
});

test('dry-run worker only reports tasks with approval metadata and a valid SHA-256', () => {
  const source = fs.readFileSync(workerPath, 'utf8');
  assert.match(source, /approvedPlanSha256/);
  assert.match(source, /\^\[a-f0-9\]\{64\}\$/);
  assert.match(source, /executionApprovedAt/);
  assert.match(source, /humanApprovalRequired === true/);
  assert.match(source, /executionEnabled: false/);
  assert.match(source, /no code executed/);
});

test('dry-run worker does not invoke shells, git, or write files', () => {
  const source = fs.readFileSync(workerPath, 'utf8');
  assert.doesNotMatch(source, /child_process|execSync|spawnSync|\bspawn\(|\bexec\(|git clone|writeFileSync|createWriteStream/);
});
