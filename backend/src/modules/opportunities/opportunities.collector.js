const env = require('../../config/env');
const pool = require('../../database/pool');

const JOBSPIPE_URL = 'https://api.jobspipe.dev/v1/jobs/search';
const JOBSPIPE_SOURCE = 'jobspipe';
const DIAS_MAXIMOS = 7;
const LIMITE = 25;
const LIMITE_CONSULTAS = 40;
const MAX_PAGINAS = 4;
const DIAS_SINCRONIZACAO_COMPLETA = 7;
const INTERVALO_RETRY_MS = 750;

const CONSULTAS_GERAIS = [
  'estágio',
  'aprendiz',
  'assistente',
  'trainee',
];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizar(valor) {
  return texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function valoresDoCampo(valor) {
  if (Array.isArray(valor)) return valor;
  return texto(valor) ? [valor] : [];
}

function gerarConsultasDoPerfil(perfis) {
  const consultas = [...CONSULTAS_GERAIS];
  const vistos = new Set(consultas.map(normalizar));

  for (const perfil of perfis || []) {
    const valores = [
      ...valoresDoCampo(perfil.interesses),
      ...valoresDoCampo(perfil.areas_sugeridas),
      ...valoresDoCampo(perfil.areas_secundarias),
      perfil.perfil_dominante,
    ];

    for (const valor of valores) {
      const consulta = texto(valor);
      const chave = normalizar(consulta);
      if (!chave || chave.length < 2 || vistos.has(chave)) continue;
      vistos.add(chave);
      consultas.push(consulta);
      if (consultas.length >= LIMITE_CONSULTAS) return consultas;
    }
  }

  return consultas;
}

function requisitosDoJob(job) {
  return [...new Set([
    ...(Array.isArray(job.technology_slugs) ? job.technology_slugs : []),
    ...(Array.isArray(job.keyword_slugs) ? job.keyword_slugs : []),
  ].map(texto).filter(Boolean))].slice(0, 30);
}

function estadoDoJob(job) {
  const estado = texto(job.state_code).toUpperCase();
  return /^[A-Z]{2}$/.test(estado) ? estado : null;
}

function dataValida(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function mapearJob(job) {
  const link = texto(job.url || job.source_url);
  if (!texto(job.job_title) || !link || !texto(job.id)) return null;

  const categoria = texto(job.job_function)
    || texto(job.occupation_label)
    || texto(job.isic_division_label)
    || null;

  return {
    externalId: String(job.id),
    titulo: texto(job.job_title),
    empresa: texto(job.company) || null,
    categoria,
    tipo: 'vaga',
    descricao: texto(job.description) || null,
    interesse: categoria,
    estado: estadoDoJob(job),
    gratuito: false,
    requisitos: requisitosDoJob(job),
    link,
    sourceUrl: texto(job.source_url) || link,
    dataPublicacao: dataValida(job.date_posted),
    lastSeenAt: dataValida(job.last_seen_at) || new Date().toISOString(),
    dadosOrigem: {
      id: String(job.id),
      normalized_title: job.normalized_title ?? null,
      location: job.location ?? null,
      country_code: job.country_code ?? null,
      remote: job.remote ?? null,
      hybrid: job.hybrid ?? null,
      work_arrangement: job.work_arrangement ?? null,
      seniority: job.seniority ?? null,
      employment_statuses: job.employment_statuses ?? [],
      technology_slugs: job.technology_slugs ?? [],
      keyword_slugs: job.keyword_slugs ?? [],
      occupation_code: job.occupation_code ?? null,
      occupation_label: job.occupation_label ?? null,
      isic_division: job.isic_division ?? null,
      isic_division_label: job.isic_division_label ?? null,
      salary_string: job.salary_string ?? null,
      expires_at: job.expires_at ?? null,
      source: job.sources ?? [],
    },
  };
}

async function buscarPerfis() {
  const result = await pool.query(`
    SELECT p.interesses, p.areas_sugeridas, p.areas_secundarias, p.perfil_dominante
    FROM profiles p
    WHERE p.interesses IS NOT NULL
       OR p.areas_sugeridas IS NOT NULL
       OR p.areas_secundarias IS NOT NULL
       OR p.perfil_dominante IS NOT NULL
  `);
  return result.rows;
}

async function obterEstadoSincronizacao() {
  const result = await pool.query(`
    SELECT ultima_execucao_sucesso, ultima_sincronizacao_completa
    FROM opportunity_collector_state
    WHERE chave = $1
  `, [JOBSPIPE_SOURCE]);
  return result.rows[0] || {};
}

async function registrarSucessoSincronizacao({ completa }) {
  await pool.query(`
    INSERT INTO opportunity_collector_state
      (chave, ultima_execucao_sucesso, ultima_sincronizacao_completa, updated_at)
    VALUES ($1, NOW(), CASE WHEN $2 THEN NOW() ELSE NULL END, NOW())
    ON CONFLICT (chave)
    DO UPDATE SET
      ultima_execucao_sucesso = NOW(),
      ultima_sincronizacao_completa = CASE
        WHEN $2 THEN NOW()
        ELSE opportunity_collector_state.ultima_sincronizacao_completa
      END,
      updated_at = NOW()
  `, [JOBSPIPE_SOURCE, completa]);
}

function precisaSincronizacaoCompleta(estado) {
  if (!estado.ultima_sincronizacao_completa) return true;
  const ultima = new Date(estado.ultima_sincronizacao_completa).getTime();
  return Date.now() - ultima >= DIAS_SINCRONIZACAO_COMPLETA * 24 * 60 * 60 * 1000;
}

function dataParaJobsPipe(valor) {
  return new Date(valor).toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

async function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buscarPaginaJobsPipe(filtros, tentativa = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(JOBSPIPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.jobsPipeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filtros),
      signal: controller.signal,
    });

    if (response.status === 429 && tentativa < 2) {
      await aguardar(INTERVALO_RETRY_MS * (tentativa + 1));
      return buscarPaginaJobsPipe(filtros, tentativa + 1);
    }

    if (!response.ok) {
      const detalhe = await response.text();
      const erro = new Error(`JobsPipe respondeu ${response.status}: ${detalhe.slice(0, 300)}`);
      erro.status = response.status;
      throw erro;
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function buscarJobsPipe(consultas, estado) {
  if (!env.jobsPipeApiKey) {
    console.warn('Sincronização de oportunidades ignorada: JOBSPIPE_API_KEY não configurada.');
    return { jobs: [], paginas: 0, completa: false, ignorada: true };
  }

  const completa = precisaSincronizacaoCompleta(estado);
  const filtrosBase = {
    job_title_or: consultas,
    job_country_code_or: ['BR'],
    status: 'active',
    limit: LIMITE,
  };

  if (completa) {
    filtrosBase.posted_at_max_age_days = DIAS_MAXIMOS;
  } else if (estado.ultima_execucao_sucesso) {
    filtrosBase.discovered_at_gte = dataParaJobsPipe(estado.ultima_execucao_sucesso);
  } else {
    filtrosBase.posted_at_max_age_days = DIAS_MAXIMOS;
  }

  const jobs = [];
  let cursor = null;
  let paginas = 0;

  do {
    const filtros = cursor ? { ...filtrosBase, cursor } : filtrosBase;
    const payload = await buscarPaginaJobsPipe(filtros);
    const dados = Array.isArray(payload.data) ? payload.data : [];
    jobs.push(...dados);
    paginas += 1;
    cursor = texto(payload.metadata?.next_cursor) || null;
  } while (cursor && paginas < MAX_PAGINAS);

  return {
    jobs,
    paginas,
    completa,
    truncada: Boolean(cursor),
    ignorada: false,
  };
}

async function salvarOportunidade(oportunidade) {
  const result = await pool.query(`
    INSERT INTO opportunities
      (titulo, empresa, categoria, tipo, descricao, interesse, estado, gratuito,
       link, requisitos, fonte, status, external_id, last_seen_at, source_url,
       data_publicacao, dados_origem, expires_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'publicada',$12,$13,$14,$15,$16,$17,NOW())
    ON CONFLICT (fonte, external_id) WHERE external_id IS NOT NULL
    DO UPDATE SET
      titulo = EXCLUDED.titulo,
      empresa = EXCLUDED.empresa,
      categoria = EXCLUDED.categoria,
      descricao = EXCLUDED.descricao,
      interesse = EXCLUDED.interesse,
      estado = EXCLUDED.estado,
      gratuito = EXCLUDED.gratuito,
      link = EXCLUDED.link,
      requisitos = EXCLUDED.requisitos,
      status = 'publicada',
      last_seen_at = EXCLUDED.last_seen_at,
      source_url = EXCLUDED.source_url,
      data_publicacao = EXCLUDED.data_publicacao,
      dados_origem = EXCLUDED.dados_origem,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    RETURNING (xmax = 0) AS inserida
  `, [
    oportunidade.titulo,
    oportunidade.empresa,
    oportunidade.categoria,
    oportunidade.tipo,
    oportunidade.descricao,
    oportunidade.interesse,
    oportunidade.estado,
    oportunidade.gratuito,
    oportunidade.link,
    oportunidade.requisitos,
    JOBSPIPE_SOURCE,
    oportunidade.externalId,
    oportunidade.lastSeenAt,
    oportunidade.sourceUrl,
    oportunidade.dataPublicacao,
    JSON.stringify(oportunidade.dadosOrigem),
    dataValida(oportunidade.dadosOrigem.expires_at),
  ]);

  return Boolean(result.rows[0]?.inserida);
}

async function expirarStaleJobs() {
  const result = await pool.query(`
    UPDATE opportunities
       SET status = 'expirada', updated_at = NOW()
     WHERE fonte = $1
       AND status = 'publicada'
       AND external_id IS NOT NULL
       AND last_seen_at IS NOT NULL
       AND last_seen_at < NOW() - INTERVAL '14 days'
  `, [JOBSPIPE_SOURCE]);

  return result.rowCount;
}

async function sincronizarJobs() {
  const perfis = await buscarPerfis();
  const consultas = gerarConsultasDoPerfil(perfis);
  const estado = await obterEstadoSincronizacao();
  const resultadoBusca = await buscarJobsPipe(consultas, estado);

  if (resultadoBusca.ignorada) {
    return {
      fonte: JOBSPIPE_SOURCE,
      consultas,
      encontrados: 0,
      inseridas: 0,
      atualizadas: 0,
      ignoradas: 0,
      expiradas: 0,
      paginas: 0,
      truncada: false,
      modo: 'desabilitado',
    };
  }

  let inseridas = 0;
  let atualizadas = 0;
  let ignoradas = 0;

  for (const job of resultadoBusca.jobs) {
    const oportunidade = mapearJob(job);
    if (!oportunidade) {
      ignoradas += 1;
      continue;
    }

    if (await salvarOportunidade(oportunidade)) inseridas += 1;
    else atualizadas += 1;
  }

  const expiradas = await expirarStaleJobs();

  if (!resultadoBusca.truncada) {
    await registrarSucessoSincronizacao({ completa: resultadoBusca.completa });
  }

  return {
    fonte: JOBSPIPE_SOURCE,
    consultas,
    encontrados: resultadoBusca.jobs.length,
    inseridas,
    atualizadas,
    ignoradas,
    expiradas,
    paginas: resultadoBusca.paginas,
    truncada: resultadoBusca.truncada,
    modo: resultadoBusca.completa ? 'completo' : 'incremental',
  };
}

module.exports = {
  gerarConsultasDoPerfil,
  mapearJob,
  sincronizarJobs,
};
