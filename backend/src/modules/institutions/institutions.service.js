const pool = require('../../database/pool');

const TIPOS = ['empresa', 'escola', 'faculdade', 'etec', 'ong', 'outra'];
const ROLES = ['participante', 'gestor', 'administrador'];

async function criar({ nome, tipo, email = null, descricao = null, userId }) {
  if (!nome?.trim()) {
    const err = new Error('Nome da instituição é obrigatório');
    err.status = 400;
    throw err;
  }
  if (!TIPOS.includes(tipo)) {
    const err = new Error('Tipo de instituição inválido');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const institution = await client.query(
      `INSERT INTO institutions (nome, tipo, email, descricao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, tipo, email, descricao, ativa, created_at, updated_at`,
      [nome.trim(), tipo, email?.trim() || null, descricao?.trim() || null],
    );

    await client.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role, status)
       VALUES ($1, $2, 'administrador', 'ativo')`,
      [institution.rows[0].id, userId],
    );

    await client.query('COMMIT');
    return institution.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listarDoUsuario(userId) {
  const result = await pool.query(
    `SELECT i.id, i.nome, i.tipo, i.email, i.descricao, i.ativa,
            m.role, m.status, m.created_at AS vinculado_em
       FROM institution_memberships m
       JOIN institutions i ON i.id = m.institution_id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC`,
    [userId],
  );
  return result.rows;
}

async function obterMembro(institutionId, userId) {
  const result = await pool.query(
    `SELECT m.id, m.institution_id, m.user_id, m.role, m.status,
            i.nome AS institution_nome, i.tipo AS institution_tipo
       FROM institution_memberships m
       JOIN institutions i ON i.id = m.institution_id
      WHERE m.institution_id = $1 AND m.user_id = $2`,
    [institutionId, userId],
  );
  return result.rows[0] || null;
}

async function listarParticipantes(institutionId, userId) {
  const membro = await obterMembro(institutionId, userId);
  if (!membro || !['gestor', 'administrador'].includes(membro.role) || membro.status !== 'ativo') {
    const err = new Error('Sem permissão para gerenciar esta instituição');
    err.status = 403;
    throw err;
  }

  const result = await pool.query(
    `SELECT u.id, u.nome, u.email, m.role, m.status, m.created_at AS vinculado_em
       FROM institution_memberships m
       JOIN users u ON u.id = m.user_id
      WHERE m.institution_id = $1
      ORDER BY u.nome ASC`,
    [institutionId],
  );
  return result.rows;
}

async function atualizarMembro(institutionId, memberId, role, status, userId) {
  const gestor = await obterMembro(institutionId, userId);
  if (!gestor || gestor.status !== 'ativo' || !['gestor', 'administrador'].includes(gestor.role)) {
    const err = new Error('Sem permissão para gerenciar esta instituição');
    err.status = 403;
    throw err;
  }

  if (role && !ROLES.includes(role)) {
    const err = new Error('Papel institucional inválido');
    err.status = 400;
    throw err;
  }
  if (status && !['ativo', 'inativo', 'pendente'].includes(status)) {
    const err = new Error('Status de vínculo inválido');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    `UPDATE institution_memberships
        SET role = COALESCE($1, role),
            status = COALESCE($2, status),
            updated_at = NOW()
      WHERE id = $3 AND institution_id = $4
      RETURNING id, institution_id, user_id, role, status, updated_at`,
    [role || null, status || null, memberId, institutionId],
  );

  if (!result.rows[0]) {
    const err = new Error('Vínculo não encontrado');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

module.exports = { TIPOS, ROLES, criar, listarDoUsuario, listarParticipantes, atualizarMembro };
