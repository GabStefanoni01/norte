const resumeService = require('./resume.service');

async function gerar(req, res, next) {
  try {
    const curriculo = await resumeService.gerarCurriculo(req.user.sub);
    res.status(201).json(curriculo);
  } catch (err) {
    next(err);
  }
}

async function buscarAtual(req, res, next) {
  try {
    const curriculo = await resumeService.buscarCurriculoAtual(req.user.sub);
    if (!curriculo) return res.status(404).json({ error: 'Você ainda não gerou um currículo.' });
    res.json(curriculo);
  } catch (err) {
    next(err);
  }
}

async function listarPerguntas(req, res, next) {
  try {
    const perguntas = await resumeService.listarPerguntasEntrevista(req.user.sub);
    res.json(perguntas);
  } catch (err) {
    next(err);
  }
}

async function enviarRespostas(req, res, next) {
  try {
    const sessao = await resumeService.enviarRespostasEntrevista(req.user.sub, req.body.respostas);
    res.json(sessao);
  } catch (err) {
    next(err);
  }
}

async function buscarUltimaEntrevista(req, res, next) {
  try {
    const sessao = await resumeService.buscarUltimaEntrevista(req.user.sub);
    if (!sessao) return res.status(404).json({ error: 'Você ainda não fez nenhuma simulação de entrevista.' });
    res.json(sessao);
  } catch (err) {
    next(err);
  }
}

module.exports = { gerar, buscarAtual, listarPerguntas, enviarRespostas, buscarUltimaEntrevista };
