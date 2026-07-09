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

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to: para,
      subject: assunto,
      text: texto,
    });
  } catch (err) {
    // Loga o motivo real (ex: remetente não verificado no provedor) em vez
    // de deixar o erro genérico do nodemailer se perder no meio do log.
    console.error('Falha ao enviar e-mail via SMTP:', err.message);
    console.error(
      'Dica: se o provedor for a Brevo, confira se SMTP_FROM usa um remetente ' +
        'verificado no painel (Senders) — o login SMTP não pode ser usado como From.'
    );
    throw err;
  }
}

module.exports = { enviarEmail };
