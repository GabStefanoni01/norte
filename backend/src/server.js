const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`Mentor Jovem IA API rodando na porta ${env.port}`);
});
