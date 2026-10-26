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
