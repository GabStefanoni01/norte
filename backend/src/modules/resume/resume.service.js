const pool = require('../../database/pool');
const { montarPerguntas } = require('./resume.data');
const { montarCurriculoTemplate, montarFeedbackEntrevistaTemplate } = require('./resume.templates');
const { gerarCurriculoComIA, gerarFeedbackEntrevistaComIA } = require('./resume.ai');
const { verificarConquistas } = require('../achievements/achievements.service');

async function buscarDadosParaCurriculo(userId) {
  const [userResult, profileResult, planResult] = await Promise.all([
    pool.query('SELECT nome, email, cidade, estado FROM users WHERE id = $1', [userId]),
    pool.query(
      'SELECT escolaridade, objetivos, habilidades, interesses, perfil_dominante FROM profiles WHERE user_id = $1',
      [userId]
    ),
    pool.query('SELECT etapas FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
  ]);

  const user = userResult.rows[0] || {};
  const profile = profileResult.rows[0] || {};
  const etapas = planResult.rows[0]?.etapas || [];

  const todosItens = etapas.flatMap((mes) => mes.itens || []);
  const projetosConcluidos = todosItens
    .filter((item) => item.status === 'concluido' && item.tipo === 'projeto')
    .map((item) => item.descricao);
  const cursosConcluidos = todosItens
    .filter((item) => item.status === 'concluido' && item.tipo === 'aprender')
    .map((item) => item.descricao);

  return {
    nome: user.nome,
    email: user.email,
    cidade: user.cidade,
    estado: user.estado,
    escolaridade: profile.escolaridade,
    objetivos: profile.objetivos,
    habilidades: profile.habilidades,
    interesses: profile.interesses,
    perfilDominante: profile.perfil_dominante,
    projetosConcluidos,
    cursosConcluidos,
  };
}

async function gerarCurriculo(userId) {
  const dados = await buscarDadosParaCurriculo(userId);

  const conteudoIA = await gerarCurriculoComIA(userId);
  const conteudo = conteudoIA || montarCurriculoTemplate(dados);

  const result = await pool.query(
    `INSERT INTO resumes (user_id, conteudo, gerado_por_ia) VALUES ($1, $2, $3) RETURNING *`,
    [userId, conteudo, Boolean(conteudoIA)]
  );

  verificarConquistas(userId).catch((err) => console.error('Erro ao verificar conquistas:', err.message));

  return result.rows[0];
}

async function buscarCurriculoAtual(userId) {
  const result = await pool.query(
    'SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
}

async function listarPerguntasEntrevista(userId) {
  const result = await pool.query('SELECT perfil_dominante FROM profiles WHERE user_id = $1', [userId]);
  return montarPerguntas(result.rows[0]?.perfil_dominante);
}

async function enviarRespostasEntrevista(userId, perguntasRespostas) {
  if (!Array.isArray(perguntasRespostas) || perguntasRespostas.length === 0) {
    const err = new Error('Envie ao menos uma pergunta respondida.');
    err.status = 400;
    throw err;
  }

  const feedbackIA = await gerarFeedbackEntrevistaComIA(perguntasRespostas);
  const feedback = feedbackIA || montarFeedbackEntrevistaTemplate();

  const result = await pool.query(
    `INSERT INTO interview_sessions (user_id, perguntas_respostas, feedback, gerado_por_ia)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, JSON.stringify(perguntasRespostas), feedback, Boolean(feedbackIA)]
  );

  verificarConquistas(userId).catch((err) => console.error('Erro ao verificar conquistas:', err.message));

  return result.rows[0];
}

async function buscarUltimaEntrevista(userId) {
  const result = await pool.query(
    'SELECT * FROM interview_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  gerarCurriculo,
  buscarCurriculoAtual,
  listarPerguntasEntrevista,
  enviarRespostasEntrevista,
  buscarUltimaEntrevista,
};
