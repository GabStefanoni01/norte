/**
 * Conquistas do Norte (Módulo 8). Cada uma é verificada automaticamente
 * conforme o usuário avança pelo app — nada precisa ser "reivindicado"
 * manualmente.
 */
const CONQUISTAS = [
  { codigo: 'perfil_completo', titulo: 'Primeiro passo', descricao: 'Completou o perfil profissional', icone: '🎯' },
  {
    codigo: 'autoconhecimento',
    titulo: 'Autoconhecimento',
    descricao: 'Concluiu o teste de descoberta pessoal',
    icone: '🧭',
  },
  { codigo: 'plano_criado', titulo: 'Plano em marcha', descricao: 'Gerou seu primeiro plano de evolução', icone: '🗺️' },
  {
    codigo: 'primeira_etapa',
    titulo: 'Primeiro passo dado',
    descricao: 'Concluiu a primeira etapa do plano',
    icone: '✅',
  },
  {
    codigo: 'primeiro_projeto',
    titulo: 'Mão na massa',
    descricao: 'Concluiu seu primeiro projeto prático',
    icone: '🛠️',
  },
  {
    codigo: 'primeiro_curso',
    titulo: 'Sempre aprendendo',
    descricao: 'Concluiu seu primeiro curso ou aprendizado',
    icone: '📘',
  },
  {
    codigo: 'plano_completo',
    titulo: 'Missão cumprida',
    descricao: 'Concluiu 100% de um plano de evolução',
    icone: '🏁',
  },
  { codigo: 'curriculo_pronto', titulo: 'Pronto pro mercado', descricao: 'Gerou seu primeiro currículo', icone: '📄' },
  {
    codigo: 'entrevista_treinada',
    titulo: 'Preparado',
    descricao: 'Completou sua primeira simulação de entrevista',
    icone: '🎤',
  },
];

const NIVEIS = [
  { nome: 'Explorador', minimo: 0 },
  { nome: 'Aprendiz', minimo: 3 },
  { nome: 'Criador', minimo: 6 },
  { nome: 'Profissional', minimo: CONQUISTAS.length },
];

function calcularNivel(totalConquistas) {
  let nivelAtual = NIVEIS[0];
  for (const nivel of NIVEIS) {
    if (totalConquistas >= nivel.minimo) nivelAtual = nivel;
  }
  return nivelAtual.nome;
}

function proximoNivel(totalConquistas) {
  return NIVEIS.find((nivel) => nivel.minimo > totalConquistas) || null;
}

module.exports = { CONQUISTAS, NIVEIS, calcularNivel, proximoNivel };
