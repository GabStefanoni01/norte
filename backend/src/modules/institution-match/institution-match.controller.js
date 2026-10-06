const service = require('./institution-match.service');

async function atualizarCriterios(req, res, next) {
  try {
    res.json(await service.atualizarCriterios({
      institutionId: Number(req.params.id),
      trailId: Number(req.params.trailId),
      criterios: req.body.criterios,
      userId: req.user.sub,
    }));
  } catch (err) {
    next(err);
  }
}

async function matchesParaUsuario(req, res, next) {
  try {
    res.json(await service.listarMatchesParaUsuario({
      institutionId: Number(req.params.id),
      userId: req.user.sub,
      limite: req.query.limite,
    }));
  } catch (err) {
    next(err);
  }
}

async function matchesDaTrilha(req, res, next) {
  try {
    res.json(await service.listarMatchesDaTrilha({
      institutionId: Number(req.params.id),
      trailId: Number(req.params.trailId),
      userId: req.user.sub,
      limite: req.query.limite,
    }));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  atualizarCriterios,
  matchesParaUsuario,
  matchesDaTrilha,
};
