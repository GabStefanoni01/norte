const service = require('./institution-interest.service');

async function criar(req, res, next) {
  try {
    const solicitacao = await service.criarSolicitacao(req.body);
    res.status(201).json({ mensagem: 'Solicitação recebida. Nossa equipe entrará em contato.', solicitacao });
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    res.json(await service.listarSolicitacoes({ status: req.query.status }));
  } catch (err) {
    next(err);
  }
}

async function obter(req, res, next) {
  try {
    res.json(await service.obterSolicitacao(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}

async function atualizarStatus(req, res, next) {
  try {
    res.json(await service.atualizarStatus(Number(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

async function aprovar(req, res, next) {
  try {
    res.status(201).json(await service.aprovarSolicitacao(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, obter, atualizarStatus, aprovar };
