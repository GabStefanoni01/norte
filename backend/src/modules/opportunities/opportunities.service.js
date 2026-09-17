const pool = require('../../database/pool');

const TIPOS_VALIDOS = ['curso', 'vaga', 'bolsa', 'evento', 'programa'];

function normalizar(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function tokens(valor) {
  return normalizar(valor).split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

function atributosDoPerfil(perfil) {
  return [
    ...(perfil.habilidades || []),
    ...(perfil.interesses || []),
    ...(perfil.areas_sugeridas || []),
    ...(perfil.areas_secundarias || []),
    perfil.escolaridade,
    perfil.perfil_dominante,
  ].filter(Boolean).map(normalizar);
}

function requisitoAtendido(requisito, atributos) {
  const alvo = normalizar(requisito);
  if (!alvo) return true;
  return atributos.some((atributo) => {
    if (atributo === alvo || atributo.includes(alvo) || alvo.includes(atributo)) return true;
    const palavras = alvo.split(/\s+/).filter((p) => p.length >= 3);
    return palavras.length > 0 && palavras.every((palavra) => atributo.includes(palavra));
  });
}

function areaAtendida(oportunidade, perfil) {
  const interesse = normalizar(oportunidade.interesse);
  const categoria = normalizar(oportunidade.categoria);
  const perfilAreas = [
    ...(perfil.interesses || []),
    ...(perfil.areas_sugeridas || []),
    ...(perfil.areas_secundarias || []),
    perfil.perfil_dominante,
  ].filter(Boolean).map(normalizar);

  if (!interesse && !categoria || perfilAreas.length === 0) return false;

  return perfilAreas.some((area) => {
    if (interesse && (area === interesse || area.includes(interesse) || interesse.includes(area))) return true;
    if (categoria && (area === categoria || area.includes(categoria) || categoria.includes(area))) return true;

    const alvoTokens = new Set([...tokens(interesse), ...tokens(categoria)]);
    const areaTokens = new Set(tokens(area));
    if (alvoTokens.size === 0 || areaTokens.size === 0) return false;

    const interseccao = [...alvoTokens].filter((token) => areaTokens.has(token)).length;
    return interseccao > 0;
  });
}

function calcularMatch(oportunidade, perfil) {
  const requisitos = oportunidade.requisitos || [];
  const atributos = atributosDoPerfil(perfil);
  const faltantes = requisitos.filter((r) => !requisitoAtendido(r, atributos));
  const requisitosAtendidos = requisitos.length - faltantes.length;
  const requisitosPercentual = requisitos.length === 0 ? 1 : requisitosAtendidos / requisitos.length;

  let contexto = 0;
  let sinais = 0;
  let areaCompativel = null;
  let localCompativel = null;
  let idadeCompativel = null;

  if (oportunidade.interesse || oportunidade.categoria) {
    sinais += 1;
    areaCompativel = areaAtendida(oportunidade, perfil);
    if (areaCompativel) contexto += 1;
  }

  if (oportunidade.estado) {
    sinais += 1;
    localCompativel = normalizar(oportunidade.estado) === normalizar(perfil.estado);
    if (localCompativel) contexto += 1;
  } else {
    sinais += 1;
    localCompativel = true;
    contexto += 1;
  }

  if (oportunidade.idade_minima != null || oportunidade.idade_maxima != null) {
    sinais += 1;
    const idade = Number(perfil.idade);
    const dentroMin = oportunidade.idade_minima == null || idade >= oportunidade.idade_minima;
    const dentroMax = oportunidade.idade_maxima == null || idade <= oportunidade.idade_maxima;
    idadeCompativel = Number.isFinite(idade) && dentroMin && dentroMax;
    if (idadeCompativel) contexto += 1;
  } else {
    sinais += 1;
    idadeCompativel = true;
    contexto += 1;
  }

  const contextoPercentual = sinais > 0 ? contexto / sinais : 1;
  const matchPercent = Math.round((requisitosPercentual * 70) + (contextoPercentual * 30));
  return {
    matchPercent,
    faltantes,
    matchDetalhes: {
      areaCompativel,
      localCompativel,
      idadeCompativel,
      requisitosAtendidos,
      requisitosTotal: requisitos.length,
    },
  };
}

function montarFiltros({ tipo, interesse, estado, busca } = {}) {
  const condicoes = ["status = 'publicada'", '(expires_at IS NULL OR expires_at > NOW())'];
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

  if (busca) {
    valores.push(`%${busca}%`);
    const parametro = `$${valores.length}`;
    condicoes.push(`(
      titulo ILIKE ${parametro}
      OR COALESCE(empresa, '') ILIKE ${parametro}
      OR COALESCE(categoria, '') ILIKE ${parametro}
      OR COALESCE(descricao, '') ILIKE ${parametro}
    )`);
  }

  return { where: condicoes.join(' AND '), valores };
}

async function buscarPerfil(userId) {
  const result = await pool.query(`
    SELECT p.habilidades, p.interesses, p.escolaridade, p.perfil_dominante,
           p.areas_sugeridas, p.areas_secundarias, u.idade, u.estado
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id = $1
  `, [userId]);
  return result.rows[0] || {};
}

async function listar(userId, filtros = {}) {
  const { where, valores } = montarFiltros(filtros);
  const [ops, perfil] = await Promise.all([
    pool.query(`SELECT * FROM opportunities WHERE ${where} ORDER BY created_at DESC`, valores),
    buscarPerfil(userId),
  ]);
  return ops.rows.map((op) => ({ ...op, ...calcularMatch(op, perfil) })).sort((a, b) => b.matchPercent - a.matchPercent);
}

async function criar(dados) {
  const { titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito,
    idade_minima, idade_maxima, link, requisitos, expires_at } = dados;
  if (!titulo || !link) { const err = new Error('titulo e link são obrigatórios'); err.status = 400; throw err; }
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    const err = new Error(`tipo inválido. Use um de: ${TIPOS_VALIDOS.join(', ')}`); err.status = 400; throw err;
  }
  if (idade_minima != null && idade_maxima != null && Number(idade_minima) > Number(idade_maxima)) {
    const err = new Error('idade_minima não pode ser maior que idade_maxima'); err.status = 400; throw err;
  }
  const result = await pool.query(`
    INSERT INTO opportunities
      (titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito,
       idade_minima, idade_maxima, link, requisitos, fonte, status, expires_at)
    VALUES ($1,$2,$3,COALESCE($4,'vaga'),$5,$6,$7,COALESCE($8,true),$9,$10,$11,
            COALESCE($12,'{}'),'manual','publicada',$13)
    RETURNING *
  `, [titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito,
    idade_minima, idade_maxima, link, requisitos, expires_at]);
  return result.rows[0];
}

async function remover(id) {
  const result = await pool.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

async function fecharLacuna(userId, opportunityId) {
  const opResult = await pool.query("SELECT * FROM opportunities WHERE id = $1 AND status = 'publicada'", [opportunityId]);
  const oportunidade = opResult.rows[0];
  if (!oportunidade) { const err = new Error('Oportunidade não encontrada'); err.status = 404; throw err; }

  const perfil = await buscarPerfil(userId);
  const { faltantes } = calcularMatch(oportunidade, perfil);
  if (faltantes.length === 0) return { message: 'Você já tem 100% de match com essa oportunidade!', itensAdicionados: 0 };

  const planResult = await pool.query('SELECT * FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  const plano = planResult.rows[0];
  const etapasAtuais = Array.isArray(plano?.etapas) ? plano.etapas : [];
  const novoMes = {
    mes: etapasAtuais.length + 1,
    titulo: `Preparação: ${oportunidade.titulo}`,
    itens: faltantes.map((skill, i) => ({ id: `match${opportunityId}i${i + 1}`, descricao: `Aprender: ${skill}`, tipo: 'aprender', status: 'pendente' })),
  };
  const etapas = [...etapasAtuais, novoMes];
  const todosItens = etapas.flatMap((m) => Array.isArray(m.itens) ? m.itens : []);
  const concluidos = todosItens.filter((i) => i.status === 'concluido').length;
  const progresso = todosItens.length > 0 ? Math.round((concluidos / todosItens.length) * 10000) / 100 : 0;

  if (plano) {
    await pool.query('UPDATE plans SET etapas = $1, progresso = $2 WHERE id = $3', [JSON.stringify(etapas), progresso, plano.id]);
  } else {
    await pool.query('INSERT INTO plans (user_id, etapas, progresso, gerado_por_ia) VALUES ($1, $2, 0, false)', [userId, JSON.stringify([novoMes])]);
  }
  return { message: `${faltantes.length} item(ns) adicionados ao seu plano de evolução.`, itensAdicionados: faltantes.length };
}

module.exports = { listar, criar, remover, fecharLacuna, calcularMatch, montarFiltros, areaAtendida };
