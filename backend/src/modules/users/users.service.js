const pool = require('../../database/pool');

async function findById(id) {
  const result = await pool.query(
    'SELECT id, nome, email, idade, cidade, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function update(id, { nome, idade, cidade }) {
  const result = await pool.query(
    `UPDATE users
     SET nome = COALESCE($1, nome),
         idade = COALESCE($2, idade),
         cidade = COALESCE($3, cidade)
     WHERE id = $4
     RETURNING id, nome, email, idade, cidade, created_at`,
    [nome, idade, cidade, id]
  );
  return result.rows[0] || null;
}

async function softDelete(id) {
  // Soft delete: marca o e-mail como anonimizado e remove dados sensíveis,
  // mantendo o registro para integridade referencial (goals, plans, etc.)
  const result = await pool.query(
    `UPDATE users
     SET email = CONCAT('deleted+', id, '@norte.local'), nome = 'Usuário removido'
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { findById, update, softDelete };
