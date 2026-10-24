-- Classifies deterministic scanner findings without treating every heuristic as a confirmed defect.
ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS finding_type TEXT;

-- Existing records remain NULL until a new discovery pass can enrich them with a rule-based classification.
