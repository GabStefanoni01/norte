ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS worker_lease_owner TEXT,
  ADD COLUMN IF NOT EXISTS worker_lease_token TEXT,
  ADD COLUMN IF NOT EXISTS worker_lease_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS worker_attempts INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_engineering_worker_lease
  ON engineering_improvements (worker_lease_expires_at, priority DESC, updated_at ASC)
  WHERE status = 'queued' AND execution_approved_at IS NOT NULL;

COMMENT ON COLUMN engineering_improvements.worker_lease_token IS
  'Short-lived claim token for a worker; never an authorization to execute code.';
COMMENT ON COLUMN engineering_improvements.worker_lease_expires_at IS
  'Expiry for an atomic worker claim. Expired claims can be reclaimed; no code execution is implied.';
