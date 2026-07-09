-- Suporte a fluxos de código temporário: verificação de e-mail no cadastro
-- e redefinição de senha. Uma única tabela, diferenciada por "tipo".

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_verification_codes_tipo') THEN
    ALTER TABLE verification_codes
      ADD CONSTRAINT chk_verification_codes_tipo CHECK (tipo IN ('verificacao_email', 'redefinicao_senha'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_tipo ON verification_codes (user_id, tipo);
