const pool = require('../../database/pool');
const { LIMITES } = require('./limits.data');

function periodoAtual(periodo) {
  const agora = new Date();
  if (periodo === 'dia') return agora.toISOString().slice(0, 10);
  return agora.toISOString().slice(0, 7);
}

async function usuarioEhPremium(userId) {
  const result = await pool.query('SELECT plano, premium_ate FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  if (!user) return false;
  if (user.plano === 'premium') return true;
  return Boolean(user.premium_ate && new Date(user.premium_ate) > new Date());
}

/**
 * Verifica e já consome uma unidade de cota, atomicamente. Lança 429 se o
 * limite do plano Free foi atingido. Usuários Premium (ou em trial) nunca
 * são bloqueados.
 */
async function consumirCota(userId, feature) {
  const limite = LIMITES[feature];
  if (!limite) return; // feature sem limite configurado, não bloqueia

  if (await usuarioEhPremium(userId)) return;

  const periodKey = periodoAtual(limite.periodo);

  const result = await pool.query(
    `INSERT INTO usage_counters (user_id, feature, period_key, contagem)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (user_id, feature, period_key)
     DO UPDATE SET contagem = usage_counters.contagem + 1
     RETURNING contagem`,
    [userId, feature, periodKey]
  );

  if (result.rows[0].contagem > limite.max) {
    const err = new Error(
      `Você atingiu o limite do plano Free para essa funcionalidade (${limite.max}/${limite.periodo}). ` +
        'Assine o Premium pra uso ilimitado.'
    );
    err.status = 429;
    err.code = 'LIMITE_PLANO_FREE';
    throw err;
  }
}

module.exports = { usuarioEhPremium, consumirCota };
