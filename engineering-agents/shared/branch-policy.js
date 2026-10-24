'use strict';

const PROTECTED_BRANCHES = new Set(['main', 'develop']);
const TASK_BRANCH_PATTERN = /^agents\/improvement-([A-Za-z0-9._-]+)$/;
const FORBIDDEN_OPERATIONS = new Set([
  'merge',
  'force-push',
  'delete-ref',
  'deploy',
  'change-repository-rules',
  'change-credentials',
]);

class BranchPolicyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BranchPolicyError';
    this.code = code;
  }
}

/**
 * Defense-in-depth guard for future write-capable workers.
 * GitHub permissions and branch protection remain mandatory.
 */
function assertWritableBranch({ branchName, taskId, operation = 'commit' } = {}) {
  if (typeof branchName !== 'string' || typeof taskId !== 'string' || !taskId) {
    throw new BranchPolicyError('INVALID_CONTEXT', 'A branch name and task ID are required.');
  }

  if (PROTECTED_BRANCHES.has(branchName)) {
    throw new BranchPolicyError('PROTECTED_BRANCH', 'Writes to protected branches are forbidden.');
  }

  if (FORBIDDEN_OPERATIONS.has(operation)) {
    throw new BranchPolicyError('FORBIDDEN_OPERATION', 'This operation requires explicit human action.');
  }

  const match = TASK_BRANCH_PATTERN.exec(branchName);
  if (!match || match[1] !== taskId) {
    throw new BranchPolicyError('BRANCH_TASK_MISMATCH', 'Writes are allowed only on the current task branch.');
  }

  return true;
}

module.exports = { assertWritableBranch, BranchPolicyError, PROTECTED_BRANCHES };
