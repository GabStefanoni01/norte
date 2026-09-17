const pool = require('../../database/pool');

const TIPOS_VALIDOS = ['curso', 'vaga', 'bolsa', 'evento', 'programa'];
const ORDENACOES_VALIDAS = ['match', 'recentes'];
const LIMITE_PADRAO = 12;
const LIMITE_MAXIMO = 50;
const PESO_TECNOLOGIA = 2;
const PESO_KEYWORD = 1;

const ALIASES_HABILIDADES = new Map([
  ['js', 'javascript'],
  ['javascript js', 'javascript'],
  ['javascript.js', 'javascript'],
  ['ts', 'typescript'],
  ['typescript ts', 'typescript'],
  ['typescript.js', 'typescript'],
  ['react.js', 'react'],
  ['reactjs', 'react'],
  ['node.js', 'node'],
  ['nodejs', 'node'],
  ['node js', 'node'],
  ['next.js', 'next'],
  ['nextjs', 'next'],
  ['vue.js', 'vue'],
  ['vuejs', 'vue'],
  ['angular.js', 'angular'],
  ['angularjs', 'angular'],
  ['postgresql', 'postgres'],
  ['postgres sql', 'postgres'],
  ['mysql database', 'mysql'],
  ['sql server', 'sql server'],
  ['c#', 'csharp'],
  ['.net', 'dotnet'],
  ['dot net', 'dotnet'],
]);

const PALAVRAS_IGNORADAS_AREA = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'para', 'com', 'e', 'a', 'o', 'as', 'os',
]);

const REGIOES_POR_ESTADO = {
  AC: 'norte', AL: 'nordeste', AP: 'norte', AM: 'norte', BA: 'nordeste', CE: 'nordeste',
  DF: 'centro oeste', ES: 'sudeste', GO: 'centro oeste', MA: 'nordeste', MT: 'centro oeste',
  MS: 'centro oeste', MG: 'sudeste', PA: 'norte', PB: 'nordeste', PR: 'sul', PE: 'nordeste',
  PI: 'nordeste', RJ: 'sudeste', RN: 'nordeste', RS: 'sul', RO: 'norte', RR: 'norte',
  SC: 'sul', SP: 'sudeste', SE: 'nordeste', TO: 'norte',
};

const NOMES_ESTADOS = new Map([
  ['acre', 'AC'], ['alagoas', 'AL'], ['amapa', 'AP'], ['amazonas', 'AM'], ['bahia', 'BA'],
  ['ceara', 'CE'], ['distrito federal', 'DF'], ['espirito santo', 'ES'], ['goias', 'GO'],
  ['maranhao', 'MA'], ['mato grosso', 'MT'], ['mato grosso do sul', 'MS'], ['minas gerais', 'MG'],
  ['para', 'PA'], ['paraiba', 'PB'], ['parana', 'PR'], ['pernambuco', 'PE'], ['piaui', 'PI'],
  ['rio de janeiro', 'RJ'], ['rio grande do norte', 'RN'], ['rio grande do sul', 'RS'],
  ['rondonia', 'RO'], ['roraima', 'RR'], ['santa catarina', 'SC'], ['sao paulo', 'SP'],
  ['sergipe', 'SE'], ['tocantins', 'TO'],
]);

const LOCALIZACOES_NACIONAIS = new Set([
  'brasil', 'brazil', 'todo brasil', 'todo o brasil', 'nacional', 'nacionalmente',
  'anywhere', 'qualquer lugar', 'todo o pais', 'todo pais',
]);

function normalizar(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizarHabilidade(valor) {
  const base = normalizar(valor).replace(/[()]/g, '').replace(/\s+/g, ' ');
  return ALIASES_HABILIDADES.get(base) || base;
}

function tokens(valor) {
  return normalizar(valor).split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
}

function tokensArea(valor) {
  return tokens(valor).filter((token) => !PALAVRAS_IGNORADAS_AREA.has(token));
}

function atributosDoPerfil(perfil) {
  return [
    ...(perfil.habilidades || []),
    ...(perfil.interesses || []),
    ...(perfil.areas_sugeridas || []),
    ...(perfil.areas_secundarias || []),
    perfil.escolaridade,
    perfil.perfil_dominante,
  ].filter(Boolean).map(normalizarHabilidade);
}

function similaridadeHabilidade(requisito, atributo) {
  const alvo = normalizarHabilidade(requisito);
  const candidato = normalizarHabilidade(atributo);
  if (!alvo || !candidato) return false;
  if (alvo === candidato || candidato.includes(alvo) || alvo.includes(candidato)) return true;

  const alvoTokens = tokens(alvo);
  const candidatoTokens = tokens(candidato);
  if (alvoTokens.length === 0 || candidatoTokens.length === 0) return false;

  return alvoTokens.every((token) => candidatoTokens.some((c) => c === token || c.includes(token) || token.includes(c)));
}

function requisitoAtendido(requisito, atributos) {
  return atributos.some((atributo) => similaridadeHabilidade(requisito, atributo));
}

function similaridadeArea(areaA, areaB) {
  const a = tokensArea(areaA);
  const b = tokensArea(areaB);
  if (a.length === 0 || b.length === 0) return false;
  if (a.join(' ') === b.join(' ')) return true;

  const conjuntoB = new Set(b);
  const interseccao = a.filter((token) => conjuntoB.has(token)).length;
  const coberturaA = interseccao / a.length;
  const coberturaB = interseccao / b.length;
  return coberturaA >= 0.5 || coberturaB >= 0.5;
}

function areaAtendida(oportunidade, perfil) {
  const alvos = [oportunidade.interesse, oportunidade.categoria]
    .filter(Boolean)
    .map(normalizarHabilidade);
  const perfilAreas = [
    ...(perfil.interesses || []),
    ...(perfil.areas_sugeridas || []),
    ...(perfil.areas_secundarias || []),
    perfil.perfil_dominante,
  ].filter(Boolean);

  if (alvos.length === 0 || perfilAreas.length === 0) return false;
  return perfilAreas.some((area) => alvos.some((alvo) => similaridadeArea(area, alvo)));
}

function estadoNormalizado(valor) {
  const normalizado = normalizar(valor);
  if (!normalizado) return null;
  if (/^[a-z]{2}$/.test(normalizado)) return normalizado.toUpperCase();
  return NOMES_ESTADOS.get(normalizado) || null;
}

function ehLocalizacaoNacional(localizacao) {
  const valor = normalizar(localizacao);
  if (!valor) return false;
  return Array.from(LOCALIZACOES_NACIONAIS).some((termo) => valor === termo || valor.includes(termo));
}

function ehRemota(oportunidade) {
  const dadosOrigem = oportunidade.dados_origem || {};
  if (dadosOrigem.remote === true) return true;
  if (dadosOrigem.hybrid === true) return false;

  const arranjo = normalizar(dadosOrigem.work_arrangement);
  const localizacao = normalizar(dadosOrigem.location);
  return /\bremote\b|\bremoto\b|\bteletrabalho\b|\bhome office\b/.test(arranjo)
    || /\bremote\b|\bremoto\b|\bteletrabalho\b|\bhome office\b/.test(localizacao);
}

function cidadeNaLocalizacao(cidade, localizacao) {
  const cidadeNormalizada = normalizar(cidade);
  const localizacaoNormalizada = normalizar(localizacao);
  if (!cidadeNormalizada || !localizacaoNormalizada) return false;
  return localizacaoNormalizada === cidadeNormalizada
    || localizacaoNormalizada.includes(cidadeNormalizada);
}

function localizacaoEspecificaPorCidade(localizacao) {
  const valor = normalizar(localizacao);
  if (!valor || ehLocalizacaoNacional(valor)) return false;
  if (/\b(remote|remoto|teletrabalho|home office)\b/.test(valor)) return false;
  if (/\b(norte|nordeste|sul|sudeste|centro oeste|centro-oeste)\b/.test(valor)) return false;
  return valor.includes(',') || /\s[-/]\s/.test(valor);
}

function regiaoDaLocalizacao(localizacao) {
  const valor = normalizar(localizacao).replace(/-/g, ' ');
  if (!valor) return null;
  const regioes = ['norte', 'nordeste', 'sul', 'sudeste', 'centro oeste'];
  return regioes.find((regiao) => valor.includes(regiao)) || null;
}

function localCompativel(oportunidade, perfil) {
  const estadoOportunidade = estadoNormalizado(oportunidade.estado);
  const estadoPerfil = estadoNormalizado(perfil.estado);
  const cidadePerfil = normalizar(perfil.cidade);
  const localizacao = normalizar(oportunidade.dados_origem?.location);

  if (ehRemota(oportunidade) || ehLocalizacaoNacional(localizacao)) return true;

  const regiao = regiaoDaLocalizacao(localizacao);
  if (regiao && estadoPerfil && REGIOES_POR_ESTADO[estadoPerfil] === regiao) return true;

  if (cidadePerfil && cidadeNaLocalizacao(cidadePerfil, localizacao)) return true;

  if (estadoOportunidade && estadoPerfil) {
    if (estadoOportunidade !== estadoPerfil) return false;
    if (localizacaoEspecificaPorCidade(localizacao) && cidadePerfil && !cidadeNaLocalizacao(cidadePerfil, localizacao)) {
      return false;
    }
    return true;
  }

  if (estadoOportunidade && !estadoPerfil) return false;
  if (!estadoOportunidade && localizacao) return cidadePerfil ? cidadeNaLocalizacao(cidadePerfil, localizacao) : true;

  return !oportunidade.estado && !localizacao;
}

function requisitosComPeso(oportunidade) {
  const requisitos = Array.isArray(oportunidade.requisitos) ? oportunidade.requisitos : [];
  const dadosOrigem = oportunidade.dados_origem || {};
  const tecnologias = Array.isArray(dadosOrigem.technology_slugs) ? dadosOrigem.technology_slugs : [];
  const keywords = Array.isArray(dadosOrigem.keyword_slugs) ? dadosOrigem.keyword_slugs : [];

  return requisitos.map((requisito) => {
    const ehTecnologia = tecnologias.some((tecnologia) => similaridadeHabilidade(requisito, tecnologia));
    const ehKeyword = keywords.some((keyword) => similaridadeHabilidade(requisito, keyword));

    return {
      requisito,
      peso: ehTecnologia ? PESO_TECNOLOGIA : (ehKeyword ? PESO_KEYWORD : PESO_KEYWORD),
      tipo: ehTecnologia ? 'tecnologia' : (ehKeyword ? 'keyword' : 'requisito'),
    };
  });
}

function calcularMatch(oportunidade, perfil) {
  const requisitosPesados = requisitosComPeso(oportunidade);
  const atributos = atributosDoPerfil(perfil);
  const faltantes = requisitosPesados
    .filter(({ requisito }) => !requisitoAtendido(requisito, atributos))
    .map(({ requisito }) => requisito);

  const pesoTotal = requisitosPesados.reduce((total, item) => total + item.peso, 0);
  const pesoAtendido = requisitosPesados
    .filter(({ requisito }) => !faltantes.includes(requisito))
    .reduce((total, item) => total + item.peso, 0);
  const requisitosPercentual = pesoTotal === 0 ? 1 : pesoAtendido / pesoTotal;
  const requisitosAtendidos = requisitosPesados.length - faltantes.length;

  let contexto = 0;
  let sinais = 0;
  let areaCompativel = null;
  let localCompativelResultado = null;
  let idadeCompativel = null;

  if (oportunidade.interesse || oportunidade.categoria) {
    sinais += 1;
    areaCompativel = areaAtendida(oportunidade, perfil);
    if (areaCompativel) contexto += 1;
  }

  if (oportunidade.estado || oportunidade.dados_origem?.location || oportunidade.dados_origem?.remote || oportunidade.dados_origem?.work_arrangement) {
    sinais += 1;
    localCompativelResultado = localCompativel(oportunidade, perfil);
    if (localCompativelResultado) contexto += 1;
  } else {
    sinais += 1;
    localCompativelResultado = true;
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
      localCompativel: localCompativelResultado,
      idadeCompativel,
      requisitosAtendidos,
      requisitosTotal: requisitosPesados.length,
      pesoAtendido,
      pesoTotal,
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

function normalizarPaginacao(valor, padrao) {
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

function normalizarOrdenacao(valor) {
  return ORDENACOES_VALIDAS.includes(valor) ? valor : 'match';
}

async function buscarPerfil(userId) {
  const result = await pool.query(`
    SELECT p.habilidades, p.interesses, p.escolaridade, p.perfil_dominante,
           p.areas_sugeridas, p.areas_secundarias, u.idade, u.estado, u.cidade
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id = $1
  `, [userId]);
  return result.rows[0] || {};
}

async function listar(userId, filtros = {}) {
  const paginaSolicitada = normalizarPaginacao(filtros.pagina, 1);
  const limite = Math.min(normalizarPaginacao(filtros.limite, LIMITE_PADRAO), LIMITE_MAXIMO);
  const ordenacao = normalizarOrdenacao(filtros.ordenar);
  const { where, valores } = montarFiltros(filtros);

  const [ops, perfil] = await Promise.all([
    pool.query(`SELECT * FROM opportunities WHERE ${where}`, valores),
    buscarPerfil(userId),
  ]);

  const oportunidades = ops.rows.map((op) => ({
    ...op,
    ...calcularMatch(op, perfil),
  }));

  oportunidades.sort((a, b) => {
    if (ordenacao === 'recentes') {
      const dataA = new Date(a.created_at).getTime();
      const dataB = new Date(b.created_at).getTime();
      return dataB - dataA || b.matchPercent - a.matchPercent;
    }

    return b.matchPercent - a.matchPercent
      || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const total = oportunidades.length;
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const pagina = Math.min(paginaSolicitada, totalPaginas);
  const inicio = (pagina - 1) * limite;
  const data = oportunidades.slice(inicio, inicio + limite);

  return {
    data,
    pagination: {
      pagina,
      limite,
      total,
      totalPaginas,
      ordenar: ordenacao,
    },
  };
}

async function listarFiltros() {
  const result = await pool.query(`
    SELECT
      ARRAY(
        SELECT DISTINCT interesse
          FROM opportunities
         WHERE status = 'publicada'
           AND interesse IS NOT NULL
           AND BTRIM(interesse) <> ''
         ORDER BY interesse
      ) AS interesses,
      ARRAY(
        SELECT DISTINCT estado
          FROM opportunities
         WHERE status = 'publicada'
           AND estado IS NOT NULL
           AND BTRIM(estado) <> ''
         ORDER BY estado
      ) AS estados
  `);

  return {
    interesses: result.rows[0]?.interesses || [],
    estados: result.rows[0]?.estados || [],
  };
}

async function buscarPorId(userId, opportunityId) {
  const result = await pool.query(`
    SELECT *
      FROM opportunities
     WHERE id = $1
       AND status = 'publicada'
       AND (expires_at IS NULL OR expires_at > NOW())
  `, [opportunityId]);

  const oportunidade = result.rows[0];
  if (!oportunidade) {
    const err = new Error('Oportunidade não encontrada');
    err.status = 404;
    throw err;
  }

  const perfil = await buscarPerfil(userId);
  return { ...oportunidade, ...calcularMatch(oportunidade, perfil) };
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

module.exports = {
  listar,
  listarFiltros,
  buscarPorId,
  criar,
  remover,
  fecharLacuna,
  calcularMatch,
  montarFiltros,
  areaAtendida,
  normalizarHabilidade,
  similaridadeHabilidade,
  similaridadeArea,
  requisitosComPeso,
  localCompativel,
};