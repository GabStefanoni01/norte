ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS recommended_action TEXT,
  ADD COLUMN IF NOT EXISTS priority_rationale TEXT;

COMMENT ON COLUMN engineering_improvements.recommended_action IS
  'Rule-based next-step suggestion; not an autonomous instruction to modify code.';
COMMENT ON COLUMN engineering_improvements.priority_rationale IS
  'Human-readable explanation of the heuristic priority score and its dimensions.';
