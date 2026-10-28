'use strict';

const { isEligibleTask } = require('./worker.js');
const { createWorkspace } = require('./workspace-manager.js');

const DEFAULT_API_URL = 'http://localhost:4310';
const REQUEST_TIMEOUT_MS = 5000;

async function requestJson(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`api_request_failed_http_${response.status}`);
  return response.json();
}

async function createApprovedTaskWorkspace({
  apiUrl = DEFAULT_API_URL,
  ingestToken = process.env.AGENTS_INGEST_TOKEN,
  workerId = process.env.AGENTS_WORKER_ID || 'local-workspace-creator',
  taskId = process.env.AGENTS_WORKSPACE_TASK_ID,
  baseRef = process.env.AGENTS_WORKSPACE_BASE_REF,
  repositoryPath = process.env.AGENTS_REPOSITORY_PATH,
  workspaceRoot = process.env.AGENTS_WORKSPACE_ROOT,
  allowUnpinnedBaseRef = process.env.AGENTS_WORKSPACE_ALLOW_UNPINNED_BASE_REF === 'true',
} = {}) {
  if (!ingestToken || ingestToken.length < 32) throw new Error('AGENTS_INGEST_TOKEN must be configured with at least 32 characters');
  if (!/^[A-Za-z0-9._:-]{1,120}$/.test(workerId)) throw new Error('invalid_worker_id');
  if (typeof taskId !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(taskId)) throw new Error('AGENTS_WORKSPACE_TASK_ID is required and must be safe');
  if (typeof baseRef !== 'string' || !baseRef) throw new Error('AGENTS_WORKSPACE_BASE_REF is required');

  const normalizedApiUrl = apiUrl.replace(/\/$/, '');
  const claim = await requestJson(`${normalizedApiUrl}/internal/execution-queue/claim`, ingestToken, {
    method: 'POST',
    body: JSON.stringify({ workerId, taskId }),
  });
  if (claim.executionEnabled !== false) throw new Error('claim_response_did_not_keep_execution_disabled');
  if (!claim.task) return { mode: 'workspace-create', executionEnabled: false, created: false, reason: 'no_eligible_approved_task' };

  const claimedTaskId = claim.task.id;
  const leaseToken = claim.lease && claim.lease.token;
  if (typeof leaseToken !== 'string' || !/^[a-f0-9]{64}$/.test(leaseToken)) {
    throw new Error('claim_response_missing_valid_lease');
  }

  let result;
  let operationError;
  try {
    if (claimedTaskId !== taskId) throw new Error('claimed_task_id_mismatch');
    if (!isEligibleTask(claim.task)) throw new Error('claimed_task_does_not_match_approval_contract');
    if (claim.task.repositoryRef && claim.task.repositoryRef !== baseRef) {
      throw new Error('base_ref_must_match_task_repository_ref');
    }
    if (!claim.task.repositoryRef && !allowUnpinnedBaseRef) {
      throw new Error('task_has_no_pinned_repository_ref; set AGENTS_WORKSPACE_ALLOW_UNPINNED_BASE_REF=true only after human verification');
    }

    result = createWorkspace({ taskId, baseRef, repositoryPath, workspaceRoot });
    result.mode = 'workspace-create';
    result.executionEnabled = false;
    result.approval = {
      approvedBy: String(claim.task.executionApprovedBy || '').slice(0, 120),
      approvedAt: claim.task.executionApprovedAt,
      planSha256: claim.task.approvedPlanSha256,
    };
  } catch (error) {
    operationError = error;
  }

  let releaseError;
  try {
    const released = await requestJson(`${normalizedApiUrl}/internal/execution-queue/${encodeURIComponent(claimedTaskId)}/release`, ingestToken, {
      method: 'POST',
      body: JSON.stringify({ workerId, leaseToken }),
    });
    if (released.executionEnabled !== false || released.released !== true) throw new Error('lease_release_contract_invalid');
  } catch (error) {
    releaseError = error;
  }

  if (operationError && releaseError) {
    throw new Error(`workspace_operation_failed: ${operationError.message}; lease_release_failed: ${releaseError.message}`);
  }
  if (operationError) throw operationError;
  if (releaseError) throw new Error(`workspace_created_but_lease_release_failed: ${releaseError.message}`);
  return { ...result, leaseReleased: true };
}

async function main() {
  const result = await createApprovedTaskWorkspace();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`workspace_create_failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createApprovedTaskWorkspace, requestJson };
