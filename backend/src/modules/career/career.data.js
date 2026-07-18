const CARREIRAS = [
  {
    id: 'desenvolvedor-frontend',
    nome: 'Desenvolvedor Front-end',
    descricaoCurta: 'Cria interfaces web responsivas e interativas.',
    competencias: ['HTML semântico', 'CSS moderno', 'JavaScript/TypeScript', 'acessibilidade', 'performance'],
    salarioMedia: 'R$ 5.500 - R$ 9.500',
    rotina:
      'Trabalha em colaboração com designers e back-end para transformar layouts em aplicações web. Ajusta responsividade, faz testes de usabilidade e resolve bugs de interface.',
    areasAtuacao: ['Agências digitais', 'Startups', 'E-commerce', 'Produtos SaaS', 'Educação online'],
    tecnologias: ['Angular', 'React', 'Vue', 'Sass', 'Bootstrap', 'Tailwind CSS'],
    cursosRecomendados: ['Fundamentos de HTML e CSS', 'JavaScript moderno', 'Desenvolvimento web responsivo', 'Acessibilidade na web', 'Frameworks front-end'],
    tempoMedioEntrada: '6 a 12 meses',
  },
  {
    id: 'analista-de-dados',
    nome: 'Analista de Dados',
    descricaoCurta: 'Transforma dados em decisões estratégicas.',
    competencias: ['SQL', 'estatística', 'visualização de dados', 'curadoria de dados', 'pensamento analítico'],
    salarioMedia: 'R$ 5.000 - R$ 10.000',
    rotina:
      'Coleta e organiza dados, constrói relatórios e dashboards, identifica padrões e recomenda ações baseadas em números. Frequentemente participa de reuniões com produto e marketing.',
    areasAtuacao: ['Finanças', 'Varejo', 'Saúde', 'Marketing', 'Operações'],
    tecnologias: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel avançado'],
    cursosRecomendados: ['Introdução a SQL', 'Análise de dados com Python', 'Visualização de dados', 'Estatística aplicada', 'Business Intelligence'],
    tempoMedioEntrada: '6 a 10 meses',
  },
  {
    id: 'designer-ux-ui',
    nome: 'Designer UX/UI',
    descricaoCurta: 'Projeta experiências digitais claras, úteis e agradáveis.',
    competencias: ['Pesquisa com usuários', 'prototipação', 'design visual', 'testes de usabilidade', 'arquitetura de informação'],
    salarioMedia: 'R$ 4.500 - R$ 9.000',
    rotina:
      'Valida ideias com usuários, monta fluxos de navegação, cria wireframes e protótipos, alinha entregas com time de produto e desenvolvedores.',
    areasAtuacao: ['Plataformas digitais', 'Agências de design', 'Educação', 'Produtos financeiros', 'Serviços públicos'],
    tecnologias: ['Figma', 'Adobe XD', 'Miro', 'Sketch', 'Principle'],
    cursosRecomendados: ['Design de interface', 'Fundamentos de UX', 'Prototipação e testes', 'Design thinking', 'Design inclusivo'],
    tempoMedioEntrada: '5 a 9 meses',
  },
  {
    id: 'marketing-digital',
    nome: 'Especialista em Marketing Digital',
    descricaoCurta: 'Planeja e executa campanhas online para atrair e reter clientes.',
    competencias: ['SEO', 'mídias sociais', 'planejamento de campanhas', 'análise de métricas', 'copywriting'],
    salarioMedia: 'R$ 4.000 - R$ 8.000',
    rotina:
      'Define objetivos, gerencia anúncios, acompanha resultados e faz ajustes a partir de relatórios. Trabalha com conteúdo, comunicação e posicionamento de marca.',
    areasAtuacao: ['E-commerce', 'Agências', 'Educação', 'Startups', 'Entretenimento'],
    tecnologias: ['Google Ads', 'Facebook Ads', 'Google Analytics', 'RD Station', 'SEO tools'],
    cursosRecomendados: ['Marketing de conteúdo', 'Mídias sociais', 'Anúncios online', 'SEO prático', 'Análise de métricas'],
    tempoMedioEntrada: '4 a 8 meses',
  },
  {
    id: 'recursos-humanos',
    nome: 'Analista de Recursos Humanos',
    descricaoCurta: 'Conecta pessoas, processos e cultura dentro das empresas.',
    competencias: ['recrutamento', 'treinamento', 'relacionamento interpessoal', 'legislação trabalhista', 'comunicação'],
    salarioMedia: 'R$ 3.500 - R$ 7.000',
    rotina:
      'Realiza seleção, acompanha desempenho, desenvolve programas de treinamento e dá suporte a colaboradores em dúvidas de carreira e benefícios.',
    areasAtuacao: ['Empresas de todos os portes', 'Consultorias', 'Educação', 'Saúde', 'Indústria'],
    tecnologias: ['Sistemas de RH', 'Bancos de talentos', 'Google Workspace', 'Office'],
    cursosRecomendados: ['Fundamentos de RH', 'Recrutamento e seleção', 'Gestão de desempenho', 'Treinamento e desenvolvimento', 'Legislação trabalhista básica'],
    tempoMedioEntrada: '3 a 6 meses',
  },
  {
    id: 'engenharia-de-software',
    nome: 'Engenheiro de Software',
    descricaoCurta: 'Desenvolve sistemas complexos com foco em qualidade e escalabilidade.',
    competencias: ['arquitetura de software', 'programação', 'teste automatizado', 'devops básico', 'resolução de problemas'],
    salarioMedia: 'R$ 8.000 - R$ 15.000',
    rotina:
      'Participa do ciclo completo de desenvolvimento, desde a análise de requisitos até a entrega. Revê código, cria integrações e mantém a estabilidade do produto.',
    areasAtuacao: ['SaaS', 'Fintech', 'Plataformas digitais', 'E-commerce', 'Startups'],
    tecnologias: ['Node.js', 'Java', 'Python', 'Docker', 'AWS', 'Git'],
    cursosRecomendados: ['Lógica de programação', 'Estruturas de dados', 'APIs e backend', 'Qualidade de software', 'Computação em nuvem'],
    tempoMedioEntrada: '8 a 14 meses',
  },
];

module.exports = { CARREIRAS };
