const cron = require('node-cron');
const env = require('../config/env');
const {
  dispararSincronizacao,
  retomarSincronizacaoPendente,
} = require('../modules/opportunities/opportunities.job');

function sincronizarOportunidades() {
  return dispararSincronizacao().then((resultado) => {
    console.log('[scheduler] sincronização de oportunidades', resultado);
    return resultado;
  });
}

async function recuperarSincronizacaoPendente() {
  try {
    const resultado = await retomarSincronizacaoPendente();
    console.log('[scheduler] recuperação de sincronização', resultado);
    return resultado;
  } catch (err) {
    console.error('[scheduler] erro ao recuperar sincronização:', err.message);
    return { status: 'recovery_failed' };
  }
}

function executarEngajamento() {
  return executarRotinaDeEngajamento().then((resultado) => {
    console.log('[scheduler] rotina de e-mails de engajamento concluída', resultado);
    return resultado;
  });
}

function iniciarScheduler() {
  if (!env.enableCron) {
    console.log('[scheduler] cron desabilitado');
    return;
  }

  cron.schedule('0 8 * * *', sincronizarOportunidades);\n  cron.schedule('0 9 * * *', executarEngajamento);

  // Recupera jobs que ficaram running ou aguardando retry antes de disparar
  // uma nova sincronização diária.
  recuperarSincronizacaoPendente().then((resultado) => {
    if (resultado.status === 'nothing_to_resume') {
      sincronizarOportunidades().catch((err) => {
        console.error('[scheduler] erro ao disparar sincronização:', err.message);
      });
    }
  });

  console.log('[scheduler] cron habilitado: oportunidades às 8h e e-mails de engajamento às 9h');
}

module.exports = {
  iniciarScheduler,
  sincronizarOportunidades,
  recuperarSincronizacaoPendente,
};
