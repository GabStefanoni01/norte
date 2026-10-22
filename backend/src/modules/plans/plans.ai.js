const env = require('../../config/env');
const { usuarioTemConsentimentoValido } = require('../policy/policy.service');
const { buildUserContext } = require('../ai/ai.context');
const evolutionAgent = require('../ai/agents/evolution.agent');

/**
 * Tenta gerar um plano com o agente especializado de evolução.
 * Retorna null quando a IA não está configurada, não há consentimento,
 * a resposta é inválida ou o provedor falha; o serviço de planos mantém
 * a responsabilidade pelo fallback baseado em regras.
 */
async function gerarPlanoComIA(userId) {
  if (!env.geminiApiKey) return null;
  if (!(await usuarioTemConsentimentoValido(userId))) return null;

  try {
    const context = await buildUserContext(userId);
    return await evolutionAgent.gerarPlano(context);
  } catch (err) {
    console.error('Não foi possível gerar plano via agente de evolução:', err.message);
    return null;
  }
}

module.exports = { gerarPlanoComIA };
