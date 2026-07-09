const pool = require('../../database/pool');
const { CONQUISTAS, calcularNivel, proximoNivel } = require('./achievements.data');

/**
 * Verifica o estado atual do usuário em todos os módulos e concede as
 * conquistas que ainda faltam. Chamado a partir dos outros módulos
 * (perfil, descoberta, plano, currículo) sempre que uma ação relevante
 * acontece — não depende de nenhuma ação manual do usuário.
 *
 * Nunca deve quebrar o fluxo principal: quem chama deve envolver isso em
 * try/catch (ou apenas não aguardar) se a ação principal não puder falhar
 * por causa da gamificação.
 */
async function verificarConquistas(userId) {
  const [profileResult, plansResult, resumesResult, interviewsResult] = await Promise.all([
    pool.query('SELECT escolaridade, perfil_dominante FROM profiles WHERE user_id = $1', [userId]),
    pool.query('SELECT etapas, progresso FROM plans WHERE user_id = $1', [userId]),
    pool.query('SELECT id FROM resumes WHERE user_id = $1 LIMIT 1', [userId]),
    pool.query('SELECT id FROM interview_sessions WHERE user_id = $1 LIMIT 1', [userId]),
  ]);

  const profile = profileResult.rows[0];
  const planos = plansResult.rows;
  const todosItens = planos.flatMap((p) => (p.etapas || []).flatMap((mes) => mes.itens || []));

  const candidatas = new Set();

  if (profile?.escolaridade) candidatas.add('perfil_completo');
  if (profile?.perfil_dominante) candidatas.add('autoconhecimento');
  if (planos.length > 0) candidatas.add('plano_criado');
  if (todosItens.some((i) => i.status === 'concluido')) candidatas.add('primeira_etapa');
  if (todosItens.some((i) => i.status === 'concluido' && i.tipo === 'projeto')) candidatas.add('primeiro_projeto');
  if (todosItens.some((i) => i.status === 'concluido' && i.tipo === 'aprender')) candidatas.add('primeiro_curso');
  if (planos.some((p) => Number(p.progresso) >= 100)) candidatas.add('plano_completo');
  if (resumesResult.rows.length > 0) candidatas.add('curriculo_pronto');
  if (interviewsResult.rows.length > 0) candidatas.add('entrevista_treinada');

  const novas = [];

  for (const codigo of candidatas) {
    const result = await pool.query(
      `INSERT INTO achievements (user_id, codigo) VALUES ($1, $2)
       ON CONFLICT (user_id, codigo) DO NOTHING
       RETURNING codigo`,
      [userId, codigo]
    );
    if (result.rows[0]) novas.push(codigo);
  }

  return novas;
}

async function listarConquistas(userId) {
  const result = await pool.query('SELECT codigo, conquistado_em FROM achievements WHERE user_id = $1', [userId]);
  const mapaConquistadas = new Map(result.rows.map((r) => [r.codigo, r.conquistado_em]));

  const conquistas = CONQUISTAS.map((c) => ({
    ...c,
    conquistada: mapaConquistadas.has(c.codigo),
    conquistadoEm: mapaConquistadas.get(c.codigo) || null,
  }));

  const total = mapaConquistadas.size;

  return {
    nivel: calcularNivel(total),
    proximoNivel: proximoNivel(total),
    totalConquistas: total,
    totalPossivel: CONQUISTAS.length,
    conquistas,
  };
}

module.exports = { verificarConquistas, listarConquistas };
