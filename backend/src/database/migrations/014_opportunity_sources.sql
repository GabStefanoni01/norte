-- Metadados necessários para oportunidades coletadas automaticamente.
-- Mantemos suporte às oportunidades manuais já existentes.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS data_publicacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dados_origem JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_fonte_external_id_uq
  ON opportunities (fonte, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS opportunities_last_seen_at_idx
  ON opportunities (last_seen_at);

CREATE INDEX IF NOT EXISTS opportunities_data_publicacao_idx
  ON opportunities (data_publicacao DESC);
