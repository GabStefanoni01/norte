-- Estado persistente dos retries do coletor.
-- Permite recuperar uma sincronização pendente após reinício do processo.
ALTER TABLE opportunity_collector_state
  ADD COLUMN IF NOT EXISTS tentativas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proxima_tentativa_em TIMESTAMPTZ;

ALTER TABLE opportunity_collector_state
  DROP CONSTRAINT IF EXISTS opportunity_collector_state_tentativas_check;

ALTER TABLE opportunity_collector_state
  ADD CONSTRAINT opportunity_collector_state_tentativas_check
  CHECK (tentativas >= 0);
