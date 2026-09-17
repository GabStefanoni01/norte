const cron = require('node-cron');
const env = require('../config/env');
const { acquireLock, releaseLock } = require('../database/redis');
const { sincronizarJobs } = require('../modules/opportunities/opportunities.collector');
const { enviarLembretes } = require('./reminders');

const LOCK_TTL_SECONDS = 10 * 60;

async function executarComLock(lockKey, tarefa) {
  const lock = await acquireLock(lockKey, LOCK_TTL_SECONDS);
  if (!lock) {
    console.log(`[scheduler] tarefa ignorada: lock ${lockKey} já está em uso`);
    return;
  }

  try {
    await tarefa();
  } finally {
    await releaseLock(lockKey, lock);
  }
}

async function sincronizarOportunidades() {
  await executarComLock('lock:oportunidades', async () => {
    try {
      const resultado = await sincronizarJobs();
      console.log('[scheduler] sincronização de oportunidades concluída', resultado || {});
    } catch (err) {
      console.error('[scheduler] erro ao sincronizar oportunidades:', err.message);
    }
  });
}

function iniciarScheduler() {
  if (!env.enableCron) {
    console.log('[scheduler] cron desabilitado');
    return;
  }

  cron.schedule('0 8 * * *', sincronizarOportunidades);

  cron.schedule('0 9 * * *', () => executarComLock('lock:lembretes', async () => {
    await enviarLembretes();
  }));

  // Faz a primeira sincronização sem esperar o próximo horário do cron.
  // O lock impede que ela concorra com outra execução.
  sincronizarOportunidades();

  console.log('[scheduler] cron habilitado: oportunidades às 8h e lembretes às 9h');
}

module.exports = { iniciarScheduler, sincronizarOportunidades };
