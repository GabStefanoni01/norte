const opportunitiesService = require('./opportunities.service');

async function listar(req, res, next) {
  try {
    const oportunidades = await opportunitiesService.listar(req.query);
    res.json(oportunidades);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const oportunidade = await opportunitiesService.criar(req.body);
    res.status(201).json(oportunidade);
  } catch (err) {
    next(err);
  }
}

async function remover(req, res, next) {
  try {
    const removida = await opportunitiesService.remover(req.params.id);
    if (!removida) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, criar, remover };
