const pool = require('../../database/pool');
const env = require('../../config/env');
const { enviarEmail } = require('./mail.service');
const { calcularProximoPasso } = require('../plans/plans.service');
const { calcularMatch } = require('../opportunities/opportunities.service');

const CAMPANHAS = {
  PROGRESSO: 'lembrete_progresso',
  RENOVACAO: 'lembrete_renovacao',
  INATIVOS: 'reengajamento_inativos',
  OPORTUNIDADES: 'novas_oportunidades',
  JORNADA: 'jornada_incompleta',
  RETORNO: 'retorno_norte',
};

const COOLDOWN_DIAS = {
  [CAMPANHAS.PROGRESSO]: 7,
  [CAMPANHAS.RENOVACAO]: 90,
  [CAMPANHAS.INATIVOS]: 30,
  [CAMPANHAS.OPORTUNIDADES]: 7,
  [CAMPANHAS.JORNADA]: 14,
  [CAMPANHAS.RETORNO]: 30,
};

function url(path) {
  const base = String(env.frontendUrl || 'https://usenortee.vercel.app').replace(/\/$/, '');
  return base + path;
}

function diasDesde(data) {
  if (!data) return Infinity;
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
}

async function podeEnviar(userId, campanha) {
  const result = await pool.query(
    'SELECT enviado_em FROM email_dispatch_log WHERE user_id = $1 AND campanha = $2 ORDER BY enviado_em DESC LIMIT 1',
    [userId, campanha]
  );
  return !result.rows[0] || diasDesde(result.rows[0].enviado_em) >= COOLDOWN_DIAS[campanha];
}

async function registrarEnvio(userId, campanha, metadata = {}) {
  await pool.query(
    'INSERT INTO email_dispatch_log (user_id, campanha, metadata) VALUES ($1, $2, $3)',
    [userId, campanha, JSON.stringify(metadata)]
  );
}

async function enviarCampanha({ campanha, destinatarios, montarEmail }) {
  const resultado = { campanha, elegiveis: destinatarios.length, enviados: 0, ignorados: 0, falhas: 0, erros: [] };
  for (const usuario of destinatarios) {
    if (!(await podeEnviar(usuario.id, campanha))) { resultado.ignorados += 1; continue; }
    try {
      const email = montarEmail(usuario);
      await enviarEmail(email);
      await registrarEnvio(usuario.id, campanha, email.metadata || {});
      resultado.enviados += 1;
    } catch (err) {
      resultado.falhas += 1;
      resultado.erros.push({ userId: usuario.id, mensagem: String(err.message || err).slice(0, 300) });
    }
  }
  return resultado;
}

async function buscarPlanosMaisRecentes() {
  const result = await pool.query(
    "SELECT DISTINCT ON (p.user_id) p.id, p.user_id, p.etapas, p.progresso, p.created_at, p.ultimo_lembrete_progresso_em, p.lembrete_renovacao_enviado_em, u.nome, u.email FROM plans p JOIN users u ON u.id = p.user_id WHERE u.email_verificado = true ORDER BY p.user_id, p.created_at DESC"
  );
  return result.rows;
}

async function enviarLembretesDeProgresso() {
  const planos = await buscarPlanosMaisRecentes();
  const destinatarios = planos.filter((p) => Number(p.progresso) < 100 && calcularProximoPasso(p.etapas));
  return enviarCampanha({
    campanha: CAMPANHAS.PROGRESSO,
    destinatarios,
    montarEmail: (p) => {
      const proximo = calcularProximoPasso(p.etapas);
      return {
        para: p.email,
        assunto: 'Continue evoluindo no Norte 🧭',
        texto: 'Oi, ' + p.nome + '!\n\n' +
          'Você já está em ' + p.progresso + '% do seu plano de evolução. Seu próximo passo é:\n\n' +
          '"' + proximo.item.descricao + '" (' + proximo.tituloMes + ')\n\n' +
          'Quando puder, continue de onde parou:\n' + url('/plano') + '\n\n' +
          'Um passo de cada vez já é progresso.\n\n— Equipe Norte',
        metadata: { planId: p.id },
      };
    },
  });
}

async function enviarLembretesDeRenovacao() {
  const planos = await buscarPlanosMaisRecentes();
  const destinatarios = planos.filter((p) => diasDesde(p.created_at) >= 90 && !p.lembrete_renovacao_enviado_em);
  const resultado = await enviarCampanha({
    campanha: CAMPANHAS.RENOVACAO,
    destinatarios,
    montarEmail: (p) => ({
      para: p.email,
      assunto: 'Seu plano no Norte pode acompanhar sua nova fase 🧭',
      texto: 'Oi, ' + p.nome + '!\n\n' +
        'Já faz cerca de 3 meses desde que seu plano de evolução foi criado. Muita coisa pode ter mudado desde então.\n\n' +
        'Que tal refazer sua descoberta e atualizar seu plano?\n' + url('/descoberta') + '\n\n— Equipe Norte',
      metadata: { planId: p.id },
    }),
  });
  for (const p of destinatarios) {
    if (!resultado.erros.some((e) => e.userId === p.user_id)) {
      await pool.query('UPDATE plans SET lembrete_renovacao_enviado_em = NOW() WHERE id = $1', [p.id]);
    }
  }
  return resultado;
}

async function executarRotinaDeLembretes() {
  const [progresso, renovacao] = await Promise.all([enviarLembretesDeProgresso(), enviarLembretesDeRenovacao()]);
  return {
    totalPlanos: (await buscarPlanosMaisRecentes()).length,
    lembretesDeProgresso: progresso.enviados,
    lembretesDeRenovacao: renovacao.enviados,
    ignorados: progresso.ignorados + renovacao.ignorados,
    falhas: progresso.falhas + renovacao.falhas,
  };
}

async function enviarReengajamentoInativos() {
  const result = await pool.query("SELECT id, nome, email, COALESCE(ultimo_acesso_em, created_at) AS ultima_atividade FROM users WHERE email_verificado = true AND COALESCE(ultimo_acesso_em, created_at) <= NOW() - INTERVAL '14 days' AND COALESCE(ultimo_acesso_em, created_at) > NOW() - INTERVAL '30 days'");
  return enviarCampanha({
    campanha: CAMPANHAS.INATIVOS, destinatarios: result.rows,
    montarEmail: (u) => ({
      para: u.email, assunto: 'Seu próximo passo ainda está no Norte 🧭',
      texto: 'Oi, ' + u.nome + '!\n\nFaz alguns dias que você não passa pelo Norte. Seu caminho continua aqui — e pode ser um bom momento para retomar de onde parou.\n\nVoltar para o Norte:\n' + url('/dashboard') + '\n\n— Equipe Norte',
    }),
  });
}

async function enviarRetornoAoNorte() {
  const result = await pool.query("SELECT id, nome, email, COALESCE(ultimo_acesso_em, created_at) AS ultima_atividade FROM users WHERE email_verificado = true AND COALESCE(ultimo_acesso_em, created_at) <= NOW() - INTERVAL '30 days'");
  return enviarCampanha({
    campanha: CAMPANHAS.RETORNO, destinatarios: result.rows,
    montarEmail: (u) => ({
      para: u.email, assunto: 'O Norte continua aqui para você ✨',
      texto: 'Oi, ' + u.nome + '!\n\nSeu caminho profissional muda com o tempo — e você pode voltar ao Norte sempre que quiser reorganizar os próximos passos.\n\nRetomar sua jornada:\n' + url('/dashboard') + '\n\n— Equipe Norte',
    }),
  });
}

async function enviarJornadaIncompleta() {
  const result = await pool.query("SELECT u.id, u.nome, u.email, CASE WHEN p.id IS NULL THEN 'perfil' WHEN p.perfil_dominante IS NULL THEN 'descoberta' WHEN pl.id IS NULL THEN 'plano' WHEN pl.progresso < 100 THEN 'plano' WHEN r.id IS NULL THEN 'curriculo' WHEN i.id IS NULL THEN 'entrevista' ELSE NULL END AS etapa FROM users u LEFT JOIN profiles p ON p.user_id = u.id LEFT JOIN LATERAL (SELECT id, progresso FROM plans WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) pl ON true LEFT JOIN LATERAL (SELECT id FROM resumes WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) r ON true LEFT JOIN LATERAL (SELECT id FROM interview_sessions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) i ON true WHERE u.email_verificado = true");
  const destinatarios = result.rows.filter((u) => u.etapa);
  const textos = { perfil: ['Complete seu perfil', '/perfil'], descoberta: ['Faça sua descoberta', '/descoberta'], plano: ['Continue seu plano de evolução', '/plano'], curriculo: ['Monte seu currículo', '/curriculo'], entrevista: ['Pratique sua entrevista', '/curriculo'] };
  return enviarCampanha({
    campanha: CAMPANHAS.JORNADA, destinatarios,
    montarEmail: (u) => {
      const acao = textos[u.etapa][0], caminho = textos[u.etapa][1];
      return {
        para: u.email, assunto: 'Você parou no meio do caminho. Que tal continuar? 🧭',
        texto: 'Oi, ' + u.nome + '!\n\nSua jornada no Norte ainda tem um próximo passo: ' + acao + '.\n\nContinuar:\n' + url(caminho) + '\n\n— Equipe Norte',
        metadata: { etapa: u.etapa },
      };
    },
  });
}

async function enviarNovasOportunidades() {
  const usersResult = await pool.query("SELECT u.id, u.nome, u.email, u.idade, u.estado, u.cidade, p.escolaridade, p.interesses, p.habilidades, p.perfil_dominante, p.areas_sugeridas, p.areas_secundarias FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.email_verificado = true");
  const opportunitiesResult = await pool.query("SELECT * FROM opportunities WHERE status = 'publicada' AND (expires_at IS NULL OR expires_at > NOW()) AND COALESCE(data_publicacao, created_at) >= NOW() - INTERVAL '7 days' ORDER BY COALESCE(data_publicacao, created_at) DESC LIMIT 200");
  const destinatarios = [];
  for (const user of usersResult.rows) {
    const matches = opportunitiesResult.rows.map((op) => ({ op, ...calcularMatch(op, user) })).filter((m) => m.matchPercent >= 60).sort((a, b) => b.matchPercent - a.matchPercent || new Date(b.op.created_at) - new Date(a.op.created_at)).slice(0, 3);
    if (matches.length) destinatarios.push({ ...user, matches });
  }
  return enviarCampanha({
    campanha: CAMPANHAS.OPORTUNIDADES, destinatarios,
    montarEmail: (u) => ({
      para: u.email,
      assunto: 'Encontramos ' + u.matches.length + ' nova' + (u.matches.length > 1 ? 's' : '') + ' oportunidade' + (u.matches.length > 1 ? 's' : '') + ' para você 🎯',
      texto: 'Oi, ' + u.nome + '!\n\nEncontramos oportunidades recentes que combinam com seu perfil:\n\n' + u.matches.map(({ op, matchPercent }) => '• ' + op.titulo + ' — ' + matchPercent + '%\n  ' + op.link).join('\n') + '\n\nVeja todas as oportunidades no Norte:\n' + url('/oportunidades') + '\n\n— Equipe Norte',
      metadata: { opportunityIds: u.matches.map(({ op }) => op.id) },
    }),
  });
}

async function executarRotinaDeEngajamento() {
  return Promise.all([enviarLembretesDeProgresso(), enviarLembretesDeRenovacao(), enviarReengajamentoInativos(), enviarNovasOportunidades(), enviarJornadaIncompleta(), enviarRetornoAoNorte()]);
}

module.exports = { CAMPANHAS, executarRotinaDeLembretes, enviarLembretesDeProgresso, enviarLembretesDeRenovacao, enviarReengajamentoInativos, enviarNovasOportunidades, enviarJornadaIncompleta, enviarRetornoAoNorte, executarRotinaDeEngajamento };