CREATE TABLE IF NOT EXISTS opportunity_collector_state (
  chave VARCHAR(100) PRIMARY KEY,
  ultima_execucao_sucesso TIMESTAMPTZ,
  ultima_sincronizacao_completa TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO opportunity_collector_state (chave)
VALUES ('jobspipe')
ON CONFLICT (chave) DO NOTHING;
