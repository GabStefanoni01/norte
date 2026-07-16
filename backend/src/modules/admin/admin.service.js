const pool = require('../../database/pool');

async function listarUsuarios() {
  const result = await pool.query(
    `SELECT id, nome, email, role, email_verificado, cidade, estado, created_at,
            aceite_termos_versao, aceite_termos_em, aceite_termos_recusado_em
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows;
}

async function atualizarRole(userId, role) {
  if (!['usuario', 'admin'].includes(role)) {
    const err = new Error('Role inválida. Use "usuario" ou "admin".');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, nome, email, role`,
    [role, userId]
  );

  if (!result.rows[0]) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

module.exports = { listarUsuarios, atualizarRole };
