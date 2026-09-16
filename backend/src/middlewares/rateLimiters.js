const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { obterCliente } = require('../config/redis');

function respostaLimite(req, res) {
  res.status(429).json({ error: 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.' });
}

function storeCompartilhado(prefixo) {
  const client = obterCliente();
  if (!client) return undefined;
  return new RedisStore({ sendCommand: (...args) => client.sendCommand(args), prefix: `rl:${prefixo}:` });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false,
  store: storeCompartilhado('auth'), handler: respostaLimite,
});
const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false,
  store: storeCompartilhado('code'), handler: respostaLimite,
});
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.sub}` : req.ip),
  store: storeCompartilhado('ai'), handler: respostaLimite,
});

module.exports = { authLimiter, codeLimiter, aiLimiter };
