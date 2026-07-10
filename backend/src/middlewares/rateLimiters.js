const rateLimit = require('express-rate-limit');

function respostaLimite(req, res) {
  res.status(429).json({ error: 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.' });
}

/**
 * Login e cadastro: previne força bruta de senha e spam de contas.
 * Chave por IP, já que ainda não há usuário autenticado nesse ponto.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respostaLimite,
});

/**
 * Códigos de 6 dígitos (verificação de e-mail, redefinição de senha):
 * mais restritivo, porque o código tem só 1 milhão de combinações —
 * sem isso, seria possível tentar força bruta dentro da janela de
 * validade do código (15 minutos).
 */
const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respostaLimite,
});

/**
 * Endpoints que chamam a API de IA (custo real por chamada): limita por
 * usuário autenticado (não por IP), já que authGuard já rodou antes.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.sub}` : req.ip),
  handler: respostaLimite,
});

module.exports = { authLimiter, codeLimiter, aiLimiter };
