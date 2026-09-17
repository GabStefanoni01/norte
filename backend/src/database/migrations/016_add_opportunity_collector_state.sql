-- Estado da sincronização automática de oportunidades.
-- Permite diferenciar sincronizações completas de incrementais
-- e evita depender de estado mantido apenas em memória.

CREATE TABLE IF NOT EXISTS opportunity_collector_state (
  chave VARCHAR(50) PRIMARY KEY,
  ultima_execucao_sucesso TIMESTAMPTZ,
  ultima_sincronizacao_completa TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS opportunity_collector_state_updated_at_idx
  ON opportunity_collector_state(updated_at DESC);
