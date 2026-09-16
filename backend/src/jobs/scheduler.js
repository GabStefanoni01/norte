const env = require('../config/env');
const { executarRotinaDeLembretes } = require('../modules/plans/plans.reminders');
const { obterCliente } = require('../config/redis');

async function comLockDistribuido(chave, ttlSegundos, tarefa) {
  const client = obterCliente();
  if (!client) { await tarefa(); return; }

  const adquirido = await client.set(chave, '1', { NX: true, EX: ttlSegundos });
  if (!adquirido) {
    console.log(`Lock "${chave}" já está com outra instância — pulando este ciclo.`);
    return;
  }
  await tarefa();
}

function iniciarAgendadorSeHabilitado() {
  if (!env.enableCron) return;
  const cron = require('node-cron');

  cron.schedule('0 9 * * *', async () => {
    try {
      await comLockDistribuido('lock:lembretes', 5 * 60, async () => {
        const resultado = await executarRotinaDeLembretes();
        console.log('Rotina de lembretes executada:', resultado);
      });
    } catch (err) {
      console.error('Falha ao executar rotina de lembretes:', err.message);
    }
  });

  console.log('Agendador interno de lembretes ativado (todo dia às 9h).');
}

module.exports = { iniciarAgendadorSeHabilitado };
