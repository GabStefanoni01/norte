-- Adds explicit provenance for every discovered improvement.
ALTER TABLE engineering_improvements
  ADD COLUMN IF NOT EXISTS repository_name TEXT,
  ADD COLUMN IF NOT EXISTS repository_url TEXT,
  ADD COLUMN IF NOT EXISTS repository_ref TEXT;

-- The existing discovery run was confirmed to target the Norte repository.
-- Leave URL/ref unset for legacy tasks rather than inventing a source revision.
UPDATE engineering_improvements
   SET repository_name = 'Norte'
 WHERE repository_name IS NULL;
