const pool = require('../../database/pool');
const { buildUserContext, contextToSystemPrompt } = require('./ai.context');
const { askMentor } = require('./ai.provider');

async function chat(userId, mensagem) {
  if (!mensagem || !mensagem.trim()) {
    const err = new Error('Mensagem não pode ser vazia');
    err.status = 400;
    throw err;
  }

  const context = await buildUserContext(userId);
  const systemPrompt = contextToSystemPrompt(context);

  const resposta = await askMentor({ systemPrompt, mensagem });

  await pool.query(
    'INSERT INTO ai_conversations (user_id, mensagem, resposta) VALUES ($1, $2, $3)',
    [userId, mensagem, resposta]
  );

  return { message: resposta };
}

async function history(userId, limit = 20) {
  const result = await pool.query(
    'SELECT mensagem, resposta, data FROM ai_conversations WHERE user_id = $1 ORDER BY data DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows.reverse();
}

module.exports = { chat, history };
