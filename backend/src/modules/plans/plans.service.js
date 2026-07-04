const pool = require('../../database/pool');
const { buildTemplatePlan } = require('./plans.templates');
const { gerarPlanoComIA } = require('./plans.ai');

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'concluido'];

function calcularProgresso(etapas) {
  const todosItens = etapas.flatMap((mes) => mes.itens);
  if (todosItens.length === 0) return 0;

  const concluidos = todosItens.filter((item) => item.status === 'concluido').length;
  return Math.round((concluidos / todosItens.length) * 100 * 100) / 100;
}

function calcularProximoPasso(etapas) {
  for (const mes of etapas) {
    const item = mes.itens.find((i) => i.status !== 'concluido');
    if (item) {
      return { mes: mes.mes, tituloMes: mes.titulo, item };
    }
  }
  return null; // Plano inteiro concluído!
}

const DIAS_PARA_RENOVAR = 90; // ~3 meses

function enriquecer(plano) {
  if (!plano) return null;
  return {
    ...plano,
    proximoPasso: calcularProximoPasso(plano.etapas),
  };
}

function diasDesde(data) {
  return Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Acrescenta flags de "frescor" do plano: se o perfil dominante da
 * descoberta mudou desde que esse plano foi gerado (a pessoa refez o
 * teste), e se já passou tempo suficiente pra sugerir uma renovação.
 * Nunca decide sozinho por trocar o plano — só sinaliza pro frontend
 * oferecer a opção, preservando o progresso que a pessoa já tem.
 */
async function comFrescor(plano, userId) {
  if (!plano) return null;

  const perfilAtual = await buscarPerfilDominante(userId);
  const diasDesdeCriacao = diasDesde(plano.created_at);

  return {
    ...plano,
    perfilDesatualizado: Boolean(
      plano.perfil_dominante_base && perfilAtual && plano.perfil_dominante_base !== perfilAtual
    ),
    precisaRenovar: diasDesdeCriacao >= DIAS_PARA_RENOVAR,
    diasDesdeCriacao,
  };
}

async function buscarPerfilDominante(userId) {
  const result = await pool.query('SELECT perfil_dominante FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0]?.perfil_dominante || null;
}

async function gerarPlano(userId) {
  const etapasIA = await gerarPlanoComIA(userId);
  const geradoPorIA = Boolean(etapasIA);
  const perfilDominante = await buscarPerfilDominante(userId);

  const etapas = etapasIA || buildTemplatePlan(perfilDominante);
  const progresso = calcularProgresso(etapas);

  const result = await pool.query(
    `INSERT INTO plans (user_id, etapas, progresso, gerado_por_ia, perfil_dominante_base)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, JSON.stringify(etapas), progresso, geradoPorIA, perfilDominante]
  );

  return comFrescor(enriquecer(result.rows[0]), userId);
}

async function buscarPlanoAtual(userId) {
  const result = await pool.query(
    'SELECT * FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return comFrescor(enriquecer(result.rows[0] || null), userId);
}

async function atualizarStatusItem(userId, planId, itemId, status, reflexao) {
  if (!STATUS_VALIDOS.includes(status)) {
    const err = new Error(`Status inválido. Use um de: ${STATUS_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // Confere que o plano pertence a quem está pedindo — sem isso, qualquer
  // usuário logado poderia alterar o plano de outra pessoa pelo ID.
  const result = await pool.query('SELECT * FROM plans WHERE id = $1 AND user_id = $2', [planId, userId]);
  const plano = result.rows[0];

  if (!plano) {
    const err = new Error('Plano não encontrado');
    err.status = 404;
    throw err;
  }

  let itemEncontrado = false;
  const etapas = plano.etapas.map((mes) => ({
    ...mes,
    itens: mes.itens.map((item) => {
      if (item.id !== itemId) return item;

      itemEncontrado = true;
      const itemAtualizado = { ...item, status };

      if (status === 'concluido') {
        itemAtualizado.concluidoEm = new Date().toISOString();
        if (reflexao) {
          itemAtualizado.reflexao = {
            dificuldade: reflexao.dificuldade ?? null,
            aprendizado: reflexao.aprendizado?.trim() || null,
          };
        }
      } else {
        // Voltar o status desfaz a marca de conclusão e a reflexão associada.
        delete itemAtualizado.concluidoEm;
        delete itemAtualizado.reflexao;
      }

      return itemAtualizado;
    }),
  }));

  if (!itemEncontrado) {
    const err = new Error('Item não encontrado neste plano');
    err.status = 404;
    throw err;
  }

  const progresso = calcularProgresso(etapas);

  const atualizado = await pool.query(
    `UPDATE plans SET etapas = $1, progresso = $2 WHERE id = $3 RETURNING *`,
    [JSON.stringify(etapas), progresso, planId]
  );

  return comFrescor(enriquecer(atualizado.rows[0]), userId);
}

module.exports = { gerarPlano, buscarPlanoAtual, atualizarStatusItem, calcularProximoPasso };
