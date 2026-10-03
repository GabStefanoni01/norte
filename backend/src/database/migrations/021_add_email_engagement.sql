-- Engajamento por e-mail: rastreia último acesso e evita disparos repetidos por campanha.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ultimo_acesso_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_ultimo_acesso_em_idx
  ON users(ultimo_acesso_em);

CREATE TABLE IF NOT EXISTS email_dispatch_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campanha VARCHAR(60) NOT NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS email_dispatch_log_user_campaign_idx
  ON email_dispatch_log(user_id, campanha, enviado_em DESC);

CREATE INDEX IF NOT EXISTS email_dispatch_log_campaign_sent_idx
  ON email_dispatch_log(campanha, enviado_em DESC);
