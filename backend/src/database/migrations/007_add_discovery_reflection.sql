-- Reflexão livre (texto aberto) ao final do teste de descoberta, usada para
-- enriquecer o contexto que a IA tem sobre o usuário.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reflexao_descoberta TEXT;
