const pool = require('../../database/pool');

async function salvar(userId, opportunityId) {
  const result = await pool.query(`
    INSERT INTO saved_opportunities (user_id, opportunity_id)
    SELECT $1, o.id
      FROM opportunities o
     WHERE o.id = $2
       AND o.status = 'publicada'
       AND (o.expires_at IS NULL OR o.expires_at > NOW())
    ON CONFLICT (user_id, opportunity_id) DO NOTHING
    RETURNING id, opportunity_id, created_at
  `, [userId, opportunityId]);

  if (result.rows[0]) return result.rows[0];

  const exists = await pool.query(
    'SELECT id, opportunity_id, created_at FROM saved_opportunities WHERE user_id = $1 AND opportunity_id = $2',
    [userId, opportunityId],
  );
  if (exists.rows[0]) return exists.rows[0];

  const error = new Error('Oportunidade não encontrada ou indisponível');
  error.status = 404;
  throw error;
}

async function remover(userId, opportunityId) {
  const result = await pool.query(
    'DELETE FROM saved_opportunities WHERE user_id = $1 AND opportunity_id = $2 RETURNING id',
    [userId, opportunityId],
  );
  return Boolean(result.rows[0]);
}

async function listar(userId) {
  const result = await pool.query(`
    SELECT o.*, s.created_at AS salvo_em
      FROM saved_opportunities s
      JOIN opportunities o ON o.id = s.opportunity_id
     WHERE s.user_id = $1
       AND o.status = 'publicada'
       AND (o.expires_at IS NULL OR o.expires_at > NOW())
     ORDER BY s.created_at DESC
  `, [userId]);
  return result.rows;
}

async function verificar(userId, opportunityId) {
  const result = await pool.query(
    'SELECT EXISTS(SELECT 1 FROM saved_opportunities WHERE user_id = $1 AND opportunity_id = $2) AS salvo',
    [userId, opportunityId],
  );
  return Boolean(result.rows[0]?.salvo);
}

module.exports = { salvar, remover, listar, verificar };
