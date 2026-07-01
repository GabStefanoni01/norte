const pool = require('../../database/pool');

/**
 * Monta o contexto do usuário para orientar o mentor IA: dados básicos,
 * perfil (interesses/objetivos), plano de evolução atual e histórico
 * recente de conversas.
 */
async function buildUserContext(userId) {
  const [userResult, profileResult, planResult, historyResult] = await Promise.all([
    pool.query('SELECT nome, idade, cidade FROM users WHERE id = $1', [userId]),
    pool.query('SELECT escolaridade, interesses, objetivos, habilidades FROM profiles WHERE user_id = $1', [userId]),
    pool.query('SELECT etapas, progresso FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
    pool.query('SELECT mensagem, resposta FROM ai_conversations WHERE user_id = $1 ORDER BY data DESC LIMIT 5', [userId]),
  ]);

  return {
    usuario: userResult.rows[0] || null,
    perfil: profileResult.rows[0] || null,
    plano: planResult.rows[0] || null,
    historicoRecente: historyResult.rows.reverse(),
  };
}

function contextToSystemPrompt(context) {
  const partes = [
    'Você é o mentor do Norte, uma plataforma que ajuda jovens a encontrar seu caminho profissional.',
    'Seja acolhedor, direto e prático. Use o contexto abaixo para personalizar sua resposta.',
  ];

  if (context.usuario) {
    partes.push(`Usuário: ${context.usuario.nome}, ${context.usuario.idade || 'idade não informada'} anos, ${context.usuario.cidade || 'cidade não informada'}.`);
  }

  if (context.perfil) {
    partes.push(`Escolaridade: ${context.perfil.escolaridade || 'não informada'}.`);
    if (context.perfil.interesses?.length) {
      partes.push(`Interesses: ${context.perfil.interesses.join(', ')}.`);
    }
    if (context.perfil.objetivos) {
      partes.push(`Objetivos: ${context.perfil.objetivos}.`);
    }
  }

  if (context.plano) {
    partes.push(`Progresso atual do plano de evolução: ${context.plano.progresso}%.`);
  }

  return partes.join('\n');
}

module.exports = { buildUserContext, contextToSystemPrompt };
