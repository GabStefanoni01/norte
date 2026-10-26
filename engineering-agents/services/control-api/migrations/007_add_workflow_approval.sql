ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS execution_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS execution_approval_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_plan_sha256 TEXT;

CREATE TABLE IF NOT EXISTS engineering_improvement_workflow_events (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES engineering_improvements(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 2000),
  actor TEXT NOT NULL CHECK (char_length(actor) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engineering_improvement_execution_approvals (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES engineering_improvements(id) ON DELETE CASCADE,
  approved_by TEXT NOT NULL CHECK (char_length(approved_by) BETWEEN 1 AND 120),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 2000),
  plan_snapshot JSONB NOT NULL CHECK (jsonb_typeof(plan_snapshot) = 'object'),
  plan_sha256 CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engineering_workflow_events_task
  ON engineering_improvement_workflow_events (task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engineering_execution_queue
  ON engineering_improvements (priority DESC, updated_at ASC)
  WHERE status = 'queued' AND execution_approved_at IS NOT NULL;

COMMENT ON COLUMN engineering_improvements.execution_approved_at IS
  'Human approval timestamp for the exact analysis plan; does not execute code by itself.';
COMMENT ON TABLE engineering_improvement_execution_approvals IS
  'Append-only approvals including a snapshot and SHA-256 digest of the reviewed analysis plan.';
