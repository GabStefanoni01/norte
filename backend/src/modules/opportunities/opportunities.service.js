const pool = require('../../database/pool');
const TIPOS_VALIDOS = ['curso', 'vaga', 'bolsa', 'evento', 'programa'];

function calcularMatch(requisitos, habilidades) {
  if (!requisitos || requisitos.length === 0) return { matchPercent: 100, faltantes: [] };
  const hl = (habilidades || []).map((h) => h.toLowerCase().trim());
  const faltantes = requisitos.filter((r) => !hl.includes(r.toLowerCase().trim()));
  const atendidos = requisitos.length - faltantes.length;
  return { matchPercent: Math.round((atendidos / requisitos.length) * 100), faltantes };
}

async function listar(userId, { tipo, interesse, estado } = {}) {
  const condicoes = [];
  const valores = [];
  if (tipo) { valores.push(tipo); condicoes.push(`tipo = $${valores.length}`); }
  if (interesse) { valores.push(interesse); condicoes.push(`interesse = $${valores.length}`); }
  if (estado) { valores.push(estado); condicoes.push(`(estado = $${valores.length} OR estado IS NULL)`); }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [ops, perfil] = await Promise.all([
    pool.query(`SELECT * FROM opportunities ${where} ORDER BY created_at DESC`, valores),
    pool.query('SELECT habilidades FROM profiles WHERE user_id = $1', [userId]),
  ]);
  const habilidades = perfil.rows[0]?.habilidades || [];

  return ops.rows
    .map((op) => ({ ...op, ...calcularMatch(op.requisitos, habilidades) }))
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

async function criar(dados) {
  const { titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, link, requisitos } = dados;
  if (!titulo || !link) { const err = new Error('titulo e link são obrigatórios'); err.status = 400; throw err; }
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    const err = new Error(`tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}`);
    err.status = 400; throw err;
  }
  const result = await pool.query(
    `INSERT INTO opportunities (titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, link, requisitos)
     VALUES ($1, $2, $3, COALESCE($4, 'vaga'), $5, $6, $7, COALESCE($8, true), $9, COALESCE($10, '{}'))
     RETURNING *`,
    [titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito, link, requisitos]
  );
  return result.rows[0];
}

async function remover(id) {
  const result = await pool.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

async function fecharLacuna(userId, opportunityId) {
  const opResult = await pool.query('SELECT * FROM opportunities WHERE id = $1', [opportunityId]);
  const oportunidade = opResult.rows[0];
  if (!oportunidade) { const err = new Error('Oportunidade não encontrada'); err.status = 404; throw err; }

  const perfilResult = await pool.query('SELECT habilidades FROM profiles WHERE user_id = $1', [userId]);
  const { faltantes } = calcularMatch(oportunidade.requisitos, perfilResult.rows[0]?.habilidades || []);
  if (faltantes.length === 0) return { message: 'Você já tem 100% de match com essa oportunidade!', itensAdicionados: 0 };

  const planResult = await pool.query('SELECT * FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  const plano = planResult.rows[0];
  const novoMes = {
    mes: plano ? plano.etapas.length + 1 : 1,
    titulo: `Preparação: ${oportunidade.titulo}`,
    itens: faltantes.map((skill, i) => ({
      id: `match${opportunityId}i${i + 1}`, descricao: `Aprender: ${skill}`, tipo: 'aprender', status: 'pendente',
    })),
  };

  if (plano) {
    const etapas = [...plano.etapas, novoMes];
    const todosItens = etapas.flatMap((m) => m.itens);
    const progresso = Math.round((todosItens.filter((i) => i.status === 'concluido').length / todosItens.length) * 10000) / 100;
    await pool.query('UPDATE plans SET etapas = $1, progresso = $2 WHERE id = $3', [JSON.stringify(etapas), progresso, plano.id]);
  } else {
    await pool.query(`INSERT INTO plans (user_id, etapas, progresso, gerado_por_ia) VALUES ($1, $2, 0, false)`, [userId, JSON.stringify([novoMes])]);
  }

  return { message: `${faltantes.length} item(ns) adicionados ao seu plano de evolução.`, itensAdicionados: faltantes.length };
}

module.exports = { listar, criar, remover, fecharLacuna };
