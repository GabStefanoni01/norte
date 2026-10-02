const pool = require('../../database/pool');
const logger = require('../../utils/logger');
const { acquireLock, releaseLock } = require('../../database/redis');
const { sincronizarJobs } = require('./opportunities.collector');

const SOURCE = 'jobspipe';
const LOCK_KEY = 'lock:oportunidades';
const LOCK_TTL_SECONDS = 10 * 60;

async function atualizarEstado(patch) {
  const campos = Object.keys(patch);
  const valores = Object.values(patch);
  const assignments = campos.map((campo, index) => `${campo} = $${index + 2}`).join(', ');

  await pool.query(`
    INSERT INTO opportunity_collector_state (chave, ${campos.join(', ')}, updated_at)
    VALUES ($1, ${valores.map((_, index) => '$' + (index + 2)).join(', ')}, NOW())
    ON CONFLICT (chave) DO UPDATE SET
      ${assignments},
      updated_at = NOW()
  `, [SOURCE, ...valores]);
}

async function executarSincronizacao() {
  const inicio = new Date();
  await atualizarEstado({
    status: 'running',
    inicio_ultima_execucao: inicio,
    fim_ultima_execucao: null,
    ultima_falha_em: null,
    ultima_falha_mensagem: null,
  });

  try {
    const resultado = await sincronizarJobs();
    await atualizarEstado({
      status: 'success',
      fim_ultima_execucao: new Date(),
      ultima_execucao_sucesso: new Date(),
    });
    logger.info('opportunities.collector.completed', { resultado });
    return resultado;
  } catch (err) {
    await atualizarEstado({
      status: 'failed',
      fim_ultima_execucao: new Date(),
      ultima_falha_em: new Date(),
      ultima_falha_mensagem: String(err.message || err).slice(0, 500),
    });
    logger.error('opportunities.collector.failed', err);
    throw err;
  }
}

async function dispararSincronizacao() {
  const lock = await acquireLock(LOCK_KEY, LOCK_TTL_SECONDS);
  if (!lock) {
    return { status: 'already_running' };
  }

  setImmediate(() => {
    executarSincronizacao()
      .catch(() => {})
      .finally(async () => {
        await releaseLock(LOCK_KEY, lock);
      });
  });

  return { status: 'queued' };
}

module.exports = { dispararSincronizacao, executarSincronizacao, atualizarEstado };
