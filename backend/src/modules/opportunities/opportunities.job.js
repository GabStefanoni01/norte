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

async function executarSincronizacao() {
  const inicio = new Date();
  await atualizarEstado({
    status: 'running',
    inicio_ultima_execucao: inicio,
    fim_ultima_execucao: null,
    ultima_falha_em: null,
    ultima_falha_mensagem: null,
  });

  const maxTentativas = env.opportunityJobMaxRetries + 1;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
    try {
      const resultado = await sincronizarJobs();

      await atualizarEstado({
        status: 'success',
        fim_ultima_execucao: new Date(),
        ultima_execucao_sucesso: new Date(),
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
        });

        logger.error('opportunities.collector.failed', err, {
          tentativa,
          tentativasTotais: maxTentativas,
        });

        throw err;
      }

      const delayMs = calcularDelay(tentativa);

      logger.warn('opportunities.collector.retry', {
        tentativa,
        proximaTentativa: tentativa + 1,
        tentativasTotais: maxTentativas,
        delayMs,
        reason: err.code || err.status || err.message,
      });

      await esperar(delayMs);
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

module.exports = {
  dispararSincronizacao,
  executarSincronizacao,
  atualizarEstado,
  erroEhRetentavel,
  calcularDelay,
};
