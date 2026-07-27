const billingService = require('./billing.service');

async function assinar(req, res, next) {
  try {
    const result = await billingService.criarAssinatura(req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function cancelar(req, res, next) {
  try {
    const result = await billingService.cancelarAssinatura(req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function status(req, res, next) {
  try {
    const result = await billingService.buscarStatus(req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    // Responde 200 rápido — o Mercado Pago espera confirmação rápida e
    // reenvia se não receber; processar em segundo plano evita timeout.
    res.status(200).send('ok');
    await billingService.processarWebhook(req.body).catch((err) =>
      console.error('Erro ao processar webhook do Mercado Pago:', err.message)
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { assinar, cancelar, status, webhook };
