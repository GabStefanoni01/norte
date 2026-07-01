const pool = require('../../database/pool');

async function getPlan(userId) {
  const result = await pool.query('SELECT * FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  return result.rows[0] || null;
}

async function createPlan(userId, etapas) {
  const result = await pool.query(
    `INSERT INTO plans (user_id, etapas, progresso) VALUES ($1, $2, 0) RETURNING *`,
    [userId, JSON.stringify(etapas)]
  );
  return result.rows[0];
}

async function updateProgress(planId, progresso) {
  const result = await pool.query(
    `UPDATE plans SET progresso = $1 WHERE id = $2 RETURNING *`,
    [progresso, planId]
  );
  return result.rows[0];
}

module.exports = { getPlan, createPlan, updateProgress };
