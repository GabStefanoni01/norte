const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const VALORES_JWT_SECRET_INSEGUROS = ['change-me', 'changeme', 'secret', '123456', ''];

function validarJwtSecret() {
  const valor = process.env.JWT_SECRET;
  const inseguro = !valor || VALORES_JWT_SECRET_INSEGUROS.includes(valor.toLowerCase());

  if (!inseguro) {
    if (valor.length < 32) {
      console.warn(
        'Aviso: JWT_SECRET tem menos de 32 caracteres. Recomendado usar um valor mais longo e aleatório.'
      );
    }
    return;
  }

  // Em teste (jest define NODE_ENV=test automaticamente), não derruba o
  // processo — só avisa, pra suíte rodar sem precisar de um .env real.
  if (process.env.NODE_ENV === 'test') {
    console.warn('Aviso: JWT_SECRET inseguro/ausente (tolerado apenas em ambiente de teste).');
    return;
  }

  console.error(
    '\nERRO FATAL: JWT_SECRET não está definido ou está usando um valor padrão inseguro ' +
      '(ex: "change-me"). Qualquer pessoa poderia forjar tokens de login, inclusive de admin.\n' +
      'Gere um valor aleatório forte, por exemplo rodando:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n' +
      'e coloque o resultado em JWT_SECRET no seu .env.\n'
  );
  process.exit(1);
}

validarJwtSecret();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
  frontendUrl: process.env.FRONTEND_URL,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Norte <no-reply@norte.app>',
  },
  enableCron: process.env.ENABLE_CRON === 'true',
};
