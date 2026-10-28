'use strict';

const path = require('node:path');
const { assertWritableBranch } = require('../../shared/branch-policy.js');

const SAFE_TASK_ID = /^[A-Za-z0-9._-]{1,100}$/;
const SAFE_REF = /^[A-Za-z0-9._/-]{1,255}$/;

function isAbsolutePath(value) {
  return typeof value === 'string' && value.length > 0 && path.isAbsolute(value);
}

function isSameOrInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function buildWorkspacePlan({ taskId, baseRef, repositoryPath, workspaceRoot } = {}) {
  if (typeof taskId !== 'string' || !SAFE_TASK_ID.test(taskId)) {
    throw new Error('invalid_task_id');
  }
  if (typeof baseRef !== 'string' || !SAFE_REF.test(baseRef) || baseRef.startsWith('/') || baseRef.endsWith('/') || baseRef.includes('..') || baseRef.includes('//') || baseRef.split('/').some((part) => !part || part === '.' || part.endsWith('.lock'))) {
    throw new Error('invalid_base_ref');
  }
  if (!isAbsolutePath(repositoryPath) || !isAbsolutePath(workspaceRoot)) {
    throw new Error('absolute_repository_and_workspace_paths_required');
  }

  const repo = path.resolve(repositoryPath);
  const root = path.resolve(workspaceRoot);
  if (isSameOrInside(repo, root) || isSameOrInside(root, repo)) {
    throw new Error('workspace_root_must_be_separate_from_repository');
  }

  const branchName = `agents/improvement-${taskId}`;
  assertWritableBranch({ branchName, taskId, operation: 'commit' });
  const workspacePath = path.join(root, taskId);
  const gitArgs = ['-C', repo, 'worktree', 'add', '-b', branchName, workspacePath, baseRef];

  return {
    mode: 'workspace-plan',
    executionEnabled: false,
    taskId,
    baseRef,
    branchName,
    repositoryPath: repo,
    workspaceRoot: root,
    workspacePath,
    command: 'git',
    args: gitArgs,
    sideEffects: false,
    nextAction: 'human-review-required; plan only, no workspace created',
  };
}

module.exports = { buildWorkspacePlan, SAFE_TASK_ID, SAFE_REF };
