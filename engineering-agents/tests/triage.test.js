'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('human triage API requires a decision, reason, reviewer, and authenticated access', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'services', 'control-api', 'src', 'server.js'), 'utf8');
  assert.match(server, /app\.post\('\/api\/tasks\/:id\/triage', requireToken/);
  assert.match(server, /'confirmed', 'false_positive', 'needs_context'/);
  assert.match(server, /body\.reason\.trim\(\)\.length < 10/);
  assert.match(server, /triage_decision = \$2/);
  assert.match(server, /engineering_improvement_triage_events/);
  assert.match(server, /app\.get\('\/api\/tasks\/:id\/triage-history', requireToken/);
  assert.match(server, /Access-Control-Allow-Methods', 'GET, POST, OPTIONS'/);
});

test('triage migration restricts decisions and keeps an append-only event history', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'services', 'control-api', 'migrations', '006_add_human_triage.sql'), 'utf8');
  assert.match(migration, /triage_decision TEXT/);
  assert.match(migration, /'confirmed', 'false_positive', 'needs_context'/);
  assert.match(migration, /FOREIGN KEY|REFERENCES engineering_improvements\(id\)/);
  assert.match(migration, /reason TEXT NOT NULL/);
  assert.match(migration, /reviewer TEXT NOT NULL/);
});

test('workflow requires allowed transitions and approval snapshots', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'services', 'control-api', 'src', 'server.js'), 'utf8');
  assert.match(server, /app\.post\('\/api\/tasks\/:id\/transition', requireToken/);
  assert.match(server, /invalid_status_transition/);
  assert.match(server, /engineering_improvement_workflow_events/);
  assert.match(server, /app\.post\('\/api\/tasks\/:id\/approve-execution', requireToken/);
  assert.match(server, /planSha256/);
  assert.match(server, /execution_approved_at IS NOT NULL/);
  assert.match(server, /app\.get\('\/internal\/execution-queue', requireIngestToken/);
  assert.match(server, /executionEnabled: false/);
});

test('workflow approval migration stores an immutable plan snapshot and audit trail', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'services', 'control-api', 'migrations', '007_add_workflow_approval.sql'), 'utf8');
  assert.match(migration, /execution_approved_at TIMESTAMPTZ/);
  assert.match(migration, /engineering_improvement_workflow_events/);
  assert.match(migration, /engineering_improvement_execution_approvals/);
  assert.match(migration, /plan_snapshot JSONB NOT NULL/);
  assert.match(migration, /plan_sha256 CHAR\(64\)/);
});
