'use strict';

// Safe worker stage: inspect approved tasks only. This module never executes
// repository code, clones repositories, writes source files, or creates PRs.
const DEFAULT_API_URL = 'http://localhost:4310';
const REQUEST_TIMEOUT_MS = 5000;
const MAX_QUEUE_ITEMS = 10;

function isEligibleTask(task) {
  return Boolean(
    task &&
    typeof task.id === 'string' &&
    /^[A-Za-z0-9._-]{1,100}$/.test(task.id) &&
    typeof task.approvedPlanSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(task.approvedPlanSha256) &&
    typeof task.executionApprovedAt === 'string' &&
    task.executionApprovedAt.length > 0 &&
    task.analysisPlan &&
    typeof task.analysisPlan === 'object' &&
    !Array.isArray(task.analysisPlan) &&
    task.analysisPlan.humanApprovalRequired === true
  );
}

function validateQueuePayload(payload) {
  if (!payload || typeof payload !== 'object' ||
      payload.executionEnabled !== false || !Array.isArray(payload.tasks)) {
    throw new Error('Queue response did not match the expected disabled-execution contract');
  }
  return payload.tasks;
}

function buildReport(tasks) {
  const eligible = tasks.filter(isEligibleTask);
  return {
    mode: 'dry-run',
    executionEnabled: false,
    fetched: tasks.length,
    eligible: eligible.length,
    tasks: eligible.map((task) => ({
      id: task.id,
      title: String(task.title || '').slice(0, 200),
      category: String(task.category || 'unknown').slice(0, 80),
      approvedBy: String(task.executionApprovedBy || '').slice(0, 120),
      approvedPlanSha256: task.approvedPlanSha256,
      nextAction: 'manual-review-required; no code executed',
    })),
  };
}

async function fetchQueue(apiUrl, ingestToken) {
  const response = await fetch(`${apiUrl}/internal/execution-queue?limit=${MAX_QUEUE_ITEMS}`, {
    headers: { Authorization: `Bearer ${ingestToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Queue request failed with HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const apiUrl = (process.env.CONTROL_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  const ingestToken = process.env.AGENTS_INGEST_TOKEN;
  if (!ingestToken || ingestToken.length < 32) {
    throw new Error('AGENTS_INGEST_TOKEN must be configured with at least 32 characters');
  }

  const payload = await fetchQueue(apiUrl, ingestToken);
  const tasks = validateQueuePayload(payload);
  const report = buildReport(tasks);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`worker_dry_run_failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { isEligibleTask, validateQueuePayload, buildReport };
