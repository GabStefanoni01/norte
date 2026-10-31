'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'services', 'control-api');

test('analysis version migration backfills existing plans and enforces unique task versions', () => {
  const migration = fs.readFileSync(path.join(root, 'migrations', '008_add_analysis_versions.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS engineering_improvement_analysis_versions/);
  assert.match(migration, /UNIQUE \(task_id, version\)/);
  assert.match(migration, /INSERT INTO engineering_improvement_analysis_versions/);
  assert.match(migration, /WHERE analysis_plan IS NOT NULL/);
  assert.match(migration, /agent_trace JSONB/);
});

test('control API exposes authenticated version history and reanalysis routes', () => {
  const server = fs.readFileSync(path.join(root, 'src', 'server.js'), 'utf8');
  assert.match(server, /app\.get\('\/api\/tasks\/:id\/analysis-versions', requireToken/);
  assert.match(server, /app\.post\('\/api\/tasks\/:id\/reanalyze', requireToken, analyzeTaskHandler\)/);
  assert.match(server, /ORDER BY version DESC/);
  assert.match(server, /analysisVersion: version/);
});

test('reanalyzing reserves the task, appends a new version, and preserves human approval gates', () => {
  const server = fs.readFileSync(path.join(root, 'src', 'server.js'), 'utf8');
  assert.match(server, /task\.status === 'triaged' && !task\.analysisPlan/);
  assert.match(server, /\['planned', 'triaged'\]\.includes\(task\.status\) && !!task\.analysisPlan/);
  assert.match(server, /UPDATE engineering_improvements SET status = 'analyzing'/);
  assert.match(server, /INSERT INTO engineering_improvement_analysis_versions/);
  assert.match(server, /humanApprovalRequired !== true/);
  assert.match(server, /execution_enabled !== false/);
  assert.match(server, /executionEnabled: false/);
  assert.match(server, /restoreAnalysisReservation/);
});

test('planned tasks can enter analyzing for a controlled reanalysis cycle', () => {
  const server = fs.readFileSync(path.join(root, 'src', 'server.js'), 'utf8');
  assert.match(server, /planned: \['analyzing', 'awaiting_approval', 'blocked', 'rejected'\]/);
});
