const env = require('../config/env');
const { executarRotinaDeLembretes } = require('../modules/plans/plans.reminders');

/**
 * Agendador interno opcional. Só faz sentido se o backend rodar como
 * processo contínuo (Railway, Docker, servidor tradicional) — em ambientes
 * serverless (ex: Vercel Functions), prefira um cron externo do provedor
 * chamando POST /admin/lembretes/enviar periodicamente, e deixe
 * ENABLE_CRON=false (ou nem defina).
 */
function iniciarAgendadorSeHabilitado() {
  if (!env.enableCron) return;

  // require aqui dentro para não exigir node-cron instalado em quem não usa.
  const cron = require('node-cron');

  // Todo dia às 9h (horário do servidor).
  cron.schedule('0 9 * * *', async () => {
    try {
      const resultado = await executarRotinaDeLembretes();
      console.log('Rotina de lembretes executada:', resultado);
    } catch (err) {
      console.error('Falha ao executar rotina de lembretes:', err.message);
    }
  });

  console.log('Agendador interno de lembretes ativado (todo dia às 9h).');
}

module.exports = { iniciarAgendadorSeHabilitado };
