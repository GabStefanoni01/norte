const contactService = require('./contact.service');
const { emailValido, nomeValido } = require('../../utils/validators');

const MENSAGEM_MAX_LENGTH = 2000;

async function enviar(req, res, next) {
  try {
    const { nome, email, mensagem } = req.body;

    if (!nomeValido(nome)) {
      return res.status(400).json({ error: 'Nome inválido (mínimo 2 caracteres).' });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (typeof mensagem !== 'string' || mensagem.trim().length < 5) {
      return res.status(400).json({ error: 'Mensagem muito curta.' });
    }
    if (mensagem.length > MENSAGEM_MAX_LENGTH) {
      return res.status(400).json({ error: `Mensagem muito longa (máximo ${MENSAGEM_MAX_LENGTH} caracteres).` });
    }

    const result = await contactService.enviarMensagemContato({ nome, email, mensagem: mensagem.trim() });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { enviar };
