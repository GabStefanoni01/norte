const opportunitiesService = require('./opportunities.service');
const { consumirCota } = require('../limits/limits.service');

async function listar(req, res, next) {
  try { res.json(await opportunitiesService.listar(req.user.sub, req.query)); } catch (err) { next(err); }
}
async function criar(req, res, next) {
  try { res.status(201).json(await opportunitiesService.criar(req.body)); } catch (err) { next(err); }
}
async function remover(req, res, next) {
  try {
    const removida = await opportunitiesService.remover(req.params.id);
    if (!removida) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.status(204).send();
  } catch (err) { next(err); }
}
async function fecharLacuna(req, res, next) {
  try {
    await consumirCota(req.user.sub, 'match_detalhado');
    res.json(await opportunitiesService.fecharLacuna(req.user.sub, req.params.id));
  } catch (err) { next(err); }
}

module.exports = { listar, criar, remover, fecharLacuna };
