-- Plano Free/Premium, controle de assinatura (Mercado Pago) e contadores
-- de uso pra limites do plano gratuito.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plano VARCHAR(20) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS premium_ate TIMESTAMP,
  ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_plano') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_plano CHECK (plano IN ('free', 'premium'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS usage_counters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  feature VARCHAR(30) NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  contagem INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, feature, period_key)
);
