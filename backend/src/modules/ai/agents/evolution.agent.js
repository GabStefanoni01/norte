const { askMentor } = require('../ai.provider');

const SYSTEM_PROMPT = [
  'Você é o agente de evolução profissional do Norte.',
  'Sua única responsabilidade é transformar o perfil e os objetivos do usuário em um plano de aprendizagem prático, realista e progressivo de 3 meses.',
  'Responda em português do Brasil e considere o nível atual, escolaridade, interesses e objetivos informados.',
  'Não presuma habilidades, orçamento, disponibilidade ou recursos que não foram informados.',
  'Prefira recursos gratuitos ou de baixo custo e projetos que possam ser demonstrados em portfólio.',
  'Cada etapa deve ser concreta, executável e ter um resultado observável. Evite recomendações genéricas.',
  'Responda APENAS com JSON válido, sem markdown ou texto adicional, neste formato:',
  '[{"titulo":"string curta do mês","itens":[{"descricao":"string com ação e resultado esperado","tipo":"aprender" ou "projeto"}]}].',
  'Gere exatamente 3 meses, cada um com 2 a 4 itens.',
].join(' ');

function validarResposta(meses) {
  return (
    Array.isArray(meses) &&
    meses.length === 3 &&
    meses.every((mes) =>
      mes &&
      typeof mes.titulo === 'string' &&
      mes.titulo.trim().length > 0 &&
      Array.isArray(mes.itens) &&
      mes.itens.length >= 2 &&
      mes.itens.length <= 4 &&
      mes.itens.every((item) =>
        item &&
        typeof item.descricao === 'string' &&
        item.descricao.trim().length > 0 &&
        ['aprender', 'projeto'].includes(item.tipo)
      )
    )
  );
}

function extrairJson(texto) {
  const limpo = texto.trim().replace(/^\u0060\u0060\u0060(?:json)?\s*/i, '').replace(/\s*\u0060\u0060\u0060$/, '');
  return JSON.parse(limpo);
}

function normalizarPlano(meses) {
  return meses.map((mes, indiceMes) => ({
    mes: indiceMes + 1,
    titulo: mes.titulo.trim(),
    itens: mes.itens.map((item, indiceItem) => ({
      id: `m${indiceMes + 1}i${indiceItem + 1}`,
      descricao: item.descricao.trim(),
      tipo: item.tipo,
      status: 'pendente',
    })),
  }));
}

async function gerarPlano(context) {
  const mensagem = [
    `Perfil dominante da descoberta: ${context.perfil?.perfil_dominante || 'não informado'}.`,
    `Objetivos: ${context.perfil?.objetivos || 'não informado'}.`,
    `Interesses: ${context.perfil?.interesses?.join(', ') || 'não informado'}.`,
    `Escolaridade: ${context.perfil?.escolaridade || 'não informada'}.`,
    `Habilidades atuais: ${context.perfil?.habilidades || 'não informadas'}.`,
    `Plano atual e progresso: ${context.plano ? JSON.stringify(context.plano) : 'não informado'}.`,
  ].join('\n');

  const texto = await askMentor({ systemPrompt: SYSTEM_PROMPT, mensagem });
  if (!texto) return null;

  let meses;
  try {
    meses = extrairJson(texto);
  } catch {
    return null;
  }

  if (!validarResposta(meses)) return null;
  return normalizarPlano(meses);
}

module.exports = { gerarPlano, validarResposta, extrairJson, normalizarPlano };
