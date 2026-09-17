-- Amplia campos textuais usados pela coleta automática.
-- O JobsPipe pode retornar classificações e funções maiores que os limites
-- originalmente definidos para oportunidades manuais.

ALTER TABLE opportunities
  ALTER COLUMN categoria TYPE TEXT,
  ALTER COLUMN interesse TYPE TEXT;
