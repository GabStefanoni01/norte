-- A busca usa ILIKE com curingas (%termo%).
-- Índices trigram permitem que o PostgreSQL evite varreduras completas
-- conforme o volume de oportunidades crescer.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS opportunities_titulo_trgm_idx
  ON opportunities USING GIN (titulo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS opportunities_empresa_trgm_idx
  ON opportunities USING GIN (empresa gin_trgm_ops);

CREATE INDEX IF NOT EXISTS opportunities_categoria_trgm_idx
  ON opportunities USING GIN (categoria gin_trgm_ops);

CREATE INDEX IF NOT EXISTS opportunities_descricao_trgm_idx
  ON opportunities USING GIN (descricao gin_trgm_ops);
