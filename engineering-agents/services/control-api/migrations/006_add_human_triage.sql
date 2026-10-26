ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS triage_decision TEXT
    CHECK (triage_decision IS NULL OR triage_decision IN ('confirmed', 'false_positive', 'needs_context')),
  ADD COLUMN IF NOT EXISTS triage_reason TEXT,
  ADD COLUMN IF NOT EXISTS triaged_by TEXT,
  ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS engineering_improvement_triage_events (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES engineering_improvements(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('confirmed', 'false_positive', 'needs_context')),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 2000),
  reviewer TEXT NOT NULL CHECK (char_length(reviewer) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engineering_triage_events_task
  ON engineering_improvement_triage_events (task_id, created_at DESC);

COMMENT ON COLUMN engineering_improvements.triage_decision IS
  'Human-recorded triage outcome; does not authorize automated code changes.';
COMMENT ON TABLE engineering_improvement_triage_events IS
  'Append-only audit history of human triage decisions.';
