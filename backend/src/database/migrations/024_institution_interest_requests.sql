CREATE TABLE IF NOT EXISTS institution_interest_requests (
  id SERIAL PRIMARY KEY,
  nome_instituicao VARCHAR(180) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('empresa','escola','faculdade','etec','ong','outra')),
  responsavel_nome VARCHAR(150) NOT NULL,
  responsavel_email VARCHAR(180) NOT NULL,
  telefone VARCHAR(30),
  quantidade_pessoas INTEGER CHECK (quantidade_pessoas IS NULL OR quantidade_pessoas > 0),
  mensagem TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','em_contato','aprovada','recusada','cancelada')),
  observacoes_admin TEXT,
  institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_institution_interest_status
  ON institution_interest_requests(status);

CREATE INDEX IF NOT EXISTS idx_institution_interest_created_at
  ON institution_interest_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_institution_interest_email
  ON institution_interest_requests(responsavel_email);
