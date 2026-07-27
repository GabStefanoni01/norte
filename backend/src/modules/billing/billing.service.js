const pool = require('../../database/pool');

const MP_API = 'https://api.mercadopago.com';
const PRECO_PREMIUM = 9.99;

function tokenConfigurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

function erroSemConfiguracao() {
  const err = new Error('Pagamento não configurado neste ambiente (MP_ACCESS_TOKEN ausente).');
  err.status = 500;
  return err;
}

async function criarAssinatura(userId) {
  if (!tokenConfigurado()) throw erroSemConfiguracao();

  const result = await pool.query('SELECT nome, email FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  const response = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Norte Premium',
      external_reference: String(userId),
      payer_email: user.email,
      back_url: `${frontendUrl}/perfil?assinatura=sucesso`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: PRECO_PREMIUM,
        currency_id: 'BRL',
      },
    }),
  });

  if (!response.ok) {
    const detalhe = await response.text();
    console.error('Erro Mercado Pago (criar assinatura):', detalhe);
    const err = new Error('Não foi possível iniciar a assinatura. Tente novamente.');
    err.status = 502;
    throw err;
  }

  const data = await response.json();

  await pool.query('UPDATE users SET mercadopago_preapproval_id = $1 WHERE id = $2', [data.id, userId]);

  return { initPoint: data.init_point };
}

async function cancelarAssinatura(userId) {
  const result = await pool.query('SELECT mercadopago_preapproval_id FROM users WHERE id = $1', [userId]);
  const preapprovalId = result.rows[0]?.mercadopago_preapproval_id;

  if (preapprovalId && tokenConfigurado()) {
    await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    }).catch((err) => console.error('Erro ao cancelar assinatura no Mercado Pago:', err.message));
  }

  await pool.query('UPDATE users SET plano = $1, premium_ate = NULL WHERE id = $2', ['free', userId]);

  return { message: 'Assinatura cancelada.' };
}

/**
 * Processa notificações webhook do Mercado Pago. Elas só trazem o tipo e o
 * id do recurso — buscamos os detalhes completos na API pra confirmar o
 * status antes de liberar/revogar o Premium.
 */
async function processarWebhook({ type, data }) {
  if (type !== 'preapproval' || !data?.id || !tokenConfigurado()) return;

  const response = await fetch(`${MP_API}/preapproval/${data.id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!response.ok) return;

  const preapproval = await response.json();
  const userId = Number(preapproval.external_reference);
  if (!userId) return;

  if (preapproval.status === 'authorized') {
    await pool.query(
      `UPDATE users SET plano = 'premium', mercadopago_preapproval_id = $1 WHERE id = $2`,
      [preapproval.id, userId]
    );
  } else if (['cancelled', 'paused'].includes(preapproval.status)) {
    await pool.query(`UPDATE users SET plano = 'free' WHERE id = $1`, [userId]);
  }
}

async function buscarStatus(userId) {
  const result = await pool.query('SELECT plano, premium_ate FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  const trialAtivo = Boolean(user?.premium_ate && new Date(user.premium_ate) > new Date());

  return {
    plano: user?.plano || 'free',
    premiumAte: user?.premium_ate,
    trialAtivo,
    assinaturaAtiva: user?.plano === 'premium' || trialAtivo,
  };
}

module.exports = { criarAssinatura, cancelarAssinatura, processarWebhook, buscarStatus };
