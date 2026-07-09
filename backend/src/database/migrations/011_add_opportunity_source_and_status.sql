-- Rastreia se a oportunidade veio de cadastro manual (admin) ou de busca
-- automática por IA, e se já foi revisada. Oportunidades da busca
-- automática entram como "pendente" — só aparecem pros usuários depois que
-- um admin aprova, pra evitar publicar links quebrados ou desatualizados
-- sem revisão humana.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS fonte VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'publicada';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_opportunities_fonte') THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT chk_opportunities_fonte CHECK (fonte IN ('manual', 'busca_automatica'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_opportunities_status') THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT chk_opportunities_status CHECK (status IN ('publicada', 'pendente'));
  END IF;
END $$;
