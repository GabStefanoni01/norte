-- Aceite de Política de Privacidade e Termos de Uso. Versionado: quando o
-- texto mudar de forma relevante, sobe VERSAO_ATUAL_TERMOS no código e
-- quem aceitou uma versão antiga passa a precisar reaceitar.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS aceite_termos_versao INTEGER,
  ADD COLUMN IF NOT EXISTS aceite_termos_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS aceite_termos_recusado_em TIMESTAMP;

ALTER TABLE verification_codes DROP CONSTRAINT IF EXISTS chk_verification_codes_tipo;
ALTER TABLE verification_codes
  ADD CONSTRAINT chk_verification_codes_tipo
  CHECK (tipo IN ('verificacao_email', 'redefinicao_senha', 'aceite_termos'));
