const plansService = require('./plans.service');

async function get(req, res, next) {
  try {
    const plan = await plansService.getPlan(req.params.userId);
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const plan = await plansService.createPlan(req.user.sub, req.body.etapas);
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

async function updateProgress(req, res, next) {
  try {
    const plan = await plansService.updateProgress(req.params.id, req.body.progresso);
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

module.exports = { get, create, updateProgress };
