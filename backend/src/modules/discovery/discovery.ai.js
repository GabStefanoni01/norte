const env = require('../../config/env');
const { usuarioTemConsentimentoValido } = require('../policy/policy.service');
const { askMentor } = require('../ai/ai.provider');
const { buildUserContext } = require('../ai/ai.context');

/**
 * Gera uma descrição personalizada do resultado do teste, cruzando o
 * perfil dominante com o contexto do usuário (interesses, objetivos).
 * Retorna null se a IA não estiver configurada ou se a chamada falhar —
 * quem chama deve usar a descrição padrão (rule-based) como fallback.
 */
async function gerarDescricaoPersonalizada(userId, resultado, reflexao) {
  if (!env.geminiApiKey) return null;
  if (!(await usuarioTemConsentimentoValido(userId))) return null;

  try {
    const context = await buildUserContext(userId);

    const systemPrompt =
      'Você é o mentor do Norte. Escreva uma mensagem curta (3 a 4 frases), calorosa e direta, ' +
      'em português do Brasil, explicando o resultado do teste de descoberta pessoal do usuário. ' +
      'Conecte o perfil dominante com os interesses/objetivos dele quando fizer sentido. ' +
      'Se houver uma reflexão pessoal do usuário, dê preferência a conectar com ela diretamente. ' +
      'Não use bullet points, apenas um parágrafo corrido. Não se apresente, vá direto ao ponto.';

    const mensagem =
      `Perfil dominante: ${resultado.perfilDominante}.\n` +
      `Áreas sugeridas: ${resultado.areasSugeridas.join(', ')}.\n` +
      `Pontuação por categoria: ${JSON.stringify(resultado.pontuacao)}.\n` +
      (reflexao ? `Reflexão pessoal do usuário: "${reflexao}"\n` : '') +
      `\nContexto do usuário:\n${context.perfil ? JSON.stringify(context.perfil) : 'sem perfil detalhado ainda'}`;

    const texto = await askMentor({ systemPrompt, mensagem });
    return texto?.trim() || null;
  } catch (err) {
    console.error('Não foi possível gerar descrição personalizada via IA:', err.message);
    return null;
  }
}

module.exports = { gerarDescricaoPersonalizada };
