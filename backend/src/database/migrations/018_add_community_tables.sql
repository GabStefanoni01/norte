CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL,
  titulo VARCHAR(250) NOT NULL,
  conteudo TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_community_post_categoria CHECK (categoria IN (
    'Estou escolhendo faculdade',
    'Quero migrar de carreira',
    'Primeiro emprego',
    'Tecnologia',
    'Administração',
    'Engenharia',
    'Saúde'
  ))
);

CREATE TABLE IF NOT EXISTS community_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL DEFAULT 'like',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, tipo)
);
