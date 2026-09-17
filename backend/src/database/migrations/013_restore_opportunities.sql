-- Restaura o módulo de Oportunidades após a descontinuação anterior.
-- A migration 012 removeu a tabela porque a estratégia de coleta automática
-- não era viável. O módulo volta agora com curadoria manual como fonte inicial.

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  empresa VARCHAR(150),
  categoria VARCHAR(100),
  tipo VARCHAR(30) NOT NULL DEFAULT 'curso',
  descricao TEXT,
  interesse VARCHAR(50),
  estado CHAR(2),
  gratuito BOOLEAN NOT NULL DEFAULT true,
  idade_minima INTEGER,
  idade_maxima INTEGER,
  requisitos TEXT[] NOT NULL DEFAULT '{}',
  link VARCHAR(500) NOT NULL,
  fonte VARCHAR(20) NOT NULL DEFAULT 'manual',
  status VARCHAR(20) NOT NULL DEFAULT 'publicada',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  CONSTRAINT chk_opportunities_tipo CHECK (tipo IN ('curso', 'vaga', 'bolsa', 'evento', 'programa')),
  CONSTRAINT chk_opportunities_fonte CHECK (fonte IN ('manual', 'busca_automatica')),
  CONSTRAINT chk_opportunities_status CHECK (status IN ('publicada', 'pendente')),
  CONSTRAINT chk_opportunities_idade CHECK (
    idade_minima IS NULL OR idade_maxima IS NULL OR idade_minima <= idade_maxima
  )
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_tipo ON opportunities(tipo);
CREATE INDEX IF NOT EXISTS idx_opportunities_interesse ON opportunities(interesse);
CREATE INDEX IF NOT EXISTS idx_opportunities_estado ON opportunities(estado);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_expires_at ON opportunities(expires_at);

-- Dados iniciais somente para evitar uma tela vazia após a restauração.
-- São páginas institucionais estáveis e não representam vagas fictícias.
INSERT INTO opportunities
  (titulo, empresa, categoria, tipo, descricao, interesse, gratuito, requisitos, link, fonte, status)
SELECT * FROM (VALUES
  (
    'Cursos gratuitos de tecnologia',
    'Fundação Bradesco',
    'Tecnologia',
    'curso',
    'Cursos online gratuitos para desenvolver conhecimentos em tecnologia e outras áreas.',
    'Tecnologia',
    true,
    ARRAY['lógica de programação']::TEXT[],
    'https://www.ev.org.br/cursos',
    'manual',
    'publicada'
  ),
  (
    'Escola Virtual Gov',
    'Governo Federal',
    'Educação',
    'curso',
    'Catálogo de cursos gratuitos da Escola Virtual de Governo em diferentes áreas.',
    'Negócios',
    true,
    ARRAY[]::TEXT[],
    'https://www.escolavirtual.gov.br/catalogo',
    'manual',
    'publicada'
  ),
  (
    'Oportunidades de estágio e aprendizagem',
    'CIEE',
    'Carreira',
    'programa',
    'Portal para busca de oportunidades de estágio, aprendizagem e desenvolvimento profissional.',
    'Tecnologia',
    true,
    ARRAY['ensino superior em andamento']::TEXT[],
    'https://portal.ciee.org.br/',
    'manual',
    'publicada'
  )
) AS seed(titulo, empresa, categoria, tipo, descricao, interesse, gratuito, requisitos, link, fonte, status)
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities existing WHERE existing.link = seed.link
);
