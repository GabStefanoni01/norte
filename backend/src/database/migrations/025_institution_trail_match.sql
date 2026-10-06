ALTER TABLE institution_trails
  ADD COLUMN IF NOT EXISTS criterios JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_institution_trails_criterios
  ON institution_trails USING GIN (criterios);

COMMENT ON COLUMN institution_trails.criterios IS
  'Critérios genéricos de aderência da trilha: interesses, habilidades, escolaridades, carreiras e cidades.';
