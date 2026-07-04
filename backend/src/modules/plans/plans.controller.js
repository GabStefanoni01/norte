const plansService = require('./plans.service');

async function gerar(req, res, next) {
  try {
    const plano = await plansService.gerarPlano(req.user.sub);
    res.status(201).json(plano);
  } catch (err) {
    next(err);
  }
}

async function buscarAtual(req, res, next) {
  try {
    const plano = await plansService.buscarPlanoAtual(req.user.sub);
    if (!plano) return res.status(404).json({ error: 'Você ainda não tem um plano de evolução.' });
    res.json(plano);
  } catch (err) {
    next(err);
  }
}

async function atualizarItem(req, res, next) {
  try {
    const plano = await plansService.atualizarStatusItem(
      req.user.sub,
      req.params.planId,
      req.params.itemId,
      req.body.status
    );
    res.json(plano);
  } catch (err) {
    next(err);
  }
}

module.exports = { gerar, buscarAtual, atualizarItem };
