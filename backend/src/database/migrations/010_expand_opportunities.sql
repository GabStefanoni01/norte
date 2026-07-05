-- Expande a tabela opportunities (Módulo 5) com os campos necessários pros
-- filtros descritos na especificação (idade, região, interesse) e um pouco
-- mais de contexto pra cada oportunidade.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) NOT NULL DEFAULT 'curso',
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS interesse VARCHAR(50),
  ADD COLUMN IF NOT EXISTS estado CHAR(2),
  ADD COLUMN IF NOT EXISTS gratuito BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS idade_minima INTEGER,
  ADD COLUMN IF NOT EXISTS idade_maxima INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_opportunities_tipo') THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT chk_opportunities_tipo CHECK (tipo IN ('curso', 'vaga', 'bolsa', 'evento', 'programa'));
  END IF;
END $$;

-- Seed de exemplo, só roda se a tabela ainda estiver vazia — evita duplicar
-- toda vez que a migration é reaplicada. São exemplos ilustrativos; o admin
-- deve revisar/substituir por oportunidades reais e atualizadas pelo painel.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM opportunities) = 0 THEN
    INSERT INTO opportunities (titulo, empresa, categoria, tipo, descricao, interesse, gratuito, link) VALUES
      ('Cursos gratuitos de tecnologia', 'Coursera', 'Tecnologia', 'curso',
       'Plataforma com diversos cursos introdutórios gratuitos em programação e dados.', 'Tecnologia', true,
       'https://www.coursera.org/courses?query=free'),
      ('Cursos gratuitos diversos', 'Udemy', 'Educação', 'curso',
       'Categoria de cursos gratuitos da Udemy, incluindo design, negócios e tecnologia.', 'Tecnologia', true,
       'https://www.udemy.com/courses/free/'),
      ('Portal de cursos gratuitos do governo', 'Gov.br', 'Educação', 'curso',
       'Cursos gratuitos oferecidos por órgãos públicos em diversas áreas.', 'Negócios', true,
       'https://www.gov.br/pt-br'),
      ('Programa de estágio (exemplo)', 'Empresa parceira', 'Tecnologia', 'vaga',
       'Exemplo de vaga de estágio — substitua por uma oportunidade real cadastrada pelo painel admin.', 'Tecnologia', true,
       '#'),
      ('Bolsa de estudos (exemplo)', 'Instituição parceira', 'Design', 'bolsa',
       'Exemplo de bolsa de estudos — substitua por uma oportunidade real cadastrada pelo painel admin.', 'Design', true,
       '#'),
      ('Evento de comunicação (exemplo)', 'Comunidade parceira', 'Comunicação', 'evento',
       'Exemplo de evento — substitua por uma oportunidade real cadastrada pelo painel admin.', 'Comunicação', true,
       '#');
  END IF;
END $$;
