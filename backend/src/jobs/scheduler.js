const cron = require('node-cron');
const env = require('../config/env');
const { dispararSincronizacao } = require('../modules/opportunities/opportunities.job');

function sincronizarOportunidades() {
  return dispararSincronizacao().then((resultado) => {
    console.log('[scheduler] sincronização de oportunidades', resultado);
    return resultado;
  });
}

function iniciarScheduler() {
  if (!env.enableCron) {
    console.log('[scheduler] cron desabilitado');
    return;
  }

  cron.schedule('0 8 * * *', sincronizarOportunidades);

  // O disparo não bloqueia o startup da API. O job é executado em background
  // e o lock distribuído impede execuções concorrentes entre instâncias.
  sincronizarOportunidades().catch((err) => {
    console.error('[scheduler] erro ao disparar sincronização:', err.message);
  });

  console.log('[scheduler] cron habilitado: oportunidades às 8h');
}

module.exports = { iniciarScheduler, sincronizarOportunidades };
