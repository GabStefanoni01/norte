'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertWritableBranch, BranchPolicyError } = require('../shared/branch-policy');

test('allows writes only to the matching task branch', () => {
  assert.equal(assertWritableBranch({
    branchName: 'agents/improvement-task-123',
    taskId: 'task-123',
    operation: 'commit',
  }), true);
});

test('rejects main and develop explicitly', () => {
  for (const branchName of ['main', 'develop']) {
    assert.throws(
      () => assertWritableBranch({ branchName, taskId: 'task-123' }),
      error => error instanceof BranchPolicyError && error.code === 'PROTECTED_BRANCH',
    );
  }
});

test('rejects a branch that belongs to another task', () => {
  assert.throws(
    () => assertWritableBranch({ branchName: 'agents/improvement-task-456', taskId: 'task-123' }),
    error => error.code === 'BRANCH_TASK_MISMATCH',
  );
});

test('rejects non-task branches and forbidden operations', () => {
  assert.throws(
    () => assertWritableBranch({ branchName: 'feature/something', taskId: 'task-123' }),
    error => error.code === 'BRANCH_TASK_MISMATCH',
  );
  assert.throws(
    () => assertWritableBranch({ branchName: 'agents/improvement-task-123', taskId: 'task-123', operation: 'merge' }),
    error => error.code === 'FORBIDDEN_OPERATION',
  );
});

test('rejects missing task context', () => {
  assert.throws(
    () => assertWritableBranch({ branchName: 'agents/improvement-task-123' }),
    error => error.code === 'INVALID_CONTEXT',
  );
});
