/**
 * Banco de perguntas para a simulação de entrevista. Perguntas gerais
 * entram sempre; as específicas variam conforme o perfil dominante do
 * teste de descoberta (fallback: usa o conjunto "analitico" se a pessoa
 * ainda não fez o teste).
 */

const PERGUNTAS_GERAIS = [
  { id: 'g1', texto: 'Fale um pouco sobre você e por que se interessa por essa área.' },
  { id: 'g2', texto: 'Conte sobre um projeto, trabalho ou estudo do qual você tem orgulho.' },
  { id: 'g3', texto: 'Como você lida com prazos apertados ou situações de pressão?' },
  { id: 'g4', texto: 'Descreva um desafio recente que você enfrentou e como resolveu.' },
  { id: 'g5', texto: 'Por que devemos te dar uma chance, mesmo com pouca experiência formal?' },
];

const PERGUNTAS_POR_CATEGORIA = {
  criativo: [
    { id: 'c1', texto: 'O que faz, na sua opinião, um bom trabalho criativo (design, conteúdo, etc)?' },
    { id: 'c2', texto: 'Conte sobre um projeto criativo que você fez, mesmo que pequeno ou pessoal.' },
    { id: 'c3', texto: 'Como você recebe e lida com feedback sobre um trabalho seu?' },
  ],
  analitico: [
    { id: 'a1', texto: 'Como você aborda um problema técnico que nunca viu antes?' },
    { id: 'a2', texto: 'Descreva um erro, bug ou problema lógico que você conseguiu resolver.' },
    { id: 'a3', texto: 'O que te atrai em tecnologia, dados ou engenharia?' },
  ],
  social: [
    { id: 's1', texto: 'Como você lidaria com um cliente ou colega insatisfeito?' },
    { id: 's2', texto: 'Conte sobre uma vez que você ajudou alguém a resolver um problema.' },
    { id: 's3', texto: 'O que você acha que faz uma comunicação realmente boa?' },
  ],
  organizador: [
    { id: 'o1', texto: 'Como você organiza suas tarefas e prioridades no dia a dia?' },
    { id: 'o2', texto: 'Conte sobre uma vez que você organizou um processo, evento ou projeto.' },
    { id: 'o3', texto: 'Como você reage quando os planos mudam de repente?' },
  ],
};

function montarPerguntas(perfilDominante) {
  const especificas = PERGUNTAS_POR_CATEGORIA[perfilDominante] || PERGUNTAS_POR_CATEGORIA.analitico;
  return [...PERGUNTAS_GERAIS, ...especificas];
}

module.exports = { montarPerguntas };
