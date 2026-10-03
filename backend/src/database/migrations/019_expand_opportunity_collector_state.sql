-- Metadados da execução do coletor para processamento em background e observabilidade.
ALTER TABLE opportunity_collector_state
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS inicio_ultima_execucao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fim_ultima_execucao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultima_falha_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultima_falha_mensagem TEXT;

ALTER TABLE opportunity_collector_state
  DROP CONSTRAINT IF EXISTS opportunity_collector_state_status_check;

ALTER TABLE opportunity_collector_state
  ADD CONSTRAINT opportunity_collector_state_status_check
  CHECK (status IN ('idle', 'running', 'success', 'failed'));
