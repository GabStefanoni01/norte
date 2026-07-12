const env = require('../../config/env');
const { enviarEmail } = require('../mail/mail.service');

async function enviarMensagemContato({ nome, email, mensagem }) {
  if (!env.contactEmail) {
    const err = new Error('E-mail de contato não configurado no servidor.');
    err.status = 500;
    throw err;
  }

  await enviarEmail({
    para: env.contactEmail,
    assunto: `Contato pelo site — ${nome}`,
    texto: `De: ${nome} <${email}>\n\n${mensagem}`,
  });

  return { message: 'Mensagem enviada com sucesso. Responderemos em breve.' };
}

module.exports = { enviarMensagemContato };
