const { randomUUID } = require('crypto');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

const SLOW_REQUEST_THRESHOLD_MS = 1000;

function requestContext(req, res, next) {
  const recebido = req.get('x-request-id');
  const requestId = typeof recebido === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(recebido) ? recebido : randomUUID();
  const inicio = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - inicio) / 1e6;
    const duration = Number(durationMs.toFixed(2));
    const slow = duration >= SLOW_REQUEST_THRESHOLD_MS;

    metrics.registrarRequest({
      statusCode: res.statusCode,
      durationMs: duration,
      slow,
    });

    const dados = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    };

    logger.info('http.request.completed', dados);

    if (slow) {
      logger.warn('http.request.slow', {
        ...dados,
        thresholdMs: SLOW_REQUEST_THRESHOLD_MS,
      });
    }
  });

  next();
}

module.exports = requestContext;
