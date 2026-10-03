const logger = require('./logger');

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deveTentarNovamente(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchResiliente(url, options = {}, config = {}) {
  const timeoutMs = config.timeoutMs ?? 20_000;
  const maxRetries = config.maxRetries ?? 2;
  const baseDelayMs = config.baseDelayMs ?? 500;
  const evento = config.evento || 'http.external_request';

  for (let tentativa = 0; tentativa <= maxRetries; tentativa += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (response.ok || !deveTentarNovamente(response.status) || tentativa === maxRetries) {
        return response;
      }

      const delayMs = baseDelayMs * (2 ** tentativa);
      logger.warn('http.external_retry', {
        evento,
        url,
        statusCode: response.status,
        tentativa: tentativa + 1,
        maxRetries,
        delayMs,
      });
      await esperar(delayMs);
    } catch (err) {
      const timeout = err?.name === 'AbortError';

      if (tentativa === maxRetries) {
        if (timeout) {
          const erro = new Error(`Timeout ao acessar serviço externo após ${timeoutMs}ms`);
          erro.code = 'EXTERNAL_TIMEOUT';
          throw erro;
        }
        throw err;
      }

      const delayMs = baseDelayMs * (2 ** tentativa);
      logger.warn('http.external_retry', {
        evento,
        url,
        tentativa: tentativa + 1,
        maxRetries,
        delayMs,
        reason: timeout ? 'timeout' : err?.code || err?.name || 'network_error',
      });
      await esperar(delayMs);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Falha inesperada na requisição externa');
}

module.exports = { fetchResiliente, deveTentarNovamente };
