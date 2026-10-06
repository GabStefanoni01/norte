const crypto = require('crypto');
const pool = require('../../database/pool');
const { enviarEmail } = require('../mail/mail.service');
const env = require('../../config/env');

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

async function criarConvite({ institutionId, email, role = 'participante', userId }) {
  const membro = await obterMembro(institutionId, userId);
  if (!membro || membro.status !== 'ativo' || !['gestor', 'administrador'].includes(membro.role)) {
    const err = new Error('Sem permissão para convidar participantes');
    err.status = 403;
    throw err;
  }
  if (!email?.trim()) {
    const err = new Error('E-mail é obrigatório');
    err.status = 400;
    throw err;
  }
  if (!ROLES.includes(role)) {
    const err = new Error('Papel institucional inválido');
    err.status = 400;
    throw err;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await pool.query(
    `INSERT INTO institution_invitations
      (institution_id, email, role, token_hash, expires_at)
     VALUES ($1, LOWER($2), $3, $4, NOW() + INTERVAL '7 days')
     RETURNING id, institution_id, email, role, expires_at, created_at`,
    [institutionId, email.trim(), role, tokenHash],
  );

  const convite = result.rows[0];
  const frontendUrl = env.frontendUrl || 'http://localhost:4200';
  const link = `${frontendUrl.replace(/\/$/, '')}/convites/instituicao?token=${token}`;

  try {
    await enviarEmail({
      para: convite.email,
      assunto: 'Convite para participar do Norte',
      texto: `Você recebeu um convite para participar de uma instituição no Norte. Acesse: ${link}`,
    });
  } catch (err) {
    await pool.query('DELETE FROM institution_invitations WHERE id = $1', [convite.id]);
    throw err;
  }

  return convite;
}

async function aceitarConvite({ token, userId, email }) {
  if (!token) {
    const err = new Error('Token do convite é obrigatório');
    err.status = 400;
    throw err;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const conviteResult = await client.query(
      `SELECT ii.*, i.nome AS institution_nome
         FROM institution_invitations ii
         JOIN institutions i ON i.id = ii.institution_id
        WHERE ii.token_hash = $1
          AND ii.accepted_at IS NULL
          AND ii.expires_at > NOW()
          AND i.ativa = true
        FOR UPDATE`,
      [tokenHash],
    );
    const convite = conviteResult.rows[0];
    if (!convite) {
      const err = new Error('Convite inválido ou expirado');
      err.status = 400;
      throw err;
    }
    if (email && convite.email.toLowerCase() !== email.toLowerCase()) {
      const err = new Error('O convite não pertence ao e-mail desta conta');
      err.status = 403;
      throw err;
    }

    const membership = await client.query(
      `INSERT INTO institution_memberships
        (institution_id, user_id, role, status)
       VALUES ($1, $2, $3, 'ativo')
       ON CONFLICT (institution_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, status = 'ativo', updated_at = NOW()
       RETURNING id, institution_id, user_id, role, status`,
      [convite.institution_id, userId, convite.role],
    );

    await client.query(
      'UPDATE institution_invitations SET accepted_at = NOW() WHERE id = $1',
      [convite.id],
    );
    await client.query('COMMIT');
    return { membership: membership.rows[0], institution: { id: convite.institution_id, nome: convite.institution_nome } };
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

async function dashboard(institutionId, userId) {
  const membro = await obterMembro(institutionId, userId);
  if (!membro || membro.status !== 'ativo' || !['gestor', 'administrador'].includes(membro.role)) {
    const err = new Error('Sem permissão para visualizar o dashboard');
    err.status = 403;
    throw err;
  }

  const [total, ativos, perfis, trilhas, progresso] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM institution_memberships WHERE institution_id = $1', [institutionId]),
    pool.query(`SELECT COUNT(*)::int AS total FROM institution_memberships WHERE institution_id = $1 AND status = 'ativo'`, [institutionId]),
    pool.query(`SELECT COUNT(DISTINCT p.user_id)::int AS total
                 FROM institution_memberships m
                 JOIN profiles p ON p.user_id = m.user_id
                WHERE m.institution_id = $1 AND m.status = 'ativo'`, [institutionId]),
    pool.query('SELECT COUNT(*)::int AS total FROM institution_trails WHERE institution_id = $1 AND ativa = true', [institutionId]),
    pool.query(`SELECT COALESCE(ROUND(AVG(progresso), 2), 0)::numeric AS media
                 FROM institution_trail_members tm
                 JOIN institution_trails t ON t.id = tm.trail_id
                WHERE t.institution_id = $1 AND t.ativa = true`, [institutionId]),
  ]);

  return {
    institution: { id: institutionId, nome: membro.institution_nome, tipo: membro.institution_tipo },
    participantes: { total: total.rows[0].total, ativos: ativos.rows[0].total },
    perfisCompletos: perfis.rows[0].total,
    trilhasAtivas: trilhas.rows[0].total,
    progressoMedio: Number(progresso.rows[0].media),
  };
}

async function criarTrilha({ institutionId, titulo, descricao = null, userId }) {
  const membro = await obterMembro(institutionId, userId);
  if (!membro || membro.status !== 'ativo' || !['gestor', 'administrador'].includes(membro.role)) {
    const err = new Error('Sem permissão para criar trilhas');
    err.status = 403;
    throw err;
  }
  if (!titulo?.trim()) {
    const err = new Error('Título da trilha é obrigatório');
    err.status = 400;
    throw err;
  }
  const result = await pool.query(
    `INSERT INTO institution_trails (institution_id, titulo, descricao)
     VALUES ($1, $2, $3)
     RETURNING id, institution_id, titulo, descricao, ativa, created_at, updated_at`,
    [institutionId, titulo.trim(), descricao?.trim() || null],
  );
  return result.rows[0];
}

async function listarTrilhas(institutionId, userId) {
  const membro = await obterMembro(institutionId, userId);
  if (!membro || membro.status !== 'ativo') {
    const err = new Error('Sem acesso à instituição');
    err.status = 403;
    throw err;
  }
  const result = await pool.query(
    `SELECT id, institution_id, titulo, descricao, ativa, created_at, updated_at
       FROM institution_trails
      WHERE institution_id = $1
      ORDER BY created_at DESC`,
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

  if (role && role !== gestor.role && gestor.role !== 'administrador') {
    const err = new Error('Apenas o administrador institucional pode alterar papéis');
    err.status = 403;
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

module.exports = { TIPOS, ROLES, criar, criarConvite, aceitarConvite, listarDoUsuario, listarParticipantes, atualizarMembro, dashboard, criarTrilha, listarTrilhas };
