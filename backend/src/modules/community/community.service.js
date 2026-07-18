const pool = require('../../database/pool');

const categorias = [
  'Estou escolhendo faculdade',
  'Quero migrar de carreira',
  'Primeiro emprego',
  'Tecnologia',
  'Administração',
  'Engenharia',
  'Saúde',
];

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 250;
const MIN_CONTENT_LENGTH = 5;
const MAX_CONTENT_LENGTH = 2000;
const REACTION_TYPES = ['like'];

function validarTexto(texto, minLength, maxLength) {
  return typeof texto === 'string' && texto.trim().length >= minLength && texto.trim().length <= maxLength;
}

async function ensureActivePost(postId) {
  const result = await pool.query(
    `SELECT id FROM community_posts WHERE id = $1 AND active = true`,
    [postId]
  );

  if (!result.rows.length) {
    const err = new Error('Publicação não encontrada ou inativa');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

async function listCategories() {
  return categorias;
}

async function listPosts({ categoria, query, limit } = {}) {
  const conditions = ['active = true'];
  const values = [];

  if (categoria) {
    values.push(categoria);
    conditions.push(`categoria = $${values.length}`);
  }

  if (query) {
    values.push(`%${query}%`);
    values.push(`%${query}%`);
    conditions.push(`(titulo ILIKE $${values.length - 1} OR conteudo ILIKE $${values.length})`);
  }

  let limitClause = '';
  if (limit && Number.isInteger(limit) && limit > 0) {
    limitClause = `LIMIT ${limit}`;
  }

  const posts = await pool.query(
    `SELECT p.id,
            p.categoria,
            p.titulo,
            p.conteudo,
            p.user_id,
            u.nome AS autor_nome,
            p.created_at,
            p.updated_at,
            COALESCE(r.count, 0) AS reacoes,
            COALESCE(c.count, 0) AS comentarios
     FROM community_posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN (
       SELECT post_id, COUNT(*) AS count
       FROM community_reactions
       GROUP BY post_id
     ) r ON r.post_id = p.id
     LEFT JOIN (
       SELECT post_id, COUNT(*) AS count
       FROM community_comments
       GROUP BY post_id
     ) c ON c.post_id = p.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.updated_at DESC, p.created_at DESC
     ${limitClause}`,
    values
  );

  return posts.rows;
}

async function getPost(postId) {
  const postResult = await pool.query(
    `SELECT p.id,
            p.categoria,
            p.titulo,
            p.conteudo,
            p.user_id,
            u.nome AS autor_nome,
            p.created_at,
            p.updated_at
     FROM community_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $1 AND p.active = true`,
    [postId]
  );

  if (!postResult.rows.length) return null;

  const [post] = postResult.rows;

  const commentsResult = await pool.query(
    `SELECT c.id, c.conteudo, c.user_id, u.nome AS autor_nome, c.created_at
     FROM community_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );

  const reactionsResult = await pool.query(
    `SELECT tipo, COUNT(*) AS count
     FROM community_reactions
     WHERE post_id = $1
     GROUP BY tipo`,
    [postId]
  );

  return {
    ...post,
    comentarios: commentsResult.rows,
    reacoes: reactionsResult.rows,
  };
}

async function createPost(userId, { categoria, titulo, conteudo }, role) {
  if (!categorias.includes(categoria)) {
    const err = new Error('Categoria inválida');
    err.status = 400;
    throw err;
  }

  if (categoria === 'Administração' && role !== 'admin') {
    const err = new Error('Apenas administradores podem publicar nessa categoria.');
    err.status = 403;
    throw err;
  }

  if (!validarTexto(titulo, MIN_TITLE_LENGTH, MAX_TITLE_LENGTH)) {
    const err = new Error(`Título inválido. Deve ter entre ${MIN_TITLE_LENGTH} e ${MAX_TITLE_LENGTH} caracteres.`);
    err.status = 400;
    throw err;
  }

  if (!validarTexto(conteudo, MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH)) {
    const err = new Error(`Conteúdo inválido. Deve ter entre ${MIN_CONTENT_LENGTH} e ${MAX_CONTENT_LENGTH} caracteres.`);
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO community_posts (user_id, categoria, titulo, conteudo)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, categoria, titulo.trim(), conteudo.trim()]
  );

  return result.rows[0];
}

async function createComment(userId, postId, { conteudo }) {
  await ensureActivePost(postId);

  if (!validarTexto(conteudo, MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH)) {
    const err = new Error(`Comentário inválido. Deve ter entre ${MIN_CONTENT_LENGTH} e ${MAX_CONTENT_LENGTH} caracteres.`);
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO community_comments (post_id, user_id, conteudo)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [postId, userId, conteudo.trim()]
  );
  return result.rows[0];
}

async function createReaction(userId, postId, tipo = 'like') {
  await ensureActivePost(postId);

  if (!REACTION_TYPES.includes(tipo)) {
    const err = new Error('Tipo de reação inválido');
    err.status = 400;
    throw err;
  }

  await pool.query(
    `INSERT INTO community_reactions (post_id, user_id, tipo)
     VALUES ($1, $2, $3)
     ON CONFLICT (post_id, user_id, tipo) DO NOTHING`,
    [postId, userId, tipo]
  );

  return { postId, tipo };
}

async function removeReaction(userId, postId, tipo = 'like') {
  await ensureActivePost(postId);

  await pool.query(
    `DELETE FROM community_reactions
     WHERE post_id = $1 AND user_id = $2 AND tipo = $3`,
    [postId, userId, tipo]
  );
  return { postId, tipo };
}

async function deletePost(postId) {
  const result = await pool.query(
    `UPDATE community_posts SET active = false, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [postId]
  );
  return result.rows[0] || null;
}

module.exports = {
  listCategories,
  listPosts,
  getPost,
  createPost,
  createComment,
  createReaction,
  removeReaction,
  deletePost,
};
