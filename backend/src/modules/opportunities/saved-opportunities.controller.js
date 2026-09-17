const savedService = require('./saved-opportunities.service');

async function listar(req, res, next) {
  try {
    res.json(await savedService.listar(req.user.sub));
  } catch (err) { next(err); }
}

async function verificar(req, res, next) {
  try {
    res.json({ salvo: await savedService.verificar(req.user.sub, req.params.id) });
  } catch (err) { next(err); }
}

async function salvar(req, res, next) {
  try {
    res.status(201).json(await savedService.salvar(req.user.sub, req.params.id));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const removido = await savedService.remover(req.user.sub, req.params.id);
    if (!removido) return res.status(404).json({ error: 'Oportunidade não está salva' });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, verificar, salvar, remover };
