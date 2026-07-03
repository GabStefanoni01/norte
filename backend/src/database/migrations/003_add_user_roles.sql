-- Adiciona papel (role) ao usuário, base para a área administrativa.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'usuario';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role') THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('usuario', 'admin'));
  END IF;
END $$;
