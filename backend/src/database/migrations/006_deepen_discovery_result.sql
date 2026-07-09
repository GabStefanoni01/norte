-- Aprofunda o resultado do teste de descoberta: guarda o breakdown completo
-- de pontuação (não só o perfil dominante) e a área secundária.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pontuacao_descoberta JSONB,
  ADD COLUMN IF NOT EXISTS areas_secundarias TEXT[],
  ADD COLUMN IF NOT EXISTS descricao_gerada_por_ia BOOLEAN NOT NULL DEFAULT false;
