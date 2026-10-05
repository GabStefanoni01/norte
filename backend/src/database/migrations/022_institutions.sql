-- Fase 3: camada institucional/B2B sem alterar o fluxo do usuário comum.

CREATE TABLE IF NOT EXISTS institutions (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('empresa', 'escola', 'faculdade', 'etec', 'ong', 'outra')),
  email VARCHAR(180),
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS institutions_tipo_idx ON institutions(tipo);
CREATE INDEX IF NOT EXISTS institutions_ativa_idx ON institutions(ativa);

CREATE TABLE IF NOT EXISTS institution_memberships (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL DEFAULT 'participante'
    CHECK (role IN ('participante', 'gestor', 'administrador')),
  status VARCHAR(20) NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'pendente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS institution_memberships_user_idx
  ON institution_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS institution_memberships_institution_idx
  ON institution_memberships(institution_id, status);

CREATE TABLE IF NOT EXISTS institution_invitations (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  email VARCHAR(180) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'participante'
    CHECK (role IN ('participante', 'gestor', 'administrador')),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS institution_invitations_email_idx
  ON institution_invitations(email, expires_at);
CREATE INDEX IF NOT EXISTS institution_invitations_institution_idx
  ON institution_invitations(institution_id, created_at DESC);
