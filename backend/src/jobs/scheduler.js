const env = require('../config/env');
const { executarRotinaDeLembretes } = require('../modules/plans/plans.reminders');
const { sincronizarJobs } = require('../modules/opportunities/opportunities.collector');
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

  cron.schedule('0 8 * * *', async () => {
    try {
      await comLockDistribuido('lock:oportunidades', 10 * 60, async () => {
        const resultado = await sincronizarJobs();
        console.log('Sincronização automática de oportunidades executada:', resultado);
      });
    } catch (err) {
      console.error('Falha ao sincronizar oportunidades:', err.message);
    }
  });

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

  console.log('Agendador interno ativado: oportunidades às 8h e lembretes às 9h.');
}

module.exports = { iniciarAgendadorSeHabilitado };
