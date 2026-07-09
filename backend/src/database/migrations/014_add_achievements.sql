-- Sistema de gamificação (Módulo 8): conquistas e níveis.

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  conquistado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, codigo)
);
