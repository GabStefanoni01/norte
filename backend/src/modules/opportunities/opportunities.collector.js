const env = require('../../config/env');
const pool = require('../../database/pool');

const JOBSPIPE_URL = 'https://api.jobspipe.dev/v1/jobs/search';
const JOBSPIPE_SOURCE = 'jobspipe';
const DIAS_MAXIMOS = 7;
const LIMITE = 25;

const TITULOS = [
  'software engineer',
  'backend engineer',
  'frontend developer',
  'full stack developer',
  'software developer',
  'web developer',
  'data analyst',
  'qa engineer',
];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
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

  return {
    externalId: String(job.id),
    titulo: texto(job.job_title),
    empresa: texto(job.company) || null,
    categoria: texto(job.job_function) || 'Tecnologia',
    tipo: 'vaga',
    descricao: texto(job.description) || null,
    interesse: texto(job.job_function) || null,
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
      salary_string: job.salary_string ?? null,
      expires_at: job.expires_at ?? null,
      source: job.sources ?? [],
    },
  };
}

async function buscarJobsPipe() {
  if (!env.jobsPipeApiKey) {
    console.warn('Sincronização de oportunidades ignorada: JOBSPIPE_API_KEY não configurada.');
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(JOBSPIPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.jobsPipeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_title_or: TITULOS,
        job_country_code_or: ['BR'],
        posted_at_max_age_days: DIAS_MAXIMOS,
        limit: LIMITE,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detalhe = await response.text();
      throw new Error(`JobsPipe respondeu ${response.status}: ${detalhe.slice(0, 300)}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  } finally {
    clearTimeout(timeout);
  }
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
  const jobs = await buscarJobsPipe();
  let inseridas = 0;
  let atualizadas = 0;
  let ignoradas = 0;

  for (const job of jobs) {
    const oportunidade = mapearJob(job);
    if (!oportunidade) {
      ignoradas += 1;
      continue;
    }

    if (await salvarOportunidade(oportunidade)) inseridas += 1;
    else atualizadas += 1;
  }

  const expiradas = await expirarStaleJobs();

  return {
    fonte: JOBSPIPE_SOURCE,
    encontrados: jobs.length,
    inseridas,
    atualizadas,
    ignoradas,
    expiradas,
  };
}

module.exports = {
  mapearJob,
  sincronizarJobs,
};
