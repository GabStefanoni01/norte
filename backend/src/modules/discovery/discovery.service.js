const pool = require('../../database/pool');
const { PERGUNTAS, CATEGORIAS } = require('./discovery.data');
const { gerarDescricaoPersonalizada } = require('./discovery.ai');
const { verificarConquistas } = require('../achievements/achievements.service');

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

  const categoriasOrdenadas = Object.keys(pontuacao).sort((a, b) => pontuacao[b] - pontuacao[a]);
  const perfilDominante = categoriasOrdenadas[0];
  const perfilSecundario = categoriasOrdenadas[1];

  const info = CATEGORIAS[perfilDominante];
  const infoSecundaria = CATEGORIAS[perfilSecundario];

  return {
    perfilDominante,
    perfilSecundario,
    descricao: info.descricao,
    areasSugeridas: info.areas,
    areasSecundarias: infoSecundaria.areas,
    pontuacao,
  };
}

async function salvarResultado(userId, resultado, reflexao) {
  // Tenta enriquecer com uma descrição personalizada via IA. Se não der
  // (sem chave configurada, ou erro na chamada), segue com o texto padrão.
  const descricaoIA = await gerarDescricaoPersonalizada(userId, resultado, reflexao);
  const descricaoFinal = descricaoIA || resultado.descricao;

  const valores = [
    resultado.perfilDominante,
    descricaoFinal,
    resultado.areasSugeridas,
    JSON.stringify(resultado.pontuacao),
    resultado.areasSecundarias,
    Boolean(descricaoIA),
    reflexao || null,
  ];

  const result = await pool.query(
    `UPDATE profiles
     SET perfil_dominante = $1,
         resultado_descoberta = $2,
         areas_sugeridas = $3,
         pontuacao_descoberta = $4,
         areas_secundarias = $5,
         descricao_gerada_por_ia = $6,
         reflexao_descoberta = $7
     WHERE user_id = $8
     RETURNING *`,
    [...valores, userId]
  );

  let perfil = result.rows[0];

  if (!perfil) {
    // Usuário ainda não tem uma linha em profiles (não passou pelo cadastro
    // de perfil) — cria uma já com o resultado da descoberta.
    const inserted = await pool.query(
      `INSERT INTO profiles
         (user_id, perfil_dominante, resultado_descoberta, areas_sugeridas, pontuacao_descoberta, areas_secundarias, descricao_gerada_por_ia, reflexao_descoberta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, ...valores]
    );
    perfil = inserted.rows[0];
  }

  verificarConquistas(userId).catch((err) => console.error('Erro ao verificar conquistas:', err.message));

  return perfil;
}

async function buscarResultado(userId) {
  const result = await pool.query(
    `SELECT perfil_dominante, resultado_descoberta, areas_sugeridas,
            pontuacao_descoberta, areas_secundarias, descricao_gerada_por_ia,
            reflexao_descoberta
     FROM profiles WHERE user_id = $1`,
    [userId]
  );

  const linha = result.rows[0];
  if (!linha || !linha.perfil_dominante) return null;

  return {
    perfilDominante: linha.perfil_dominante,
    descricao: linha.resultado_descoberta,
    areasSugeridas: linha.areas_sugeridas,
    pontuacao: linha.pontuacao_descoberta,
    areasSecundarias: linha.areas_secundarias,
    geradoPorIA: linha.descricao_gerada_por_ia,
    reflexao: linha.reflexao_descoberta,
  };
}

module.exports = { listarPerguntas, calcularResultado, salvarResultado, buscarResultado };
