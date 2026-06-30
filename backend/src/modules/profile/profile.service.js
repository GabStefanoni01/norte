const pool = require('../../database/pool');

async function upsertProfile(userId, { escolaridade, interesses, objetivos, habilidades }) {
  const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE profiles
       SET escolaridade = $1, interesses = $2, objetivos = $3, habilidades = $4
       WHERE user_id = $5
       RETURNING *`,
      [escolaridade, interesses, objetivos, habilidades, userId]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO profiles (user_id, escolaridade, interesses, objetivos, habilidades)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, escolaridade, interesses, objetivos, habilidades]
  );

  return result.rows[0];
}

async function getProfile(userId) {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

module.exports = { upsertProfile, getProfile };
