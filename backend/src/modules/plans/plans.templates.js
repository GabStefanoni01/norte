/**
 * Templates de plano de evolução por perfil dominante (resultado do teste
 * de descoberta). Usado como fallback quando a IA não está configurada ou
 * falha — garante que todo mundo recebe um plano decente sempre.
 */

const TEMPLATES = {
  analitico: [
    {
      titulo: 'Fundamentos',
      itens: [
        { descricao: 'Aprender lógica de programação', tipo: 'aprender' },
        { descricao: 'Aprender o básico de HTML e CSS', tipo: 'aprender' },
        { descricao: 'Criar uma página pessoal simples', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Primeiros sistemas',
      itens: [
        { descricao: 'Aprender JavaScript', tipo: 'aprender' },
        { descricao: 'Criar um sistema simples (ex: lista de tarefas)', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Preparação para o mercado',
      itens: [
        { descricao: 'Aprender o básico de Git e GitHub', tipo: 'aprender' },
        { descricao: 'Montar currículo e perfil no LinkedIn', tipo: 'projeto' },
        { descricao: 'Organizar os projetos feitos em um portfólio', tipo: 'projeto' },
      ],
    },
  ],
  criativo: [
    {
      titulo: 'Fundamentos de design',
      itens: [
        { descricao: 'Aprender princípios de design (cores, tipografia, hierarquia)', tipo: 'aprender' },
        { descricao: 'Aprender o básico de uma ferramenta como Figma', tipo: 'aprender' },
        { descricao: 'Redesenhar a tela de um app que você usa no dia a dia', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Prática e portfólio',
      itens: [
        { descricao: 'Aprender fundamentos de UX (pesquisa, wireframes)', tipo: 'aprender' },
        { descricao: 'Criar 2 telas completas de um app fictício', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Preparação para o mercado',
      itens: [
        { descricao: 'Aprender a montar um case de projeto', tipo: 'aprender' },
        { descricao: 'Montar portfólio online e currículo', tipo: 'projeto' },
      ],
    },
  ],
  social: [
    {
      titulo: 'Fundamentos de comunicação',
      itens: [
        { descricao: 'Estudar comunicação assertiva e escuta ativa', tipo: 'aprender' },
        { descricao: 'Escrever 3 posts sobre um tema que você domina', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Prática com pessoas',
      itens: [
        { descricao: 'Estudar fundamentos de atendimento, vendas ou RH', tipo: 'aprender' },
        { descricao: 'Simular um atendimento ou entrevista com um amigo', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Preparação para o mercado',
      itens: [
        { descricao: 'Aprender a se apresentar profissionalmente', tipo: 'aprender' },
        { descricao: 'Montar currículo e perfil no LinkedIn com foco em soft skills', tipo: 'projeto' },
      ],
    },
  ],
  organizador: [
    {
      titulo: 'Fundamentos de organização',
      itens: [
        { descricao: 'Aprender metodologias ágeis básicas (Kanban, Scrum)', tipo: 'aprender' },
        { descricao: 'Organizar um projeto pessoal usando um quadro Kanban', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Prática de gestão',
      itens: [
        { descricao: 'Aprender priorização (ex: matriz de Eisenhower)', tipo: 'aprender' },
        { descricao: 'Planejar o roadmap de um projeto fictício', tipo: 'projeto' },
      ],
    },
    {
      titulo: 'Preparação para o mercado',
      itens: [
        { descricao: 'Aprender a falar sobre organização e gestão em entrevistas', tipo: 'aprender' },
        { descricao: 'Montar currículo e perfil no LinkedIn com foco em processos', tipo: 'projeto' },
      ],
    },
  ],
};

function buildTemplatePlan(perfilDominante) {
  const meses = TEMPLATES[perfilDominante] || TEMPLATES.analitico;

  return meses.map((mes, indiceMes) => ({
    mes: indiceMes + 1,
    titulo: mes.titulo,
    itens: mes.itens.map((item, indiceItem) => ({
      id: `m${indiceMes + 1}i${indiceItem + 1}`,
      descricao: item.descricao,
      tipo: item.tipo,
      status: 'pendente',
    })),
  }));
}

module.exports = { buildTemplatePlan };
