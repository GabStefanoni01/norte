const aiService = require('./ai.service');

async function chat(req, res, next) {
  try {
    const result = await aiService.chat(req.user.sub, req.body.mensagem);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const messages = await aiService.history(req.user.sub, req.query.limit);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, history };
