-- Sinaliza se o plano foi gerado pela IA ou por um template padrão (fallback).

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS gerado_por_ia BOOLEAN NOT NULL DEFAULT false;
