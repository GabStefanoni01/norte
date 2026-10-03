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
async function enviarEmail({ para, assunto, texto, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    const err = new Error('SMTP não configurado. Defina SMTP_HOST antes de disparar e-mails.');
    err.code = 'SMTP_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to: para,
      subject: assunto,
      text: texto,
      ...(html ? { html } : {}),
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

async function statusSMTP() {
  if (!env.smtp.host) {
    return {
      configurado: false,
      status: 'unavailable',
      mensagem: 'SMTP não configurado.',
      hostConfigurado: false,
      autenticacaoConfigurada: Boolean(env.smtp.user && env.smtp.pass),
      remetente: env.smtp.from,
      porta: env.smtp.port,
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return {
      configurado: true,
      status: 'ok',
      mensagem: 'Conexão SMTP verificada com sucesso.',
      hostConfigurado: true,
      autenticacaoConfigurada: Boolean(env.smtp.user && env.smtp.pass),
      remetente: env.smtp.from,
      porta: env.smtp.port,
    };
  } catch (err) {
    return {
      configurado: true,
      status: 'error',
      mensagem: String(err.message || err).slice(0, 300),
      hostConfigurado: true,
      autenticacaoConfigurada: Boolean(env.smtp.user && env.smtp.pass),
      remetente: env.smtp.from,
      porta: env.smtp.port,
    };
  }
}

module.exports = { enviarEmail, statusSMTP };
