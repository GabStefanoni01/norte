const service = require('./institutions.service');

async function criar(req, res, next) {
  try {
    const institution = await service.criar({ ...req.body, userId: req.user.sub });
    res.status(201).json(institution);
  } catch (err) {
    next(err);
  }
}

async function criarConvite(req, res, next) {
  try {
    res.status(201).json(await service.criarConvite({
      institutionId: Number(req.params.id),
      email: req.body.email,
      role: req.body.role,
      userId: req.user.sub,
    }));
  } catch (err) {
    next(err);
  }
}

async function aceitarConvite(req, res, next) {
  try {
    res.json(await service.aceitarConvite({
      token: req.body.token,
      userId: req.user.sub,
      email: req.user.email,
    }));
  } catch (err) {
    next(err);
  }
}

async function dashboard(req, res, next) {
  try { res.json(await service.dashboard(Number(req.params.id), req.user.sub)); } catch (err) { next(err); }
}

async function criarTrilha(req, res, next) {
  try {
    res.status(201).json(await service.criarTrilha({
      institutionId: Number(req.params.id), titulo: req.body.titulo,
      descricao: req.body.descricao, userId: req.user.sub,
    }));
  } catch (err) { next(err); }
}

async function listarTrilhas(req, res, next) {
  try { res.json(await service.listarTrilhas(Number(req.params.id), req.user.sub)); } catch (err) { next(err); }
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

async function listarTrilhaMembros(req, res, next) {
  try { res.json(await service.listarTrilhaMembros(Number(req.params.id), Number(req.params.trailId), req.user.sub)); } catch (err) { next(err); }
}
async function atribuirParticipanteTrilha(req, res, next) {
  try {
    res.status(201).json(await service.atribuirParticipanteTrilha({
      institutionId: Number(req.params.id),
      trailId: Number(req.params.trailId),
      participanteId: Number(req.body.participanteId),
      requesterId: req.user.sub,
    }));
  } catch (err) { next(err); }
}
async function minhasJornadas(req, res, next) {
  try { res.json(await service.minhasJornadas(Number(req.params.id), req.user.sub)); } catch (err) { next(err); }
}
async function atualizarProgressoTrilha(req, res, next) {
  try {
    res.json(await service.atualizarProgressoTrilha({
      institutionId: Number(req.params.id),
      trailId: Number(req.params.trailId),
      userId: Number(req.body.userId || req.user.sub),
      status: req.body.status,
      progresso: req.body.progresso,
      requesterId: req.user.sub,
    }));
  } catch (err) { next(err); }
}
module.exports = { criar, criarConvite, aceitarConvite, dashboard, criarTrilha, listarTrilhas, listar, listarParticipantes, atualizarMembro, listarTrilhaMembros, atribuirParticipanteTrilha, minhasJornadas, atualizarProgressoTrilha };
