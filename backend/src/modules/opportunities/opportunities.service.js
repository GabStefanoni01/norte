const pool = require('../../database/pool');
const { buscarOportunidadesNaWeb } = require('./opportunities.discovery');

const TIPOS_VALIDOS = ['curso', 'vaga', 'bolsa', 'evento', 'programa'];
const STATUS_VALIDOS = ['publicada', 'pendente'];

function montarFiltros({ tipo, interesse, estado, gratuito }, incluirPendentes) {
  const condicoes = [];
  const valores = [];

  if (!incluirPendentes) {
    condicoes.push(`status = 'publicada'`);
  }

  if (tipo) {
    valores.push(tipo);
    condicoes.push(`tipo = $${valores.length}`);
  }
  if (interesse) {
    valores.push(interesse);
    condicoes.push(`interesse = $${valores.length}`);
  }
  if (estado) {
    valores.push(estado);
    condicoes.push(`(estado = $${valores.length} OR estado IS NULL)`);
  }
  if (gratuito !== undefined) {
    valores.push(gratuito === 'true' || gratuito === true);
    condicoes.push(`gratuito = $${valores.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  return { where, valores };
}

async function listar(filtros = {}) {
  const { where, valores } = montarFiltros(filtros, false);
  const result = await pool.query(
    `SELECT * FROM opportunities ${where} ORDER BY created_at DESC NULLS LAST, id DESC`,
    valores
  );
  return result.rows;
}

async function listarTodas(filtros = {}) {
  const { where, valores } = montarFiltros(filtros, true);
  const result = await pool.query(
    `SELECT * FROM opportunities ${where} ORDER BY created_at DESC NULLS LAST, id DESC`,
    valores
  );
  return result.rows;
}

async function criar(dados) {
  const { titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, idadeMinima, idadeMaxima, link } =
    dados;

  if (!titulo || !link) {
    const err = new Error('titulo e link são obrigatórios');
    err.status = 400;
    throw err;
  }

  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    const err = new Error(`tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO opportunities
       (titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, idade_minima, idade_maxima, link, fonte, status)
     VALUES ($1, $2, $3, COALESCE($4, 'curso'), $5, $6, $7, COALESCE($8, true), $9, $10, $11, 'manual', 'publicada')
     RETURNING *`,
    [titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, idadeMinima, idadeMaxima, link]
  );

  return result.rows[0];
}

async function remover(id) {
  const result = await pool.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

async function atualizarStatus(id, status) {
  if (!STATUS_VALIDOS.includes(status)) {
    const err = new Error(`status inválido. Use um de: ${STATUS_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const result = await pool.query('UPDATE opportunities SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (!result.rows[0]) {
    const err = new Error('Oportunidade não encontrada');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

/**
 * Busca oportunidades na web via IA e insere as que ainda não existem
 * (checagem simples por link, pra não duplicar). Tudo entra como
 * "pendente" — precisa de aprovação de um admin antes de aparecer pros
 * usuários.
 */
async function sincronizarComWeb({ interesse, estado } = {}) {
  const encontradas = await buscarOportunidadesNaWeb({ interesse, estado });

  let novas = 0;
  let duplicadas = 0;

  for (const op of encontradas) {
    const existente = await pool.query('SELECT id FROM opportunities WHERE link = $1', [op.link]);

    if (existente.rows[0]) {
      duplicadas += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO opportunities
         (titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, link, fonte, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'busca_automatica', 'pendente')`,
      [op.titulo, op.empresa, op.categoria, op.tipo, op.descricao, op.interesse, op.estado, op.gratuito, op.link]
    );
    novas += 1;
  }

  return { encontradas: encontradas.length, novas, duplicadas };
}

module.exports = { listar, listarTodas, criar, remover, atualizarStatus, sincronizarComWeb };
