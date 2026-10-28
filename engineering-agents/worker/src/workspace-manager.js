'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

function validateInputs({ taskId, baseRef, repositoryPath, workspaceRoot } = {}) {
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
  return { taskId, baseRef, repositoryPath: repo, workspaceRoot: root, workspacePath: path.join(root, taskId), branchName };
}

function buildWorkspacePlan(input = {}) {
  const { taskId, baseRef, repositoryPath, workspaceRoot, workspacePath, branchName } = validateInputs(input);
  return {
    mode: 'workspace-plan',
    executionEnabled: false,
    taskId,
    baseRef,
    branchName,
    repositoryPath,
    workspaceRoot,
    workspacePath,
    command: 'git',
    args: ['-C', repositoryPath, 'worktree', 'add', '-b', branchName, workspacePath, baseRef],
    sideEffects: false,
    nextAction: 'human-review-required; plan only, no workspace created',
  };
}

function runGit(repositoryPath, args) {
  const result = spawnSync('git', ['-C', repositoryPath, ...args], {
    encoding: 'utf8',
    shell: false,
    timeout: 15000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw new Error(`git_command_failed: ${result.error.code || result.error.message}`);
  if (result.status !== 0) {
    const detail = String(result.stderr || '').trim().slice(0, 500);
    throw new Error(`git_command_failed: ${detail || `exit_${result.status}`}`);
  }
  return String(result.stdout || '').trim();
}

function createWorkspace(input = {}) {
  const plan = buildWorkspacePlan(input);
  const { repositoryPath, workspaceRoot, workspacePath, branchName, baseRef, taskId } = plan;

  const repositoryTop = runGit(repositoryPath, ['rev-parse', '--show-toplevel']);
  if (path.resolve(repositoryTop) !== repositoryPath) {
    throw new Error('repository_path_must_be_repository_root');
  }
  runGit(repositoryPath, ['rev-parse', '--verify', `${baseRef}^{commit}`]);

  if (fs.existsSync(workspacePath)) {
    const top = runGit(workspacePath, ['rev-parse', '--show-toplevel']);
    const currentBranch = runGit(workspacePath, ['branch', '--show-current']);
    if (path.resolve(top) !== workspacePath || currentBranch !== branchName) {
      throw new Error('workspace_path_exists_but_does_not_match_expected_worktree');
    }
    return { mode: 'workspace-created', executionEnabled: false, sideEffects: false, alreadyExisted: true, taskId, baseRef, branchName, workspacePath, nextAction: 'human-review-required; workspace ready, no code executed' };
  }

  const branchExists = spawnSync('git', ['-C', repositoryPath, 'show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], {
    encoding: 'utf8', shell: false, timeout: 10000, windowsHide: true,
  });
  if (branchExists.error) throw new Error(`git_command_failed: ${branchExists.error.code || branchExists.error.message}`);
  if (branchExists.status === 0) throw new Error('task_branch_already_exists_without_matching_workspace');

  fs.mkdirSync(workspaceRoot, { recursive: true });
  runGit(repositoryPath, ['worktree', 'add', '-b', branchName, workspacePath, baseRef]);

  const actualTop = runGit(workspacePath, ['rev-parse', '--show-toplevel']);
  const actualBranch = runGit(workspacePath, ['branch', '--show-current']);
  if (path.resolve(actualTop) !== workspacePath || actualBranch !== branchName) {
    throw new Error('created_worktree_verification_failed');
  }

  return { mode: 'workspace-created', executionEnabled: false, sideEffects: true, alreadyExisted: false, taskId, baseRef, branchName, workspacePath, nextAction: 'human-review-required; workspace ready, no code executed' };
}

module.exports = { buildWorkspacePlan, createWorkspace, validateInputs, runGit, SAFE_TASK_ID, SAFE_REF };
