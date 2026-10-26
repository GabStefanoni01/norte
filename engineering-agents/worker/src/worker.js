'use strict';

// Safe first-stage worker: inspect approved tasks only. It deliberately does not
// clone repositories, execute commands, write source files, or create pull requests.
const apiUrl = (process.env.CONTROL_API_URL || 'http://localhost:4310').replace(/\/$/, '');
const ingestToken = process.env.AGENTS_INGEST_TOKEN;

if (!ingestToken || ingestToken.length < 32) {
  throw new Error('AGENTS_INGEST_TOKEN must be configured with at least 32 characters');
}

async function main() {
  const response = await fetch(`${apiUrl}/internal/execution-queue?limit=10`, {
    headers: { Authorization: `Bearer ${ingestToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Queue request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.executionEnabled !== false || !Array.isArray(payload.tasks)) {
    throw new Error('Queue response did not match the expected disabled-execution contract');
  }

  const eligible = payload.tasks.filter((task) =>
    task &&
    typeof task.id === 'string' &&
    typeof task.approvedPlanSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(task.approvedPlanSha256) &&
    task.executionApprovedAt &&
    task.analysisPlan &&
    task.analysisPlan.humanApprovalRequired === true
  );

  const report = {
    mode: 'dry-run',
    executionEnabled: false,
    fetched: payload.tasks.length,
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

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`worker_dry_run_failed: ${error.message}\n`);
  process.exitCode = 1;
});
