const pool = require('../../database/pool');

const WEIGHTS = {
  interesses: 30,
  habilidades: 30,
  escolaridades: 20,
  carreiras: 10,
  cidades: 10,
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function overlap(userValues, requiredValues) {
  const userSet = new Set(asArray(userValues).map(normalize));
  return asArray(requiredValues).filter((item) => userSet.has(normalize(item)));
}

function getCriteria(criteria) {
  const source = criteria && typeof criteria === 'object' ? criteria : {};
  return {
    interesses: asArray(source.interesses),
    habilidades: asArray(source.habilidades),
    escolaridades: asArray(source.escolaridades),
    carreiras: asArray(source.carreiras),
    cidades: asArray(source.cidades),
  };
}

function calculateMatch(profile, user, rawCriteria) {
  const criteria = getCriteria(rawCriteria);
  const active = Object.entries(criteria).filter(([, values]) => values.length > 0);

  if (!active.length) {
    return {
      percentual: 0,
      criteriosAtendidos: 0,
      criteriosTotais: 0,
      motivos: [],
      lacunas: [],
      semCriterios: true,
    };
  }

  const activeWeight = active.reduce((sum, [key]) => sum + WEIGHTS[key], 0);
  let score = 0;
  const motivos = [];
  const lacunas = [];

  for (const [key, required] of active) {
    const weight = WEIGHTS[key] / activeWeight;
    let matched = [];

    if (key === 'cidades') {
      const cidade = user?.cidade;
      matched = required.filter((item) => normalize(item) === normalize(cidade));
    } else if (key === 'escolaridades') {
      matched = required.filter((item) => normalize(item) === normalize(profile?.escolaridade));
    } else if (key === 'carreiras') {
      matched = required.filter((item) => normalize(item) === normalize(profile?.carreira_interesse));
    } else {
      matched = overlap(profile?.[key], required);
    }

    if (matched.length) {
      score += weight * (matched.length / required.length);
      motivos.push({
        criterio: key,
        itens: matched,
        peso: Math.round(WEIGHTS[key]),
      });
    } else {
      lacunas.push({
        criterio: key,
        itens: required,
      });
    }
  }

  const criteriosAtendidos = motivos.length;
  const criteriosTotais = active.length;

  return {
    percentual: Math.round(score),
    criteriosAtendidos,
    criteriosTotais,
    motivos,
    lacunas,
    semCriterios: false,
  };
}

function validateCriteria(criteria) {
  if (criteria === undefined) return {};
  if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
    const err = new Error('Critérios de match inválidos');
    err.status = 400;
    throw err;
  }

  const allowed = ['interesses', 'habilidades', 'escolaridades', 'carreiras', 'cidades'];
  const result = {};

  for (const key of allowed) {
    if (criteria[key] === undefined) continue;
    if (!Array.isArray(criteria[key])) {
      const err = new Error(`O critério "${key}" deve ser uma lista`);
      err.status = 400;
      throw err;
    }
    result[key] = criteria[key]
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return result;
}

async function ensureManager(institutionId, userId) {
  const result = await pool.query(
    `SELECT role, status
       FROM institution_memberships
      WHERE institution_id = $1 AND user_id = $2`,
    [institutionId, userId],
  );
  const member = result.rows[0];

  if (!member || member.status !== 'ativo' || !['gestor', 'administrador'].includes(member.role)) {
    const err = new Error('Sem permissão para gerenciar o match institucional');
    err.status = 403;
    throw err;
  }
}

async function atualizarCriterios({ institutionId, trailId, criterios, userId }) {
  await ensureManager(institutionId, userId);
  const validated = validateCriteria(criterios);

  const result = await pool.query(
    `UPDATE institution_trails
        SET criterios = $1::jsonb,
            updated_at = NOW()
      WHERE id = $2 AND institution_id = $3
      RETURNING id, institution_id, titulo, descricao, criterios, ativa, created_at, updated_at`,
    [JSON.stringify(validated), trailId, institutionId],
  );

  if (!result.rows[0]) {
    const err = new Error('Trilha não encontrada');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function listarMatchesParaUsuario({ institutionId, userId, limite = 10 }) {
  const membership = await pool.query(
    `SELECT 1
       FROM institution_memberships
      WHERE institution_id = $1 AND user_id = $2 AND status = 'ativo'`,
    [institutionId, userId],
  );

  if (!membership.rows[0]) {
    const err = new Error('Sem acesso à instituição');
    err.status = 403;
    throw err;
  }

  const [profileResult, userResult, trailsResult] = await Promise.all([
    pool.query(
      `SELECT escolaridade, interesses, objetivos, habilidades, carreira_interesse
         FROM profiles
        WHERE user_id = $1`,
      [userId],
    ),
    pool.query(
      'SELECT id, nome, cidade FROM users WHERE id = $1',
      [userId],
    ),
    pool.query(
      `SELECT id, institution_id, titulo, descricao, criterios, ativa, created_at, updated_at
         FROM institution_trails
        WHERE institution_id = $1 AND ativa = true
        ORDER BY created_at DESC`,
      [institutionId],
    ),
  ]);

  const profile = profileResult.rows[0] || {};
  const user = userResult.rows[0] || {};

  return trailsResult.rows
    .map((trail) => ({
      ...trail,
      match: calculateMatch(profile, user, trail.criterios),
    }))
    .sort((a, b) => b.match.percentual - a.match.percentual || a.titulo.localeCompare(b.titulo))
    .slice(0, Math.max(1, Math.min(Number(limite) || 10, 50)));
}

async function listarMatchesDaTrilha({ institutionId, trailId, userId, limite = 50 }) {
  await ensureManager(institutionId, userId);

  const trailResult = await pool.query(
    `SELECT id, institution_id, titulo, descricao, criterios, ativa
       FROM institution_trails
      WHERE id = $1 AND institution_id = $2`,
    [trailId, institutionId],
  );
  const trail = trailResult.rows[0];

  if (!trail) {
    const err = new Error('Trilha não encontrada');
    err.status = 404;
    throw err;
  }

  const membersResult = await pool.query(
    `SELECT u.id, u.nome, u.email, u.cidade,
            p.escolaridade, p.interesses, p.habilidades, p.carreira_interesse,
            m.role, m.status AS membership_status
       FROM institution_memberships m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
      WHERE m.institution_id = $1 AND m.status = 'ativo'
      ORDER BY u.nome ASC`,
    [institutionId],
  );

  return membersResult.rows
    .map((member) => ({
      user: {
        id: member.id,
        nome: member.nome,
        email: member.email,
        role: member.role,
      },
      match: calculateMatch(member, member, trail.criterios),
    }))
    .sort((a, b) => b.match.percentual - a.match.percentual || a.user.nome.localeCompare(b.user.nome))
    .slice(0, Math.max(1, Math.min(Number(limite) || 50, 100)));
}

module.exports = {
  atualizarCriterios,
  listarMatchesParaUsuario,
  listarMatchesDaTrilha,
  validateCriteria,
};
