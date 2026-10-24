CREATE TABLE IF NOT EXISTS engineering_improvements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 4000),
  category TEXT NOT NULL CHECK (category IN (
    'security', 'reliability', 'performance', 'testing', 'architecture',
    'maintainability', 'documentation', 'accessibility', 'other'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'discovered', 'triaged', 'queued', 'analyzing', 'planned', 'implementing',
    'reviewing', 'validating', 'awaiting_approval', 'rejected', 'blocked',
    'failed', 'cancelled', 'completed'
  )),
  priority NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 100),
  impact SMALLINT CHECK (impact BETWEEN 1 AND 5),
  confidence NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
  effort SMALLINT CHECK (effort BETWEEN 1 AND 5),
  risk SMALLINT CHECK (risk BETWEEN 1 AND 5),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  branch_name TEXT CHECK (branch_name IS NULL OR branch_name ~ '^agents/improvement-[A-Za-z0-9._-]+$'),
  pull_request_url TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engineering_improvements_queue
  ON engineering_improvements (priority DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_engineering_improvements_status
  ON engineering_improvements (status, updated_at DESC);

CREATE OR REPLACE FUNCTION set_engineering_improvement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_engineering_improvements_updated_at ON engineering_improvements;
CREATE TRIGGER trg_engineering_improvements_updated_at
BEFORE UPDATE ON engineering_improvements
FOR EACH ROW EXECUTE FUNCTION set_engineering_improvement_updated_at();