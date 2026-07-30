CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  empresa VARCHAR(150),
  categoria VARCHAR(100),
  tipo VARCHAR(30) NOT NULL DEFAULT 'vaga',
  descricao TEXT,
  interesse VARCHAR(50),
  estado CHAR(2),
  gratuito BOOLEAN NOT NULL DEFAULT true,
  link VARCHAR(255) NOT NULL,
  requisitos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_opportunities_tipo') THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT chk_opportunities_tipo CHECK (tipo IN ('curso', 'vaga', 'bolsa', 'evento', 'programa'));
  END IF;
END $$;
