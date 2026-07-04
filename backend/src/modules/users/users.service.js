const pool = require('../../database/pool');
const { calcularIdade } = require('../../utils/date');

async function findById(id) {
  const result = await pool.query(
    `SELECT id, nome, email, idade, cidade, estado, data_nascimento, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function update(id, { nome, cidade, estado, dataNascimento }) {
  // Se a data de nascimento for atualizada, a idade é recalculada junto —
  // igual ao que acontece no cadastro, pra nunca ficarem dessincronizadas.
  const idade = dataNascimento ? calcularIdade(dataNascimento) : undefined;

  const result = await pool.query(
    `UPDATE users
     SET nome = COALESCE($1, nome),
         cidade = COALESCE($2, cidade),
         estado = COALESCE($3, estado),
         data_nascimento = COALESCE($4, data_nascimento),
         idade = COALESCE($5, idade)
     WHERE id = $6
     RETURNING id, nome, email, idade, cidade, estado, data_nascimento, created_at`,
    [nome, cidade, estado, dataNascimento, idade, id]
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
