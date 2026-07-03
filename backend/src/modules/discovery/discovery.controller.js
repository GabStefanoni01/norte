const discoveryService = require('./discovery.service');

function listarPerguntas(req, res) {
  res.json(discoveryService.listarPerguntas());
}

async function enviarRespostas(req, res, next) {
  try {
    const resultado = discoveryService.calcularResultado(req.body.respostas);
    const perfilAtualizado = await discoveryService.salvarResultado(req.user.sub, resultado);
    res.json({
      perfilDominante: resultado.perfilDominante,
      descricao: resultado.descricao,
      areasSugeridas: resultado.areasSugeridas,
      perfil: perfilAtualizado,
    });
  } catch (err) {
    next(err);
  }
}

async function buscarResultado(req, res, next) {
  try {
    const resultado = await discoveryService.buscarResultado(req.user.sub);
    if (!resultado) {
      return res.status(404).json({ error: 'Você ainda não fez o teste de descoberta.' });
    }
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPerguntas, enviarRespostas, buscarResultado };
