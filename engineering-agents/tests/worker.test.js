'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isEligibleTask, validateQueuePayload, buildReport, claimAndRelease } = require('../worker/src/worker.js');

const approvedTask = {
  id: 'test-task-001',
  title: 'Tarefa de teste aprovada',
  category: 'maintainability',
  executionApprovedAt: '2026-10-26T12:00:00.000Z',
  executionApprovedBy: 'reviewer-test',
  approvedPlanSha256: 'a'.repeat(64),
  analysisPlan: {
    hypothesis: 'Validar o contrato da fila',
    steps: ['Inspecionar o payload'],
    validation: ['Executar os testes'],
    rollback: 'Nenhuma alteração foi realizada',
    humanApprovalRequired: true,
  },
};

test('accepts a task only when approval metadata and plan requirements are valid', () => {
  assert.equal(isEligibleTask(approvedTask), true);
  assert.equal(isEligibleTask({ ...approvedTask, approvedPlanSha256: 'invalid' }), false);
  assert.equal(isEligibleTask({ ...approvedTask, executionApprovedAt: null }), false);
  assert.equal(isEligibleTask({
    ...approvedTask,
    analysisPlan: { ...approvedTask.analysisPlan, humanApprovalRequired: false },
  }), false);
  assert.equal(isEligibleTask({ ...approvedTask, id: '../unsafe' }), false);
});

test('fails closed when the queue contract is missing or execution is enabled', () => {
  assert.throws(() => validateQueuePayload(null), /disabled-execution contract/);
  assert.throws(() => validateQueuePayload({ tasks: [] }), /disabled-execution contract/);
  assert.throws(() => validateQueuePayload({ executionEnabled: true, tasks: [] }), /disabled-execution contract/);
  assert.deepEqual(validateQueuePayload({ executionEnabled: false, tasks: [] }), []);
});

test('reports only eligible tasks and explicitly keeps execution disabled', () => {
  const report = buildReport([approvedTask, { ...approvedTask, id: 'bad-hash', approvedPlanSha256: 'nope' }]);
  assert.equal(report.mode, 'dry-run');
  assert.equal(report.executionEnabled, false);
  assert.equal(report.fetched, 2);
  assert.equal(report.eligible, 1);
  assert.equal(report.tasks[0].id, 'test-task-001');
  assert.match(report.tasks[0].nextAction, /no code executed/);
});

test('report truncates externally supplied display strings', () => {
  const report = buildReport([{
    ...approvedTask,
    title: 'T'.repeat(500),
    category: 'C'.repeat(200),
    executionApprovedBy: 'R'.repeat(200),
  }]);
  assert.equal(report.tasks[0].title.length, 200);
  assert.equal(report.tasks[0].category.length, 80);
  assert.equal(report.tasks[0].approvedBy.length, 120);
});

test('worker remains read-only and does not invoke a shell, git, or filesystem writes', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'worker', 'src', 'worker.js'), 'utf8');
  assert.doesNotMatch(source, /child_process|execSync|spawnSync|\bspawn\(|\bexec\(|git clone|writeFileSync|createWriteStream/);
});

test('claim dry-run releases its lease and never enables execution', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    if (String(url).endsWith('/internal/execution-queue/claim')) {
      return new Response(JSON.stringify({
        task: approvedTask,
        lease: { owner: 'local-dry-run', token: 'b'.repeat(64), expiresAt: '2026-10-28T16:00:00.000Z' },
        executionEnabled: false,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ released: true, executionEnabled: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const report = await claimAndRelease('http://localhost:4310', 'x'.repeat(64));
  assert.equal(report.mode, 'claim-dry-run');
  assert.equal(report.executionEnabled, false);
  assert.equal(report.eligible, 1);
  assert.equal(report.leaseReleased, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/claim$/);
  assert.match(calls[1].url, /test-task-001\/release$/);
  assert.equal(JSON.parse(calls[1].options.body).leaseToken, 'b'.repeat(64));
});

test('claim dry-run fails closed if claim response enables execution', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    task: approvedTask,
    lease: { owner: 'local-dry-run', token: 'b'.repeat(64) },
    executionEnabled: true,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

  await assert.rejects(
    claimAndRelease('http://localhost:4310', 'x'.repeat(64)),
    /explicitly keep execution disabled/,
  );
});
