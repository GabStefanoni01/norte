const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`Norte API rodando na porta ${env.port}`);

  if (env.smtp.host) {
    console.log(`SMTP configurado: host=${env.smtp.host} porta=${env.smtp.port} from="${env.smtp.from}"`);
  } else {
    console.log(
      'SMTP não configurado (SMTP_HOST vazio) — códigos vão aparecer no console em vez de serem enviados por e-mail. ' +
        'Se você já configurou o .env e ainda vê esta mensagem, confira: (1) o arquivo é backend/.env, ' +
        '(2) o backend foi reiniciado depois da edição, (3) não há aspas/espaços extras nas variáveis.'
    );
  }
});
