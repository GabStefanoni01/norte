const service = require('./institutions.service');

async function criar(req, res, next) {
  try {
    const institution = await service.criar({ ...req.body, userId: req.user.sub });
    res.status(201).json(institution);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    res.json(await service.listarDoUsuario(req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function listarParticipantes(req, res, next) {
  try {
    res.json(await service.listarParticipantes(Number(req.params.id), req.user.sub));
  } catch (err) {
    next(err);
  }
}

async function atualizarMembro(req, res, next) {
  try {
    const result = await service.atualizarMembro(
      Number(req.params.id),
      Number(req.params.memberId),
      req.body.role,
      req.body.status,
      req.user.sub,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, listarParticipantes, atualizarMembro };
