const pool = require('../../database/pool');
const { PERGUNTAS, CATEGORIAS } = require('./discovery.data');

function listarPerguntas() {
  // Não expõe a categoria de cada opção — senão dava pra "forçar" o resultado.
  return PERGUNTAS.map((pergunta) => ({
    id: pergunta.id,
    texto: pergunta.texto,
    opcoes: pergunta.opcoes.map((opcao) => ({ id: opcao.id, texto: opcao.texto })),
  }));
}

function calcularResultado(respostas) {
  if (!Array.isArray(respostas) || respostas.length !== PERGUNTAS.length) {
    const err = new Error(`Envie exatamente ${PERGUNTAS.length} respostas.`);
    err.status = 400;
    throw err;
  }

  const pontuacao = { criativo: 0, analitico: 0, social: 0, organizador: 0 };

  for (const resposta of respostas) {
    const pergunta = PERGUNTAS.find((p) => p.id === resposta.perguntaId);
    if (!pergunta) {
      const err = new Error(`Pergunta inválida: ${resposta.perguntaId}`);
      err.status = 400;
      throw err;
    }

    const opcao = pergunta.opcoes.find((o) => o.id === resposta.opcaoId);
    if (!opcao) {
      const err = new Error(`Opção inválida para a pergunta ${resposta.perguntaId}`);
      err.status = 400;
      throw err;
    }

    pontuacao[opcao.categoria] += 1;
  }

  const perfilDominante = Object.keys(pontuacao).reduce((maiorAtual, categoria) =>
    pontuacao[categoria] > pontuacao[maiorAtual] ? categoria : maiorAtual
  );

  const info = CATEGORIAS[perfilDominante];

  return {
    perfilDominante,
    descricao: info.descricao,
    areasSugeridas: info.areas,
    pontuacao,
  };
}

async function salvarResultado(userId, resultado) {
  const result = await pool.query(
    `UPDATE profiles
     SET perfil_dominante = $1, resultado_descoberta = $2, areas_sugeridas = $3
     WHERE user_id = $4
     RETURNING *`,
    [resultado.perfilDominante, resultado.descricao, resultado.areasSugeridas, userId]
  );

  if (result.rows[0]) return result.rows[0];

  // Usuário ainda não tem uma linha em profiles (não passou pelo cadastro
  // de perfil) — cria uma já com o resultado da descoberta.
  const inserted = await pool.query(
    `INSERT INTO profiles (user_id, perfil_dominante, resultado_descoberta, areas_sugeridas)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, resultado.perfilDominante, resultado.descricao, resultado.areasSugeridas]
  );

  return inserted.rows[0];
}

async function buscarResultado(userId) {
  const result = await pool.query(
    'SELECT perfil_dominante, resultado_descoberta, areas_sugeridas FROM profiles WHERE user_id = $1',
    [userId]
  );

  const linha = result.rows[0];
  if (!linha || !linha.perfil_dominante) return null;

  return {
    perfilDominante: linha.perfil_dominante,
    descricao: linha.resultado_descoberta,
    areasSugeridas: linha.areas_sugeridas,
  };
}

module.exports = { listarPerguntas, calcularResultado, salvarResultado, buscarResultado };
