const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

function requestContext(req, res, next) {
  const recebido = req.get('x-request-id');
  const requestId = typeof recebido === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(recebido) ? recebido : randomUUID();
  const inicio = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - inicio) / 1e6;
    logger.info('http.request.completed', { requestId, method: req.method, path: req.path, statusCode: res.statusCode, durationMs: Number(durationMs.toFixed(2)) });
  });
  next();
}

module.exports = requestContext;
