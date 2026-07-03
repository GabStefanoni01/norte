-- Resultado do teste de descoberta pessoal (Módulo 2 da especificação).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS perfil_dominante VARCHAR(30),
  ADD COLUMN IF NOT EXISTS resultado_descoberta TEXT,
  ADD COLUMN IF NOT EXISTS areas_sugeridas TEXT[];
