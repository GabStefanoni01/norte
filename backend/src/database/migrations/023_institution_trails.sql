-- Indicadores institucionais e trilhas da Fase 3.

CREATE TABLE IF NOT EXISTS institution_trails (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  titulo VARCHAR(180) NOT NULL,
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_trail_members (
  id SERIAL PRIMARY KEY,
  trail_id INTEGER NOT NULL REFERENCES institution_trails(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  progresso NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trail_id, user_id)
);

CREATE INDEX IF NOT EXISTS institution_trails_institution_idx
  ON institution_trails(institution_id, ativa);
CREATE INDEX IF NOT EXISTS institution_trail_members_user_idx
  ON institution_trail_members(user_id, status);
