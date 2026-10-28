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

async function claimAndRelease(apiUrl, ingestToken) {
  const workerId = process.env.AGENTS_WORKER_ID || 'local-dry-run';
  if (!/^[A-Za-z0-9._:-]{1,120}$/.test(workerId)) {
    throw new Error('AGENTS_WORKER_ID contains unsupported characters');
  }

  const claimResponse = await fetch(`${apiUrl}/internal/execution-queue/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ingestToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workerId }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!claimResponse.ok) throw new Error(`Queue claim failed with HTTP ${claimResponse.status}`);
  const claim = await claimResponse.json();
  if (claim.executionEnabled !== false) {
    throw new Error('Claim response did not explicitly keep execution disabled');
  }
  if (!claim.task) {
    return { mode: 'claim-dry-run', executionEnabled: false, fetched: 0, eligible: 0, tasks: [], leaseReleased: true };
  }
  if (!claim.lease || typeof claim.lease.token !== 'string' || !/^[a-f0-9]{64}$/.test(claim.lease.token)) {
    throw new Error('Claim response did not contain a valid lease token');
  }

  let report;
  let releaseError;
  try {
    report = buildReport([claim.task]);
  } finally {
    try {
      const releaseResponse = await fetch(`${apiUrl}/internal/execution-queue/${encodeURIComponent(claim.task.id)}/release`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ingestToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workerId, leaseToken: claim.lease.token }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!releaseResponse.ok) throw new Error(`Lease release failed with HTTP ${releaseResponse.status}`);
    } catch (error) {
      releaseError = error;
    }
  }
  if (releaseError) {
    throw new Error(`Task was claimed but the lease could not be released; it will expire automatically: ${releaseError.message}`);
  }
  return { ...report, mode: 'claim-dry-run', leaseReleased: true };
}

async function main() {
  const apiUrl = (process.env.CONTROL_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
  const ingestToken = process.env.AGENTS_INGEST_TOKEN;
  if (!ingestToken || ingestToken.length < 32) {
    throw new Error('AGENTS_INGEST_TOKEN must be configured with at least 32 characters');
  }

  const report = process.argv.includes('--claim-dry-run')
    ? await claimAndRelease(apiUrl, ingestToken)
    : buildReport(validateQueuePayload(await fetchQueue(apiUrl, ingestToken)));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`worker_dry_run_failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { isEligibleTask, validateQueuePayload, buildReport, claimAndRelease };
