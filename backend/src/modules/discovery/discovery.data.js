/**
 * Teste de descoberta pessoal (Módulo 2 da especificação).
 *
 * Cada pergunta tem 4 opções, uma por categoria comportamental. A resposta
 * escolhida soma um ponto pra sua categoria; a categoria com mais pontos ao
 * final define o "perfil dominante" e as áreas sugeridas.
 */

const PERGUNTAS = [
  {
    id: 'p1',
    texto: 'Quando você tem um problema pra resolver, você prefere...',
    opcoes: [
      { id: 'a', texto: 'Criar algo novo do zero', categoria: 'criativo' },
      { id: 'b', texto: 'Analisar dados e encontrar padrões', categoria: 'analitico' },
      { id: 'c', texto: 'Conversar com pessoas pra entender a situação', categoria: 'social' },
      { id: 'd', texto: 'Montar um plano passo a passo', categoria: 'organizador' },
    ],
  },
  {
    id: 'p2',
    texto: 'Você aprende melhor quando...',
    opcoes: [
      { id: 'a', texto: 'Experimenta e cria na prática', categoria: 'criativo' },
      { id: 'b', texto: 'Entende a lógica e a teoria por trás', categoria: 'analitico' },
      { id: 'c', texto: 'Discute e troca ideias em grupo', categoria: 'social' },
      { id: 'd', texto: 'Segue um roteiro bem estruturado', categoria: 'organizador' },
    ],
  },
  {
    id: 'p3',
    texto: 'Em um trabalho em equipe, você costuma...',
    opcoes: [
      { id: 'a', texto: 'Puxar as ideias criativas', categoria: 'criativo' },
      { id: 'b', texto: 'Resolver os problemas técnicos', categoria: 'analitico' },
      { id: 'c', texto: 'Cuidar da comunicação entre todos', categoria: 'social' },
      { id: 'd', texto: 'Organizar tarefas e prazos', categoria: 'organizador' },
    ],
  },
  {
    id: 'p4',
    texto: 'O que mais te motiva no dia a dia?',
    opcoes: [
      { id: 'a', texto: 'Fazer algo visualmente bonito ou original', categoria: 'criativo' },
      { id: 'b', texto: 'Entender como as coisas funcionam por dentro', categoria: 'analitico' },
      { id: 'c', texto: 'Ajudar e conectar pessoas', categoria: 'social' },
      { id: 'd', texto: 'Ver um processo funcionando redondinho', categoria: 'organizador' },
    ],
  },
  {
    id: 'p5',
    texto: 'Você prefere trabalhar...',
    opcoes: [
      { id: 'a', texto: 'Sozinho, com liberdade criativa', categoria: 'criativo' },
      { id: 'b', texto: 'Sozinho, com foco em lógica', categoria: 'analitico' },
      { id: 'c', texto: 'Em equipe, interagindo bastante', categoria: 'social' },
      { id: 'd', texto: 'Em equipe, com papéis bem definidos', categoria: 'organizador' },
    ],
  },
  {
    id: 'p6',
    texto: 'Diante de um prazo apertado, você...',
    opcoes: [
      { id: 'a', texto: 'Improvisa uma solução criativa', categoria: 'criativo' },
      { id: 'b', texto: 'Quebra o problema em partes lógicas', categoria: 'analitico' },
      { id: 'c', texto: 'Pede ajuda e divide com o time', categoria: 'social' },
      { id: 'd', texto: 'Monta uma lista de prioridades', categoria: 'organizador' },
    ],
  },
];

const CATEGORIAS = {
  criativo: {
    descricao:
      'Você demonstra características de áreas criativas — gosta de criar, experimentar e dar forma a ideias novas.',
    areas: ['Design', 'Marketing de Conteúdo', 'Desenvolvimento Front-end'],
  },
  analitico: {
    descricao:
      'Você tem um perfil analítico — gosta de entender como as coisas funcionam e resolver problemas com lógica.',
    areas: ['Desenvolvimento', 'Dados', 'Engenharia'],
  },
  social: {
    descricao:
      'Você tem um perfil social — se destaca em conectar pessoas e entender necessidades dos outros.',
    areas: ['Comunicação', 'Vendas', 'Recursos Humanos', 'Atendimento'],
  },
  organizador: {
    descricao:
      'Você tem um perfil organizador — gosta de estruturar processos e manter tudo funcionando direitinho.',
    areas: ['Gestão de Produto', 'Operações', 'Administração'],
  },
};

module.exports = { PERGUNTAS, CATEGORIAS };
