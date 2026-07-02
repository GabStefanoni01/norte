const env = require('../../config/env');

let transporterPromise = null;

function getTransporter() {
  if (!env.smtp.host) return null;

  if (!transporterPromise) {
    // require aqui dentro para não quebrar o boot caso nodemailer ainda
    // não tenha sido instalado (ex: ambiente sem SMTP configurado).
    const nodemailer = require('nodemailer');
    transporterPromise = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }

  return transporterPromise;
}

/**
 * Envia um e-mail. Se SMTP_HOST não estiver configurado (ambiente de
 * desenvolvimento), apenas loga no console — assim o fluxo funciona sem
 * exigir configuração de e-mail real para testar localmente.
 */
async function enviarEmail({ para, assunto, texto }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log('--- [dev] E-mail não enviado (SMTP não configurado) ---');
    console.log(`Para: ${para}`);
    console.log(`Assunto: ${assunto}`);
    console.log(texto);
    console.log('--------------------------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: para,
    subject: assunto,
    text: texto,
  });
}

module.exports = { enviarEmail };
