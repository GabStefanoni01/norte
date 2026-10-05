const app = require('./app');
const env = require('./config/env');
const { iniciarScheduler } = require('./jobs/scheduler');

app.listen(env.port, () => {
  console.log(`Norte API rodando na porta ${env.port}`);

  if (env.smtp.host) {
    console.log(`SMTP configurado: host=${env.smtp.host} porta=${env.smtp.port} from="${env.smtp.from}"`);
  } else {
    console.log(
      'SMTP não configurado (SMTP_HOST vazio) — o envio de e-mails está desabilitado. ' +
        'Para habilitar, configure SMTP_HOST, SMTP_PORT, SMTP_FROM e, quando necessário, SMTP_USER/SMTP_PASS no backend/.env.'
    );
  }

  iniciarScheduler();
});
