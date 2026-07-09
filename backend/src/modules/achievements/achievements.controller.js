const achievementsService = require('./achievements.service');

async function buscarMinhas(req, res, next) {
  try {
    const resultado = await achievementsService.listarConquistas(req.user.sub);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { buscarMinhas };
