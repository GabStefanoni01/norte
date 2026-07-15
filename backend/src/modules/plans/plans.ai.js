const env = require('../../config/env');
const { usuarioTemConsentimentoValido } = require('../policy/policy.service');
const { askMentor } = require('../ai/ai.provider');
const { buildUserContext } = require('../ai/ai.context');

/**
 * Tenta gerar um plano de evolução personalizado via IA, em formato JSON
 * estruturado. Retorna null se a IA não estiver configurada, se a resposta
 * não for um JSON válido no formato esperado, ou se a chamada falhar —
 * quem chama deve usar o template padrão (rule-based) como fallback.
 */
async function gerarPlanoComIA(userId) {
  if (!env.geminiApiKey) return null;
  if (!(await usuarioTemConsentimentoValido(userId))) return null;

  try {
    const context = await buildUserContext(userId);

    const systemPrompt =
      'Você é o mentor do Norte. Gere um plano de evolução profissional de 3 meses ' +
      'para o usuário, em português do Brasil, personalizado com base no perfil dele. ' +
      'Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, sem markdown, ' +
      'no formato exato: ' +
      '[{"titulo": "string curta do mês", "itens": [{"descricao": "string", "tipo": "aprender" ou "projeto"}]}]. ' +
      'Gere exatamente 3 objetos (um por mês), cada um com 2 a 4 itens. Seja concreto e prático, ' +
      'nada de conselhos genéricos.';

    const mensagem =
      `Perfil dominante do teste de descoberta: ${context.perfil?.perfil_dominante || 'não informado'}.\n` +
      `Objetivos do usuário: ${context.perfil?.objetivos || 'não informado'}.\n` +
      `Interesses: ${context.perfil?.interesses?.join(', ') || 'não informado'}.\n` +
      `Escolaridade: ${context.perfil?.escolaridade || 'não informado'}.`;

    const texto = await askMentor({ systemPrompt, mensagem });
    if (!texto) return null;

    const jsonLimpo = texto.trim().replace(/^```json\s*|^```\s*|```\s*$/g, '');
    const meses = JSON.parse(jsonLimpo);

    if (!validarFormato(meses)) {
      console.error('Plano gerado pela IA veio em formato inesperado, usando fallback.');
      return null;
    }

    return meses.map((mes, indiceMes) => ({
      mes: indiceMes + 1,
      titulo: mes.titulo,
      itens: mes.itens.map((item, indiceItem) => ({
        id: `m${indiceMes + 1}i${indiceItem + 1}`,
        descricao: item.descricao,
        tipo: item.tipo === 'projeto' ? 'projeto' : 'aprender',
        status: 'pendente',
      })),
    }));
  } catch (err) {
    console.error('Não foi possível gerar plano via IA:', err.message);
    return null;
  }
}

function validarFormato(meses) {
  return (
    Array.isArray(meses) &&
    meses.length > 0 &&
    meses.every(
      (mes) =>
        typeof mes.titulo === 'string' &&
        Array.isArray(mes.itens) &&
        mes.itens.every((item) => typeof item.descricao === 'string')
    )
  );
}

module.exports = { gerarPlanoComIA };
