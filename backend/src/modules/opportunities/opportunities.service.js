const pool = require('../../database/pool');

const TIPOS_VALIDOS = ['curso', 'vaga', 'bolsa', 'evento', 'programa'];

async function listar({ tipo, interesse, estado, gratuito } = {}) {
  const condicoes = [];
  const valores = [];

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
       (titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, idade_minima, idade_maxima, link)
     VALUES ($1, $2, $3, COALESCE($4, 'curso'), $5, $6, $7, COALESCE($8, true), $9, $10, $11)
     RETURNING *`,
    [titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, idadeMinima, idadeMaxima, link]
  );

  return result.rows[0];
}

async function remover(id) {
  const result = await pool.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

module.exports = { listar, criar, remover };
