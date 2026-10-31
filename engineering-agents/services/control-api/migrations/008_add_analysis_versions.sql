CREATE TABLE IF NOT EXISTS engineering_improvement_analysis_versions (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES engineering_improvements(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  analysis_plan JSONB NOT NULL CHECK (jsonb_typeof(analysis_plan) = 'object'),
  agent_trace JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(agent_trace) = 'array'),
  created_by TEXT NOT NULL DEFAULT 'langgraph-orchestrator'
    CHECK (char_length(created_by) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, version)
);

-- Preserve existing analyses as the first historical version before new writes begin.
INSERT INTO engineering_improvement_analysis_versions
  (task_id, version, analysis_plan, agent_trace, created_by, created_at)
SELECT
  id,
  1,
  analysis_plan,
  CASE
    WHEN jsonb_typeof(analysis_plan->'agentTrace') = 'array' THEN analysis_plan->'agentTrace'
    ELSE '[]'::jsonb
  END,
  'migration-backfill',
  COALESCE(updated_at, created_at, NOW())
FROM engineering_improvements
WHERE analysis_plan IS NOT NULL
  AND jsonb_typeof(analysis_plan) = 'object'
ON CONFLICT (task_id, version) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_engineering_analysis_versions_task
  ON engineering_improvement_analysis_versions (task_id, version DESC);

COMMENT ON TABLE engineering_improvement_analysis_versions IS
  'Append-only snapshots of each LangGraph analysis. A new analysis creates a new version; prior plans remain available.';
