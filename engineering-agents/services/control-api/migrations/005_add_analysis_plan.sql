ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS analysis_plan JSONB;

COMMENT ON COLUMN engineering_improvements.analysis_plan IS
  'Rule-based proposed analysis and validation plan; advisory only and never an authorization to edit code.';
