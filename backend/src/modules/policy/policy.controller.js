const policyService = require('./policy.service');
const { VERSAO_ATUAL_TERMOS } = require('./policy.data');
const { emailValido } = require('../../utils/validators');

async function responder(req, res, next) {
  try {
    const { email, token, aceito } = req.body;
    if (!emailValido(email)) return res.status(400).json({ error: 'E-mail inválido.' });
    if (typeof token !== 'string' || token.length < 32) return res.status(400).json({ error: 'Token inválido.' });
    if (typeof aceito !== 'boolean') return res.status(400).json({ error: 'Campo "aceito" precisa ser true ou false.' });

    const result = await policyService.processarResposta({ email, token, aceito });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function meuStatus(req, res, next) {
  try {
    const consentimentoValido = await policyService.usuarioTemConsentimentoValido(req.user.sub);
    res.json({ consentimentoValido, versaoAtual: VERSAO_ATUAL_TERMOS });
  } catch (err) {
    next(err);
  }
}

module.exports = { responder, meuStatus };
