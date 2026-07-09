const pool = require('../../database/pool');
const { verificarConquistas } = require('../achievements/achievements.service');

async function upsertProfile(userId, { escolaridade, interesses, objetivos, habilidades }) {
  const existing = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);

  let perfil;

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE profiles
       SET escolaridade = $1, interesses = $2, objetivos = $3, habilidades = $4
       WHERE user_id = $5
       RETURNING *`,
      [escolaridade, interesses, objetivos, habilidades, userId]
    );
    perfil = result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO profiles (user_id, escolaridade, interesses, objetivos, habilidades)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, escolaridade, interesses, objetivos, habilidades]
    );
    perfil = result.rows[0];
  }

  // Não deixa uma falha na checagem de conquistas quebrar o salvamento do perfil.
  verificarConquistas(userId).catch((err) => console.error('Erro ao verificar conquistas:', err.message));

  return perfil;
}

async function getProfile(userId) {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

module.exports = { upsertProfile, getProfile };
