-- Adiciona papel (role) ao usuário, base para a área administrativa.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'usuario';

ALTER TABLE users
  ADD CONSTRAINT chk_users_role CHECK (role IN ('usuario', 'admin'));
