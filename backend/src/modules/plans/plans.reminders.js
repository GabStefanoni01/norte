const pool = require('../../database/pool');
const { enviarEmail } = require('../mail/mail.service');
const { calcularProximoPasso } = require('./plans.service');

const DIAS_ENTRE_LEMBRETES_PROGRESSO = 7;
const DIAS_PARA_LEMBRETE_RENOVACAO = 90;

/**
 * Pega só o plano mais recente de cada usuário (DISTINCT ON é a forma
 * idiomática do Postgres pra isso — evita mandar lembrete de um plano
 * antigo que já foi substituído por um mais novo).
 */
async function buscarPlanosMaisRecentesPorUsuario() {
  const result = await pool.query(`
    SELECT DISTINCT ON (p.user_id)
      p.id, p.user_id, p.etapas, p.progresso, p.created_at,
      p.ultimo_lembrete_progresso_em, p.lembrete_renovacao_enviado_em,
      u.nome, u.email
    FROM plans p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.user_id, p.created_at DESC
  `);
  return result.rows;
}

function diasDesde(data) {
  if (!data) return Infinity;
  return Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24));
}

async function enviarLembreteDeProgresso(plano) {
  const proximoPasso = calcularProximoPasso(plano.etapas);
  if (!proximoPasso) return false; // plano já concluído, nada a lembrar

  await enviarEmail({
    para: plano.email,
    assunto: 'Continue evoluindo no Norte 🧭',
    texto:
      `Oi, ${plano.nome}!\n\n` +
      `Você já está em ${plano.progresso}% do seu plano de evolução. Que tal avançar hoje em:\n\n` +
      `"${proximoPasso.item.descricao}" (${proximoPasso.tituloMes})\n\n` +
      'Um passo de cada vez já é progresso. Bora?\n\n— Equipe Norte',
  });

  await pool.query('UPDATE plans SET ultimo_lembrete_progresso_em = NOW() WHERE id = $1', [plano.id]);
  return true;
}

async function enviarLembreteDeRenovacao(plano) {
  await enviarEmail({
    para: plano.email,
    assunto: 'Já faz 3 meses — hora de atualizar seu plano no Norte',
    texto:
      `Oi, ${plano.nome}!\n\n` +
      'Já faz cerca de 3 meses desde que seu plano de evolução foi criado. Muita coisa pode ter mudado ' +
      'desde então — que tal refazer o teste de descoberta e gerar um plano atualizado?\n\n— Equipe Norte',
  });

  await pool.query('UPDATE plans SET lembrete_renovacao_enviado_em = NOW() WHERE id = $1', [plano.id]);
  return true;
}

/**
 * Roda a rotina completa de lembretes. Pensada para ser chamada por um
 * agendador externo (cron do provedor de hosting, GitHub Actions, Vercel
 * Cron) via POST /admin/lembretes/enviar, ou por um scheduler interno
 * (ver ENABLE_CRON no .env) quando o backend roda como processo contínuo.
 */
async function executarRotinaDeLembretes() {
  const planos = await buscarPlanosMaisRecentesPorUsuario();

  let progresso = 0;
  let renovacao = 0;

  for (const plano of planos) {
    const idadePlanoEmDias = diasDesde(plano.created_at);

    if (plano.progresso < 100 && diasDesde(plano.ultimo_lembrete_progresso_em) >= DIAS_ENTRE_LEMBRETES_PROGRESSO) {
      const enviado = await enviarLembreteDeProgresso(plano);
      if (enviado) progresso += 1;
    }

    if (idadePlanoEmDias >= DIAS_PARA_LEMBRETE_RENOVACAO && !plano.lembrete_renovacao_enviado_em) {
      await enviarLembreteDeRenovacao(plano);
      renovacao += 1;
    }
  }

  return { totalPlanos: planos.length, lembretesDeProgresso: progresso, lembretesDeRenovacao: renovacao };
}

module.exports = { executarRotinaDeLembretes };
