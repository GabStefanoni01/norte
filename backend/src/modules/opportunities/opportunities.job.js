const pool = require('../../database/pool');
const logger = require('../../utils/logger');
const env = require('../../config/env');
const { acquireLock, releaseLock } = require('../../database/redis');
const { sincronizarJobs } = require('./opportunities.collector');

const SOURCE = 'jobspipe';
const LOCK_KEY = 'lock:oportunidades';
const LOCK_TTL_SECONDS = 10 * 60;

function erroEhRetentavel(err) {
  if (!err) return false;
  if (err.code === 'EXTERNAL_TIMEOUT') return true;
  if (err.code === 'CIRCUIT_OPEN' || err.code === 'CIRCUIT_HALF_OPEN') return true;
  if (err.name === 'TypeError') return true;

  const status = Number(err.status);
  return status === 429 || status >= 500;
}

function calcularDelay(attempt) {
  return env.opportunityJobRetryBaseDelayMs * (2 ** (attempt - 1));
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function obterEstado() {
  const result = await pool.query(
    'SELECT * FROM opportunity_collector_state WHERE chave = $1',
    [SOURCE]
  );
  return result.rows[0] || null;
}

async function executarSincronizacao({ tentativaInicial = 1 } = {}) {
  const inicio = new Date();
  await atualizarEstado({
    status: 'running',
    inicio_ultima_execucao: inicio,
    fim_ultima_execucao: null,
    ultima_falha_em: null,
    ultima_falha_mensagem: null,
    tentativas: tentativaInicial - 1,
    proxima_tentativa_em: null,
  });

  const maxTentativas = env.opportunityJobMaxRetries + 1;

  for (let tentativa = tentativaInicial; tentativa <= maxTentativas; tentativa += 1) {
    try {
      const resultado = await sincronizarJobs();

      await atualizarEstado({
        status: 'success',
        fim_ultima_execucao: new Date(),
        ultima_execucao_sucesso: new Date(),
        tentativas: tentativa,
        proxima_tentativa_em: null,
      });

      logger.info('opportunities.collector.completed', {
        resultado,
        tentativa,
        tentativasTotais: maxTentativas,
      });

      return resultado;
    } catch (err) {
      const podeTentarNovamente = tentativa < maxTentativas && erroEhRetentavel(err);

      if (!podeTentarNovamente) {
        await atualizarEstado({
          status: 'failed',
          fim_ultima_execucao: new Date(),
          ultima_falha_em: new Date(),
          ultima_falha_mensagem: String(err.message || err).slice(0, 500),
          tentativas: tentativa,
          proxima_tentativa_em: null,
        });

        logger.error('opportunities.collector.failed', err, {
          tentativa,
          tentativasTotais: maxTentativas,
        });

        throw err;
      }

      const delayMs = calcularDelay(tentativa);
      const proximaTentativa = new Date(Date.now() + delayMs);

      await atualizarEstado({
        status: 'failed',
        ultima_falha_em: new Date(),
        ultima_falha_mensagem: String(err.message || err).slice(0, 500),
        tentativas: tentativa,
        proxima_tentativa_em: proximaTentativa,
      });

      logger.warn('opportunities.collector.retry', {
        tentativa,
        proximaTentativa: tentativa + 1,
        tentativasTotais: maxTentativas,
        delayMs,
        proximaTentativaEm: proximaTentativa.toISOString(),
        reason: err.code || err.status || err.message,
      });

      await esperar(delayMs);

      await atualizarEstado({
        status: 'running',
        proxima_tentativa_em: null,
      });
    }
  }

  throw new Error('Sincronização de oportunidades encerrada sem resultado');
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

async function retomarSincronizacaoPendente() {
  const estado = await obterEstado();

  if (!estado) return { status: 'nothing_to_resume' };

  const pendentePorRetry =
    estado.status === 'failed' &&
    estado.proxima_tentativa_em &&
    new Date(estado.proxima_tentativa_em) <= new Date() &&
    Number(estado.tentativas) < env.opportunityJobMaxRetries + 1;

  const travadaPorReinicio = estado.status === 'running';

  if (!pendentePorRetry && !travadaPorReinicio) {
    return { status: 'nothing_to_resume' };
  }

  const tentativaInicial = travadaPorReinicio
    ? Math.min(Number(estado.tentativas || 0) + 1, env.opportunityJobMaxRetries + 1)
    : Number(estado.tentativas || 0) + 1;

  const lock = await acquireLock(LOCK_KEY, LOCK_TTL_SECONDS);
  if (!lock) return { status: 'already_running' };

  setImmediate(() => {
    executarSincronizacao({ tentativaInicial })
      .catch(() => {})
      .finally(async () => {
        await releaseLock(LOCK_KEY, lock);
      });
  });

  logger.warn('opportunities.collector.resumed', {
    reason: travadaPorReinicio ? 'process_restart' : 'scheduled_retry',
    tentativaInicial,
  });

  return { status: 'queued', reason: travadaPorReinicio ? 'process_restart' : 'scheduled_retry' };
}

module.exports = {
  dispararSincronizacao,
  executarSincronizacao,
  atualizarEstado,
  obterEstado,
  retomarSincronizacaoPendente,
  erroEhRetentavel,
  calcularDelay,
};
