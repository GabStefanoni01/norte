-- Suporte a: (1) detectar quando o plano ficou desatualizado em relação ao
-- perfil da descoberta mais recente, (2) sugerir renovação a cada ~3 meses,
-- (3) controlar o envio de lembretes por e-mail sem spammar o usuário.

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS perfil_dominante_base VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ultimo_lembrete_progresso_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS lembrete_renovacao_enviado_em TIMESTAMP;
