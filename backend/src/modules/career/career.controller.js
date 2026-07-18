const careerService = require('./career.service');

async function listar(req, res, next) {
  try {
    const carreiras = await careerService.listarCarreiras();
    res.json(carreiras);
  } catch (err) {
    next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const carreira = await careerService.buscarCarreiraPorId(req.params.id);
    res.json(carreira);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, buscarPorId };
