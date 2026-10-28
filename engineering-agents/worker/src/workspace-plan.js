'use strict';

const { buildWorkspacePlan } = require('./workspace-manager.js');

function main() {
  const plan = buildWorkspacePlan({
    taskId: process.env.AGENTS_WORKSPACE_TASK_ID,
    baseRef: process.env.AGENTS_WORKSPACE_BASE_REF,
    repositoryPath: process.env.AGENTS_REPOSITORY_PATH,
    workspaceRoot: process.env.AGENTS_WORKSPACE_ROOT,
  });
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`workspace_plan_failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main };
